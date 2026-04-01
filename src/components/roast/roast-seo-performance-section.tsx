import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { Badge } from "@/components/ui/badge";
import { Search, Gauge } from "lucide-react";
import { formatSeoIssueLabel, type SeoAppendixInput } from "@/lib/report-seo-appendix";

function pageTypeLabel(pt: string): string {
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
      return pt;
  }
}

type Props = {
  data: SeoAppendixInput;
};

export function hasRoastSeoHealthContent(data: SeoAppendixInput): boolean {
  const showPageType = Boolean(data.page_type && data.page_type !== "unknown");
  return showPageType || data.seo != null;
}

export function RoastSeoHealthBlock({ data }: Props) {
  const { seo, page_type: pageType } = data;
  const showPageType = Boolean(pageType && pageType !== "unknown");
  const showSeo = seo != null;

  if (!showPageType && !showSeo) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {showPageType && pageType ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Detected page type:</span>{" "}
          {pageTypeLabel(pageType)}
        </p>
      ) : null}

      {showSeo && seo ? (
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
            <p className="font-mono text-xl font-semibold tabular-nums text-primary md:text-2xl">
              {seo.score}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </p>
            <ul className="grid gap-2 text-muted-foreground sm:grid-cols-2">
              <li>
                <span className="text-foreground">Title</span> (
                {seo.title?.length ?? 0} chars):{" "}
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
                <span className="text-foreground">Canonical</span>:{" "}
                {seo.hasCanonical ? "Yes" : "No"}
              </li>
              <li>
                <span className="text-foreground">Open Graph</span>:{" "}
                {seo.openGraph ? "Yes" : "No"}
              </li>
              <li>
                <span className="text-foreground">Twitter cards</span>:{" "}
                {seo.twitterCards ? "Yes" : "No"}
              </li>
              <li className="sm:col-span-2">
                <span className="text-foreground">Image alt coverage</span>:{" "}
                {Math.round(seo.imageAltCoverage * 100)}%
              </li>
            </ul>
            {seo.issues && seo.issues.length > 0 ? (
              <div className="border-t border-border-muted pt-3">
                <p className="mb-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
                  Issues
                </p>
                <ul className="flex flex-col gap-1.5">
                  {seo.issues.map((issue, i) => (
                    <li key={`${issue.type}-${i}`} className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5 shrink-0 text-xs font-normal">
                        {issue.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatSeoIssueLabel(issue.type)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function RoastPageSpeedBlock({ data }: Props) {
  const { performance } = data;
  const showPerf = Boolean(
    performance &&
      (typeof performance.performanceScore === "number" ||
        (performance.lcp != null && performance.lcp !== "") ||
        (performance.cls != null && performance.cls !== ""))
  );

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
      <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
        {typeof performance.performanceScore === "number" ? (
          <p>
            <span className="font-medium text-foreground">Performance score:</span>{" "}
            {performance.performanceScore}
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
      </CardContent>
    </Card>
  );
}
