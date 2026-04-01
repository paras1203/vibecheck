/**
 * Server-side PDF template generation (Puppeteer). Uses inline SVG so charts print reliably.
 */

import { reportFontsHref, reportHex, getReportPdfStyles } from "./report-theme";
import { FULL_DIAGNOSTIC_UPGRADE_HOOK, PRO_UPGRADE_STRIP } from "./report-copy";
import {
  formatIntelScoreFootnote,
  INTEL_ESTIMATED_IMPROVEMENT,
  INTEL_BENCHMARK,
} from "./report-intelligence";
import { buildRadarSvg, buildScrollHeatStripSvg } from "./report-charts-svg";
import { buildAttentionHeatmapFigureHtml } from "./report-heatmap-embed";
import { buildInsightLayersHtml } from "./insight-layers-report";
import type { InsightExportData } from "./insight-layers-report";
import { buildExecutiveDiagnosticInnerHtml } from "./report-diagnostic-section";
import { scrollDepthNarrative } from "./report-ui";
import { BRAND_NAME } from "./brand";
import { buildPersonalizedInsiderLines } from "@/lib/personalized-insider";
import { heroScreenshotDataUrl } from "@/lib/hero-image";
import { buildSeoPerformanceAppendixHtml } from "@/lib/report-seo-appendix";
import type { SeoAnalysisResult } from "@/lib/seo-analyzer";
import type { PageSpeedSummary } from "@/lib/pagespeed";

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

function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x));
}

