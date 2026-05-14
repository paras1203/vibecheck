import type { InsightLayerBlock } from "@/types/insight-layers";
import type { AuditReportPayload, QuickWin } from "@/lib/report-html";
import {
  stripDisplayMarkdown,
  stripNarrativeSegmentLabels,
  FULL_DIAGNOSTIC_UPGRADE_HOOK,
  PRO_UPGRADE_STRIP,
} from "@/lib/report-copy";
import {
  annualLeakUsd,
  buildRevenueLeakEstimate,
  DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
  fallbackInsightLayers,
} from "@/lib/insight-layers";
import { layerBlockHtml, buildRevenueLeakCardHtml } from "@/lib/insight-layers-report";
import { meanRadarSiteScore, verdictLabelFromSiteScore } from "@/lib/site-score";
import { RADAR_AXIS_LABELS, scoreForRadarAxis } from "@/lib/radar-axis-scores";
import { pdfAxisScoreHex, pdfVerdictHex, reportFontsHref, getReportPdfStyles } from "@/lib/report-theme";
import { buildRadarSvg, buildScrollHeatStripSvg } from "@/lib/report-charts-svg";
import { buildHeroSnapshotFigureHtml } from "@/lib/report-hero-snapshot-html";
import { heroScreenshotDataUrl } from "@/lib/hero-image";
import { scrollDepthNarrative, formatQuickWinSubheadLine } from "@/lib/report-ui";
import { quickWinFixBulletText } from "@/lib/quick-wins-format";
import { buildScrollEffectiveness } from "@/lib/scroll-effectiveness-from-audit";
import { buildSeoPerformanceAppendixHtml } from "@/lib/report-seo-appendix";
import {
  buildImplementationChecklistHtml,
  buildReportAnalyticsReadinessHtml,
  buildReportContextCardHtml,
  resolveExperimentItems,
} from "@/lib/report-artifacts-html";
import type { ReportArtifactsInput } from "@/lib/report-artifacts-html";
import { ensureQuickWinsUpTo } from "@/lib/quick-wins-fill";
import { detailedAuditToDisplayRows } from "@/lib/report-v2-pillar-audit";
import { buildAuditImpactPillHtml, buildAuditStatusPillHtml } from "@/lib/audit-table-cells";
import {
  CATEGORY_TAB_ORDER,
  displayNameForCategoryKey,
  type DetailedAuditRow,
} from "@/lib/report-category-score";
import {
  filterQuickWinsByKeywords,
  instrumentationLines,
  weakestRadarAxis,
} from "@/lib/report-v2-deck-utils";
import { parseExecutiveSummaryText } from "@/lib/report-v2-executive";
import { reportTimestampFromRoastId } from "@/lib/report-display-name";
import { BRAND_NAME } from "@/lib/brand";
import type { ExperimentBacklogItem } from "@/types/report-artifacts";

export type ReportV2Calc = { traffic: number; price: number; industry: string };

function hostLabel(url?: string): string {
  if (!url?.trim()) return "your-site";
  try {
    const u = url.includes("://") ? url.trim() : `https://${url.trim()}`;
    return new URL(u).hostname.replace(/^www\./i, "");
  } catch {
    return url.trim();
  }
}

function pageTypeLabel(pt?: string): string {
  const raw = (pt || "unknown").toLowerCase();
  if (raw === "landing") return "Landing";
  if (raw === "blog") return "Blog";
  if (raw === "product") return "Product";
  if (raw === "unknown") return "Unknown";
  return pt || "—";
}

