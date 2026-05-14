"use client";

/**
 * Report V2 — consulting deck layout. Payload mapping:
 * 0 Cover — audited_url (hostname), overall_score/radar → site score, weakest pillar from radar,
 *   page_type, trafficEstimate.monthlySessions + note, device, report date from reportId.
 * 1 Executive — hook | overview.executiveSummary (parseExecutiveSummaryText); revenueLeakEstimate
 *   scenarios + radar pillar scores; conversion pillar context via radar + narrative.
 * 2 How to use — static IA copy; implementationChecklist | resolveChecklistItems from quickWins/radar.
 * 3 Context — ReportContextCard fields + industry_guess; revenueLeakEstimate disclaimer/methodology.
 * 4 First impression — firstImpressionScore (+ fallbackInsightLayers); quickWins keywords hero/cta.
 * 5 Trust — trustGapIndex; quickWins keywords trust/testimonial/proof.
 * 6 Messaging — messagingClarityScore; quickWins copy/headline; optional before/after from problem/fix.
 * 7 UX & scroll — radar UX + scrollEffectiveness | buildScrollEffectiveness; pageHeight; heroScreenshot.
 * 8 Speed — performance, performanceGemini, performance_audit; RoastPageSpeed patterns.
 * 9 Analytics — tech_stack.detectedTools, behaviour_tools; instrumentation checklist (derived).
 * 10 Experiments — experimentBacklog | resolveExperimentItems(quickWins).
 * 11 Pillar audit — detailedAudit rows (worker-shaped: workingWell, notWorking, impact, fix.quickFix).
 * 12 SEO appendix — seo, on_page_seo, meta_preview (RoastSeoHealthBlock + RoastExpandedDiagnosticsSection).
 */

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { RoastRadar } from "@/components/roast-radar";
import { RadialChart } from "@/components/ui/radial-chart";
import { IconFrame } from "@/components/ui/icon-frame";
import {
  CircleCheck,
  CircleX,
  Radar as RadarIcon,
} from "lucide-react";
import { ReportContextCard } from "@/components/roast/report-context-card";
import { RevenueLeakEstimateCard } from "@/components/roast/revenue-leak-estimate-card";
import { ImplementationChecklistSection } from "@/components/roast/implementation-checklist-section";
import { ReportAnalyticsReadinessCard } from "@/components/roast/report-analytics-readiness-card";
import {
  RoastSeoHealthBlock,
  RoastPageSpeedBlock,
  hasRoastSeoHealthContent,
  hasRoastPageSpeedContent,
} from "@/components/roast/roast-seo-performance-section";
import {
  RoastExpandedDiagnosticsSection,
  hasRoastExpandedDiagnosticsContent,
} from "@/components/roast/roast-expanded-diagnostics-section";
import { ScrollOfDeathCard } from "@/components/roast/scroll-of-death-card";
import { FirstViewportSnapshotPanel } from "@/components/roast/first-viewport-snapshot-panel";
import { QuickWinCardBody } from "@/components/roast/quick-win-card-body";
import { UnlockFullReportButton } from "@/components/roast/unlock-full-report-button";
import { RoastReportV2SignalsTable } from "@/components/roast/roast-report-v2-signals-table";
import {
  filterQuickWinsByKeywords,
  instrumentationLines,
  weakestRadarAxis,
} from "@/lib/report-v2-deck-utils";
import type { AuditReportPayload, QuickWin } from "@/lib/report-html";
import {
  stripDisplayMarkdown,
  stripNarrativeSegmentLabels,
  FULL_DIAGNOSTIC_UPGRADE_HOOK,
} from "@/lib/report-copy";
import { parseExecutiveSummaryText } from "@/lib/report-v2-executive";
import { detailedAuditToDisplayRows } from "@/lib/report-v2-pillar-audit";
import {
  auditImpactTextClassName,
  auditStatusTextClassName,
  formatAuditImpactLabel,
} from "@/lib/audit-table-cells";
import {
  buildRevenueLeakEstimate,
  DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
  fallbackInsightLayers,
} from "@/lib/insight-layers";
import { ensureQuickWinsUpTo } from "@/lib/quick-wins-fill";
import { buildScrollEffectiveness } from "@/lib/scroll-effectiveness-from-audit";
import { scrollDepthNarrative, LOCKED_INSIGHT_BULLETS } from "@/lib/report-ui";
import { meanRadarSiteScore, verdictLabelFromSiteScore } from "@/lib/site-score";
import {
  RADAR_AXIS_LABELS,
  scoreForRadarAxis,
  radarScoreValueClass,
} from "@/lib/radar-axis-scores";
import {
  CATEGORY_TAB_ORDER,
  displayNameForCategoryKey,
  type DetailedAuditRow,
} from "@/lib/report-category-score";
import { resolveExperimentItems } from "@/lib/report-artifacts-html";
import type { ReportArtifactsInput } from "@/lib/report-artifacts-html";
import { reportTimestampFromRoastId } from "@/lib/report-display-name";
import { cn } from "@/lib/utils";
import type { ExperimentBacklogItem } from "@/types/report-artifacts";

