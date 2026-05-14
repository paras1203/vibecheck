import { BRAND_NAME } from "@/lib/brand";
import type { PageSpeedSummary } from "@/lib/pagespeed";
import type { TrafficEstimate } from "@/types/roast-extras";
import {
  buildExperimentBacklog,
  buildImplementationChecklist,
} from "@/lib/report-artifacts-builders";
import type { ExperimentBacklogItem, ImplementationChecklistItem } from "@/types/report-artifacts";

/** Roast JSON subset for artifact sections (keeps this module free of report-html import cycles). */
export type ReportArtifactsInput = {
  page_type?: string;
  price_guess?: number;
  price_from_page?: boolean;
  price_billing_note?: string;
  trafficEstimate?: TrafficEstimate;
  performance?: PageSpeedSummary | null;
  performance_audit?: import("@/lib/audits/performance-pagespeed").PerformanceAuditResult | null;
  tech_stack?: import("@/lib/audits/tech-stack-audit").TechStackAuditResult | null;
  behaviour_tools?: import("@/lib/audits/behaviour-tools").BehaviourToolsAdvice | null;
  quickWins?: Array<Record<string, unknown>>;
  quick_wins?: Array<Record<string, unknown>>;
  experimentBacklog?: ExperimentBacklogItem[];
  implementationChecklist?: ImplementationChecklistItem[];
  radar_scores?: Record<string, unknown>;
  radarMetrics?: Record<string, unknown>;
};

function pageTypeLabel(pt: string | undefined): string {
  switch (pt) {
    case "landing":
      return "Landing";
    case "blog":
      return "Blog";
    case "product":
      return "Product";
    case "unknown":
      return "Unknown";
    default:
      return pt || "—";
  }
}

function trafficSourceLabel(source: string | undefined): string {
  if (source === "gemini") return "model estimate";
  return "default benchmark";
}

export function buildReportContextCardHtml(
  data: ReportArtifactsInput,
  esc: (s: string) => string
): string {
  const pt = pageTypeLabel(data.page_type);
  const te = data.trafficEstimate;
  const perf = data.performance;
  const pa = data.performance_audit;
  const mobile = pa?.mobile;
  const score =
    typeof perf?.performanceScore === "number"
      ? perf.performanceScore
      : typeof mobile?.performanceScore === "number"
        ? mobile.performanceScore
        : null;
  const metrics: string[] = [];
  if (mobile?.lcp) metrics.push(`LCP ${mobile.lcp}`);
  if (mobile?.inp) metrics.push(`INP ${mobile.inp}`);
  if (mobile?.cls) metrics.push(`CLS ${mobile.cls}`);
  if (mobile?.tbt && metrics.length < 2) metrics.push(`TBT ${mobile.tbt}`);
  const metricLineRaw = metrics.slice(0, 2).join(" · ") || "—";

  const price = typeof data.price_guess === "number" ? data.price_guess : null;
  const priceLine =
    price != null && price > 0
      ? `$${price.toLocaleString()}${data.price_from_page ? " (from page)" : " (illustrative)"}`
      : "—";
  const bill =
    typeof data.price_billing_note === "string" && data.price_billing_note.trim()
      ? esc(data.price_billing_note.trim())
      : "";

  const sessionsLine =
    te != null
      ? `${te.monthlySessions.toLocaleString()} visits/mo (${trafficSourceLabel(te.source)})`
      : "—";
  const noteLine = te?.note ? esc(te.note) : "";

  return `<div class="section report-major"><h2>Scan context</h2>
    <ul class="report-nojustify" style="font-size:0.875rem;line-height:1.55;padding-left:1.1rem;">
      <li><strong>Page type:</strong> ${esc(pt)}</li>
      <li><strong>Traffic (illustrative):</strong> ${esc(sessionsLine)}${noteLine ? ` — ${noteLine}` : ""}</li>
      <li><strong>Deal value (for models):</strong> ${esc(priceLine)}${bill ? ` — ${bill}` : ""}</li>
      <li><strong>Lighthouse performance:</strong> ${
        score != null ? esc(String(score)) : esc("—")
      } (${esc(metricLineRaw)}${!pa?.mobile ? `, ${esc("lab data not captured")}` : ""})</li>
    </ul>
  </div>`;
}

