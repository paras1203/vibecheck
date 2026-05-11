import type { PerformanceStrategyResult } from "@/lib/audits/performance-pagespeed";
import { Activity, Code2, Layers2, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import {
  hasExtendedAuditAppendixContent,
  type ExtendedAuditAppendixInput,
} from "@/lib/report-extended-audit-appendix";
import { radarScoreValueClass } from "@/lib/radar-axis-scores";
import { stripDisplayMarkdown } from "@/lib/report-copy";
import { cn } from "@/lib/utils";

export function hasRoastExpandedDiagnosticsContent(
  data: ExtendedAuditAppendixInput | null | undefined
): boolean {
  if (!data) return false;
  return hasExtendedAuditAppendixContent(data);
}

function StratPerf({ label, strat }: { label: string; strat: PerformanceStrategyResult }) {
  return (
    <div className="rounded-lg border border-border-muted bg-muted/20 p-3 text-sm">
      <p className="mb-2 font-medium text-foreground">{label}</p>
      <ul className="grid gap-1 text-muted-foreground sm:grid-cols-2">
        {typeof strat.performanceScore === "number" ? (
          <li>
            <span className="text-foreground">Score:</span>{" "}
            <span
              className={cn(
                "font-mono font-semibold tabular-nums",
                radarScoreValueClass(strat.performanceScore)
              )}
            >
              {strat.performanceScore}
            </span>
          </li>
        ) : null}
        {strat.lcp ? (
          <li>
            <span className="text-foreground">LCP:</span> {strat.lcp}
          </li>
        ) : null}
        {strat.inp ? (
          <li>
            <span className="text-foreground">INP:</span> {strat.inp}
          </li>
        ) : null}
        {strat.cls ? (
          <li>
            <span className="text-foreground">CLS:</span> {strat.cls}
          </li>
        ) : null}
        {strat.tbt ? (
          <li>
            <span className="text-foreground">TBT:</span> {strat.tbt}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function RoastExpandedDiagnosticsSection(
  props: ExtendedAuditAppendixInput
) {
  if (!hasRoastExpandedDiagnosticsContent(props)) {
    return null;
  }

  const pa = props.performance_audit;
  const seo = props.on_page_seo;
  const mp = props.meta_preview;
  const tt = props.tech_stack;
  const bh = props.behaviour_tools;

  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="border-border-muted bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Programmatic audit sources
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          Signals below combine{" "}
          <strong className="text-foreground">
            Google PageSpeed Insights API
          </strong>{" "}
          (when <code>PAGESPEED_API_KEY</code> is set), lightweight DOM/heuristic
          checks, and an optional{" "}
          <code className="text-xs">TECHSTACK_API_URL</code> merge.
        </CardContent>
      </Card>

      {pa && (pa.mobile || pa.desktop || pa.opportunities.length || pa.diagnostics.length) ? (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <IconFrame size="sm" className="bg-primary/10 text-primary">
                <Activity className="size-4 stroke-[1.5]" />
              </IconFrame>
              Performance (dual strategy)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Lab metrics from PSI / Lighthouse across mobile & desktop snapshots.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
            {pa.mobile ? <StratPerf label="Mobile" strat={pa.mobile} /> : null}
            {pa.desktop ? <StratPerf label="Desktop" strat={pa.desktop} /> : null}
          </CardContent>
          {pa.opportunities.length > 0 ? (
            <CardContent className="border-t border-border-muted pt-3">
              <p className="mb-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
                Top opportunities
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {pa.opportunities.slice(0, 8).map((o) => (
                  <li key={o.id}>
                    <span className="text-foreground">{o.title ?? o.id}</span>
                    {o.displayValue ? (
                      <span className="text-muted-foreground"> — {o.displayValue}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          ) : null}
          {pa.diagnostics.length > 0 ? (
            <CardContent className="border-t border-border-muted pt-3">
              <p className="mb-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
                Diagnostics
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {pa.diagnostics.slice(0, 8).map((o) => (
                  <li key={o.id}>
                    <span className="text-foreground">{o.title ?? o.id}</span>
                    {o.displayValue ? (
                      <span className="text-muted-foreground"> — {o.displayValue}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {seo ? (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <IconFrame size="sm" className="bg-primary/10 text-primary">
                <Target className="size-4 stroke-[1.5]" />
              </IconFrame>
              On-page SEO & hygiene
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
            <p>
              Headings · H1 {seo.headingH1Count} · H2 {seo.headingH2Count} · H3{" "}
              {seo.headingH3Count}
            </p>
            <p>
              Canonical: {seo.canonicalPresent ? "present" : "missing"} · valid URL:{" "}
              {seo.canonicalValid ? "yes" : "no"} · host match:{" "}
              {seo.canonicalMatchesPageHost ? "yes" : "no"}
            </p>
            <p>
              Images: {seo.imagesTotal} total · alt coverage{" "}
              {Math.round(seo.imagesWithMeaningfulAltPct * 100)}% · hero alt (heuristic):{" "}
              {seo.heroAltPresentLikely ? "likely present" : "missing or uncertain"}
            </p>
            <p>
              Links — internal {seo.internalLinks} · external {seo.externalLinks}
              {seo.linkFlagNoNavigational ? " · no navigational anchors found" : ""}
              {seo.linkFlagOnlyExternal ? " · only external links" : ""}
            </p>
            {seo.messages?.length ? (
              <ul className="list-disc space-y-1 pl-5 text-foreground">
                {seo.messages.map((m, i) => (
                  <li key={`${i}-${m.slice(0, 12)}`}>{m}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {mp ? (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <IconFrame size="sm" className="bg-primary/10 text-primary">
                <Layers2 className="size-4 stroke-[1.5]" />
              </IconFrame>
              Meta snippets & previews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 text-sm">
            <div className="space-y-1">
              <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
                SERP-style preview
              </p>
              <pre className="whitespace-pre-wrap rounded-lg border border-border-muted bg-muted/30 p-3 font-sans text-sm text-foreground">
                {mp.serpPreviewText}
              </pre>
            </div>
            <div className="space-y-1">
              <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
                Open Graph summary
              </p>
              <pre className="whitespace-pre-wrap rounded-lg border border-border-muted bg-muted/30 p-3 font-sans text-sm text-foreground">
                {mp.ogPreviewText}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              Missing OG:{" "}
              {[mp.missingOgTitle && "title", mp.missingOgDescription && "description", mp.missingOgImage && "image"]
                .filter(Boolean)
                .join(", ") || "none noted"}{" "}
              · Missing Twitter:{" "}
              {[
                mp.missingTwitterCard && "card",
                mp.missingTwitterTitle && "title",
                mp.missingTwitterDescription && "description",
                mp.missingTwitterImage && "image",
              ]
                .filter(Boolean)
                .join(", ") || "none noted"}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {tt && tt.detectedTools.length > 0 ? (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <IconFrame size="sm" className="bg-primary/10 text-primary">
                <Code2 className="size-4 stroke-[1.5]" />
              </IconFrame>
              Tech stack & trackers
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Pattern matched against fetched HTML/scripts.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {tt.detectedTools.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 rounded-full border border-border-muted bg-muted/30 px-3 py-1 text-xs text-foreground"
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground">
                  ({t.category} · {t.confidence})
                </span>
              </span>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {bh?.recommendationMessage ? (
        <Card className="border-primary/40 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Behaviour analytics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Heuristic recommendation using the same fingerprinting signals.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-sm text-foreground">
            <p className="leading-relaxed">{stripDisplayMarkdown(bh.recommendationMessage)}</p>
            {bh.recommendBehaviourAnalytics ? (
              <p className="text-sm text-muted-foreground">
                Microsoft Clarity remains a strong free option for recordings + heatmaps when you
                need fast insight without another paid SaaS tier.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