function sortedDetailedAuditEntries(detailed: Record<string, DetailedAuditRow[]>) {
  const entries = Object.entries(detailed).filter(
    ([, v]) => Array.isArray(v) && v.length > 0
  );
  entries.sort((a, b) => {
    const na = displayNameForCategoryKey(a[0]);
    const nb = displayNameForCategoryKey(b[0]);
    const ia = CATEGORY_TAB_ORDER.indexOf(na as (typeof CATEGORY_TAB_ORDER)[number]);
    const ib = CATEGORY_TAB_ORDER.indexOf(nb as (typeof CATEGORY_TAB_ORDER)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return entries;
}

function quickWinCardHtml(win: QuickWin, idx: number, esc: (s: string) => string): string {
  const title = esc(String(win.title || win.elementName || `Quick win ${idx + 1}`));
  const sub = esc(formatQuickWinSubheadLine(win.effort, win.impactCode, win.lift));
  const fixB = esc(quickWinFixBulletText(String(win.fix || ""), String(win.example || "")));
  const prob = win.problem ? `<li><strong>Problem:</strong> ${esc(win.problem)}</li>` : "";
  return `<div class="quick-win">
    <div class="report-card__index">#${idx + 1}</div>
    <div class="report-card__title report-nojustify">${title}</div>
    <p class="muted report-nojustify" style="font-size:0.8125rem;margin-top:6px">${sub}</p>
    <ul style="margin:8px 0 0;padding-left:1.1rem;font-size:0.8125rem">${prob}<li><strong>Fix:</strong> ${fixB}</li></ul>
  </div>`;
}

function insightHeadingHtml(esc: (s: string) => string, title: string, bodyHtml: string): string {
  return `<div class="section report-major"><h2>${esc(title)}</h2>${bodyHtml}</div>`;
}

function subIntroParagraphHtml(esc: (s: string) => string, text: string): string {
  return `<p class="report-prose report-nojustify" style="font-size:0.9375rem;">${esc(text)}</p>`;
}

function bulletsHtml(esc: (s: string) => string, items: string[]): string {
  if (!items.length) return "";
  return `<ul style="margin:8px 0;padding-left:1.2rem;line-height:1.5;font-size:0.875rem;">${items
    .map((x) => `<li>${esc(x)}</li>`)
    .join("")}</ul>`;
}

/** Inner HTML for Report V2 (no html/head wrapper). */
export function buildReportV2InnerHtml(
  data: AuditReportPayload,
  opts: {
    esc: (s: string) => string;
    isPaid: boolean;
    calculator: ReportV2Calc;
    reportId: string;
    generatedAt?: Date;
  }
): string {
  const esc = opts.esc;
  const { isPaid, calculator: calc, reportId } = opts;
  const at = opts.generatedAt ?? new Date();
  const completedMs = reportTimestampFromRoastId(reportId, at.getTime());

  const radarScores = data.radar_scores || data.radarMetrics || {};
  const hasRadarGrid =
    typeof radarScores === "object" &&
    radarScores !== null &&
    Object.keys(radarScores).length > 0;
  const storedOverall =
    Number(data.overall_score ?? data.overview?.overallScore) || 50;
  const overallScore = hasRadarGrid
    ? meanRadarSiteScore(radarScores as Record<string, unknown>)
    : storedOverall;

  const radarForVerdict = {
    ...(radarScores as Record<string, unknown>),
    ...(data.radarMetrics as Record<string, unknown> | undefined),
  };

  const verdictLabel = verdictLabelFromSiteScore(Math.round(overallScore), radarForVerdict);
  const verdictColor = pdfVerdictHex(verdictLabel);

  const weakest = weakestRadarAxis(radarScores as Record<string, number>);
  const deviceLabel = data.device === "mobile" ? "Mobile" : "Desktop";

  const trafficSessionsBaseline =
    data.trafficEstimate?.monthlySessions ?? DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS;
  const trafficAssumptionLine =
    calc.traffic === trafficSessionsBaseline && data.trafficEstimate?.note?.trim()
      ? data.trafficEstimate.note.trim()
      : `Monthly sessions ${calc.traffic.toLocaleString()} (illustrative—not from your analytics).`;

  const revenueLeakEstimateResolved = buildRevenueLeakEstimate(calc.traffic, calc.price, {
    industryLabel: data.industry_guess?.trim() || calc.industry,
    priceFromScrape: Boolean(data.price_from_page),
    trafficAssumptionLine,
  });

  const radarMetricsLower: Record<string, number> = data.radarMetrics
    ? { ...data.radarMetrics }
    : {
        ux: Number(radarScores.UX ?? radarScores.ux ?? 50),
        conversion: Number(radarScores.Conversion ?? radarScores.conversion ?? 50),
        copy: Number(radarScores.Copy ?? radarScores.copy ?? 50),
        visuals: Number(radarScores.Visuals ?? radarScores.visuals ?? 50),
        trust: Number(radarScores.Trust ?? radarScores.trust ?? 50),
        speed: Number(radarScores.Speed ?? radarScores.speed ?? 50),
      };

  const insightFallback = fallbackInsightLayers(radarMetricsLower);
  const firstLayer = data.firstImpressionScore ?? insightFallback.firstImpressionScore;
  const trustLayer = data.trustGapIndex ?? insightFallback.trustGapIndex;
  const msgLayer = data.messagingClarityScore ?? insightFallback.messagingClarityScore;

  const execRaw = stripDisplayMarkdown(
    stripNarrativeSegmentLabels(
      data.hook || data.overview?.executiveSummary || data.roastSummary || ""
    )
  );
  const parsedExec = parseExecutiveSummaryText(execRaw);

  const quickWins = ensureQuickWinsUpTo(data.quickWins || data.quick_wins, data.audit_items);

  const qwConversion = filterQuickWinsByKeywords(
    quickWins as QuickWin[],
    ["hero", "headline", "cta", "fold", "above", "conversion", "goal"],
    3
  );
  const qwTrust = filterQuickWinsByKeywords(
    quickWins as QuickWin[],
    ["trust", "testimonial", "proof", "guarantee", "risk", "social"],
    3
  );
  const qwCopy = filterQuickWinsByKeywords(
    quickWins as QuickWin[],
    ["copy", "headline", "message", "value", "subhead", "clarity"],
    3
  );
  const qwScroll = filterQuickWinsByKeywords(
    quickWins as QuickWin[],
    ["scroll", "section", "carousel", "layout", "gradient", "order"],
    1
  );

  const conversionRadar = scoreForRadarAxis(radarScores as Record<string, number>, "Conversion");
  const uxRadar = scoreForRadarAxis(radarScores as Record<string, number>, "UX");
  const speedRadar = scoreForRadarAxis(radarScores as Record<string, number>, "Speed");

  const pageHeight = data.pageHeight || 3000;
  const scrollHelp = scrollDepthNarrative(data.audited_url, pageHeight);
  const scrollResolved =
    data.scrollEffectiveness ??
    buildScrollEffectiveness(data, data.audited_url || "", pageHeight, 800);
  const foldHeight = 800;
  const belowFold = Math.max(0, pageHeight - foldHeight);
  const belowFoldPercent = pageHeight > 0 ? (belowFold / pageHeight) * 100 : 0;

  const techIds = new Set((data.tech_stack?.detectedTools ?? []).map((t) => t.id.toLowerCase()));
  const toolNamesLower = (data.tech_stack?.detectedTools ?? [])
    .map((t) => t.name.toLowerCase())
    .join(" ");
  const hasClarityHint =
    toolNamesLower.includes("clarity") ||
    Boolean(data.behaviour_tools?.recommendationMessage?.includes("Clarity"));
  const checklistInstrument = instrumentationLines({ techIds, hasClarityHint });

  const experiments = resolveExperimentItems(data as ReportArtifactsInput).slice(0, 6);

  const detailedAudit = (data.detailedAudit || {}) as Record<string, DetailedAuditRow[]>;
  const pillarSorted = sortedDetailedAuditEntries(detailedAudit);

  const lowUsd = annualLeakUsd(
    calc.traffic,
    calc.price,
    revenueLeakEstimateResolved.scenarios.low.conversionUpliftRate
  );
  const baseUsd = annualLeakUsd(
    calc.traffic,
    calc.price,
    revenueLeakEstimateResolved.scenarios.base.conversionUpliftRate
  );
  const highUsd = annualLeakUsd(
    calc.traffic,
    calc.price,
    revenueLeakEstimateResolved.scenarios.high.conversionUpliftRate
  );

  const pillarTiles = RADAR_AXIS_LABELS.map((label) => {
    const axisScore = scoreForRadarAxis(radarScores as Record<string, number>, label);
    return `<div style="border:1px solid var(--rs-border,#e5e7eb);border-radius:8px;padding:8px;text-align:center;"><div style="font-size:10px;color:#6b7280;">${esc(label)}</div><div style="font-weight:700;color:${pdfAxisScoreHex(axisScore)};">${axisScore}</div></div>`;
  }).join("");

  const radarSvg = hasRadarGrid
    ? buildRadarSvg(radarScores as Record<string, number>, 260)
    : "";

  const scrollSvg = buildScrollHeatStripSvg(pageHeight);
  const snapSrc = data.heroScreenshot ? heroScreenshotDataUrl(data.heroScreenshot) : null;
  const snapBody = buildHeroSnapshotFigureHtml(snapSrc, {});

  const seoAppendix = buildSeoPerformanceAppendixHtml(data, esc);

  const experimentRows =
    experiments.length === 0
      ? `<tr><td colspan="5" class="muted">${esc("No experiment backlog resolved.")}</td></tr>`
      : (experiments as ExperimentBacklogItem[])
          .map(
            (it, i) =>
              `<tr><td>${i + 1}</td><td>${esc(it.testName)}</td><td>${esc(it.hypothesis)}</td><td>${esc(it.primaryMetric)}</td><td>${esc(it.variantDescription)}</td></tr>`
          )
          .join("");

  const pillarBlocks = pillarSorted
    .map(([catKey, items]) => {
      const title = displayNameForCategoryKey(catKey);
      const rows = detailedAuditToDisplayRows(items, isPaid ? 50 : 2);
      if (!isPaid && rows.length === 0)
        return `<h3>${esc(title)}</h3><p class="muted">${esc(PRO_UPGRADE_STRIP)}</p>`;
      const body =
        rows.length === 0
          ? `<p class="muted">${esc("No rows.")}</p>`
          : `<table class="report-matrix pillar-audit-matrix" style="table-layout:fixed;width:100%;font-size:11px;"><colgroup><col style="width:10%"><col style="width:10%"><col style="width:5%"><col style="width:25%"><col style="width:25%"><col style="width:25%"></colgroup><thead><tr><th>${esc("Element")}</th><th>${esc("Status")}</th><th>${esc("Impact")}</th><th>${esc("Working")}</th><th>${esc("Not working")}</th><th>${esc("Fix")}</th></tr></thead><tbody>${rows
              .map(
                (r) =>
                  `<tr><td>${esc(r.element)}</td><td>${buildAuditStatusPillHtml(r.status, esc)}</td><td>${buildAuditImpactPillHtml(r.impact, esc)}</td><td>${esc(r.working)}</td><td>${esc(r.notWorking)}</td><td>${esc(r.fix)}</td></tr>`
              )
              .join("")}</tbody></table>`;
      return `<h3>${esc(title)}</h3>${body}`;
    })
    .join("");

  const dom = hostLabel(data.audited_url);

  const execBullets =
    parsedExec.fallbackBody != null
      ? `<p class="report-prose">${esc(parsedExec.fallbackBody)}</p>`
      : `<ol style="padding-left:1.25rem;line-height:1.55;font-size:0.9rem;">${parsedExec.bullets
          .map((b) => `<li>${esc(b)}</li>`)
          .join("")}</ol>${
          parsedExec.impactLine
            ? `<p style="margin-top:10px;font-size:0.9rem;"><strong>Business impact:</strong> ${esc(parsedExec.impactLine)}</p>`
            : ""
        }${
          parsedExec.fixFirstLine
            ? `<p style="margin-top:6px;font-size:0.9rem;"><strong>Fix first:</strong> ${esc(parsedExec.fixFirstLine)}</p>`
            : ""
        }`;

  const coverStrip = `<div class="section report-major" style="border:1px solid var(--rs-border,#e5e7eb);border-radius:12px;padding:20px;background:linear-gradient(135deg,rgba(59,130,246,0.06),transparent);">
    <p class="report-label">${esc("Conversion audit")}</p>
    <h1 style="margin:6px 0 12px;font-size:1.75rem;">${esc(dom)}</h1>
    <p class="report-meta report-nojustify">${esc(`Score ${Math.round(overallScore)}/100 · ${verdictLabel}`)} · ${esc(`Weakest pillar: ${weakest.label} (${weakest.score})`)} · ${esc(pageTypeLabel(data.page_type))} · ${esc(`~${calc.traffic.toLocaleString()} sess./mo illustrative`)} · ${esc(new Date(completedMs).toLocaleDateString())} · ${esc(deviceLabel)}</p>
    <p class="report-verdict" style="color:${verdictColor};font-size:0.95rem;margin-top:8px;">${esc(verdictLabel)}</p>
  </div>`;

  const execMetrics = `<div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:16px;align-items:flex-start;">
    <div style="flex:1;min-width:140px;"><div class="report-label">${esc("Overall")}</div>
    <div class="score score--semantic" style="color:${pdfAxisScoreHex(overallScore)};font-size:42px;font-weight:700;"><span class="report-figure">${Math.round(overallScore)}</span><span class="score-suffix">/100</span></div></div>
    <div style="flex:2;min-width:220px;"><div class="report-label">${esc("Pillars")}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;">${pillarTiles}</div></div>
    <div style="flex:2;min-width:220px;"><div class="report-label">${esc("Revenue scenarios (illustrative)")}</div>
    <ul class="muted report-nojustify" style="font-size:0.8125rem;margin-top:8px;line-height:1.45;">
    <li>${esc("Low")}: ~$${Math.round(lowUsd).toLocaleString()} /yr</li>
    <li>${esc("Base")}: ~$${Math.round(baseUsd).toLocaleString()} /yr</li>
    <li>${esc("High")}: ~$${Math.round(highUsd).toLocaleString()} /yr</li>
    </ul>
    <p class="muted" style="font-size:0.75rem;">${esc(revenueLeakEstimateResolved.disclaimer)}</p></div>
  </div>`;

  const execSection = `<div class="section report-major"><h2>${esc("Executive summary")}</h2>${execBullets}${execMetrics}${radarSvg ? `<div style="margin-top:14px;max-width:280px;">${radarSvg}</div>` : ""}</div>`;

  const howTo = `<div class="section report-major"><h2>${esc("How to use this report")}</h2>
    <h3 style="font-size:1rem;margin-top:8px;">${esc("Who this is for")}</h3>
    ${bulletsHtml(esc, [
      "Founders — exec summary, revenue scenarios, experiments.",
      "Marketing / CRO — first impression, trust, messaging, instrumentation.",
      "Design / Dev — UX scroll, speed, pillar audit fixes.",
    ])}
    <h3 style="font-size:1rem;margin-top:14px;">${esc("How to read it")}</h3>
    ${bulletsHtml(esc, [
      "Sections First impression → Messaging translate qualitative signals into actions.",
      "UX & scroll + Speed cover layout and lab performance.",
      "Analytics + Experiments prioritize tooling and tests.",
      "SEO appendix closes with programmatic SEO / meta / diagnostics.",
    ])}
    ${buildImplementationChecklistHtml(data as ReportArtifactsInput, esc)}
  </div>`;

  const contextSection = `<div class="section report-major"><h2>${esc("Context & assumptions")}</h2>
    ${buildReportContextCardHtml(data as ReportArtifactsInput, esc)}
    <div style="margin-top:14px;padding:12px;border:1px solid var(--rs-border,#e5e7eb);border-radius:8px;">
      <p class="report-label">${esc("Industry (guess)")}</p>
      <p class="report-prose">${esc(data.industry_guess?.trim() || "—")}</p>
      <p class="muted report-nojustify" style="font-size:0.8125rem;margin-top:8px;">${esc(trafficAssumptionLine)}</p>
    </div>
    <div style="margin-top:14px;padding:12px;border:1px solid var(--rs-border,#e5e7eb);border-radius:8px;">
      <p class="report-label">${esc("Revenue model & limitations")}</p>
      <p class="report-prose" style="font-size:0.875rem;">${esc(revenueLeakEstimateResolved.methodology)}</p>
      <p class="muted" style="font-size:0.75rem;margin-top:8px;">${esc(revenueLeakEstimateResolved.disclaimer)}</p>
    </div>
    ${buildRevenueLeakCardHtml(data, { traffic: calc.traffic, price: calc.price }, esc)}
  </div>`;

  const firstImpBody =
    subIntroParagraphHtml(
      esc,
      `First impression ${firstLayer.composite.current}→${firstLayer.composite.proposed}; Conversion pillar ${conversionRadar}. ${firstLayer.layerSummary}`
    ) +
    layerBlockHtml(esc, "First impression score", firstLayer as InsightLayerBlock, isPaid);

  const trustBody =
    subIntroParagraphHtml(esc, trustLayer.layerSummary) +
    layerBlockHtml(esc, "Trust gap index", trustLayer as InsightLayerBlock, isPaid);

  const msgBody =
    subIntroParagraphHtml(esc, msgLayer.layerSummary) +
    layerBlockHtml(esc, "Messaging clarity score", msgLayer as InsightLayerBlock, isPaid);

  const qwConvHtml = qwConversion
    .slice(0, 2)
    .map((w, i) => quickWinCardHtml(w as QuickWin, i, esc))
    .join("");
  const qwTrustHtml = qwTrust
    .slice(0, 2)
    .map((w, i) => quickWinCardHtml(w as QuickWin, i, esc))
    .join("");
  const qwCopyHtml = qwCopy
    .slice(0, 1)
    .map((w, i) => quickWinCardHtml(w as QuickWin, i, esc))
    .join("");

  const beforeAfterWin = (qwCopy[0] || quickWins[0]) as QuickWin | undefined;
  const beforeAfter =
    beforeAfterWin &&
    (beforeAfterWin.problem || beforeAfterWin.fix || msgLayer.highPrioritySignals.length)
      ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">
    <div style="border:1px solid var(--rs-border,#e5e7eb);border-radius:8px;padding:10px;"><strong>${esc("Before")}</strong><p style="margin-top:6px;font-size:0.875rem;">${esc(beforeAfterWin.problem || msgLayer.highPrioritySignals[0] || "—")}</p></div>
    <div style="border:1px solid rgba(59,130,246,0.35);border-radius:8px;padding:10px;"><strong>${esc("After")}</strong><p style="margin-top:6px;font-size:0.875rem;">${esc(beforeAfterWin.fix || msgLayer.highPrioritySignals[1] || "—")}</p></div>
  </div>`
      : "";

  const uxScrollSection = insightHeadingHtml(
    esc,
    "UX & scroll behaviour",
    `<p class="report-prose">UX pillar ${uxRadar}. Page height ~${pageHeight}px; ~${belowFoldPercent.toFixed(0)}% below fold (800px). ${esc(scrollResolved.situation || scrollHelp.situation)}</p>
    ${bulletsHtml(
      esc,
      (scrollResolved.evidenceBullets?.length
        ? scrollResolved.evidenceBullets.filter(Boolean).slice(0, 3)
        : [scrollHelp.situation, scrollHelp.action, "Reorder proof closer to hero where possible."]
      ).map(String)
    )}
    ${qwScroll[0] ? quickWinCardHtml(qwScroll[0] as QuickWin, 0, esc) : ""}
    <div style="margin-top:14px;"><p class="chart-block__title">${esc("Scroll profile")}</p><div class="chart-box">${scrollSvg}</div></div>
    <div style="margin-top:14px;"><p class="chart-block__title">${esc("First viewport")}</p>${snapBody}</div>`
  );

  const perfGem = data.performanceGemini;
  const speedBullets = (
    perfGem?.quickFixes?.length ? perfGem.quickFixes : ["Review LCP", "Reduce blocking JS", "Compress hero media"]
  ).slice(0, 3);

  const speedSection = insightHeadingHtml(
    esc,
    "Speed & technical health",
    `<p class="report-prose">${esc(perfGem?.summary || `Speed pillar ${speedRadar} — validate with RUM.`)}</p>
    ${bulletsHtml(esc, speedBullets.map(String))}`
  );

  const analyticsSection = `<div class="section report-major"><h2>${esc("Analytics & behaviour tools")}</h2>
    ${buildReportAnalyticsReadinessHtml(data as ReportArtifactsInput, esc)}
    <h3 style="font-size:1rem;margin-top:12px;">${esc("Instrumentation checklist")}</h3>
    <ol style="padding-left:1.25rem;line-height:1.5;font-size:0.875rem;">${checklistInstrument
      .map((l) => `<li>${esc(l)}</li>`)
      .join("")}</ol>
  </div>`;

  const experimentSection = `<div class="section report-major"><h2>${esc("Experiment backlog")}</h2>
    <table class="report-matrix experiment-backlog-table" style="table-layout:fixed;width:100%;font-size:11px;"><colgroup><col style="width:5%"><col style="width:18%"><col style="width:27%"><col style="width:20%"><col style="width:30%"></colgroup><thead><tr><th>#</th><th>${esc("Test")}</th><th>${esc("Hypothesis")}</th><th>${esc("Metric")}</th><th>${esc("Notes")}</th></tr></thead><tbody>${experimentRows}</tbody></table>
  </div>`;

  const pillarSection = `<div class="section report-major"><h2>${esc("Detailed audit by pillar")}</h2>
    ${!isPaid ? `<p class="muted">${esc(PRO_UPGRADE_STRIP)} ${esc(FULL_DIAGNOSTIC_UPGRADE_HOOK)}</p>` : ""}
    ${pillarBlocks || `<p class="muted">${esc("No detailedAudit payload.")}</p>`}
  </div>`;

  const appendixSection = `<div class="section report-major"><h2>${esc("SEO & technical appendix")}</h2>${seoAppendix || `<p class="muted">${esc("No appendix blocks for this export.")}</p>`}</div>`;

  const teaserNote = !isPaid
    ? `<div class="locked-section" style="margin-top:18px;"><p class="muted">${esc(PRO_UPGRADE_STRIP)}</p></div>`
    : "";

  return [
    coverStrip,
    execSection,
    howTo,
    contextSection,
    insightHeadingHtml(esc, "First impression & conversion focus", firstImpBody + qwConvHtml),
    insightHeadingHtml(esc, "Trust & proof", trustBody + qwTrustHtml),
    insightHeadingHtml(esc, "Messaging & copy", msgBody + beforeAfter + qwCopyHtml),
    uxScrollSection,
    speedSection,
    analyticsSection,
    experimentSection,
    pillarSection,
    appendixSection,
    teaserNote,
  ].join("\n");
}

/** Full HTML document for Puppeteer V2 PDF (styles aligned with paid PDF theme). */
export function buildReportV2PdfShellHtml(
  innerBodyHtml: string,
  opts: { esc: (s: string) => string; generatedAt: Date }
): string {
  const styles = getReportPdfStyles();
  const at = opts.generatedAt;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${BRAND_NAME} — Report V2</title>
  <link rel="stylesheet" href="${reportFontsHref}" />
  <style>${styles}</style>
</head>
<body>
  ${innerBodyHtml}
  <footer class="report-pdf-footer"><p>${BRAND_NAME}</p><p>${opts.esc(at.toISOString())}</p></footer>
</body>
</html>`;
}
