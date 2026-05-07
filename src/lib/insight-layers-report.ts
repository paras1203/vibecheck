import type {
  FirstImpressionInsight,
  InsightLayerBlock,
  InsightPriority,
  MessagingClarityInsight,
  RevenueLeakEstimate,
  TrustGapInsight,
} from "@/types/insight-layers";
import {
  annualLeakUsd,
  buildRevenueLeakEstimate,
  fallbackInsightLayers,
} from "@/lib/insight-layers";
import { pdfAxisScoreHex, reportHex } from "@/lib/report-theme";

export type InsightExportData = {
  radarMetrics?: Record<string, number>;
  radar_scores?: Record<string, number>;
  revenueLeakEstimate?: RevenueLeakEstimate;
  firstImpressionScore?: FirstImpressionInsight;
  trustGapIndex?: TrustGapInsight;
  messagingClarityScore?: MessagingClarityInsight;
};

function radarForFallback(data: InsightExportData): Record<string, number> {
  const radarM = data.radarMetrics;
  if (radarM && Object.keys(radarM).length > 0) {
    return { ...radarM };
  }
  const rs = (data.radar_scores || {}) as Record<string, number>;
  return {
    ux: Number(rs.UX ?? rs.ux ?? 50),
    conversion: Number(rs.Conversion ?? rs.conversion ?? 50),
    copy: Number(rs.Copy ?? rs.copy ?? 50),
    visuals: Number(rs.Visuals ?? rs.visuals ?? 50),
    trust: Number(rs.Trust ?? rs.trust ?? 50),
    speed: Number(rs.Speed ?? rs.speed ?? 50),
  };
}

function formatSubKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function priorityBadgeHtml(esc: (s: string) => string, priority: InsightPriority): string {
  const h = reportHex;
  const c =
    priority === "high"
      ? h.destructive
      : priority === "medium"
        ? h.warning
        : h.success;
  return `<span class="insight-priority" style="border-color:${c}44;color:${c};background:${c}14;">${esc(priority)} priority</span>`;
}

function layerBlockHtml(
  esc: (s: string) => string,
  cardTitle: string,
  layer: InsightLayerBlock,
  isPaid: boolean
): string {
  const { composite, layerSummary, highPrioritySignals, priority, subscores } =
    layer;
  const sigList =
    highPrioritySignals.length > 0
      ? `<ul class="insight-signals">${highPrioritySignals.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`
      : "";
  let subBlock = "";
  if (isPaid) {
    const rows = Object.entries(subscores)
      .map(
        ([k, t]) =>
          `<tr><td>${esc(formatSubKey(k))}</td><td class="report-figure" style="color:${pdfAxisScoreHex(t.current)};font-weight:700;">${t.current}</td><td class="report-figure" style="color:${pdfAxisScoreHex(t.proposed)};font-weight:700;">${t.proposed}</td><td>${esc(t.impact)}</td></tr>`
      )
      .join("");
    subBlock = `<table class="insight-sub"><thead><tr><th>Factor</th><th>Cur.</th><th>Prop.</th><th>Impact</th></tr></thead><tbody>${rows}</tbody></table>`;
  } else {
    subBlock = `<p class="muted report-nojustify" style="font-size:0.8125rem;margin-top:10px;">Full sub-score breakdown included in Pro / Agency.</p>`;
  }
  const curC = pdfAxisScoreHex(composite.current);
  const propC = pdfAxisScoreHex(composite.proposed);
  return `<div class="insight-card">
    <div class="insight-card__head">
      <span class="insight-card__name">${esc(cardTitle)}</span>
      ${priorityBadgeHtml(esc, priority)}
    </div>
    <p class="report-prose" style="font-size:0.9375rem;margin:0;">${esc(layerSummary)}</p>
    <div class="insight-compare report-nojustify">
      <span>Current <span class="report-figure" style="color:${curC};font-weight:700;">${composite.current}</span></span>
      <span>→</span>
      <span>Proposed <span class="report-figure" style="color:${propC};font-weight:700;">${composite.proposed}</span></span>
    </div>
    <p class="muted report-nojustify" style="font-size:0.875rem;margin:0;">${esc(composite.impact)}</p>
    ${sigList ? `<p class="insight-signals-label">Signals</p>${sigList}` : ""}
    ${subBlock}
  </div>`;
}