export async function generateFreeRoastCertificateHTML(
  data: RoastData,
  url: string = "https://siteroast.ai"
): Promise<string> {
  const overallScore = data.overall_score || data.overview?.overallScore || 50;
  const quickWins = data.quickWins || data.quick_wins || [];
  const traffic = 1000;
  const price = data.price_guess || 50;
  const lift = 0.02;
  const lost = Math.round(traffic * lift * price * 12);
  const insiderLines = buildPersonalizedInsiderLines(data as Record<string, unknown>);
  const insiderHtml = insiderLines.length
    ? insiderLines.map((l) => `<p class="report-prose">${esc(l)}</p>`).join("")
    : `<p class="report-prose">${esc("Patterns from your page and category benchmarks.")}</p>`;
  const auditCount = (data.audit_items || []).length;
  const intelScoreEsc = esc(formatIntelScoreFootnote(overallScore, auditCount));
  const intelEstEsc = esc(`${INTEL_ESTIMATED_IMPROVEMENT} (illustrative)`);
  const intelBenchEsc = esc(INTEL_BENCHMARK);

  const insightFreeHtml = buildInsightLayersHtml(
    data,
    false,
    { traffic, price },
    esc
  );

  const h = reportHex;
  const scoreColor = pdfScoreColor(overallScore);
  const verdictText =
    overallScore < 50
      ? "CRITICAL CONDITION"
      : overallScore < 80
        ? "NEEDS OPTIMIZATION"
        : "EXCELLENT";

  const execInner = buildExecutiveDiagnosticInnerHtml(data, esc);
  const seoAppendixFree = buildSeoPerformanceAppendixHtml(data, esc);

  const qwHtml = quickWins
    .slice(0, 8)
    .map((win, i) => {
      const w = win as {
        title?: string;
        elementName?: string;
        lift?: string;
        fix?: string;
        effort?: string;
      };
      const t = esc(w.title || w.elementName || `Quick win ${i + 1}`);
      const imp = esc(w.lift || w.fix || "—");
      const ef = w.effort ? esc(w.effort) : "";
      return `<div class="quick-win">
        <div class="report-card__index">#${i + 1}</div>
        <div class="report-card__title report-nojustify">${t}</div>
        <p class="muted report-nojustify" style="font-size:0.875rem;margin-top:8px;"><span class="report-label" style="display:inline;margin-right:6px;">Impact</span> ${imp}</p>
        ${ef ? `<p class="muted report-nojustify" style="font-size:0.8125rem;"><span class="report-label" style="display:inline;margin-right:6px;">Effort</span> ${ef}</p>` : ""}
      </div>`;
    })
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
  <p class="report-verdict">${esc(verdictText)}</p>
  <div class="score score--semantic" style="color:${scoreColor};font-size:68px;font-weight:700;line-height:1;margin-bottom:8px;"><span class="report-figure">${overallScore}</span><span class="score-suffix">/100</span></div>
  <p class="intel-micro">${intelScoreEsc}</p>

  ${execInner ? `<h2>Executive summary &amp; diagnostic</h2>${execInner}` : ""}

  ${insightFreeHtml}

  ${quickWins.length ? `<h2>Quick wins &amp; impact</h2><p class="intel-micro">${intelEstEsc} when prioritized fixes ship (typical range, not guaranteed). ${intelBenchEsc}.</p>${qwHtml}` : ""}

  <h2>Lost revenue (illustrative)</h2>
  <div class="section" style="margin-top:12px;">
    <p class="report-prose report-nojustify">At ~${traffic.toLocaleString()} monthly visits and $${price} per conversion (2% missed lift), roughly <strong class="report-figure">$${lost.toLocaleString()}</strong> may be left on the table annually.</p>
    <p class="intel-micro" style="margin-top:12px;">${intelEstEsc}</p>
  </div>

  <h2>Industry insider</h2>
  <div class="section" style="margin-top:12px;">${insiderHtml}</div>

  ${seoAppendixFree}

  <div class="locked-section" style="margin-top:28px;">
    <p class="report-label" style="text-align:center;margin-bottom:8px;">Upgrade</p>
    <p class="report-nojustify">${esc(PRO_UPGRADE_STRIP)} Radar, heatmap, priority matrix, deep dive, and full element audit — ${esc(url)}/billing</p>
    <p class="muted report-nojustify" style="margin-top:10px;font-size:13px;">${esc(FULL_DIAGNOSTIC_UPGRADE_HOOK)}</p>
  </div>
</body>
</html>`;
}

export async function generatePaidAgencyReportHTML(
  data: RoastData,
  url: string = "https://siteroast.ai"
): Promise<string> {
  const overallScore = data.overall_score || data.overview?.overallScore || 50;
  const quickWins = data.quickWins || data.quick_wins || [];
  const radarScores = data.radar_scores || data.radarMetrics || {};
  const detailedAudit = data.detailedAudit || {};
  const auditItems = data.audit_items || [];
  const pageHeight = data.pageHeight || 3000;

  const h = reportHex;

  const getVerdictText = (score: number): string => {
    if (score < 50) return "CRITICAL CONDITION";
    if (score < 80) return "NEEDS OPTIMIZATION";
    return "EXCELLENT";
  };

  const categoryNames: Record<string, string> = {
    ux: "UX & Layout",
    conversion: "Conversion & Funnel",
    copy: "Copy & Messaging",
    visuals: "Visuals & Brand",
    trust: "Trust & Credibility",
    speed: "Speed & Technical Health",
  };

  const statusColors: Record<string, string> = {
    Excellent: h.success,
    Good: h.success,
    Satisfactory: h.warning,
    "Needs Improvement": h.warning,
    Failed: h.destructive,
  };

  const statusPoints: Record<string, number> = {
    Excellent: 95,
    Good: 80,
    Satisfactory: 60,
    "Needs Improvement": 35,
    Failed: 5,
  };

  const categoriesInner = Object.entries(detailedAudit)
    .map(([category, items]) => {
      if (!items || items.length === 0) return "";
      const categoryName = categoryNames[category.toLowerCase()] || category;
      const scores = items.map(
        (item) => statusPoints[String(item.status || "Satisfactory")] || 60
      );
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      const itemsHTML = items
        .map((item) => {
          const status = String(item.status || "Satisfactory");
          const color = statusColors[status] || h.muted;
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
              <span style="padding:4px 10px;border-radius:4px;background-color:${color}22;color:${color};font-size:11px;font-weight:600;">${esc(status)}</span>
            </div>
            ${item.rationale ? `<p class="report-prose" style="font-size:14px;margin:0 0 10px;">${esc(String(item.rationale))}</p>` : ""}
            ${fixText ? `<p class="report-nojustify" style="font-size:14px;"><span class="report-label" style="display:inline;margin-right:6px;">Action</span> ${esc(fixText)}</p>` : ""}
          </div>`;
        })
        .join("");

      return `<h3>${esc(categoryName)} <span class="report-figure" style="font-size:1.25rem;color:${pdfScoreColor(avgScore)};">${avgScore}/100</span></h3>
      ${itemsHTML}`;
    })
    .join("");

  const matrixRows =
    quickWins.length > 0
      ? quickWins
          .slice(0, 12)
          .map(
            (win, idx) => `
        <tr>
          <td>#${idx + 1}</td>
          <td>${esc(String(win.title || win.elementName || "Quick win"))}</td>
          <td style="color: ${h.muted};">${esc(String(win.effort || "—"))}</td>
          <td style="color: ${h.muted};">${esc(String(win.lift || "—"))}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="4" style="color:${h.muted};">No quick wins in dataset — see deep dive.</td></tr>`;

  const hasRadar = Object.keys(radarScores).length > 0;
  const radarSvg = hasRadar
    ? buildRadarSvg(radarScores as Record<string, number>, 300)
    : `<p class="muted">No radar metrics in export.</p>`;
  const scrollSvg = buildScrollHeatStripSvg(pageHeight);
  const scrollCap = scrollDepthNarrative(data.audited_url, pageHeight);
  const heatSrc = data.heroScreenshot ? heroScreenshotDataUrl(data.heroScreenshot) : null;
  const heatBody = buildAttentionHeatmapFigureHtml(heatSrc, {
    borderColor: reportHex.border,
  });

  const auditItemsHTML = auditItems
    .map((item) => {
      const el = esc(String(item.element || "Element"));
      const st = esc(String(item.status || "—"));
      const rationale = item.rationale ? esc(String(item.rationale)) : "";
      const working = strList(item.working);
      const notWorking = strList(item.not_working);
      const fix = item.fix ? esc(String(item.fix)) : "";
      const impact = item.expected_impact
        ? esc(String(item.expected_impact))
        : "";
      return `<div class="quick-win">
        <div class="report-card__title report-nojustify">${el} <span class="muted">— ${st}</span></div>
        ${rationale ? `<p class="report-prose" style="font-size:14px;margin:8px 0;">${rationale}</p>` : ""}
        ${working.length ? `<p class="report-nojustify" style="font-size:14px;"><span class="report-label" style="display:inline;margin-right:6px;">Working</span> ${working.map((s) => esc(s)).join("; ")}</p>` : ""}
        ${notWorking.length ? `<p class="report-nojustify" style="font-size:14px;"><span class="report-label" style="display:inline;margin-right:6px;">Not working</span> ${notWorking.map((s) => esc(s)).join("; ")}</p>` : ""}
        ${fix ? `<p class="report-nojustify" style="font-size:14px;"><span class="report-label" style="display:inline;margin-right:6px;">Fix</span> ${fix}</p>` : ""}
        ${impact ? `<p class="muted report-nojustify" style="font-size:14px;"><span class="report-label" style="display:inline;margin-right:6px;">Impact</span> ${impact}</p>` : ""}
      </div>`;
    })
    .join("");

  const paidIntelScoreEsc = esc(
    formatIntelScoreFootnote(overallScore, auditItems.length)
  );
  const paidIntelEstEsc = esc(`${INTEL_ESTIMATED_IMPROVEMENT} (illustrative)`);

  const pdfTraffic = 1000;
  const pdfPrice = data.price_guess || 50;
  const insightPaidHtml = buildInsightLayersHtml(
    data,
    true,
    { traffic: pdfTraffic, price: pdfPrice },
    esc
  );

  const execInner = buildExecutiveDiagnosticInnerHtml(data, esc);

  const quickWinCards = quickWins
    .map((win, idx) => {
      const t = esc(String(win.title || win.elementName || "Quick win"));
      const impact = win.lift ? esc(String(win.lift)) : "";
      return `<div class="quick-win">
        <div class="report-card__index">#${idx + 1}</div>
        <div class="report-card__title report-nojustify">${t}</div>
        ${win.problem ? `<p class="report-nojustify" style="font-size:14px;margin-top:8px;"><span class="report-label" style="display:inline;margin-right:6px;">Problem</span> ${esc(String(win.problem))}</p>` : ""}
        ${win.fix ? `<p class="report-nojustify" style="font-size:14px;"><span class="report-label" style="display:inline;margin-right:6px;">Fix</span> ${esc(String(win.fix))}</p>` : ""}
        ${win.example ? `<pre style="margin-top:10px;">${esc(String(win.example))}</pre>` : ""}
        ${impact || win.effort ? `<p class="muted report-nojustify" style="font-size:13px;margin-top:8px;"><span class="report-label" style="display:inline;margin-right:6px;">Impact / effort</span> ${impact || "—"}${win.effort ? ` · ${esc(String(win.effort))}` : ""}</p>` : ""}
      </div>`;
    })
    .join("");

  const coverPage = `<div class="report-page">
    <div class="report-cover-pdf">
      <h1>${BRAND_NAME}</h1>
      <p class="report-cover-subtitle">Conversion audit — full report</p>
      <div class="score score--semantic" style="color:${pdfScoreColor(overallScore)};"><span class="report-figure">${overallScore}</span><span class="score-suffix">/100</span></div>
      <p class="intel-micro">${paidIntelScoreEsc}</p>
      <p class="report-verdict" style="font-size:15px;margin-top:16px;">${esc(getVerdictText(overallScore))}</p>
      <p class="report-meta report-nojustify" style="margin-top:20px;word-break:break-all;">${esc(url)}</p>
      <p class="report-meta report-nojustify" style="margin-top:20px;">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
  </div>`;

  const execPage =
    execInner.trim().length > 0
      ? `<div class="report-page">
    <h2>Executive summary &amp; diagnostic</h2>
    ${execInner}
  </div>`
      : "";

  const insightPage = `<div class="report-page">${insightPaidHtml}</div>`;

  const matrixPage = `<div class="report-page">
    <h2>Priority matrix</h2>
    <p class="intel-micro" style="margin-bottom:14px;">${paidIntelEstEsc} · ${esc(INTEL_BENCHMARK)}</p>
    <table class="report-matrix">
      <thead><tr><th>#</th><th>Element</th><th>Effort</th><th>Impact</th></tr></thead>
      <tbody>${matrixRows}</tbody>
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
      <p class="chart-block__title">Site score radar</p>
      <div class="chart-box">${radarSvg}</div>
      <p class="chart-block__caption">Category scores on a common scale for quick comparison.</p>
    </div>
    <div class="chart-block">
      <p class="chart-block__title">Scroll profile</p>
      <div class="chart-box">${scrollSvg}</div>
      <p class="chart-block__caption">${esc(scrollCap.situation)} ${esc(scrollCap.action)}</p>
    </div>
    <div class="chart-block">
      <p class="chart-block__title">Attention heatmap</p>
      ${heatBody}
      <p class="chart-block__caption">${data.heroScreenshot ? "Jet-style attention overlay on first viewport (illustrative)." : "Grid heatmap schematic when no capture is embedded."}</p>
    </div>
  </div>`;

  const auditPage =
    auditItems.length > 0
      ? `<div class="report-page">
    <h2>Element-by-element audit</h2>
    ${auditItemsHTML}
  </div>`
      : "";

  const deepDivePage =
    Object.keys(detailedAudit).length > 0 && categoriesInner.trim().length > 0
      ? `<div class="report-page">
    <h2>Deep dive findings</h2>
    <div class="report-deep-dive-body">${categoriesInner}</div>
  </div>`
      : "";

  const seoAppendixPaid = buildSeoPerformanceAppendixHtml(data, esc);
  const seoPage = seoAppendixPaid
    ? `<div class="report-page">${seoAppendixPaid}</div>`
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
  ${insightPage}
  ${matrixPage}
  ${quickWinsPage}
  ${visualPage}
  ${auditPage}
  ${deepDivePage}
  ${seoPage}
  <footer class="report-pdf-footer">
    <p>Confidential — ${BRAND_NAME}</p>
    <p>${new Date().toISOString()}</p>
  </footer>
</body>
</html>`;
}
