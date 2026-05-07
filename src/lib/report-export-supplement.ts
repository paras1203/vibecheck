import type { ScrollEffectiveness } from "@/types/roast-extras";

type SupplementInput = {
  scrollEffectiveness?: ScrollEffectiveness | null;
  trafficEstimate?: {
    note?: string;
    monthlySessions?: number;
    source?: string;
  } | null;
};

/**
 * Renders audit-adjacent payload not covered by main PDF/HTML sections (scroll narrative, traffic note).
 */
export function buildReportSupplementInnerHtml(
  data: SupplementInput,
  esc: (s: string) => string
): string {
  const parts: string[] = [];
  const se = data.scrollEffectiveness;
  if (
    se &&
    (String(se.situation || "").trim() ||
      String(se.action || "").trim() ||
      (se.evidenceBullets?.length ?? 0) > 0)
  ) {
    const bullets = (se.evidenceBullets || [])
      .filter(Boolean)
      .map((b) => `<li class="report-nojustify">${esc(b)}</li>`)
      .join("");
    parts.push(`<div class="quick-win">
      <p class="report-label">Scroll effectiveness</p>
      ${
        se.situation
          ? `<p class="report-nojustify" style="font-size:0.875rem;">${esc(se.situation)}</p>`
          : ""
      }
      ${
        se.action
          ? `<p class="report-nojustify" style="font-size:0.875rem;"><span class="report-label" style="display:inline;margin-right:6px;">Next step</span>${esc(se.action)}</p>`
          : ""
      }
      ${
        bullets
          ? `<ul style="margin:8px 0 0;padding-left:1.25rem;font-size:0.875rem;">${bullets}</ul>`
          : ""
      }
    </div>`);
  }
  const te = data.trafficEstimate;
  if (te?.note?.trim()) {
    parts.push(`<div class="quick-win">
      <p class="report-label">Traffic estimate note</p>
      <p class="report-nojustify" style="font-size:0.875rem;">${esc(te.note.trim())}</p>
    </div>`);
  }
  if (!parts.length) return "";
  return `<p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:14px;">Context from the roast pipeline that does not appear in other sections of this report.</p>
    ${parts.join("")}`;
}
