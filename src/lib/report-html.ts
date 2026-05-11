import {
  reportFontsHref,
  getReportEmbedStyles,
  reportHex,
  pdfAxisScoreHex,
  pdfVerdictHex,
} from "./report-theme";
import { buildRadarSvg, buildScrollHeatStripSvg } from "./report-charts-svg";
import { buildHeroSnapshotFigureHtml } from "./report-hero-snapshot-html";
import { FULL_DIAGNOSTIC_UPGRADE_HOOK, PRO_UPGRADE_STRIP } from "./report-copy";
import { formatEffortLine, formatImpactLine, formatQuickWinSubheadLine, scrollDepthNarrative } from "./report-ui";
import {
  formatIntelScoreFootnote,
  INTEL_ESTIMATED_IMPROVEMENT,
  INTEL_BENCHMARK,
} from "./report-intelligence";
import type {
  FirstImpressionInsight,
  MessagingClarityInsight,
  RevenueLeakEstimate,
  TrustGapInsight,
} from "@/types/insight-layers";
import {
  DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD,
  DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
} from "@/lib/insight-layers";
import {
  buildInsightLayersHtml,
  buildRevenueLeakCardHtml,
} from "@/lib/insight-layers-report";
import { buildReportSupplementInnerHtml } from "@/lib/report-export-supplement";
import {
  exportCategoryVerdictColor,
  exportStatusPillColor,
} from "@/lib/report-export-status";
import {
  buildExecutiveDiagnosticInnerHtml,
} from "@/lib/report-diagnostic-section";
import { meanRadarSiteScore, verdictLabelFromSiteScore } from "@/lib/site-score";
import { BRAND_NAME } from "@/lib/brand";
import { buildPersonalizedInsiderLines } from "@/lib/personalized-insider";
import { heroScreenshotDataUrl } from "@/lib/hero-image";
import { buildSeoPerformanceAppendixHtml } from "@/lib/report-seo-appendix";
import {
  buildExperimentBacklogSectionHtml,
  buildHowToReadThisReportHtml,
  buildImplementationChecklistHtml,
  buildReportAnalyticsReadinessHtml,
  buildReportContextCardHtml,
} from "@/lib/report-artifacts-html";
import type { ExperimentBacklogItem, ImplementationChecklistItem } from "@/types/report-artifacts";
import { buildRadarPillarTilesHtml } from "@/lib/report-radar-tiles-html";
import { quickWinFixBulletText } from "@/lib/quick-wins-format";
import {
  averageScoreForCategoryItems,
  displayNameForCategoryKey,
  verdictLabelForCategoryAverage,
  type DetailedAuditRow,
} from "@/lib/report-category-score";
import type { SeoAnalysisResult } from "@/lib/seo-analyzer";
import type { PageSpeedSummary } from "@/lib/pagespeed";
import type { PerformanceGeminiSummary, ScrollEffectiveness, TrafficEstimate } from "@/types/roast-extras";

export type QuickWin = {
  title?: string;
  elementName?: string;
  problem?: string;
  fix?: string;
  example?: string;
  effort?: string;
  lift?: string;
  impactCode?: string;
};

