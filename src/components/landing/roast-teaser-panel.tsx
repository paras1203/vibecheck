"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoastRadar } from "@/components/roast-radar";
import { FULL_REPORT_SUBLINE } from "@/lib/report-copy";
import type { RoastTeaserContent } from "@/lib/roast-teaser";

type RoastTeaserPanelProps = {
  teaser: RoastTeaserContent;
  accountCreditsLine?: string | null;
  onContinue: () => void;
};

export function RoastTeaserPanel({ teaser, accountCreditsLine, onContinue }: RoastTeaserPanelProps) {
  const radarEntries = Object.entries(teaser.radarMetrics);
  const leakFormatted = teaser.annualLeakUsd.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

  return (
    <div className="flex w-full min-w-0 max-w-3xl flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-border bg-surface-1 shadow-surface-xs">
        <div className="flex items-center gap-2 border-b border-border-muted bg-surface-2/80 px-3 py-2 sm:px-4">
          <span className="size-2.5 rounded-full bg-destructive/80" />
          <span className="size-2.5 rounded-full bg-warning/80" />
          <span className="size-2.5 rounded-full bg-success/80" />
          <span className="ml-2 truncate font-mono text-[10px] text-muted-foreground sm:text-xs">
            {teaser.reportStub}
          </span>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-foreground sm:text-lg">Your audit preview</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Preview</Badge>
              <Badge variant="outline">Free summary</Badge>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-border-muted bg-surface-2/40 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Executive pulse</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {teaser.executivePulse}
              </CardContent>
            </Card>
            <Card className="border-border-muted bg-surface-2/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-center text-sm">Overall score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-0">
                <div
                  className="relative flex size-24 items-center justify-center rounded-full border-4 border-primary/25 sm:size-28"
                  aria-hidden
                >
                  <span className="font-mono text-2xl font-semibold tabular-nums text-primary sm:text-3xl">
                    {teaser.score}
                  </span>
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">Your page</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-3 border-border-muted bg-surface-2/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cost of inaction</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="font-mono text-base font-semibold tabular-nums text-primary sm:text-lg">
                ~${leakFormatted}/yr left on the table
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                Illustrative annual opportunity cost from friction and a weak conversion path—full report shows
                scenarios and fixes.
              </p>
            </CardContent>
          </Card>

          <div className="mt-3 rounded-lg border border-border-muted bg-surface-2/25 px-3 py-3 sm:px-4">
            <p className="text-label mb-2 text-muted-foreground">Top leak we spotted</p>
            <p className="text-sm font-medium leading-relaxed text-foreground">{teaser.criticalIssue}</p>
            <p className="mt-3 text-label text-muted-foreground">Assessment</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{teaser.surprisingInsight}</p>
          </div>

          <div className="mt-3 rounded-lg border border-border-muted bg-surface-2/25 px-3 py-3 sm:px-4">
            <p className="text-label mb-2 text-muted-foreground">AI Insights</p>
            <ul className="space-y-2 text-sm text-foreground">
              {teaser.insiderLines.map((line, i) => (
                <li key={`teaser-insider-${i}`} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3">
            <p className="text-label mb-2 text-muted-foreground">Site Score</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {radarEntries.map(([label, score]) => (
                <div
                  key={label}
                  className="rounded-lg border border-border-muted bg-surface-2/30 px-2 py-2 text-center sm:px-3"
                >
                  <div className="text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</div>
                  <div className="font-mono text-sm font-semibold tabular-nums text-foreground">{score}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 w-full min-w-0">
              <RoastRadar radarMetrics={teaser.radarMetrics} />
            </div>
          </div>
        </div>
          </div>

          {accountCreditsLine ? (
            <p className="text-center text-xs font-medium text-foreground/90">{accountCreditsLine}</p>
          ) : null}

          <p className="text-center text-xs text-muted-foreground">{FULL_REPORT_SUBLINE}</p>
      <Button type="button" size="lg" className="h-12 w-full font-semibold sm:h-14" onClick={onContinue}>
        Continue to full report
      </Button>
    </div>
  );
}
