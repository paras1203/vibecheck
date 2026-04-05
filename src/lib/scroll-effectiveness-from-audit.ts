/**
 * Scroll-of-death copy from audit JSON + measured scroll metrics.
 * One concise issue → fix line per audit item (no long rationale dumps).
 */

import type { ScrollEffectiveness } from "@/types/roast-extras";

const SCROLL_RE =
  /\b(scroll|fold|above the fold|below the fold|footer|sticky|anchor|section|long form|wall of text|length|depth|cta|call to action|proof|social proof|bury|buried|friction|bounce|skim|viewport|hero|mid-?page|deep)\b/i;

export const SCROLL_BULLET_ARROW = " → ";

export type ScrollEvidenceZone = "top" | "mid" | "deep";

/** Route an issue line to a scroll band using lightweight keyword cues (audit text is messy). */
export function scrollEvidenceZoneForLine(line: string): ScrollEvidenceZone {
  const t = line.toLowerCase();
  if (
    /\b(hero|headline|above\s*the|first\s+screen|viewport|header\b|banner|navigation|nav\b|menu\b|logo|primary\s*cta|money\s*zone|above\s*fold)\b/.test(
      t
    )
  ) {
    return "top";
  }
  if (
    /\b(footer|bottom\s+of|deep\s|graveyard|late\s*cta|end\s+of\s+the\s+page|below\s+the\s+fold\s+only)\b/.test(
      t
    )
  ) {
    return "deep";
  }
  return "mid";
}

export function partitionScrollEvidenceByZone(
  lines: string[]
): Record<ScrollEvidenceZone, string[]> {
  const top: string[] = [];
  const mid: string[] = [];
  const deep: string[] = [];
  for (const line of lines) {
    const z = scrollEvidenceZoneForLine(line);
    if (z === "top") top.push(line);
    else if (z === "deep") deep.push(line);
    else mid.push(line);
  }
  return { top, mid, deep };
}

export type ScrollMetrics = {
  pageHeight: number;
  foldHeight: number;
  belowFoldPercent: number;
};

type AuditItemLike = {
  element?: string;
  elementName?: string;
  status?: string;
  rationale?: string;
  fix?: string | { quickFix?: string } | null;
  not_working?: string[];
  working?: string[];
};

function textMatchesScroll(text: string): boolean {
  return text.trim().length > 0 && SCROLL_RE.test(text);
}

function getFixText(item: AuditItemLike): string {
  if (typeof item.fix === "string") return item.fix.trim();
  if (item.fix && typeof item.fix === "object" && item.fix.quickFix) {
    return String(item.fix.quickFix).trim();
  }
  return "";
}

function clipWords(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  const head = sp > max * 0.5 ? cut.slice(0, sp) : cut.trimEnd();
  return `${head}…`;
}

function isScrollRelevantItem(item: AuditItemLike): boolean {
  if (textMatchesScroll((item.rationale ?? "").trim())) return true;
  if (item.not_working?.some((x) => textMatchesScroll(String(x).trim()))) return true;
  const fix = getFixText(item);
  if (fix && textMatchesScroll(fix)) return true;
  const el = (item.element || item.elementName || "").trim();
  const st = (item.status || "").trim();
  if (el && st && textMatchesScroll(`${st}: ${el}`)) return true;
  return false;
}

function oneLineIssueFix(item: AuditItemLike): string | null {
  if (!isScrollRelevantItem(item)) return null;

  const el = (item.element || item.elementName || "").trim();
  const st = (item.status || "").trim();
  const fix = getFixText(item);
  const rat = (item.rationale ?? "").trim();

  let issue = "";
  if (rat && textMatchesScroll(rat)) issue = rat;
  else if (item.not_working?.length) {
    const hit = item.not_working
      .map((x) => String(x).trim())
      .find((x) => x && textMatchesScroll(x));
    if (hit) issue = hit;
  }
  if (!issue && el && st && textMatchesScroll(`${st}: ${el}`)) issue = `${st}: ${el}`;
  if (!issue && el) issue = el;
  if (!issue && rat) issue = rat;
  if (!issue.trim()) return null;

  const issueOut = clipWords(issue, 88);
  const fixOut = fix ? clipWords(fix, 72) : "";
  if (fixOut) return `${issueOut}${SCROLL_BULLET_ARROW}${fixOut}`;
  return issueOut;
}

function extractConciseBullets(roast: {
  audit_items?: AuditItemLike[];
  detailedAudit?: Record<string, AuditItemLike[]>;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const add = (s: string) => {
    const t = s.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  const items = roast.audit_items;
  if (Array.isArray(items)) {
    for (const it of items) {
      const line = oneLineIssueFix(it);
      if (line) add(line);
    }
  }

  const da = roast.detailedAudit;
  if (da && typeof da === "object") {
    for (const arr of Object.values(da)) {
      if (!Array.isArray(arr)) continue;
      for (const it of arr) {
        const line = oneLineIssueFix(it as AuditItemLike);
        if (line) add(line);
      }
    }
  }

  return out.slice(0, 4);
}

function weakestConversionUxLine(radar: Record<string, number> | undefined): string | null {
  if (!radar || typeof radar !== "object") return null;
  const ux = Number(radar.UX ?? radar.ux ?? radar["UX & Layout"] ?? 100);
  const conv = Number(
    radar.Conversion ?? radar.conversion ?? radar["Conversion & Funnel"] ?? 100
  );
  const pairs: [string, number][] = [
    ["UX & layout", ux],
    ["Conversion", conv],
  ];
  pairs.sort((a, b) => a[1] - b[1]);
  const [label, score] = pairs[0]!;
  if (!Number.isFinite(score) || score >= 65) return null;
  return `${label} ${Math.round(score)}/100—weak placement often tracks scroll and CTA clarity.`;
}

export function buildScrollEffectiveness(
  roast: {
    audit_items?: AuditItemLike[];
    detailedAudit?: Record<string, AuditItemLike[]>;
    radar_scores?: Record<string, number>;
    radarMetrics?: Record<string, number>;
    audited_url?: string;
  },
  auditedUrl: string,
  pageHeight: number,
  foldHeight = 800
): ScrollEffectiveness {
  const belowFold = Math.max(0, pageHeight - foldHeight);
  const belowFoldPercent = pageHeight > 0 ? (belowFold / pageHeight) * 100 : 0;

  let host = "this page";
  try {
    const raw = (roast.audited_url || auditedUrl || "").trim();
    if (raw) {
      const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
      host = u.hostname.replace(/^www\./i, "");
    }
  } catch {
    /* keep */
  }

  const bullets = extractConciseBullets(roast);
  const radar = roast.radar_scores || roast.radarMetrics;
  const radarLine = weakestConversionUxLine(radar);

  let situation =
    belowFoldPercent >= 55
      ? `${host} reads as a long page in this snapshot: most of what we show appears after the first screen, so visitors who don’t scroll may miss key offers, proof, or secondary actions.`
      : `${host} shows more content in the first screen in this snapshot—still keep one clear primary action and one proof line obvious without scrolling.`;

  let action =
    "Put your main ask and one trust signal high on the page; if the page is long, add a lighter second action after the first section.";
  if (bullets.length > 0) {
    action = "Address the issues in the zones below, then move the next important action higher.";
  }
  if (radarLine) {
    action = `${action} (${radarLine})`;
  }

  return { situation, action, evidenceBullets: bullets };
}