export type AuditReportPayload = {
  overall_score?: number;
  overview?: {
    overallScore?: number;
    executiveSummary?: string;
    roastAnalysis?: string;
  };
  roastSummary?: string;
  roastAnalysis?: string;
  hook?: string;
  script?: string;
  verdict?: string;
  closer?: string;
  analysis?: string;
  quickWins?: QuickWin[];
  quick_wins?: QuickWin[];
  radarMetrics?: Record<string, number>;
  radar_scores?: Record<string, number>;
  detailedAudit?: Record<string, Array<Record<string, unknown>>>;
  audit_items?: Array<{
    element?: string;
    status?: string;
    rationale?: string;
    working?: string[];
    not_working?: string[];
    fix?: string;
    expected_impact?: string;
  }>;
  pageHeight?: number;
  price_guess?: number;
  price_from_page?: boolean;
  price_billing_note?: string;
  industry_guess?: string;
  audited_url?: string;
  /** Roast capture device (parity with hero refetch). */
  device?: string;
  /** Raw base64 PNG/JPEG from capture (large; omit when persisting to localStorage). */
  heroScreenshot?: string;
  revenueLeakEstimate?: RevenueLeakEstimate;
  firstImpressionScore?: FirstImpressionInsight;
  trustGapIndex?: TrustGapInsight;
  messagingClarityScore?: MessagingClarityInsight;
  seo?: SeoAnalysisResult | null;
  page_type?: string;
  performance?: PageSpeedSummary | null;
  performanceGemini?: PerformanceGeminiSummary | null;
  performance_audit?: import("@/lib/audits/performance-pagespeed").PerformanceAuditResult | null;
  on_page_seo?: import("@/lib/audits/on-page-seo").OnPageSeoAuditResult | null;
  meta_preview?: import("@/lib/audits/meta-preview-audit").MetaPreviewAuditResult | null;
  tech_stack?: import("@/lib/audits/tech-stack-audit").TechStackAuditResult | null;
  behaviour_tools?: import("@/lib/audits/behaviour-tools").BehaviourToolsAdvice | null;
  trafficEstimate?: TrafficEstimate;
  scrollEffectiveness?: ScrollEffectiveness;
  experimentBacklog?: ExperimentBacklogItem[];
  implementationChecklist?: ImplementationChecklistItem[];
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const REPORT_CATEGORY_SUB =
  "Together they answer what this means for UX, conversion, copy, and the other audit dimensions—rolled up by category.";
export const REPORT_ELEMENT_SUB =
  "Together they answer what each surfaced component is doing—status, rationale, what works, gaps, and fixes.";

function industryInsiderHtmlFromAudit(data: AuditReportPayload, escape: (s: string) => string): string {
  const lines = buildPersonalizedInsiderLines(data as Record<string, unknown>);
  if (!lines.length) return "";
  return lines.map((l) => `<p class="report-prose">${escape(l)}</p>`).join("");
}

function quickWinHtmlBlock(win: QuickWin, i: number, esc: (s: string) => string): string {
  const title = win.title || win.elementName || `Quick win ${i + 1}`;
  const sub = esc(formatQuickWinSubheadLine(win.effort, win.impactCode, win.lift));
  const fixText = esc(quickWinFixBulletText(win.fix || "", win.example || ""));
  const probLi = win.problem
    ? `<li><strong>Problem:</strong> ${esc(win.problem)}</li>`
    : "";
  const impLi = win.lift ? `<li><strong>Impact:</strong> ${esc(win.lift)}</li>` : "";
  return `<div class="quick-win">
    <div class="report-card__index">#${i + 1}</div>
    <div class="report-card__title report-nojustify">${esc(title)}</div>
    <p class="muted report-nojustify" style="font-size:0.8125rem">${sub}</p>
    <ul style="margin:8px 0 0;padding-left:1.1rem;font-size:0.8125rem" class="report-nojustify">${probLi}<li><strong>Fix:</strong> ${fixText}</li>${impLi}</ul>
  </div>`;
}

function priorityMatrixRows(quickWins: QuickWin[]): string {
  if (quickWins.length === 0) {
    return `<tr><td colspan="4">No priority items in this dataset.</td></tr>`;
  }
  return quickWins
    .map((win, idx) => {
      const title = win.title || win.elementName || "Quick win";
      const impactCell = win.impactCode
        ? `${win.impactCode} — ${(win.lift || "").trim()}`.trim()
        : win.lift || "—";
      return `<tr>
        <td>#${idx + 1}</td>
        <td>${escapeHtml(title)}</td>
        <td>${escapeHtml(win.effort || "—")}</td>
        <td>${escapeHtml(impactCell)}</td>
      </tr>`;
    })
    .join("");
}

function buildExecutiveDiagnosticSection(data: AuditReportPayload): string {
  const inner = buildExecutiveDiagnosticInnerHtml(data, escapeHtml);
  if (!inner) return "";
  return `<div class="section report-major">
    <h2>Executive summary &amp; diagnostic</h2>
    <div class="report-exec-diagnostics">${inner}</div>
  </div>`;
}

function buildSiteScoreSectionHtml(
  radar: Record<string, number>,
  overall: number,
  hasRadar: boolean,
  auditCount: number
): string {
  const verdict = verdictLabelFromSiteScore(
    Math.round(overall),
    radar as Record<string, unknown>
  );
  const vColor = pdfVerdictHex(verdict);
  const sColor = pdfAxisScoreHex(overall);
  const intel = escapeHtml(formatIntelScoreFootnote(overall, auditCount));
  const pillarTiles = buildRadarPillarTilesHtml(
    radar as Record<string, number>,
    escapeHtml,
    hasRadar
  );
  const chart = hasRadar
    ? buildRadarSvg(radar as Record<string, number>, 300)
    : `<p class="muted">No radar metrics in export.</p>`;
  return `<div class="section report-major">
    <h2>Site Score</h2>
    <p class="report-verdict" style="color:${vColor}">${escapeHtml(verdict)}</p>
    <div class="score score--semantic" style="color:${sColor}"><span class="report-figure">${overall}</span><span class="score-suffix">/100</span></div>
    <p class="intel-micro">${intel}</p>
    <p class="chart-block__title">Pillar scores</p>
    ${pillarTiles}
    <div class="chart-box">${chart}</div>
    <p class="chart-block__caption">Six pillars on one scale; same basis as the live report.</p>
  </div>`;
}

function buildVisualAnalysisSection(data: AuditReportPayload): string {
  const pageHeight = data.pageHeight || 3000;
  const { situation, action } = scrollDepthNarrative(data.audited_url, pageHeight);
  const blocks: string[] = [];
  blocks.push(`<div class="chart-block">
    <p class="chart-block__title">Scroll profile</p>
    <div class="chart-box">${buildScrollHeatStripSvg(pageHeight)}</div>
    <p class="chart-block__caption">${escapeHtml(situation)} ${escapeHtml(action)}</p>
  </div>`);
  const snapSrc = data.heroScreenshot ? heroScreenshotDataUrl(data.heroScreenshot) : null;
  const snapBody = buildHeroSnapshotFigureHtml(snapSrc);
  blocks.push(`<div class="chart-block">
    <p class="chart-block__title">First viewport snapshot</p>
    ${snapBody}
    <p class="chart-block__caption">${data.heroScreenshot ? "Above-the-fold capture used for this audit (single chunk)." : "No screenshot stored."}</p>
  </div>`);

  return `<div class="section report-major">
    <h2>Visual analysis</h2>
    ${blocks.join("")}
  </div>`;
}

function elementAuditHtml(
  items: NonNullable<AuditReportPayload["audit_items"]>,
  isPaid: boolean
): string {
  if (!items.length) return "";
  const h = reportHex;
  const statusColors: Record<string, string> = {
    Excellent: h.success,
    Good: h.success,
    Satisfactory: h.warning,
    "Needs Improvement": h.warning,
    Failed: h.destructive,
  };
  const slice = isPaid ? items : items.slice(0, 3);
  const teaserNote = !isPaid
    ? `<p class="muted report-nojustify">${escapeHtml(PRO_UPGRADE_STRIP)} ${escapeHtml(FULL_DIAGNOSTIC_UPGRADE_HOOK)}</p>`
    : "";
  const subPaid = isPaid
    ? `<p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:14px;">${escapeHtml(REPORT_ELEMENT_SUB)}</p>`
    : "";
  const rows = slice
    .map((item) => {
      const el = item.element || "Element";
      const stRaw = item.status || "—";
      if (!isPaid) {
        return `<div class="quick-win">
        <div class="report-card__title report-nojustify">${escapeHtml(el)} <span class="muted">— ${escapeHtml(stRaw)}</span></div>
        <p class="muted">• Root-cause diagnosis — full report</p>
        <p class="muted">• Implementation steps — Pro</p>
        <p class="muted">• Expected lift context — Pro</p>
      </div>`;
      }
      const pill = exportStatusPillColor(String(stRaw), statusColors);
      const workingBlock =
        item.working?.length
          ? `<div style="border-radius:8px;border:1px solid ${h.border};background:${h.surfaceMuted};padding:10px 12px;margin:8px 0;">
          <p class="report-label">What&apos;s working</p>
          <ul style="margin:6px 0 0;padding-left:1.15rem;font-size:0.8125rem;line-height:1.5;">${item.working.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
        </div>`
          : "";
      const notBlock =
        item.not_working?.length
          ? `<div style="border-radius:8px;border:1px solid ${h.destructive}33;background:${h.destructive}0d;padding:10px 12px;margin:8px 0;">
          <p class="report-label" style="color:${h.destructive};">What&apos;s not working</p>
          <ul style="margin:6px 0 0;padding-left:1.15rem;font-size:0.8125rem;line-height:1.5;">${item.not_working.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
        </div>`
          : "";
      return `<div class="quick-win">
        <div class="insight-card__head" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
          <span class="report-card__title report-nojustify">${escapeHtml(el)}</span>
          <span style="padding:4px 10px;border-radius:4px;background-color:${pill}22;color:${pill};font-size:11px;font-weight:600;">${escapeHtml(String(stRaw))}</span>
        </div>
        ${item.rationale ? `<p class="report-prose">${escapeHtml(item.rationale)}</p>` : ""}
        ${workingBlock}
        ${notBlock}
        ${item.fix ? `<p class="report-nojustify" style="margin-top:8px;"><span class="report-label" style="display:inline;margin-right:6px;">Fix</span> ${escapeHtml(item.fix)}</p>` : ""}
        ${
          item.expected_impact
            ? `<p class="muted report-nojustify"><span class="report-label" style="display:inline;margin-right:6px;">Impact</span> ${escapeHtml(item.expected_impact)}</p>`
            : ""
        }
      </div>`;
    })
    .join("");
  return `<div class="section report-major">
    <h2>Element-by-element audit</h2>
    ${subPaid}
    ${teaserNote}
    ${rows}
  </div>`;
}

function deepDiveFromDetailed(
  data: AuditReportPayload,
  isPaid: boolean
): string {
  if (!isPaid) {
    const detailed = data.detailedAudit || {};
    const previews = Object.entries(detailed)
      .filter(([, items]) => items?.length)
      .map(([cat]) => {
        const title = displayNameForCategoryKey(cat);
        return `<p class="muted"><strong>${escapeHtml(title)}</strong> — category breakdown, fix sequencing, and evidence in Pro.</p>`;
      })
      .join("");
    return `<div class="locked-section">
    <h2>Deep dive preview</h2>
    ${previews || `<p class="muted">Category-level analysis ships with Pro / Agency.</p>`}
    <p class="muted">${escapeHtml(PRO_UPGRADE_STRIP)}</p>
    <p class="muted">${escapeHtml(FULL_DIAGNOSTIC_UPGRADE_HOOK)}</p>
  </div>`;
  }
  const h = reportHex;
  const statusColors: Record<string, string> = {
    Excellent: h.success,
    Good: h.success,
    Satisfactory: h.warning,
    "Needs Improvement": h.warning,
    Failed: h.destructive,
  };
  const detailed = data.detailedAudit || {};
  const inner = Object.entries(detailed)
    .map(([cat, items]) => {
      if (!items?.length) return "";
      const title = displayNameForCategoryKey(cat);
      const rows = items as DetailedAuditRow[];
      const avgScore = averageScoreForCategoryItems(rows);
      const catVerdict = verdictLabelForCategoryAverage(avgScore);
      const catVerdictColor = exportCategoryVerdictColor(catVerdict);
      const body = items
        .map((item) => {
          const name =
            (item.elementName as string) ||
            (item.element as string) ||
            "Item";
          const status = String(item.status || "Satisfactory");
          const pill = exportStatusPillColor(status, statusColors);
          const fix =
            typeof item.fix === "object" && item.fix !== null
              ? String(
                  (item.fix as { quickFix?: string }).quickFix ||
                    JSON.stringify(item.fix)
                )
              : String(item.fix || "");
          return `<div class="quick-win">
            <div class="insight-card__head" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
              <span class="report-card__title report-nojustify">${escapeHtml(name)}</span>
              <span style="padding:4px 10px;border-radius:4px;background-color:${pill}22;color:${pill};font-size:11px;font-weight:600;">${escapeHtml(status)}</span>
            </div>
            ${item.rationale ? `<p class="report-prose">${escapeHtml(String(item.rationale))}</p>` : ""}
            ${fix ? `<p class="report-nojustify"><span class="report-label" style="display:inline;margin-right:6px;">Action</span> ${escapeHtml(fix)}</p>` : ""}
          </div>`;
        })
        .join("");
      return `<h3>${escapeHtml(title)} <span class="report-figure" style="font-size:1.25rem;color:${pdfAxisScoreHex(avgScore)};">${avgScore}/100</span> <span style="color:${catVerdictColor};font-size:0.8125rem;font-weight:600;">${escapeHtml(catVerdict)}</span></h3>${body}`;
    })
    .join("");
  if (!inner) {
    return `<div class="section report-major"><h2>Category deep dive</h2><p class="muted">No category breakdown in this export.</p></div>`;
  }
  return `<div class="section report-major">
    <h2>Category deep dive</h2>
    <p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:14px;">${escapeHtml(REPORT_CATEGORY_SUB)}</p>
    <div class="report-deep-dive-body">${inner}</div>
  </div>`;
}

export function generateAuditReportHTML(
  data: AuditReportPayload,
  options: {
    reportId: string;
    isPaid: boolean;
    calculator?: { traffic: number; price: number; industry: string };
    generatedAt?: Date;
  }
): string {
  const { reportId, isPaid } = options;
  const calc = options.calculator || {
    traffic: DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
    price: data.price_guess || DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD,
    industry: data.industry_guess || "SaaS",
  };
  const at = options.generatedAt || new Date();
  const quickWins = data.quickWins || data.quick_wins || [];
  const radar = data.radar_scores || data.radarMetrics || {};
  const hasRadar =
    typeof radar === "object" && radar !== null && Object.keys(radar).length > 0;
  const overall = hasRadar
    ? meanRadarSiteScore(radar as Record<string, unknown>)
    : Number(data.overall_score ?? data.overview?.overallScore) || 50;
  const auditItems = data.audit_items || [];
  const insiderBlock = industryInsiderHtmlFromAudit(data, escapeHtml);
  const seoPerfAppendix = buildSeoPerformanceAppendixHtml(data, escapeHtml);
  const site =
    data.audited_url ||
    (typeof reportId === "string" ? `Report ${reportId}` : "Your site");

  const tierLabel = isPaid ? "Full report (Pro / Agency)" : "Free summary";

  const freeQuickWins = quickWins
    .slice(0, 8)
    .map((win, i) => quickWinHtmlBlock(win as QuickWin, i, escapeHtml))
    .join("");

  const matrix = isPaid
    ? `<div class="section report-major">
        <h2>Priority matrix</h2>
        <table class="matrix report-matrix">
          <thead><tr><th>#</th><th>Element</th><th>Effort</th><th>Impact</th></tr></thead>
          <tbody>${priorityMatrixRows(quickWins)}</tbody>
        </table>
      </div>`
    : "";

  const paidQuickDetail =
    isPaid && quickWins.length
      ? `<div class="section report-major"><h2>Quick wins</h2>${quickWins
          .map((win, i) => quickWinHtmlBlock(win as QuickWin, i, escapeHtml))
          .join("")}</div>`
      : "";

  const auditCount = auditItems.length;
  const intelScoreNote = escapeHtml(formatIntelScoreFootnote(overall, auditCount));
  const intelEstNote = escapeHtml(`${INTEL_ESTIMATED_IMPROVEMENT} (illustrative)`);
  const intelBenchNote = escapeHtml(INTEL_BENCHMARK);

  const scoreColorHtml = pdfAxisScoreHex(overall);
  const verdict = verdictLabelFromSiteScore(
    Math.round(overall),
    radar as Record<string, unknown>
  );
  const verdictColorHtml = pdfVerdictHex(verdict);

  const freeRevenueSection = `<div class="section report-major"><h2>Revenue leak estimate</h2>${buildRevenueLeakCardHtml(data, calc, escapeHtml)}</div>`;
  const freeInsightSection = `<div class="section report-major"><h2>Executive insight layers</h2><p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:14px;">Scenario model—not a guarantee. Base uses the 2% benchmark consistent with lost-revenue illustrations elsewhere in this report.</p>${buildInsightLayersHtml(data, false, calc, escapeHtml, { includeRevenue: false, includeOuterHeading: false, includeIntroBlurb: false })}</div>`;

  const supplementInner = buildReportSupplementInnerHtml(
    {
      scrollEffectiveness: data.scrollEffectiveness ?? null,
      trafficEstimate: data.trafficEstimate ?? null,
    },
    escapeHtml
  );
  const supplementSection = supplementInner.trim()
    ? `<div class="section report-major"><h2>Supplementary audit coverage</h2>${supplementInner}</div>`
    : "";

  const paidCover = `<div class="report-cover">
    <h1 class="report-cover-brand">${BRAND_NAME}</h1>
    <p class="report-cover-subtitle">Conversion audit — full report</p>
    <p class="report-meta report-nojustify" style="margin-top:20px;">${escapeHtml(site)} · ${escapeHtml(tierLabel)} · ${escapeHtml(at.toLocaleString())}</p>
  </div>`;

  const revenuePaidSection = `<div class="section report-major"><h2>Revenue leak estimate</h2>${buildRevenueLeakCardHtml(data, calc, escapeHtml)}</div>`;
  const insightPaidSection = `<div class="section report-major"><h2>Executive insight layers</h2><p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:14px;">Scenario model—not a guarantee. Base uses the 2% benchmark consistent with lost-revenue illustrations elsewhere in this report.</p>${buildInsightLayersHtml(data, true, calc, escapeHtml, { includeRevenue: false, includeOuterHeading: false, includeIntroBlurb: false })}</div>`;
  const siteScorePaidSection = buildSiteScoreSectionHtml(
    radar as Record<string, number>,
    overall,
    hasRadar,
    auditCount
  );

  const execDiagnostic = buildExecutiveDiagnosticSection(data);
  const visualSection = isPaid ? buildVisualAnalysisSection(data) : "";

  const readGuideHtml = buildHowToReadThisReportHtml(escapeHtml);
  const scanContextHtml = buildReportContextCardHtml(data, escapeHtml);
  const analyticsReadyHtml = buildReportAnalyticsReadinessHtml(data, escapeHtml);
  const experimentHtml = buildExperimentBacklogSectionHtml(data, escapeHtml);
  const checklistHtml = buildImplementationChecklistHtml(data, escapeHtml);

  if (!isPaid) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME} — Free audit summary (${escapeHtml(reportId)})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="${reportFontsHref}" />
  <style>${getReportEmbedStyles()}</style>
</head>
<body>
  <header class="report-head">
    <h1>${BRAND_NAME} audit — Free summary</h1>
    <p class="report-meta">${escapeHtml(site)} · ${tierLabel} · ${escapeHtml(at.toLocaleString())}</p>
  </header>

  <div class="section report-major">
    <h2>Overall score</h2>
    <p class="report-verdict" style="color:${verdictColorHtml}">${escapeHtml(verdict)}</p>
    <div class="score score--semantic" style="color:${scoreColorHtml}"><span class="report-figure">${overall}</span><span class="score-suffix">/100</span></div>
    <p class="intel-micro">${intelScoreNote}</p>
  </div>

  ${buildExecutiveDiagnosticSection(data)}

  ${readGuideHtml}
  ${scanContextHtml}
  ${analyticsReadyHtml}

  ${freeRevenueSection}

  ${freeInsightSection}

  ${
    quickWins.length
      ? `<div class="section report-major"><h2>Quick wins &amp; impact</h2><p class="intel-micro">${intelEstNote} when prioritized fixes ship (typical range, not guaranteed). ${intelBenchNote}.</p>${freeQuickWins}</div>
      ${experimentHtml}
      ${checklistHtml}`
      : `${experimentHtml}${checklistHtml}`
  }

  <div class="section report-major">
    <h2>AI Insights</h2>
    ${insiderBlock || `<p class="report-prose">Patterns from your page and category benchmarks.</p>`}
  </div>

  ${seoPerfAppendix}

  ${Object.keys(data.detailedAudit || {}).length ? deepDiveFromDetailed(data, false) : ""}
  ${auditItems.length ? elementAuditHtml(auditItems, false) : ""}

  ${supplementSection}

  <div class="locked-section">
    <h2>Unlock the full report</h2>
    <p class="report-nojustify">Radar, first-viewport snapshot, priority matrix, competitor context, and full element-level fixes are included in Pro / Agency.</p>
    <p class="muted">${escapeHtml(PRO_UPGRADE_STRIP)}</p>
    <p class="muted">${escapeHtml(FULL_DIAGNOSTIC_UPGRADE_HOOK)}</p>
  </div>

  <footer class="meta report-nojustify"><small>Generated by ${BRAND_NAME} · ${escapeHtml(at.toISOString())}</small></footer>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME} — Full audit (${escapeHtml(reportId)})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="${reportFontsHref}" />
  <style>${getReportEmbedStyles()}</style>
</head>
<body>
  ${paidCover}
  <div class="report-body">
  ${execDiagnostic}
  ${readGuideHtml}
  ${scanContextHtml}
  ${analyticsReadyHtml}
  ${revenuePaidSection}
  ${insightPaidSection}
  ${siteScorePaidSection}
  ${matrix}
  ${paidQuickDetail}
  ${experimentHtml}
  ${checklistHtml}
  ${visualSection}
  ${deepDiveFromDetailed(data, true)}
  ${elementAuditHtml(auditItems, true)}
  ${seoPerfAppendix}
  ${supplementSection}
  </div>

  <footer class="meta report-nojustify"><small>Confidential · ${BRAND_NAME} · ${escapeHtml(at.toISOString())}</small></footer>
</body>
</html>`;
}
