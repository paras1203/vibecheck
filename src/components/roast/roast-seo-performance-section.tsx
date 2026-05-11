import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { Search, Gauge } from "lucide-react";
import {
  formatSeoIssueLabel,
  formatSeoIssueSolution,
  type SeoAppendixInput,
} from "@/lib/report-seo-appendix";
import { radarScoreValueClass } from "@/lib/radar-axis-scores";
import { cn } from "@/lib/utils";

/** Gated like extra quick-fix rows for free users. */
const PAYWALL_SEO_ISSUE_TYPES = new Set([
  "META_DESCRIPTION_LENGTH",
  "IMAGE_ALT_COVERAGE_LOW",
]);

type Props = {
  data: SeoAppendixInput;
  hasFullReportAccess?: boolean;
};

export function hasRoastSeoHealthContent(data: SeoAppendixInput): boolean {
  return data.seo != null;
}

export function hasRoastPageSpeedContent(data: SeoAppendixInput): boolean {
  const perf = data.performance;
  return Boolean(
    perf &&
      (typeof perf.performanceScore === "number" ||
        (perf.lcp != null && perf.lcp !== "") ||
        (perf.cls != null && perf.cls !== "") ||
        (perf.tbt != null && perf.tbt !== "") ||
        (perf.inp != null && perf.inp !== ""))
  );
}

export function RoastSeoHealthBlock({ data, hasFullReportAccess = true }: Props) {
  const { seo } = data;
  if (seo == null) {
    return null;
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <Search className="size-4 stroke-[1.5]" />
          </IconFrame>
          SEO health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        <p
          className={cn(
            "font-mono text-xl font-semibold tabular-nums md:text-2xl",
            radarScoreValueClass(seo.score)
          )}
        >
          {seo.score}
          <span className="text-sm font-normal text-muted-foreground">/100</span>
        </p>
        <ul className="grid gap-2 text-muted-foreground sm:grid-cols-2">
          <li>
            <span className="text-foreground">Title</span> ({seo.title?.length ?? 0} chars):{" "}
            {!seo.title
              ? "Missing"
              : seo.title.length < 30 || seo.title.length > 60
                ? "Length warning"
                : "OK"}
          </li>
          <li>
            <span className="text-foreground">Meta description</span>:{" "}
            {!seo.metaDescription
              ? "Missing"
              : seo.metaDescription.length < 70 || seo.metaDescription.length > 160
                ? "Length warning"
                : "OK"}
          </li>
          <li>
            <span className="text-foreground">H1 count</span>: {seo.h1Count}
          </li>
          <li>
            <span className="text-foreground">Canonical</span>: {seo.hasCanonical ? "Yes" : "No"}
          </li>
          <li>
            <span className="text-foreground">Open Graph</span>: {seo.openGraph ? "Yes" : "No"}
          </li>
          <li>
            <span className="text-foreground">Twitter cards</span>: {seo.twitterCards ? "Yes" : "No"}
          </li>
          <li className="sm:col-span-2">
            <span className="text-foreground">Image alt coverage</span>:{" "}
            {Math.round(seo.imageAltCoverage * 100)}%
          </li>
        </ul>
        {seo.issues && seo.issues.length > 0 ? (
          <div className="border-t border-border-muted pt-3">
            <p className="mb-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
              Issues & recommended fixes
            </p>
            <ul className="flex flex-col gap-2">
              {seo.issues.map((issue, i) => {
                const paywalled =
                  !hasFullReportAccess && PAYWALL_SEO_ISSUE_TYPES.has(issue.type);
                if (paywalled) {
                  return (
                    <li
                      key={`${issue.type}-${i}-locked`}
                      className="rounded-lg border border-dashed border-border-muted bg-muted/10 px-3 py-2.5"
                      aria-label="Full report details are required to view this recommendation"
                    >
                      <div className="space-y-2" aria-hidden>
                        <div className="h-3.5 w-[min(12rem,55%)] rounded-md bg-muted" />
                        <div className="h-3 w-[min(16rem,75%)] rounded-md bg-muted/60" />
                        <div className="h-3 w-[min(11rem,45%)] rounded-md bg-muted/40" />
                      </div>
                    </li>
                  );
                }
                return (
                  <li
                    key={`${issue.type}-${i}`}
                    className="rounded-lg border border-border-muted bg-muted/20 px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {formatSeoIssueLabel(issue.type)}
                    </span>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground/90">Fix: </span>
                      {formatSeoIssueSolution(issue.type)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function RoastPageSpeedBlock({ data }: Props) {
  const { performance } = data;
  const showPerf = Boolean(
    performance &&
      (typeof performance.performanceScore === "number" ||
        (performance.lcp != null && performance.lcp !== "") ||
        (performance.cls != null && performance.cls !== "") ||
        (performance.tbt != null && performance.tbt !== ""))
  );

  const gem = data.performanceGemini;

  if (!showPerf || !performance) {
    return null;
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <Gauge className="size-4 stroke-[1.5]" />
          </IconFrame>
          PageSpeed Insights
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Lab metrics from Google when a PageSpeed API key is configured.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
        {typeof performance.performanceScore === "number" ? (
          <p>
            <span className="font-medium text-foreground">Performance score:</span>{" "}
            <span
              className={cn(
                "font-mono font-semibold tabular-nums",
                radarScoreValueClass(performance.performanceScore)
              )}
            >
              {performance.performanceScore}
            </span>
          </p>
        ) : null}
        {performance.lcp ? (
          <p>
            <span className="font-medium text-foreground">LCP:</span> {performance.lcp}
          </p>
        ) : null}
        {performance.cls ? (
          <p>
            <span className="font-medium text-foreground">CLS:</span> {performance.cls}
          </p>
        ) : null}
        {performance.inp ? (
          <p>
            <span className="font-medium text-foreground">INP:</span> {performance.inp}
          </p>
        ) : null}
        {performance.tbt ? (
          <p>
            <span className="font-medium text-foreground">TBT:</span> {performance.tbt}
          </p>
        ) : null}
        {gem?.summary ? (
          <div className="space-y-2 border-t border-border-muted pt-3">
            <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
              Summary report
            </p>
            <p className="text-sm leading-relaxed text-foreground">{gem.summary}</p>
            {gem.quickFixes?.length === 2 ? (
              <div>
                <p className="mb-1.5 text-caption font-medium uppercase tracking-wide text-muted-foreground">
                  Top 2 quick fixes (speed)
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
                  <li>{gem.quickFixes[0]}</li>
                  <li>{gem.quickFixes[1]}</li>
                </ol>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
