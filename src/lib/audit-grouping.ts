/**
 * Theme grouping for worker audit items: dedupe by (elementName, radarCategory).
 * Used for display-only structures (quick wins, detailedAudit). Radar scoring still uses raw items.
 */

export type WorkerAuditFix = {
  quickFix?: string;
  example?: string;
  expectedImpact?: string;
};

export type WorkerAuditItem = {
  elementName?: string;
  radarCategory?: string;
  status?: string;
  impact?: string;
  rationale?: string;
  workingWell?: unknown;
  notWorking?: unknown;
  fix?: WorkerAuditFix | string | Record<string, unknown> | null;
  conversionImpact?: string;
  [key: string]: unknown;
};

export type AuditThemeGroup = {
  /** Stable key: lowercased radar + NUL + lowercased element (empty element → "unknown") */
  themeKey: string;
  /** Display name from first occurrence in group (trimmed worker label) */
  elementName: string;
  radarCategory: string;
  items: WorkerAuditItem[];
};

const STATUS_ORDER: Record<string, number> = {
  Failed: 0,
  "Needs Improvement": 1,
  Satisfactory: 2,
  Good: 3,
  Excellent: 4,
};

const IMPACT_RANK: Record<string, number> = { HI: 3, MI: 2, LI: 1 };

function statusRank(status: string | undefined): number {
  const s = status || "Satisfactory";
  return s in STATUS_ORDER ? STATUS_ORDER[s] : 99;
}

function impactRank(impact: string | undefined): number {
  const i = impact || "MI";
  return IMPACT_RANK[i] ?? 0;
}