export function buildReportAnalyticsReadinessHtml(
  data: ReportArtifactsInput,
  esc: (s: string) => string
): string {
  const tools =
    data.tech_stack?.detectedTools?.filter((t) =>
      ["analytics", "heatmap", "tag_manager"].includes(t.category)
    ) ?? [];
  const lines = tools.length
    ? tools.map((t) => `<li>${esc(t.name)} <span style="opacity:0.8">(${esc(t.category)})</span></li>`).join("")
    : `<li>${esc("No common analytics / heatmap / tag-manager signatures detected from HTML patterns.")}</li>`;
  const rec =
    typeof data.behaviour_tools?.recommendationMessage === "string"
      ? data.behaviour_tools.recommendationMessage.trim()
      : "";
  const recHtml = rec
    ? `<p class="muted report-nojustify" style="margin-top:12px">${esc(rec)}</p>`
    : "";
  return `<div class="section report-major"><h2>Analytics readiness</h2>
    <p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:8px">Tools inferred from snippets and signatures (not a compliance audit).</p>
    <ul style="padding-left:1.1rem;font-size:0.875rem">${lines}</ul>
    ${recHtml}
  </div>`;
}

export function resolveExperimentItems(data: ReportArtifactsInput): ExperimentBacklogItem[] {
  const qw = (data.quickWins || data.quick_wins || []) as Parameters<
    typeof buildExperimentBacklog
  >[0];
  const ext = data.experimentBacklog;
  return ext?.length ? ext : buildExperimentBacklog(qw);
}

export function resolveChecklistItems(data: ReportArtifactsInput): ImplementationChecklistItem[] {
  const qw = (data.quickWins || data.quick_wins || []) as Parameters<
    typeof buildImplementationChecklist
  >[0];
  const ext = data.implementationChecklist;
  return ext?.length ? ext : buildImplementationChecklist(qw, data.radar_scores, data.radarMetrics);
}

export function buildExperimentBacklogSectionHtml(
  data: ReportArtifactsInput,
  esc: (s: string) => string
): string {
  const items = resolveExperimentItems(data);
  if (!items.length) return "";
  const body = items
    .map(
      (it) =>
        `<div style="margin-bottom:14px"><p style="font-weight:600">${esc(it.testName)}</p>
        <ul style="font-size:0.8125rem;padding-left:1.1rem;margin:6px 0 0">
          <li><strong>Hypothesis:</strong> ${esc(it.hypothesis)}</li>
          <li><strong>Primary metric:</strong> ${esc(it.primaryMetric)}</li>
          <li><strong>Variant:</strong> ${esc(it.variantDescription)}</li>
        </ul></div>`
    )
    .join("");
  return `<div class="section report-major"><h2>Experiment backlog</h2>${body}</div>`;
}

export function buildImplementationChecklistHtml(
  data: ReportArtifactsInput,
  esc: (s: string) => string
): string {
  const items = resolveChecklistItems(data);
  if (!items.length) return "";
  const rows = items
    .map(
      (it) =>
        `<tr><td>${esc(it.task)}</td><td>${esc(it.owner)}</td><td>${esc(it.effort)}</td></tr>`
    )
    .join("");
  return `<div class="section report-major"><h2>Implementation checklist</h2>
  <table class="report-matrix implementation-checklist-table" style="table-layout:fixed;width:100%;font-size:0.875rem;line-height:1.5;"><colgroup><col style="width:70%"><col style="width:15%"><col style="width:15%"></colgroup>
  <thead><tr><th>Task</th><th>Owner</th><th>Effort</th></tr></thead>
  <tbody>${rows}</tbody></table>
  </div>`;
}

export function buildHowToReadThisReportHtml(esc: (s: string) => string): string {
  return `<div class="section report-major"><h2>How to read this report</h2>
    <p class="report-prose">${esc(
      `${BRAND_NAME} combines AI-audited pillars, quick wins, programmatic SEO and speed checks, and illustrative traffic models. Use Quick Fixes for fast actions, the radar for balance, and Experiment / Checklist blocks to sequence work. Figures are directional—not guarantees.`
    )}</p>
  </div>`;
}