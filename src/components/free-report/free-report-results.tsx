"use client";

import type { FreeReportPayload } from "@/types/free-report";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FreeReportProUpsell } from "@/components/free-report/free-report-pro-upsell";
import { FreeReportScoreHero } from "@/components/free-report/free-report-score-hero";
import { REVENUE_LEAK_DISCLAIMER } from "@/lib/insight-layers";
import { cn } from "@/lib/utils";

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function severityBadgeClass(s: FreeReportPayload["gaps"][0]["severity"]) {
  if (s === "high") return "border-destructive/50 bg-destructive/10 text-destructive";
  if (s === "medium") return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return "border-border bg-muted/50 text-muted-foreground";
}

export function FreeReportResults({ data }: { data: FreeReportPayload }) {
  const leakBase = data.revenueLeakEstimate.annualLeakUsdDefaults?.base;
  const meta = data.meta_preview;

  return (
    <div className="space-y-8">
      <FreeReportScoreHero data={data} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Gaps that cost you conversions</CardTitle>
          <p className="text-sm text-muted-foreground">
            These are deterministic findings. The paid roast explains *why* they matter on your page
            and what to change first.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No major automated flags—still run a full roast for qualitative UX and CTA critique.
            </p>
          ) : (
            data.gaps.map((g, i) => (
              <div
                key={`${g.title}-${i}`}
                className="rounded-lg border border-border bg-card/50 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px] font-semibold", severityBadgeClass(g.severity))}>
                    {g.severity}
                  </Badge>
                  <h4 className="font-semibold text-foreground">{g.title}</h4>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{g.detail}</p>
                <p className="mt-2 border-t border-border/60 pt-2 text-xs font-medium text-primary">
                  With full audit: {g.proUnlock}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Search & share preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                SERP-style
              </p>
              <p className="mt-1 line-clamp-2 text-base font-medium text-primary">
                {meta?.title || data.seo?.title || "—"}
              </p>
              <p className="line-clamp-3 text-muted-foreground">{meta?.serpPreviewText || "—"}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-dashed border-border p-2 text-xs">
                <p className="font-semibold text-foreground">Open Graph</p>
                <p className="text-muted-foreground">
                  {meta?.missingOgImage ? "Image missing — weak link previews." : "OG image present."}
                </p>
              </div>
              <div className="rounded-md border border-dashed border-border p-2 text-xs">
                <p className="font-semibold text-foreground">Twitter card</p>
                <p className="text-muted-foreground">
                  {meta?.missingTwitterCard ? "Card type missing." : "Card metadata detected."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Speed & measurement (lab)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-3 font-mono text-xs tabular-nums">
              <span>LCP {data.performance?.lcp ?? "—"}</span>
              <span>CLS {data.performance?.cls ?? "—"}</span>
              <span>INP {data.performance?.inp ?? "—"}</span>
              <span>TBT {data.performance?.tbt ?? "—"}</span>
            </div>
            <p className="text-muted-foreground">
              {typeof data.performance?.performanceScore === "number"
                ? `Mobile performance score ≈ ${data.performance.performanceScore}/100 (PageSpeed Insights when configured).`
                : "PageSpeed data unavailable—API key or quota may be missing."}
            </p>
            <p className="text-xs text-muted-foreground">{data.behaviour_tools?.recommendationMessage}</p>
          </CardContent>
        </Card>
      </div>

      {typeof leakBase === "number" ? (
        <Card className="border-amber-500/25 bg-amber-500/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Illustrative revenue at risk (scenario)</CardTitle>
            <p className="text-xs text-muted-foreground">{REVENUE_LEAK_DISCLAIMER}</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{fmtUsd(leakBase)}</p>
            <p className="text-muted-foreground">
              Base scenario annual gap using illustrative traffic ({data.quickScan.industry_guess}{" "}
              segment) and order value
              {data.quickScan.price_from_page ? " from your page" : " default"}—not your real
              analytics.
            </p>
            <ul className="list-inside list-disc text-xs text-muted-foreground">
              {data.revenueLeakEstimate.assumptions.slice(0, 3).map((a, idx) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <FreeReportProUpsell />
    </div>
  );
}