function normalizeDedupeLine(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Theme key from element + radar. Empty trimmed elementName becomes "unknown". */
export function themeKeyFromItem(item: WorkerAuditItem): string {
  const rawEl = (item.elementName ?? "").trim();
  const el = rawEl ? rawEl.toLowerCase() : "unknown";
  const cat = String(item.radarCategory ?? "").trim().toLowerCase();
  return `${cat}\0${el}`;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function getFixParts(
  fix: WorkerAuditItem["fix"]
): { quickFix: string; example: string; expectedImpact: string } {
  if (!fix || typeof fix !== "object") {
    return {
      quickFix: typeof fix === "string" ? fix.trim() : "",
      example: "",
      expectedImpact: "",
    };
  }
  const o = fix as WorkerAuditFix;
  return {
    quickFix: typeof o.quickFix === "string" ? o.quickFix.trim() : "",
    example: typeof o.example === "string" ? o.example.trim() : "",
    expectedImpact:
      typeof o.expectedImpact === "string" ? o.expectedImpact.trim() : "",
  };
}

/** Prefer longer substantive string; ties favor first candidate. */
function pickLongerField(...candidates: string[]): string {
  let best = "";
  for (const c of candidates) {
    const t = (c || "").trim();
    if (t.length > best.length) best = t;
  }
  return best;
}

/** Single worst-status item in group; ties broken by higher badness (via rank then impact). */
export function pickCanonicalItemForTheme(group: AuditThemeGroup): WorkerAuditItem {
  let best = group.items[0];
  let bestSr = statusRank(best?.status);
  let bestIr = impactRank(best?.impact);
  for (let i = 1; i < group.items.length; i++) {
    const it = group.items[i];
    const sr = statusRank(it?.status);
    const ir = impactRank(it?.impact);
    if (sr < bestSr || (sr === bestSr && ir > bestIr)) {
      best = it;
      bestSr = sr;
      bestIr = ir;
    }
  }
  return best;
}

/** Collect groups keyed by theme; preserves first-seen key order via Map iteration order. */
export function groupAuditItemsByTheme(
  items: WorkerAuditItem[]
): Map<string, AuditThemeGroup> {
  const map = new Map<string, AuditThemeGroup>();
  for (const item of items) {
    const key = themeKeyFromItem(item);
    const rawEl = (item.elementName ?? "").trim();
    const displayEl = rawEl || "Unknown";
    const cat = String(item.radarCategory ?? "").trim();
    let g = map.get(key);
    if (!g) {
      g = {
        themeKey: key,
        elementName: displayEl,
        radarCategory: cat,
        items: [],
      };
      map.set(key, g);
    }
    g.items.push(item);
  }
  return map;
}

function mergeStringListsDedup(arrays: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const arr of arrays) {
    for (const s of arr) {
      const key = normalizeDedupeLine(s);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(s.trim());
    }
  }
  return out;
}

/**
 * Rolls up a theme group into one worker-shaped row for downstream formatters (`calculateBadnessScore`, quick wins, HTML).
 */
export function mergeThemeGroupToCanonicalItem(group: AuditThemeGroup): WorkerAuditItem {
  const pivot = pickCanonicalItemForTheme(group);

  let worstSr = Infinity;
  let highestImpact = 0;
  for (const it of group.items) {
    const sr = statusRank(it.status);
    const ir = impactRank(it.impact);
    if (sr < worstSr) worstSr = sr;
    if (ir > highestImpact) highestImpact = ir;
  }

  const inverseStatusRank = Object.entries(STATUS_ORDER).find(
    ([, v]) => v === worstSr
  );
  const bestStatus =
    inverseStatusRank?.[0] ??
    (typeof pivot.status === "string" ? pivot.status : null) ??
    "Satisfactory";

  const impactLabel =
    Object.entries(IMPACT_RANK).find(([, v]) => v === highestImpact)?.[0] ??
    (typeof pivot.impact === "string" ? pivot.impact : null) ??
    "MI";

  const workingMerge = mergeStringListsDedup(group.items.map((i) => asStringArray(i.workingWell)));
  const notWorkingMerge = mergeStringListsDedup(
    group.items.map((i) => asStringArray(i.notWorking))
  );

  const worstItems = group.items.filter((it) => statusRank(it.status) === worstSr);
  let quickFixWinner = worstItems.length ? worstItems[0] : pivot;
  let maxLen = 0;
  for (const wi of worstItems) {
    const q = getFixParts(wi.fix).quickFix.length;
    if (q >= maxLen) {
      maxLen = q;
      quickFixWinner = wi;
    }
  }

  let exampleWinner = worstItems.length ? worstItems[0] : pivot;
  maxLen = 0;
  for (const wi of worstItems) {
    const ex = getFixParts(wi.fix).example.length;
    if (ex >= maxLen) {
      maxLen = ex;
      exampleWinner = wi;
    }
  }

  let impactWinner = worstItems.length ? worstItems[0] : pivot;
  maxLen = 0;
  for (const wi of worstItems) {
    const ei = getFixParts(wi.fix).expectedImpact.length;
    if (ei >= maxLen) {
      maxLen = ei;
      impactWinner = wi;
    }
  }

  const qParts = group.items.map((i) => getFixParts(i.fix).quickFix);
  const eParts = group.items.map((i) => getFixParts(i.fix).example);
  const eiParts = group.items.map((i) => getFixParts(i.fix).expectedImpact);

  const mergedQuickFix = pickLongerField(
    getFixParts(quickFixWinner.fix).quickFix,
    ...qParts
  );
  let mergedExample = pickLongerField(getFixParts(exampleWinner.fix).example, ...eParts);
  if (/BEFORE\s*:/i.test(getFixParts(exampleWinner.fix).example)) {
    mergedExample = getFixParts(exampleWinner.fix).example;
  } else if (group.items.some((i) => /BEFORE\s*:/i.test(getFixParts(i.fix).example))) {
    mergedExample =
      [...group.items].map((i) => getFixParts(i.fix).example).find((ex) =>
        /BEFORE\s*:/i.test(ex)
      ) || mergedExample;
  }

  const mergedExpectedImpact = pickLongerField(
    getFixParts(impactWinner.fix).expectedImpact,
    ...eiParts
  );

  const rationales = mergeStringListsDedup(
    group.items.map((i) => {
      const r = typeof i.rationale === "string" ? i.rationale.trim() : "";
      return r ? [r] : [];
    })
  );

  const out: WorkerAuditItem = {
    ...pivot,
    elementName: group.elementName,
    radarCategory: group.radarCategory || pivot.radarCategory,
    status: bestStatus,
    impact: impactLabel as WorkerAuditItem["impact"],
    workingWell: workingMerge,
    notWorking: notWorkingMerge,
    rationale: rationales.length ? rationales.join(" ") : pivot.rationale,
    fix: {
      quickFix: mergedQuickFix || getFixParts(pivot.fix).quickFix || "Review and improve",
      example: mergedExample,
      expectedImpact:
        mergedExpectedImpact || getFixParts(pivot.fix).expectedImpact || "",
    },
  };

  return out;
}

/**
 * Deduped canonical items in **same order as first appearance** in `items`.
 */
export function canonicalItemsPreservingOrder(items: WorkerAuditItem[]): WorkerAuditItem[] {
  const grouped = groupAuditItemsByTheme(items);
  const seen = new Set<string>();
  const out: WorkerAuditItem[] = [];
  for (const it of items) {
    const k = themeKeyFromItem(it);
    if (seen.has(k)) continue;
    seen.add(k);
    const g = grouped.get(k);
    if (!g || g.items.length === 0) continue;
    out.push(mergeThemeGroupToCanonicalItem(g));
  }
  return out;
}