function scenarioRowHtml(
  esc: (s: string) => string,
  label: string,
  amount: number,
  rate: number,
  accent: string
): string {
  return `<div class="scenario-row" style="border-color:${accent}33;">
      <div class="scenario-row__label" style="color:${accent};font-weight:600;">${esc(label)}</div>
      <div class="scenario-row__amt" style="color:${accent};">$${Math.round(amount).toLocaleString()}</div>
      <div class="scenario-row__rate">${(rate * 100).toFixed(1).replace(/\.0$/, "")}% uplift</div>
    </div>`;
}

/**
 * Revenue leak card only (shared by full insight block and PDF page layout).
 */
export function buildRevenueLeakCardHtml(
  data: InsightExportData,
  calc: { traffic: number; price: number },
  esc: (s: string) => string
): string {
  const revenue = data.revenueLeakEstimate ?? buildRevenueLeakEstimate();
  const sc = revenue.scenarios;
  const low = annualLeakUsd(calc.traffic, calc.price, sc.low.conversionUpliftRate);
  const base = annualLeakUsd(calc.traffic, calc.price, sc.base.conversionUpliftRate);
  const high = annualLeakUsd(calc.traffic, calc.price, sc.high.conversionUpliftRate);
  const h = reportHex;

  const assumptions = revenue.assumptions
    .map((a) => `<li>${esc(a)}</li>`)
    .join("");

  return `<div class="insight-card">
    <div class="insight-card__head">
      <span class="insight-card__name">Revenue leak estimate</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
      ${scenarioRowHtml(esc, "Low", low, sc.low.conversionUpliftRate, h.muted)}
      ${scenarioRowHtml(esc, "Base", base, sc.base.conversionUpliftRate, h.warning)}
      ${scenarioRowHtml(esc, "High", high, sc.high.conversionUpliftRate, h.destructive)}
    </div>
    <p class="report-label">Methodology</p>
    <p class="report-prose" style="font-size:0.8125rem;">${esc(revenue.methodology)}</p>
    <ul class="report-prose" style="font-size:0.8125rem;margin:8px 0 8px 1.15rem;line-height:1.5;">${assumptions}</ul>
    <p class="muted" style="font-size:0.75rem;font-style:italic;line-height:1.45;">${esc(revenue.disclaimer)}</p>
  </div>`;
}

export type InsightLayersHtmlOptions = {
  includeRevenue?: boolean;
  includeOuterHeading?: boolean;
  includeIntroBlurb?: boolean;
};

/**
 * HTML block for executive insight layers (static export / PDF).
 */
export function buildInsightLayersHtml(
  data: InsightExportData,
  isPaid: boolean,
  calc: { traffic: number; price: number },
  esc: (s: string) => string,
  options?: InsightLayersHtmlOptions
): string {
  const includeRevenue = options?.includeRevenue !== false;
  const includeOuterHeading = options?.includeOuterHeading !== false;
  const includeIntroBlurb = options?.includeIntroBlurb !== false;

  const rm = radarForFallback(data);
  const fb = fallbackInsightLayers(rm);
  const fi = data.firstImpressionScore ?? fb.firstImpressionScore;
  const tg = data.trustGapIndex ?? fb.trustGapIndex;
  const mc = data.messagingClarityScore ?? fb.messagingClarityScore;

  const revenueCard = includeRevenue ? buildRevenueLeakCardHtml(data, calc, esc) : "";
  const intro =
    includeIntroBlurb
      ? `<p class="muted report-nojustify" style="font-size:0.8125rem;margin-bottom:14px;">Scenario model—not a guarantee. Base uses the 2% benchmark consistent with lost-revenue illustrations elsewhere in this report.</p>`
      : "";

  const inner = `${intro}${revenueCard}${layerBlockHtml(esc, "First impression score", fi, isPaid)}${layerBlockHtml(esc, "Trust gap index", tg, isPaid)}${layerBlockHtml(esc, "Messaging clarity score", mc, isPaid)}`;

  if (!includeOuterHeading) {
    return `<div class="section insight-layers">${inner}</div>`;
  }

  return `<div class="section insight-layers report-major">
    <h2>Executive insight layers</h2>
    ${inner}
  </div>`;
}
