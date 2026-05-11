import {
  auditElementLabel,
  isDeprioritizedLegalAuditElement,
  partitionLegalComplianceAuditLast,
} from "@/lib/legal-compliance-audit";

export type QuickWinLike = {
  title?: string;
  elementName?: string;
  problem?: string;
  fix?: string;
  example?: string;
  effort?: string;
  lift?: string;
  impactCode?: string;
};

type AuditItemLike = {
  element?: string;
  elementName?: string;
  status?: string;
  rationale?: string;
  not_working?: string[];
  fix?: string | Record<string, unknown>;
  expected_impact?: string;
};

function statusRank(status: string | undefined): number {
  const s = (status || "").toLowerCase();
  if (s === "failed") return 0;
  if (s.includes("needs improvement")) return 1;
  if (s === "satisfactory") return 2;
  if (s === "good" || s === "excellent") return 3;
  return 4;
}

function fixQuickString(fix: AuditItemLike["fix"]): string {
  if (typeof fix === "object" && fix !== null && "quickFix" in fix) {
    const q = (fix as { quickFix?: string }).quickFix;
    return typeof q === "string" ? q : "";
  }
  return typeof fix === "string" ? fix : "";
}

/** Pads quick wins from audit_items when the API returned fewer than `max` (default 6). */
export function ensureQuickWinsUpTo(
  quickWins: QuickWinLike[] | undefined | null,
  auditItems: AuditItemLike[] | undefined | null,
  max = 6
): QuickWinLike[] {
  const base = [...(quickWins ?? [])].slice(0, max);
  if (base.length >= max) return base;

  const used = new Set(
    base.map((w) => (w.title || w.elementName || "").trim().toLowerCase()).filter(Boolean)
  );

  const ordered = partitionLegalComplianceAuditLast([...(auditItems ?? [])]);
  const sorted = [...ordered].sort((a, b) => statusRank(a.status) - statusRank(b.status));

  for (const item of sorted) {
    if (base.length >= max) break;
    const name = auditElementLabel(item);
    if (!name || isDeprioritizedLegalAuditElement(name)) continue;
    const key = name.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);

    const qf = fixQuickString(item.fix);
    const nw = item.not_working?.filter(Boolean) ?? [];
    base.push({
      title: name,
      elementName: name,
      problem: nw.length > 0 ? nw.slice(0, 2).join("; ") : item.rationale?.trim() || "Review audit finding",
      fix: qf || "See detailed audit for remediation steps.",
      example: "",
      effort: "15min",
      lift: item.expected_impact || "Expected conversion improvement",
    });
  }

  return base;
}

/** @deprecated Prefer ensureQuickWinsUpTo(..., 4) where a 4-cap is required */
export function ensureQuickWinsUpToFour(
  quickWins: QuickWinLike[] | undefined | null,
  auditItems: AuditItemLike[] | undefined | null
): QuickWinLike[] {
  return ensureQuickWinsUpTo(quickWins, auditItems, 4);
}
