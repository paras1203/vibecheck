/**
 * Category deep-dive scoring from `detailedAudit` — shared by roast UI, HTML export, PDF.
 */

export const REPORT_CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  ux: "UX & Layout",
  conversion: "Conversion & Funnel",
  copy: "Copy & Messaging",
  visuals: "Visuals & Brand",
  trust: "Trust & Credibility",
  speed: "Speed & Technical Health",
};

export const CATEGORY_TAB_ORDER = [
  "UX & Layout",
  "Conversion & Funnel",
  "Copy & Messaging",
  "Visuals & Brand",
  "Trust & Credibility",
  "Speed & Technical Health",
] as const;

export const CATEGORY_STATUS_POINTS: Record<string, number> = {
  Excellent: 95,
  Good: 80,
  Satisfactory: 60,
  "Needs Improvement": 35,
  Failed: 5,
};

export type DetailedAuditRow = {
  status?: string;
  elementName?: string;
  element?: string;
  rationale?: string;
  fix?: string | { quickFix?: string } | null;
};

export function displayNameForCategoryKey(catKey: string): string {
  return REPORT_CATEGORY_DISPLAY_NAMES[catKey.toLowerCase()] || catKey;
}

export function averageScoreForCategoryItems(items: DetailedAuditRow[]): number {
  if (!items?.length) return 0;
  const scores = items.map(
    (item) => CATEGORY_STATUS_POINTS[String(item.status || "Satisfactory")] || 60
  );
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function verdictLabelForCategoryAverage(avgScore: number): string {
  if (avgScore < 60) return "Needs Improvement";
  if (avgScore < 80) return "Good";
  return "Excellent";
}

export function impactHighOrMediumFromItems(items: DetailedAuditRow[]): string {
  const whatFailedItems = items.filter(
    (item) => item.status === "Failed" || item.status === "Needs Improvement"
  );
  return whatFailedItems.length > 0 ? "High" : "Medium";
}

export type RoastCategoryCard = {
  name: string;
  score: number;
  verdict: string;
  impact: string;
  what_works: string;
  what_failed: string;
  fix_steps: string[];
};

export function categoriesFromDetailedAudit(
  detailedAudit: Record<string, DetailedAuditRow[]> | undefined | null
): RoastCategoryCard[] {
  if (!detailedAudit || typeof detailedAudit !== "object") return [];
  const out: RoastCategoryCard[] = [];

  for (const [catKey, itemsRaw] of Object.entries(detailedAudit)) {
    const items = Array.isArray(itemsRaw) ? itemsRaw : [];
    if (items.length === 0) continue;

    const catName = displayNameForCategoryKey(catKey);
    const avgScore = averageScoreForCategoryItems(items);
    const verdict = verdictLabelForCategoryAverage(avgScore);

    const whatWorksItems = items.filter(
      (item) => item.status === "Excellent" || item.status === "Good"
    );
    const whatFailedItems = items.filter(
      (item) => item.status === "Failed" || item.status === "Needs Improvement"
    );

    const whatWorks = whatWorksItems
      .slice(0, 3)
      .map((item) => item.elementName || item.element || "")
      .join("; ");
    const whatFailed = whatFailedItems
      .slice(0, 3)
      .map((item) => item.elementName || item.element || "")
      .join("; ");

    const fixSteps: string[] = [];
    for (const item of whatFailedItems.slice(0, 3)) {
      const nm = item.elementName || item.element || "Item";
      const fix = item.fix;
      if (typeof fix === "object" && fix !== null) {
        const quickFix = fix.quickFix || "";
        if (quickFix) fixSteps.push(`${nm}: ${quickFix}`);
      } else if (fix) {
        fixSteps.push(`${nm}: ${String(fix)}`);
      }
    }

    out.push({
      name: catName,
      score: avgScore,
      verdict,
      impact: impactHighOrMediumFromItems(items),
      what_works: whatWorks,
      what_failed: whatFailed,
      fix_steps: fixSteps,
    });
  }

  out.sort((a, b) => {
    const ia = CATEGORY_TAB_ORDER.indexOf(a.name as (typeof CATEGORY_TAB_ORDER)[number]);
    const ib = CATEGORY_TAB_ORDER.indexOf(b.name as (typeof CATEGORY_TAB_ORDER)[number]);
    return (ia === -1 ? 100 : ia) - (ib === -1 ? 100 : ib);
  });
  return out;
}
