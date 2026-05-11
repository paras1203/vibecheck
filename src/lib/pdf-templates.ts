/**
 * Server-side PDF template generation (Puppeteer). Uses inline SVG so charts print reliably.
 */

import {
  reportFontsHref,
  reportHex,
  getReportPdfStyles,
  pdfAxisScoreHex,
  pdfVerdictHex,
} from "./report-theme";
import { FULL_DIAGNOSTIC_UPGRADE_HOOK, PRO_UPGRADE_STRIP } from "./report-copy";
import {
  formatIntelScoreFootnote,
  INTEL_ESTIMATED_IMPROVEMENT,
  INTEL_BENCHMARK,
} from "./report-intelligence";
import { buildRadarSvg, buildScrollHeatStripSvg } from "./report-charts-svg";
import { buildHeroSnapshotFigureHtml } from "./report-hero-snapshot-html";
import {
  buildInsightLayersHtml,
  buildRevenueLeakCardHtml,
} from "./insight-layers-report";
import type { InsightExportData } from "./insight-layers-report";
import { buildExecutiveDiagnosticInnerHtml } from "./report-diagnostic-section";
import { scrollDepthNarrative, formatQuickWinSubheadLine } from "./report-ui";
import { quickWinFixBulletText } from "./quick-wins-format";
import { BRAND_NAME } from "./brand";
import { buildPersonalizedInsiderLines } from "@/lib/personalized-insider";
import { heroScreenshotDataUrl } from "@/lib/hero-image";
import { buildSeoPerformanceAppendixHtml } from "@/lib/report-seo-appendix";
import type { ReportArtifactsInput } from "@/lib/report-artifacts-html";
import {
  buildExperimentBacklogSectionHtml,
  buildHowToReadThisReportHtml,
  buildImplementationChecklistHtml,
  buildReportAnalyticsReadinessHtml,
  buildReportContextCardHtml,
} from "@/lib/report-artifacts-html";
import type { SeoAnalysisResult } from "@/lib/seo-analyzer";
import type { PageSpeedSummary } from "@/lib/pagespeed";
import {
  DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD,
  DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
} from "@/lib/insight-layers";
import type {
  PerformanceGeminiSummary,
  ScrollEffectiveness,
  TrafficEstimate,
} from "@/types/roast-extras";
import { buildReportSupplementInnerHtml } from "./report-export-supplement";
import { buildRadarPillarTilesHtml } from "./report-radar-tiles-html";
import { meanRadarSiteScore, verdictLabelFromSiteScore } from "@/lib/site-score";
import {
  averageScoreForCategoryItems,
  displayNameForCategoryKey,
  verdictLabelForCategoryAverage,
  type DetailedAuditRow,
} from "@/lib/report-category-score";
import {
  exportCategoryVerdictColor,
  exportStatusPillColor,
} from "@/lib/report-export-status";
import type { AuditReportPayload } from "@/lib/report-html";
import { buildReportV2InnerHtml, buildReportV2PdfShellHtml } from "@/lib/report-v2-html-blocks";

interface RoastData extends InsightExportData {
  overall_score?: number;
  roastSummary?: string;
  roastAnalysis?: string;
  hook?: string;
  script?: string;
  analysis?: string;
  verdict?: string;
  closer?: string;
  overview?: {
    overallScore?: number;
    executiveSummary?: string;
    roastAnalysis?: string;
  };
  quickWins?: Array<{
    title?: string;
    elementName?: string;
    problem?: string;
    fix?: string;
    example?: string;
    effort?: string;
    lift?: string;
  }>;
  quick_wins?: Array<Record<string, unknown>>;
  radarMetrics?: Record<string, number>;
  radar_scores?: Record<string, number>;
  detailedAudit?: Record<string, Array<Record<string, unknown>>>;
  audit_items?: Array<Record<string, unknown>>;
  pageHeight?: number;
  price_guess?: number;
  industry_guess?: string;
  audited_url?: string;
  heroScreenshot?: string;
  seo?: SeoAnalysisResult | null;
  page_type?: string;
  performance?: PageSpeedSummary | null;
  performanceGemini?: PerformanceGeminiSummary | null;
  scrollEffectiveness?: ScrollEffectiveness | null;
  trafficEstimate?: TrafficEstimate | null;
  experimentBacklog?: import("@/types/report-artifacts").ExperimentBacklogItem[];
  implementationChecklist?: import("@/types/report-artifacts").ImplementationChecklistItem[];
  price_from_page?: boolean;
  price_billing_note?: string;
  performance_audit?: import("@/lib/audits/performance-pagespeed").PerformanceAuditResult | null;
  tech_stack?: import("@/lib/audits/tech-stack-audit").TechStackAuditResult | null;
  behaviour_tools?: import("@/lib/audits/behaviour-tools").BehaviourToolsAdvice | null;
}

