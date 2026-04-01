import { reportFontsHref, getReportEmbedStyles, reportHex } from "./report-theme";
import { buildRadarSvg, buildScrollHeatStripSvg } from "./report-charts-svg";
import { buildAttentionHeatmapFigureHtml } from "./report-heatmap-embed";
import { FULL_DIAGNOSTIC_UPGRADE_HOOK, PRO_UPGRADE_STRIP } from "./report-copy";
import { formatEffortLine, formatImpactLine, scrollDepthNarrative } from "./report-ui";
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
import { buildInsightLayersHtml } from "@/lib/insight-layers-report";
import {
  buildExecutiveDiagnosticInnerHtml,
} from "@/lib/report-diagnostic-section";
import { BRAND_NAME } from "@/lib/brand";
import { buildPersonalizedInsiderLines } from "@/lib/personalized-insider";
import { heroScreenshotDataUrl } from "@/lib/hero-image";
import { buildSeoPerformanceAppendixHtml } from "@/lib/report-seo-appendix";
import type { SeoAnalysisResult } from "@/lib/seo-analyzer";
import type { PageSpeedSummary } from "@/lib/pagespeed";

export type QuickWin = {
  title?: string;
  elementName?: string;
  problem?: string;
  fix?: string;
  example?: string;
  effort?: string;
  lift?: string;
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
  industry_guess?: string;
  audited_url?: string;
  /** Raw base64 PNG/JPEG from capture (large; omit when persisting to localStorage). */
  heroScreenshot?: string;
  revenueLeakEstimate?: RevenueLeakEstimate;
  firstImpressionScore?: FirstImpressionInsight;
  trustGapIndex?: TrustGapInsight;
  messagingClarityScore?: MessagingClarityInsight;
  seo?: SeoAnalysisResult | null;
  page_type?: string;
  performance?: PageSpeedSummary | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreSemanticColor(score: number): string {
  if (score < 50) return reportHex.destructive;
  if (score < 80) return reportHex.warning;
  return reportHex.success;
}

function verdictForScore(score: number): string {
  if (score < 50) return "CRITICAL CONDITION";
  if (score < 80) return "NEEDS OPTIMIZATION";
  return "EXCELLENT";
}

function industryInsiderHtmlFromAudit(data: AuditReportPayload, escape: (s: string) => string): string {
  const lines = buildPersonalizedInsiderLines(data as Record<string, unknown>);
  if (!lines.length) return "";
  return lines.map((l) => `<p class="report-prose">${escape(l)}</p>`).join("");
}

function lostRevenueAnnual(
  traffic: number,
  price: number,
  lift = 0.02
): number {
  return traffic * lift * price * 12;
}

function priorityMatrixRows(quickWins: QuickWin[]): string {
  if (quickWins.length === 0) {
    return `<tr><td colspan="4">No priority items in this dataset.</td></tr>`;
  }
  return quickWins
    .slice(0, 12)
    .map((win, idx) => {
      const title = win.title || win.elementName || "Quick win";
      return `<tr>
        <td>#${idx + 1}</td>
        <td>${escapeHtml(title)}</td>
        <td>${escapeHtml(win.effort || "—")}</td>
        <td>${escapeHtml(win.lift || "—")}</td>
      </tr>`;
    })
    .join("");
}

function buildExecutiveDiagnosticSection(data: AuditReportPayload): string {
  const inner = buildExecutiveDiagnosticInnerHtml(data, escapeHtml);
  if (!inner) return "";
  return `<div class="section report-major">
    <h2>Executive summary &amp; diagnostic</h2>
    ${inner}
  </div>`;
}

function buildVisualAnalysisSection(data: AuditReportPayload, radar: Record<string, number>): string {
  const pageHeight = data.pageHeight || 3000;
  const { situation, action } = scrollDepthNarrative(data.audited_url, pageHeight);
  const hasRadar = Object.keys(radar).length > 0;
  const blocks: string[] = [];
  if (hasRadar) {
    blocks.push(`<div class="chart-block">
      <p class="chart-block__title">Site score radar</p>
      <div class="chart-box">${buildRadarSvg(radar)}</div>
      <p class="chart-block__caption">Category scores on a common scale for quick comparison.</p>
    </div>`);
  }
  blocks.push(`<div class="chart-block">
    <p class="chart-block__title">Scroll profile</p>
    <div class="chart-box">${buildScrollHeatStripSvg(pageHeight)}</div>
    <p class="chart-block__caption">${escapeHtml(situation)} ${escapeHtml(action)}</p>
  </div>`);
  const heatSrc = data.heroScreenshot ? heroScreenshotDataUrl(data.heroScreenshot) : null;
  const heatBody = buildAttentionHeatmapFigureHtml(heatSrc);
  blocks.push(`<div class="chart-block">
    <p class="chart-block__title">Attention heatmap</p>
    ${heatBody}
    <p class="chart-block__caption">${data.heroScreenshot ? "Jet-style overlay highlights expected attention hotspots on the first viewport (illustrative, not eye-tracking)." : "Grid heatmap schematic when no hero capture is stored."}</p>
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
  const slice = isPaid ? items : items.slice(0, 3);
  const teaserNote = !isPaid
    ? `<p class="muted report-nojustify">${escapeHtml(PRO_UPGRADE_STRIP)} ${escapeHtml(FULL_DIAGNOSTIC_UPGRADE_HOOK)}</p>`
    : "";
  const rows = slice
    .map((item) => {
      const el = item.element || "Element";
      const st = item.status || "—";
      if (!isPaid) {
        return `<div class="quick-win">
        <div class="report-card__title report-nojustify">${escapeHtml(el)} <span class="muted">— ${escapeHtml(st)}</span></div>
        <p class="muted">• Root-cause diagnosis — full report</p>
        <p class="muted">• Implementation steps — Pro</p>
        <p class="muted">• Expected lift context — Pro</p>
      </div>`;
      }
      return `<div class="quick-win">
        <div class="report-card__title report-nojustify">${escapeHtml(el)} <span class="muted">— ${escapeHtml(st)}</span></div>
        ${item.rationale ? `<p class="report-prose">${escapeHtml(item.rationale)}</p>` : ""}
        ${
          item.working?.length
            ? `<p class="report-nojustify"><span class="report-label" style="display:inline;margin-right:6px;">Working</span> ${escapeHtml(item.working.join("; "))}</p>`
            : ""
        }
        ${
          item.not_working?.length
            ? `<p class="report-nojustify"><span class="report-label" style="display:inline;margin-right:6px;">Not working</span> ${escapeHtml(item.not_working.join("; "))}</p>`
            : ""
        }
        ${item.fix ? `<p class="report-nojustify"><span class="report-label" style="display:inline;margin-right:6px;">Fix</span> ${escapeHtml(item.fix)}</p>` : ""}
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
    ${teaserNote}
    ${rows}
  </div>`;
}

function deepDiveFromDetailed(
  data: AuditReportPayload,
  isPaid: boolean
): string {
  const categoryNames: Record<string, string> = {
    ux: "UX & Layout",
    conversion: "Conversion & Funnel",
    copy: "Copy & Messaging",
    visuals: "Visuals & Brand",
    trust: "Trust & Credibility",
    speed: "Speed & Technical Health",
  };
  if (!isPaid) {
    const detailed = data.detailedAudit || {};
    const previews = Object.entries(detailed)
      .filter(([, items]) => items?.length)
      .map(([cat]) => {
        const title = categoryNames[cat.toLowerCase()] || cat;
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
  const detailed = data.detailedAudit || {};
  const inner = Object.entries(detailed)
    .map(([cat, items]) => {
      if (!items?.length) return "";
      const title = categoryNames[cat.toLowerCase()] || cat;
      const body = items
        .map((item) => {
          const name =
            (item.elementName as string) ||
            (item.element as string) ||
            "Item";
          const status = (item.status as string) || "";
          const fix =
            typeof item.fix === "object" && item.fix !== null
              ? String(
                  (item.fix as { quickFix?: string }).quickFix ||
                    JSON.stringify(item.fix)
                )
              : String(item.fix || "");
          return `<div class="quick-win">
            <div class="report-card__title report-nojustify">${escapeHtml(name)} <span class="muted">— ${escapeHtml(status)}</span></div>
            ${item.rationale ? `<p class="report-prose">${escapeHtml(String(item.rationale))}</p>` : ""}
            ${fix ? `<p class="report-nojustify"><span class="report-label" style="display:inline;margin-right:6px;">Action</span> ${escapeHtml(fix)}</p>` : ""}
          </div>`;
        })
        .join("");
      return `<h3>${escapeHtml(title)}</h3>${body}`;
    })
    .join("");
  if (!inner) {
    return `<div class="section report-major"><h2>Deep dive findings</h2><p class="muted">No deep dive categories in this export.</p></div>`;
  }
  return `<div class="section report-major">
    <h2>Deep dive findings</h2>
    ${inner}
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
    traffic: 1000,
    price: data.price_guess || 50,
    industry: data.industry_guess || "SaaS",
  };
  const at = options.generatedAt || new Date();
  const overall =
    data.overall_score || data.overview?.overallScore || 50;
  const quickWins = data.quickWins || data.quick_wins || [];
  const radar = data.radar_scores || data.radarMetrics || {};
  const auditItems = data.audit_items || [];
  const pageHeight = data.pageHeight || 3000;
  const lost = lostRevenueAnnual(calc.traffic, calc.price);
  const insiderBlock = industryInsiderHtmlFromAudit(data, escapeHtml);
  const seoPerfAppendix = buildSeoPerformanceAppendixHtml(data, escapeHtml);
  const site =
    data.audited_url ||
    (typeof reportId === "string" ? `Report ${reportId}` : "Your site");

  const tierLabel = isPaid ? "Full report (Pro / Agency)" : "Free summary";

  const freeQuickWins = quickWins
    .slice(0, 8)
    .map((win, i) => {
      const title = win.title || win.elementName || `Quick win ${i + 1}`;
      const effortLine = escapeHtml(formatEffortLine(win.effort));
      const impactLine = escapeHtml(formatImpactLine(win.lift || win.fix));
      return `<div class="quick-win">
        <div class="report-card__index">#${i + 1}</div>
        <div class="report-card__title report-nojustify">${escapeHtml(title)}</div>
        <p class="muted report-nojustify">${effortLine}</p>
        <p class="muted report-nojustify">${impactLine}</p>
      </div>`;
    })
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
          .map((win, i) => {
            const t = win.title || win.elementName || `Item ${i + 1}`;
            const impact = win.lift || "";
            return `<div class="quick-win">
            <div class="report-card__index">#${i + 1}</div>
            <div class="report-card__title report-nojustify">${escapeHtml(t)}</div>
            ${win.problem ? `<p class="report-nojustify"><span class="report-label" style="display:inline;margin-right:6px;">Problem</span> ${escapeHtml(win.problem)}</p>` : ""}
            ${win.fix ? `<p class="report-nojustify"><span class="report-label" style="display:inline;margin-right:6px;">Fix</span> ${escapeHtml(win.fix)}</p>` : ""}
            ${win.example ? `<pre>${escapeHtml(win.example)}</pre>` : ""}
            ${impact || win.effort ? `<p class="muted report-nojustify"><span class="report-label" style="display:inline;margin-right:6px;">Impact / effort</span> ${escapeHtml(impact || "—")}${win.effort ? ` · ${escapeHtml(win.effort)}` : ""}</p>` : ""}
          </div>`;
          })
          .join("")}</div>`
      : "";

  const auditCount = auditItems.length;
  const intelScoreNote = escapeHtml(formatIntelScoreFootnote(overall, auditCount));
  const intelEstNote = escapeHtml(`${INTEL_ESTIMATED_IMPROVEMENT} (illustrative)`);
  const intelBenchNote = escapeHtml(INTEL_BENCHMARK);

  const scoreColor = scoreSemanticColor(overall);
  const verdict = verdictForScore(overall);

  const paidCover = `<div class="report-cover">
    <h1 class="report-cover-brand">${BRAND_NAME}</h1>
    <p class="report-cover-subtitle">Conversion audit — full report</p>
    <div class="score score--semantic" style="color:${scoreColor}"><span class="report-figure">${overall}</span><span class="score-suffix">/100</span></div>
    <p class="intel-micro">${intelScoreNote}</p>
    <p class="report-verdict">${escapeHtml(verdict)}</p>
    <p class="report-meta report-nojustify">${escapeHtml(site)} · ${escapeHtml(tierLabel)} · ${escapeHtml(at.toLocaleString())}</p>
  </div>`;

  const execDiagnostic = buildExecutiveDiagnosticSection(data);
  const visualSection = isPaid ? buildVisualAnalysisSection(data, radar) : "";

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
    <div class="score score--semantic" style="color:${scoreColor}"><span class="report-figure">${overall}</span><span class="score-suffix">/100</span></div>
    <p class="intel-micro">${intelScoreNote}</p>
    <p class="report-verdict">${escapeHtml(verdict)}</p>
  </div>

  ${buildExecutiveDiagnosticSection(data)}

  ${buildInsightLayersHtml(data, false, calc, escapeHtml)}

  ${
    quickWins.length
      ? `<div class="section report-major"><h2>Quick wins &amp; impact</h2><p class="intel-micro">${intelEstNote} when prioritized fixes ship (typical range, not guaranteed). ${intelBenchNote}.</p>${freeQuickWins}</div>`
      : ""
  }

  <div class="section report-major">
    <h2>Lost revenue (illustrative)</h2>
    <p class="report-prose report-nojustify">At ~${calc.traffic.toLocaleString()} monthly visits and $${calc.price} per conversion (2% missed lift), you may be leaving roughly <strong class="report-figure">$${Math.round(lost).toLocaleString()}</strong> on the table annually.</p>
    <p class="intel-micro">${intelEstNote}</p>
  </div>

  <div class="section report-major">
    <h2>Industry insider</h2>
    ${insiderBlock || `<p class="report-prose">Patterns from your page and category benchmarks.</p>`}
  </div>

  ${seoPerfAppendix}

  ${auditItems.length ? elementAuditHtml(auditItems, false) : ""}
  ${Object.keys(data.detailedAudit || {}).length ? deepDiveFromDetailed(data, false) : ""}

  <div class="locked-section">
    <h2>Unlock the full report</h2>
    <p class="report-nojustify">Radar, heatmap, priority matrix, competitor context, and full element-level fixes are included in Pro / Agency.</p>
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
  ${buildInsightLayersHtml(data, true, calc, escapeHtml)}
  ${matrix}
  ${paidQuickDetail}
  ${visualSection}
  ${elementAuditHtml(auditItems, true)}
  ${deepDiveFromDetailed(data, true)}
  ${seoPerfAppendix}
  </div>

  <footer class="meta report-nojustify"><small>Confidential · ${BRAND_NAME} · ${escapeHtml(at.toISOString())}</small></footer>
</body>
</html>`;
}