export type RoastReportV2Props = {
  roastData: AuditReportPayload;
  reportId: string;
  hasFullReportAccess: boolean;
  unlockFullReport: () => void;
  traffic: number;
  price: number;
  industry: "SaaS" | "Agency" | "E-commerce";
  setTraffic: (n: number) => void;
  setPrice: (n: number) => void;
};

function hostLabel(url?: string): string {
  if (!url?.trim()) return "your-site";
  try {
    const u = url.includes("://") ? url.trim() : `https://${url.trim()}`;
    return new URL(u).hostname.replace(/^www\./i, "");
  } catch {
    return url.trim();
  }
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

function pageTypeBadge(pt?: string) {
  const raw = (pt || "unknown").toLowerCase();
  const label =
    raw === "landing"
      ? "Landing"
      : raw === "blog"
        ? "Blog"
        : raw === "product"
          ? "Product"
          : raw === "unknown"
            ? "Unknown"
            : pt || "—";
  return label;
}

export function RoastReportV2({
  roastData,
  reportId,
  hasFullReportAccess,
  unlockFullReport,
  traffic,
  price,
  industry,
  setTraffic,
  setPrice,
}: RoastReportV2Props) {
  const completedMs = reportTimestampFromRoastId(reportId, Date.now());
  const domain = hostLabel(roastData.audited_url);

  const radarScores = roastData.radar_scores || roastData.radarMetrics || {};
  const hasRadarGrid =
    typeof radarScores === "object" &&
    radarScores !== null &&
    Object.keys(radarScores).length > 0;
  const storedOverall =
    Number(roastData.overall_score ?? roastData.overview?.overallScore) || 50;
  const overallScore = hasRadarGrid
    ? meanRadarSiteScore(radarScores as Record<string, unknown>)
    : storedOverall;

  const radarForVerdict = {
    ...(radarScores as Record<string, unknown>),
    ...(roastData.radarMetrics as Record<string, unknown> | undefined),
  };

  const quickWins = ensureQuickWinsUpTo(
    roastData.quickWins || roastData.quick_wins,
    roastData.audit_items
  );

  const radarMetricsLower: Record<string, number> = roastData.radarMetrics
    ? { ...roastData.radarMetrics }
    : {
        ux: Number(radarScores.UX ?? radarScores.ux ?? 50),
        conversion: Number(radarScores.Conversion ?? radarScores.conversion ?? 50),
        copy: Number(radarScores.Copy ?? radarScores.copy ?? 50),
        visuals: Number(radarScores.Visuals ?? radarScores.visuals ?? 50),
        trust: Number(radarScores.Trust ?? radarScores.trust ?? 50),
        speed: Number(radarScores.Speed ?? radarScores.speed ?? 50),
      };

  const trafficSessionsBaseline =
    roastData.trafficEstimate?.monthlySessions ?? DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS;
  const trafficAssumptionLine =
    traffic === trafficSessionsBaseline && roastData.trafficEstimate?.note?.trim()
      ? roastData.trafficEstimate.note.trim()
      : `Monthly sessions set to ${traffic.toLocaleString()} (editable below; illustrative—not from your analytics).`;

  const revenueLeakEstimateResolved = buildRevenueLeakEstimate(traffic, price, {
    industryLabel: roastData.industry_guess?.trim() || industry,
    priceFromScrape: Boolean(roastData.price_from_page),
    trafficAssumptionLine,
  });

  const insightFallback = fallbackInsightLayers(radarMetricsLower);
  const firstImpressionLayer =
    roastData.firstImpressionScore ?? insightFallback.firstImpressionScore;
  const trustGapLayer = roastData.trustGapIndex ?? insightFallback.trustGapIndex;
  const messagingLayer =
    roastData.messagingClarityScore ?? insightFallback.messagingClarityScore;

  const execRaw = stripDisplayMarkdown(
    stripNarrativeSegmentLabels(
      roastData.hook ||
        roastData.overview?.executiveSummary ||
        roastData.roastSummary ||
        ""
    )
  );
  const parsedExec = useMemo(() => parseExecutiveSummaryText(execRaw), [execRaw]);

  const weakest = weakestRadarAxis(radarScores as Record<string, number>);
  const verdictLabel = verdictLabelFromSiteScore(Math.round(overallScore), radarForVerdict);

  const pageHeight = roastData.pageHeight || 3000;
  const scrollHelp = scrollDepthNarrative(roastData.audited_url, pageHeight);
  const scrollResolved =
    roastData.scrollEffectiveness ??
    buildScrollEffectiveness(roastData, roastData.audited_url || "", pageHeight, 800);

  const foldHeight = 800;
  const belowFold = Math.max(0, pageHeight - foldHeight);
  const belowFoldPercent = pageHeight > 0 ? (belowFold / pageHeight) * 100 : 0;

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

  const techIds = new Set((roastData.tech_stack?.detectedTools ?? []).map((t) => t.id.toLowerCase()));
  const toolNamesLower = (roastData.tech_stack?.detectedTools ?? [])
    .map((t) => t.name.toLowerCase())
    .join(" ");
  const hasClarityHint =
    toolNamesLower.includes("clarity") ||
    Boolean(roastData.behaviour_tools?.recommendationMessage?.includes("Clarity"));
  const checklistInstrument = instrumentationLines({ techIds, hasClarityHint });

  const experiments = resolveExperimentItems(roastData as ReportArtifactsInput).slice(0, 6);

  const detailedAudit = (roastData.detailedAudit || {}) as Record<string, DetailedAuditRow[]>;
  const pillarSorted = sortedDetailedAuditEntries(detailedAudit);

  const seoHealthBlockData = {
    seo: roastData.seo,
    page_type: roastData.page_type,
    performance: roastData.performance,
  };
  const showSeoHealthBlock = hasRoastSeoHealthContent(seoHealthBlockData);

  const conversionRadar = scoreForRadarAxis(radarScores as Record<string, number>, "Conversion");

  const beforeAfterWin = (qwCopy[0] || quickWins[0]) as QuickWin | undefined;

  const deviceLabel = roastData.device === "mobile" ? "Mobile" : "Desktop";

  return (
    <div className="flex w-full flex-col gap-10 md:gap-12">
      <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-caption uppercase tracking-wide text-muted-foreground">
                Conversion audit
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {domain}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="font-mono tabular-nums">
                Score {Math.round(overallScore)}/100 · {verdictLabel}
              </Badge>
              <Badge variant="outline">
                Weakest: {weakest.label} ({weakest.score})
              </Badge>
              <Badge variant="outline">{pageTypeBadge(roastData.page_type)}</Badge>
              <Badge variant="outline">
                ~{traffic.toLocaleString()} sess./mo (illustrative)
              </Badge>
              <Badge variant="outline">
                {new Date(completedMs).toLocaleDateString()} · {deviceLabel}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4" id="v2-executive">
        <SectionHeader
          title="Executive summary"
          description="Critical failures, impact, and what to fix first — plus pillar and revenue context."
          size="compact"
        />
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-6">
            {parsedExec.fallbackBody ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {parsedExec.fallbackBody}
              </p>
            ) : (
              <>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  {parsedExec.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ol>
                {parsedExec.impactLine ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Business impact: </span>
                    {parsedExec.impactLine}
                  </p>
                ) : null}
                {parsedExec.fixFirstLine ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Fix first: </span>
                    {parsedExec.fixFirstLine}
                  </p>
                ) : null}
              </>
            )}
            <div className="grid gap-4 border-t border-border-muted pt-4 md:grid-cols-12 md:items-start">
              <div className="flex flex-col items-center md:col-span-3">
                <RadialChart value={overallScore} size={112} strokeWidth={9} showLabel={false} />
                <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-primary">
                  {Math.round(overallScore)}
                  <span className="text-sm font-normal text-muted-foreground">/100</span>
                </p>
              </div>
              <div className="md:col-span-5">
                <p className="mb-2 text-caption font-medium text-muted-foreground">Pillar scores</p>
                <div className="grid grid-cols-3 gap-2">
                  {RADAR_AXIS_LABELS.map((label) => {
                    const axisScore = scoreForRadarAxis(radarScores as Record<string, number>, label);
                    return (
                      <div
                        key={label}
                        className="rounded-lg border border-border-muted bg-surface-2/30 px-2 py-2 text-center"
                      >
                        <div className="text-[10px] font-medium text-muted-foreground">{label}</div>
                        <div
                          className={cn(
                            "font-mono text-xs font-semibold tabular-nums",
                            radarScoreValueClass(axisScore)
                          )}
                        >
                          {axisScore}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-4">
                <p className="mb-2 text-caption font-medium text-muted-foreground">
                  Revenue scenarios (illustrative)
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>
                    Low ({Math.round(revenueLeakEstimateResolved.scenarios.low.conversionUpliftRate * 100)}
                    % uplift): ~$
                    {Math.round(
                      revenueLeakEstimateResolved.annualLeakUsdDefaults?.low ??
                        traffic * price * 12 * revenueLeakEstimateResolved.scenarios.low.conversionUpliftRate
                    ).toLocaleString()}{" "}
                    /yr directional
                  </li>
                  <li>
                    Base ({Math.round(revenueLeakEstimateResolved.scenarios.base.conversionUpliftRate * 100)}
                    %): ~$
                    {Math.round(
                      revenueLeakEstimateResolved.annualLeakUsdDefaults?.base ??
                        traffic * price * 12 * revenueLeakEstimateResolved.scenarios.base.conversionUpliftRate
                    ).toLocaleString()}
                  </li>
                  <li>
                    High ({Math.round(revenueLeakEstimateResolved.scenarios.high.conversionUpliftRate * 100)}
                    %): ~$
                    {Math.round(
                      revenueLeakEstimateResolved.annualLeakUsdDefaults?.high ??
                        traffic * price * 12 * revenueLeakEstimateResolved.scenarios.high.conversionUpliftRate
                    ).toLocaleString()}
                  </li>
                </ul>
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  {revenueLeakEstimateResolved.disclaimer}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4" id="v2-howto">
        <SectionHeader
          title="How to use this report"
          description="Audience, reading order, and an implementation checklist."
          size="compact"
        />
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Who this is for</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium text-foreground">Founders:</span> exec summary, revenue
                scenarios, experiment backlog.
              </li>
              <li>
                <span className="font-medium text-foreground">Marketing / CRO:</span> first impression,
                trust, messaging, analytics instrumentation.
              </li>
              <li>
                <span className="font-medium text-foreground">Design / Dev:</span> UX scroll, speed &
                technical health, pillar audit fixes.
              </li>
            </ul>
            <div>
              <p className="mb-2 font-medium text-foreground">How to read it</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Sections 4–6 translate qualitative signals into hero, trust, and copy moves.</li>
                <li>Sections 7–8 cover layout/scroll and lab performance.</li>
                <li>Sections 9–11 prioritize tooling and tests from Quick Wins.</li>
                <li>Section 12 is the SEO / meta / diagnostics appendix.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        <ImplementationChecklistSection roastLike={roastData as ReportArtifactsInput} />
      </section>

      <section className="grid gap-4 md:grid-cols-2" id="v2-context">
        <SectionHeader
          title="Context & assumptions"
          description="Traffic model and revenue scenario limits."
          size="compact"
          className="md:col-span-2"
        />
        <ReportContextCard
          page_type={roastData.page_type}
          trafficEstimate={roastData.trafficEstimate}
          performance={roastData.performance}
          performance_audit={roastData.performance_audit ?? null}
          price_guess={roastData.price_guess}
          price_from_page={roastData.price_from_page}
          price_billing_note={roastData.price_billing_note}
        />
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Page & industry context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Industry (guess):</span>{" "}
              {roastData.industry_guess?.trim() || "—"}
            </p>
            <p className="text-xs leading-relaxed">{trafficAssumptionLine}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Revenue model & limitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{revenueLeakEstimateResolved.methodology}</p>
            <p className="text-xs">{revenueLeakEstimateResolved.disclaimer}</p>
          </CardContent>
        </Card>
        <div className="md:col-span-2">
          <RevenueLeakEstimateCard
            estimate={revenueLeakEstimateResolved}
            traffic={traffic}
            price={price}
            onTrafficChange={setTraffic}
            onPriceChange={setPrice}
          />
        </div>
      </section>

      <section className="space-y-4" id="v2-first-impression">
        <SectionHeader
          title="First impression & conversion focus"
          description="Hero clarity, CTA visibility, and hierarchy vs conversion pillar."
          size="compact"
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          First impression composite scores{" "}
          <span
            className={cn(
              "font-mono font-semibold",
              radarScoreValueClass(firstImpressionLayer.composite.current)
            )}
          >
            {firstImpressionLayer.composite.current}
          </span>
          {" → "}
          <span className="font-mono font-semibold text-primary">
            {firstImpressionLayer.composite.proposed}
          </span>
          . Conversion pillar sits at{" "}
          <span className={cn("font-mono font-semibold", radarScoreValueClass(conversionRadar))}>
            {conversionRadar}
          </span>
          . {firstImpressionLayer.layerSummary}
        </p>
        <RoastReportV2SignalsTable subscores={firstImpressionLayer.subscores} />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <IconFrame size="sm" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  <CircleCheck className="size-4 stroke-[1.5]" />
                </IconFrame>
                What&apos;s working
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {(hasFullReportAccess
                  ? firstImpressionLayer.highPrioritySignals.slice(0, 3)
                  : LOCKED_INSIGHT_BULLETS.slice(0, 3)
                ).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <IconFrame size="sm" className="bg-destructive/15 text-destructive">
                  <CircleX className="size-4 stroke-[1.5]" />
                </IconFrame>
                What&apos;s not working
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {(hasFullReportAccess
                  ? firstImpressionLayer.highPrioritySignals.slice(-3)
                  : LOCKED_INSIGHT_BULLETS.slice(0, 3)
                ).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        {!hasFullReportAccess ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            <p>{FULL_DIAGNOSTIC_UPGRADE_HOOK}</p>
            <UnlockFullReportButton onUnlock={unlockFullReport} className="mt-3" />
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {qwConversion.slice(0, 2).map((w, i) => (
            <Card key={`qw-conv-${i}`} className="border-border bg-card">
              <CardContent className="flex gap-3 pt-6">
                <QuickWinCardBody win={w} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4" id="v2-trust">
        <SectionHeader title="Trust & proof" description="Risk, testimonials, and guarantees." size="compact" />
        <p className="text-sm leading-relaxed text-muted-foreground">{trustGapLayer.layerSummary}</p>
        <RoastReportV2SignalsTable subscores={trustGapLayer.subscores} />
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {trustGapLayer.highPrioritySignals.slice(0, 3).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <div className="grid gap-4 md:grid-cols-2">
          {qwTrust.slice(0, 2).map((w, i) => (
            <Card key={`qw-trust-${i}`} className="border-border bg-card">
              <CardContent className="flex gap-3 pt-6">
                <QuickWinCardBody win={w} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4" id="v2-messaging">
        <SectionHeader title="Messaging & copy" description="Value proposition and specificity." size="compact" />
        <p className="text-sm leading-relaxed text-muted-foreground">{messagingLayer.layerSummary}</p>
        <RoastReportV2SignalsTable subscores={messagingLayer.subscores} />
        {beforeAfterWin ? (
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Before → After (directional)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-lg border border-border-muted bg-muted/30 p-3">
                <p className="text-caption font-medium text-muted-foreground">Before</p>
                <p className="mt-1">
                  {beforeAfterWin.problem || messagingLayer.highPrioritySignals[0] || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
                <p className="text-caption font-medium text-muted-foreground">After</p>
                <p className="mt-1">{beforeAfterWin.fix || messagingLayer.highPrioritySignals[1] || "—"}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
        {qwCopy.slice(0, 1).map((w, i) => (
          <Card key={`qw-copy-${i}`} className="border-border bg-card">
            <CardContent className="flex gap-3 pt-6">
              <QuickWinCardBody win={w} />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4" id="v2-ux-scroll">
        <SectionHeader
          title="UX & scroll behaviour"
          description="Layout depth, fold ratio, and scroll narrative."
          size="compact"
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          UX pillar:{" "}
          <span
            className={cn(
              "font-mono font-semibold",
              radarScoreValueClass(scoreForRadarAxis(radarScores as Record<string, number>, "UX"))
            )}
          >
            {scoreForRadarAxis(radarScores as Record<string, number>, "UX")}
          </span>
          . Page height ~{pageHeight}px with ~{belowFoldPercent.toFixed(0)}% below the fold (800px fold).
          {scrollResolved.situation ? ` ${scrollResolved.situation}` : ""}
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {(scrollResolved.evidenceBullets?.length
            ? scrollResolved.evidenceBullets.filter(Boolean).slice(0, 3)
            : [
                scrollHelp.situation,
                scrollHelp.action,
                `Consider shortening sections or reordering proof nearer the hero.`,
              ]
          ).map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        {qwScroll[0] ? (
          <Card className="border-border bg-card">
            <CardContent className="flex gap-3 pt-6">
              <QuickWinCardBody win={qwScroll[0]} />
            </CardContent>
          </Card>
        ) : null}
        <ScrollOfDeathCard
          belowFoldPercent={belowFoldPercent}
          foldHeight={foldHeight}
          pageHeight={pageHeight}
          scrollHelp={scrollHelp}
          scrollEffectiveness={scrollResolved}
        />
        <FirstViewportSnapshotPanel heroBase64={roastData.heroScreenshot} siteLabel={roastData.audited_url} />
      </section>

      <section className="space-y-4" id="v2-speed">
        <SectionHeader title="Speed & technical health" description="Lab metrics and quick fixes." size="compact" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {roastData.performanceGemini?.summary ||
            `Speed pillar scores ${scoreForRadarAxis(radarScores as Record<string, number>, "Speed")} — pair lab data with real-user monitoring when possible.`}
        </p>
        {hasRoastPageSpeedContent({
          seo: roastData.seo,
          page_type: roastData.page_type,
          performance: roastData.performance,
          performanceGemini: roastData.performanceGemini,
        }) ? (
          <RoastPageSpeedBlock
            data={{
              seo: roastData.seo,
              page_type: roastData.page_type,
              performance: roastData.performance,
              performanceGemini: roastData.performanceGemini,
            }}
          />
        ) : (
          <Card className="border-border bg-muted/30">
            <CardContent className="p-4 text-sm text-muted-foreground">
              No PageSpeed summary embedded for this roast.
            </CardContent>
          </Card>
        )}
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {(roastData.performanceGemini?.quickFixes?.length
            ? roastData.performanceGemini.quickFixes
            : ["Review LCP candidate", "Reduce render-blocking scripts", "Compress hero media"]
          )
            .slice(0, 3)
            .map((x, i) => (
              <li key={i}>{x}</li>
            ))}
        </ul>
      </section>

      <section className="space-y-4" id="v2-analytics">
        <SectionHeader
          title="Analytics & behaviour tools"
          description="Detected stack vs recommended gaps."
          size="compact"
        />
        <ReportAnalyticsReadinessCard
          tech_stack={roastData.tech_stack}
          behaviour_tools={roastData.behaviour_tools}
        />
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Instrumentation checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              {checklistInstrument.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4" id="v2-experiments">
        <SectionHeader title="Experiment backlog" description="Hypothesis-led tests from Quick Wins." size="compact" />
        {experiments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No backlog items resolved for this roast.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="table-fixed w-full min-w-[640px] text-sm">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[18%]" />
                <col className="w-[27%]" />
                <col className="w-[20%]" />
                <col className="w-[30%]" />
              </colgroup>
              <thead className="border-b border-border bg-muted/40 text-left text-caption text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Test name</th>
                  <th className="px-3 py-2 font-medium">Hypothesis</th>
                  <th className="px-3 py-2 font-medium">Primary metric</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((it: ExperimentBacklogItem, i: number) => (
                  <tr key={it.testName} className="border-b border-border-muted align-top last:border-0">
                    <td className="px-3 py-2 font-mono tabular-nums">{i + 1}</td>
                    <td className="break-words px-3 py-2 font-medium">{it.testName}</td>
                    <td className="break-words px-3 py-2 text-muted-foreground">{it.hypothesis}</td>
                    <td className="break-words px-3 py-2 text-muted-foreground">{it.primaryMetric}</td>
                    <td className="break-words px-3 py-2 text-muted-foreground">{it.variantDescription}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {hasRadarGrid ? (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <IconFrame size="sm" className="bg-primary/10 text-primary">
                <RadarIcon className="size-4 stroke-[1.5]" />
              </IconFrame>
              Site score radar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            <div className="w-full max-w-[308px] rounded-lg border border-border-muted bg-surface-2/30 p-3 md:p-4">
              <div className="h-[264px] w-full min-w-0">
                <RoastRadar radarMetrics={radarScores} frameless />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4" id="v2-pillar-audit">
        <SectionHeader
          title="Detailed audit by pillar"
          description="Compact rollup from detailedAudit themes."
          size="compact"
        />
        {!hasFullReportAccess ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            <p>{FULL_DIAGNOSTIC_UPGRADE_HOOK}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <UnlockFullReportButton onUnlock={unlockFullReport} />
              <Button variant="outline" asChild>
                <Link href="/billing">Upgrade</Link>
              </Button>
            </div>
          </div>
        ) : null}
        <div className="space-y-8">
          {pillarSorted.map(([catKey, items]) => {
            const title = displayNameForCategoryKey(catKey);
            const rows = detailedAuditToDisplayRows(items, hasFullReportAccess ? 50 : 2);
            return (
              <Card key={catKey} className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="table-fixed w-full min-w-[720px] text-xs">
                    <colgroup>
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                      <col className="w-[5%]" />
                      <col className="w-[25%]" />
                      <col className="w-[25%]" />
                      <col className="w-[25%]" />
                    </colgroup>
                    <thead className="border-b border-border text-left text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-2 align-bottom font-medium">Element</th>
                        <th className="py-2 pr-2 align-bottom font-medium">Status</th>
                        <th className="py-2 pr-2 align-bottom font-medium">Impact</th>
                        <th className="py-2 pr-2 align-bottom font-medium">Working</th>
                        <th className="py-2 pr-2 align-bottom font-medium">Not working</th>
                        <th className="py-2 align-bottom font-medium">Fix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={`${r.element}-${i}`} className="border-b border-border-muted/80 align-top">
                          <td className="break-words py-2 pr-2 font-medium">{r.element}</td>
                          <td className="break-words py-2 pr-2">
                            <span className={auditStatusTextClassName(r.status)}>{r.status}</span>
                          </td>
                          <td className="break-words py-2 pr-2">
                            <span className={auditImpactTextClassName(r.impact)}>
                              {formatAuditImpactLabel(r.impact)}
                            </span>
                          </td>
                          <td className="break-words py-2 pr-2 text-muted-foreground">{r.working}</td>
                          <td className="break-words py-2 pr-2 text-muted-foreground">{r.notWorking}</td>
                          <td className="break-words py-2 text-muted-foreground">{r.fix}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-4" id="v2-seo-appendix">
        <SectionHeader
          title="SEO & technical appendix"
          description="On-page SEO, meta preview, legal signals, PageSpeed opportunities."
          size="compact"
        />
        {showSeoHealthBlock ? (
          <RoastSeoHealthBlock data={seoHealthBlockData} hasFullReportAccess={hasFullReportAccess} />
        ) : null}
        {hasRoastExpandedDiagnosticsContent({
          performance_audit: roastData.performance_audit,
          on_page_seo: roastData.on_page_seo,
          meta_preview: roastData.meta_preview,
          tech_stack: roastData.tech_stack,
          behaviour_tools: roastData.behaviour_tools,
        }) ? (
          <RoastExpandedDiagnosticsSection
            performance_audit={roastData.performance_audit}
            on_page_seo={roastData.on_page_seo}
            meta_preview={roastData.meta_preview}
            tech_stack={roastData.tech_stack}
            behaviour_tools={roastData.behaviour_tools}
          />
        ) : null}
      </section>
    </div>
  );
}