function pdfScoreColor(score: number): string {
  if (score < 50) return reportHex.destructive;
  if (score < 80) return reportHex.warning;
  return reportHex.success;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ReportExportCalculatorInput = {
  traffic?: number;
  price?: number;
  industry?: string;
};

function resolvePdfCalculatorNumbers(
  data: RoastData,
  override?: ReportExportCalculatorInput | null
): { traffic: number; price: number } {
  const traffic =
    override?.traffic ??
    data.trafficEstimate?.monthlySessions ??
    DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS;
  const pg = Number(data.price_guess);
  const price =
    override?.price ??
    (Number.isFinite(pg) && pg > 0 ? pg : DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD);
  return { traffic, price };
}

function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x));
}

function quickWinImpactMatrixCell(win: { impactCode?: string; lift?: string }): string {
  const code = (win.impactCode || "").trim().toUpperCase();
  const lift = (win.lift || "").trim();
  if (code === "HI" || code === "MI" || code === "LI") {
    return lift ? `${code} — ${lift}` : code;
  }
  return lift || "—";
}

function quickWinPdfCardBlock(
  win: {
    title?: string;
    elementName?: string;
    effort?: string;
    impactCode?: string;
    problem?: string;
    fix?: string;
    example?: string;
    lift?: string;
  },
  idx: number
): string {
  const title = esc(String(win.title || win.elementName || "Quick win"));
  const sub = esc(formatQuickWinSubheadLine(win.effort, win.impactCode, win.lift));
  const fixB = esc(
    quickWinFixBulletText(String(win.fix || ""), String(win.example || ""))
  );
  const prob = win.problem
    ? `<li><strong>Problem:</strong> ${esc(String(win.problem))}</li>`
    : "";
  const impLi = win.lift
    ? `<li><strong>Impact:</strong> ${esc(String(win.lift))}</li>`
    : "";
  return `<div class="quick-win">
        <div class="report-card__index">#${idx + 1}</div>
        <div class="report-card__title report-nojustify">${title}</div>
        <p class="muted report-nojustify" style="font-size:0.8125rem;margin-top:6px">${sub}</p>
        <ul style="margin:8px 0 0;padding-left:1.1rem;font-size:0.8125rem">${prob}<li><strong>Fix:</strong> ${fixB}</li>${impLi}</ul>
      </div>`;
}

