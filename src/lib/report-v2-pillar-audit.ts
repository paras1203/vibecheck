import type { DetailedAuditRow } from "@/lib/report-category-score";

export type PillarAuditDisplayRow = {
  element: string;
  status: string;
  impact: string;
  working: string;
  notWorking: string;
  fix: string;
};

function firstStringFromUnknownArray(v: unknown): string {
  if (!Array.isArray(v) || v.length === 0) return "—";
  const s = String(v[0]).trim();
  return s || "—";
}

function fixQuickFix(fix: DetailedAuditRow["fix"]): string {
  if (!fix) return "—";
  if (typeof fix === "object" && fix !== null && "quickFix" in fix) {
    const q = String((fix as { quickFix?: string }).quickFix || "").trim();
    return q || "—";
  }
  const t = String(fix).trim();
  return t || "—";
}

function impactFromItem(item: DetailedAuditRow & Record<string, unknown>): string {
  const imp = item.impact;
  if (typeof imp === "string" && imp.trim()) return imp.trim().toUpperCase();
  const st = String(item.status || "");
  if (st === "Failed" || st === "Needs Improvement") return "HI";
  if (st === "Satisfactory") return "MI";
  return "MI";
}

/**
 * Maps canonical detailedAudit rows (worker-shaped) to compact table rows.
 */
export function detailedAuditToDisplayRows(
  items: DetailedAuditRow[] | undefined | null,
  maxRows = 50
): PillarAuditDisplayRow[] {
  if (!items?.length) return [];
  const out: PillarAuditDisplayRow[] = [];
  const slice = items.slice(0, maxRows);
  for (const row of slice) {
    const ext = row as DetailedAuditRow & Record<string, unknown>;
    const element =
      String(ext.elementName || ext.element || "Element").trim() || "Element";
    const status = String(ext.status || "—");
    out.push({
      element,
      status,
      impact: impactFromItem(ext),
      working: firstStringFromUnknownArray(ext.workingWell),
      notWorking: firstStringFromUnknownArray(ext.notWorking),
      fix: fixQuickFix(ext.fix),
    });
  }
  return out;
}