export async function generateFreeRoastCertificateHTML(
  data: RoastData,
  url: string = "https://siteroast.ai",
  calculator?: ReportExportCalculatorInput | null
): Promise<string> {
  const radarForScore = data.radar_scores || data.radarMetrics || {};
  const hasRadar = Object.keys(radarForScore).length > 0;
  const overallScore = hasRadar
    ? meanRadarSiteScore(radarForScore as Record<string, unknown>)
    : Number(data.overall_score ?? data.overview?.overallScore) || 50;
  const quickWins = data.quickWins || data.quick_wins || [];
  const { traffic, price } = resolvePdfCalculatorNumbers(data, calculator);
  const insiderLines = buildPersonalizedInsiderLines(data as Record<string, unknown>);
  const insiderHtml = insiderLines.length
    ? insiderLines.map((l) => `<p class="report-prose">${esc(l)}</p>`).join("")
    : `<p class="report-prose">${esc("Patterns from your page and category benchmarks.")}</p>`;
  const auditCount = (data.audit_items || []).length;
  const intelScoreEsc = esc(formatIntelScoreFootnote(overallScore, auditCount));
  const intelEstEsc = esc(`${INTEL_ESTIMATED_IMPROVEMENT} (illustrative)`);
  const intelBenchEsc = esc(INTEL_BENCHMARK);

  const revenueLeakFreeHtml = buildRevenueLeakCardHtml(data, { traffic, price }, esc);
  const insightFreeHtml = buildInsightLayersHtml(
    data,
    false,
    { traffic, price },
    esc,
    { includeRevenue: false, includeIntroBlurb: false }
  );

  const h = reportHex;
  const verdictText = verdictLabelFromSiteScore(
    Math.round(overallScore),
    radarForScore as Record<string, unknown>
  );
  const verdictColorFree = pdfVerdictHex(verdictText);
  const scoreColorFree = pdfAxisScoreHex(overallScore);

  const execInner = buildExecutiveDiagnosticInnerHtml(data, esc);
  const seoAppendixFree = buildSeoPerformanceAppendixHtml(data, esc);
  const artifactPayload = data as ReportArtifactsInput;
  const roadmapIntroFree =
    buildHowToReadThisReportHtml(esc) +
    buildReportContextCardHtml(artifactPayload, esc) +
    buildReportAnalyticsReadinessHtml(artifactPayload, esc);
  const experimentFreeHtml =
    buildExperimentBacklogSectionHtml(artifactPayload, esc);
  const checklistFreeHtml =
    buildImplementationChecklistHtml(artifactPayload, esc);
  const deliveryBlocksFree =
    experimentFreeHtml + checklistFreeHtml;

  const qwHtml = quickWins
    .slice(0, 8)
    .map((win, i) => quickWinPdfCardBlock(win, i))
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${BRAND_NAME} — Free summary</title>
  <link rel="stylesheet" href="${reportFontsHref}" />
  <style>${getReportPdfStyles()}</style>
  <style>
    body { padding: 44px 36px 56px; }
    .report-page { page-break-after: auto; border-bottom: none; }
  </style>
</head>
<body>
  <h1>${BRAND_NAME} — Free audit summary</h1>
  <p class="report-meta" style="margin-bottom:28px;">${esc(url)} · ${new Date().toLocaleDateString()}</p>

  <h2>Overall score</h2>
  <p class="report-verdict" style="color:${verdictColorFree};">${esc(verdictText)}</p>
  <div class="score score--semantic" style="color:${scoreColorFree};font-size:68px;font-weight:700;line-height:1;margin-bottom:8px;"><span class="report-figure">${overallScore}</span><span class="score-suffix">/100</span></div>
  <p class="intel-micro">${intelScoreEsc}</p>

  ${execInner ? `<h2>Executive summary &amp; diagnostic</h2><div class="report-exec-diagnostics">${execInner}</div>` : ""}

  ${roadmapIntroFree}

  <h2>Revenue leak estimate</h2>
  ${revenueLeakFreeHtml}

  <h2>Executive insight layers</h2>
  <p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:14px;">Scenario model—not a guarantee. Base uses the 2% benchmark consistent with lost-revenue illustrations elsewhere in this report.</p>
  ${insightFreeHtml}

  ${quickWins.length ? `<h2>Quick wins &amp; impact</h2><p class="intel-micro">${intelEstEsc} when prioritized fixes ship (typical range, not guaranteed). ${intelBenchEsc}.</p>${qwHtml}${deliveryBlocksFree}` : `${deliveryBlocksFree}`}

  <h2>AI Insights</h2>
  <div class="section" style="margin-top:12px;">${insiderHtml}</div>

  ${seoAppendixFree}

  <div class="locked-section" style="margin-top:28px;">
    <p class="report-label" style="text-align:center;margin-bottom:8px;">Upgrade</p>
    <p class="report-nojustify">${esc(PRO_UPGRADE_STRIP)} Radar, viewport snapshot, priority matrix, deep dive, and full element audit — ${esc(url)}/billing</p>
    <p class="muted report-nojustify" style="margin-top:10px;font-size:13px;">${esc(FULL_DIAGNOSTIC_UPGRADE_HOOK)}</p>
  </div>
</body>
</html>`;
}

export async function generatePaidAgencyReportHTML(
  data: RoastData,
  url: string = "https://siteroast.ai",
  calculator?: ReportExportCalculatorInput | null
): Promise<string> {
  const radarScores = data.radar_scores || data.radarMetrics || {};
  const hasRadar = Object.keys(radarScores).length > 0;
  const overallScore = hasRadar
    ? meanRadarSiteScore(radarScores as Record<string, unknown>)
    : Number(data.overall_score ?? data.overview?.overallScore) || 50;
  const quickWins = data.quickWins || data.quick_wins || [];
  const detailedAudit = data.detailedAudit || {};
  const auditItems = data.audit_items || [];
  const pageHeight = data.pageHeight || 3000;
  const { traffic: pdfTraffic, price: pdfPrice } = resolvePdfCalculatorNumbers(
    data,
    calculator
  );

  const h = reportHex;

  const statusColors: Record<string, string> = {
    Excellent: h.success,
    Good: h.success,
    Satisfactory: h.warning,
    "Needs Improvement": h.warning,
    Failed: h.destructive,
  };

  const categoriesInner = Object.entries(detailedAudit)
    .map(([category, items]) => {
      if (!items || items.length === 0) return "";
      const categoryName = displayNameForCategoryKey(category);
      const rows = items as DetailedAuditRow[];
      const avgScore = averageScoreForCategoryItems(rows);
      const catVerdict = verdictLabelForCategoryAverage(avgScore);
      const catVerdictColor = exportCategoryVerdictColor(catVerdict);

      const itemsHTML = items
        .map((item) => {
          const status = String(item.status || "Satisfactory");
          const pillColor = exportStatusPillColor(status, statusColors);
          const fixRaw = item.fix;
          const fixText =
            typeof fixRaw === "object" && fixRaw !== null
              ? String(
                  (fixRaw as { quickFix?: string }).quickFix ||
                    JSON.stringify(fixRaw)
                )
              : String(fixRaw || "");
          const name = String(item.elementName || "Element");

          return `<div class="quick-win">
            <div class="insight-card__head" style="margin-bottom:8px;">
              <span class="report-card__title report-nojustify">${esc(name)}</span>
              <span style="padding:4px 10px;border-radius:4px;background-color:${pillColor}22;color:${pillColor};font-size:11px;font-weight:600;">${esc(status)}</span>
            </div>
            ${item.rationale ? `<p class="report-prose" style="font-size:14px;margin:0 0 10px;">${esc(String(item.rationale))}</p>` : ""}
            ${fixText ? `<p class="report-nojustify" style="font-size:14px;"><span class="report-label" style="display:inline;margin-right:6px;">Action</span> ${esc(fixText)}</p>` : ""}
          </div>`;
        })
        .join("");

      return `<h3>${esc(categoryName)} <span class="report-figure" style="font-size:1.25rem;color:${pdfAxisScoreHex(avgScore)};">${avgScore}/100</span> <span style="color:${catVerdictColor};font-size:0.8125rem;font-weight:600;">${esc(catVerdict)}</span></h3>
      ${itemsHTML}`;
    })
    .join("");

  const matrixExtraRowsStr =
    quickWins.length > 12
      ? quickWins
          .slice(12)
          .map(
            (win, idx) => `
        <tr>
          <td>#${idx + 13}</td>
          <td>${esc(String(win.title || win.elementName || "Quick win"))}</td>
          <td style="color: ${h.muted};">${esc(String(win.effort || "—"))}</td>
          <td style="color: ${h.muted};">${esc(quickWinImpactMatrixCell(win as { impactCode?: string; lift?: string }))}</td>
        </tr>`
          )
          .join("")
      : "";
  const matrixRowsFull =
    quickWins.length > 0
      ? quickWins
          .slice(0, 12)
          .map(
            (win, idx) => `
        <tr>
          <td>#${idx + 1}</td>
          <td>${esc(String(win.title || win.elementName || "Quick win"))}</td>
          <td style="color: ${h.muted};">${esc(String(win.effort || "—"))}</td>
          <td style="color: ${h.muted};">${esc(quickWinImpactMatrixCell(win as { impactCode?: string; lift?: string }))}</td>
        </tr>`
          )
          .join("") + matrixExtraRowsStr
      : `<tr><td colspan="4" style="color:${h.muted};">No quick wins in dataset — see deep dive.</td></tr>`;

  const radarSvg = hasRadar
    ? buildRadarSvg(radarScores as Record<string, number>, 300)
    : `<p class="muted">No radar metrics in export.</p>`;
  const scrollSvg = buildScrollHeatStripSvg(pageHeight);
  const scrollCap = scrollDepthNarrative(data.audited_url, pageHeight);
  const snapSrc = data.heroScreenshot ? heroScreenshotDataUrl(data.heroScreenshot) : null;
  const snapBody = buildHeroSnapshotFigureHtml(snapSrc, {
    borderColor: reportHex.border,
  });

  const auditItemsHTML = auditItems
    .map((item) => {
      const el = esc(String(item.element || "Element"));
      const stRaw = String(item.status || "—");
      const st = esc(stRaw);
      const pillColor = exportStatusPillColor(stRaw, statusColors);
      const rationale = item.rationale ? esc(String(item.rationale)) : "";
      const working = strList(item.working);
      const notWorking = strList(item.not_working);
      const fix = item.fix ? esc(String(item.fix)) : "";
      const impact = item.expected_impact
        ? esc(String(item.expected_impact))
        : "";
      const workingBlock =
        working.length > 0
          ? `<div style="border-radius:8px;border:1px solid ${h.border};background:${h.surfaceMuted};padding:10px 12px;margin:8px 0;">
          <p class="report-label">What&apos;s working</p>
          <ul style="margin:6px 0 0;padding-left:1.15rem;font-size:0.8125rem;line-height:1.5;">${working.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        </div>`
          : "";
      const notBlock =
        notWorking.length > 0
          ? `<div style="border-radius:8px;border:1px solid ${h.destructive}33;background:${h.destructive}0d;padding:10px 12px;margin:8px 0;">
          <p class="report-label" style="color:${h.destructive};">What&apos;s not working</p>
          <ul style="margin:6px 0 0;padding-left:1.15rem;font-size:0.8125rem;line-height:1.5;">${notWorking.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        </div>`
          : "";
      return `<div class="quick-win">
        <div class="insight-card__head" style="margin-bottom:8px;">
          <span class="report-card__title report-nojustify">${el}</span>
          <span style="padding:4px 10px;border-radius:4px;background-color:${pillColor}22;color:${pillColor};font-size:11px;font-weight:600;">${st}</span>
        </div>
        ${rationale ? `<p class="report-prose" style="font-size:14px;margin:8px 0;">${rationale}</p>` : ""}
        ${workingBlock}
        ${notBlock}
        ${fix ? `<p class="report-nojustify" style="font-size:14px;margin-top:8px;"><span class="report-label" style="display:inline;margin-right:6px;">Fix</span> ${fix}</p>` : ""}
        ${impact ? `<p class="muted report-nojustify" style="font-size:14px;"><span class="report-label" style="display:inline;margin-right:6px;">Impact</span> ${impact}</p>` : ""}
      </div>`;
    })
    .join("");

  const paidIntelScoreEsc = esc(
    formatIntelScoreFootnote(overallScore, auditItems.length)
  );
  const paidIntelEstEsc = esc(`${INTEL_ESTIMATED_IMPROVEMENT} (illustrative)`);

  const revenuePageHtml = buildRevenueLeakCardHtml(
    data,
    { traffic: pdfTraffic, price: pdfPrice },
    esc
  );
  const insightLayersOnlyHtml = buildInsightLayersHtml(
    data,
    true,
    { traffic: pdfTraffic, price: pdfPrice },
    esc,
    { includeRevenue: false, includeOuterHeading: false, includeIntroBlurb: false }
  );

  const verdictPaidText = verdictLabelFromSiteScore(
    Math.round(overallScore),
    radarScores as Record<string, unknown>
  );
  const verdictPaidColor = pdfVerdictHex(verdictPaidText);
  const pillarTilesHtml = buildRadarPillarTilesHtml(
    radarScores as Record<string, number>,
    esc,
    hasRadar
  );

  const execInner = buildExecutiveDiagnosticInnerHtml(data, esc);
  const artifactPaid = data as ReportArtifactsInput;
  const roadmapPaidPage =
    `<div class="report-page">${buildHowToReadThisReportHtml(
      esc
    )}${buildReportContextCardHtml(artifactPaid, esc)}${buildReportAnalyticsReadinessHtml(
      artifactPaid,
      esc
    )}</div>`;
  const backlogPaidCombined =
    buildExperimentBacklogSectionHtml(artifactPaid, esc) +
    buildImplementationChecklistHtml(artifactPaid, esc);
  const experimentChecklistPaidPage = backlogPaidCombined.trim()
    ? `<div class="report-page">${backlogPaidCombined}</div>`
    : "";

  const quickWinCards = quickWins
    .map((win, idx) => quickWinPdfCardBlock(win, idx))
    .join("");

  const coverPage = `<div class="report-page">
    <div class="report-cover-pdf">
      <h1>${BRAND_NAME}</h1>
      <p class="report-cover-subtitle">Conversion audit — full report</p>
      <p class="report-meta report-nojustify" style="margin-top:28px;word-break:break-all;">${esc(url)}</p>
      <p class="report-meta report-nojustify" style="margin-top:16px;">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
  </div>`;

  const execPage =
    execInner.trim().length > 0
      ? `<div class="report-page">
    <h2>Executive summary &amp; diagnostic</h2>
    <div class="report-exec-diagnostics">${execInner}</div>
  </div>`
      : "";

  const revenuePage = `<div class="report-page">
    <h2>Revenue leak estimate</h2>
    ${revenuePageHtml}
  </div>`;

  const insightPage = `<div class="report-page">
    <h2>Executive insight layers</h2>
    <p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:14px;">Scenario model—not a guarantee. Base uses the 2% benchmark consistent with lost-revenue illustrations elsewhere in this report.</p>
    ${insightLayersOnlyHtml}
  </div>`;

  const siteScorePage = `<div class="report-page">
    <h2>Site Score</h2>
    <p class="report-verdict" style="font-size:13px;letter-spacing:0.06em;color:${verdictPaidColor};margin-bottom:10px;">${esc(verdictPaidText)}</p>
    <div class="score score--semantic" style="color:${pdfAxisScoreHex(overallScore)};font-size:72px;font-weight:700;line-height:1;margin-bottom:8px;"><span class="report-figure">${overallScore}</span><span class="score-suffix">/100</span></div>
    <p class="intel-micro">${paidIntelScoreEsc}</p>
    <p class="chart-block__title" style="margin-top:22px;">Pillar scores</p>
    ${pillarTilesHtml}
    <div class="chart-box">${radarSvg}</div>
    <p class="chart-block__caption">Six pillars on one scale; same basis as the live report.</p>
  </div>`;

  const matrixPage = `<div class="report-page">
    <h2>Priority matrix</h2>
    <p class="intel-micro" style="margin-bottom:14px;">${paidIntelEstEsc} · ${esc(INTEL_BENCHMARK)}</p>
    <table class="report-matrix">
      <thead><tr><th>#</th><th>Element</th><th>Effort</th><th>Impact</th></tr></thead>
      <tbody>${matrixRowsFull}</tbody>
    </table>
  </div>`;

  const quickWinsPage =
    quickWins.length > 0
      ? `<div class="report-page">
    <h2>Quick wins</h2>
    ${quickWinCards}
  </div>`
      : "";

  const visualPage = `<div class="report-page">
    <h2>Visual analysis</h2>
    <div class="chart-block">
      <p class="chart-block__title">Scroll profile</p>
      <div class="chart-box">${scrollSvg}</div>
      <p class="chart-block__caption">${esc(scrollCap.situation)} ${esc(scrollCap.action)}</p>
    </div>
    <div class="chart-block">
      <p class="chart-block__title">First viewport snapshot</p>
      ${snapBody}
      <p class="chart-block__caption">${data.heroScreenshot ? "Above-the-fold capture (single chunk)." : "No screenshot embedded."}</p>
    </div>
  </div>`;

  const categorySub =
    "Together they answer what this means for UX, conversion, copy, and the other audit dimensions—rolled up by category.";
  const elementSub =
    "Together they answer what each surfaced component is doing—status, rationale, what works, gaps, and fixes.";

  const deepDivePage =
    Object.keys(detailedAudit).length > 0 && categoriesInner.trim().length > 0
      ? `<div class="report-page">
    <h2>Category deep dive</h2>
    <p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:14px;">${esc(categorySub)}</p>
    <div class="report-deep-dive-body">${categoriesInner}</div>
  </div>`
      : "";

  const auditPage =
    auditItems.length > 0
      ? `<div class="report-page">
    <h2>Element-by-element audit</h2>
    <p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:14px;">${esc(elementSub)}</p>
    ${auditItemsHTML}
  </div>`
      : "";

  const seoAppendixPaid = buildSeoPerformanceAppendixHtml(data, esc);
  const seoPage = seoAppendixPaid
    ? `<div class="report-page">${seoAppendixPaid}</div>`
    : "";

  const supplementInner = buildReportSupplementInnerHtml(
    {
      scrollEffectiveness: data.scrollEffectiveness ?? null,
      trafficEstimate: data.trafficEstimate ?? null,
    },
    esc
  );
  const supplementPage = supplementInner.trim()
    ? `<div class="report-page">
    <h2>Supplementary audit coverage</h2>
    ${supplementInner}
  </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${BRAND_NAME} Full Report</title>
  <link rel="stylesheet" href="${reportFontsHref}" />
  <style>${getReportPdfStyles()}</style>
</head>
<body>
  ${coverPage}
  ${execPage}
  ${roadmapPaidPage}
  ${revenuePage}
  ${insightPage}
  ${siteScorePage}
  ${matrixPage}
  ${quickWinsPage}
  ${experimentChecklistPaidPage}
  ${visualPage}
  ${deepDivePage}
  ${auditPage}
  ${seoPage}
  ${supplementPage}
  <footer class="report-pdf-footer">
    <p>Confidential — ${BRAND_NAME}</p>
    <p>${new Date().toISOString()}</p>
  </footer>
</body>
</html>`;
}

export async function generateFreeRoastCertificateHTMLV2(
  data: RoastData,
  url: string = "https://siteroast.ai",
  calculator?: ReportExportCalculatorInput | null,
  reportId: string = "export"
): Promise<string> {
  const { traffic, price } = resolvePdfCalculatorNumbers(data, calculator);
  const inner = buildReportV2InnerHtml(data as unknown as AuditReportPayload, {
    esc,
    isPaid: false,
    calculator: {
      traffic,
      price,
      industry: String(calculator?.industry ?? data.industry_guess ?? "SaaS"),
    },
    reportId,
    generatedAt: new Date(),
  });
  return buildReportV2PdfShellHtml(inner, { esc, generatedAt: new Date() });
}

export async function generatePaidAgencyReportHTMLV2(
  data: RoastData,
  url: string = "https://siteroast.ai",
  calculator?: ReportExportCalculatorInput | null,
  reportId: string = "export"
): Promise<string> {
  const { traffic, price } = resolvePdfCalculatorNumbers(data, calculator);
  const inner = buildReportV2InnerHtml(data as unknown as AuditReportPayload, {
    esc,
    isPaid: true,
    calculator: {
      traffic,
      price,
      industry: String(calculator?.industry ?? data.industry_guess ?? "SaaS"),
    },
    reportId,
    generatedAt: new Date(),
  });
  return buildReportV2PdfShellHtml(inner, { esc, generatedAt: new Date() });
}
