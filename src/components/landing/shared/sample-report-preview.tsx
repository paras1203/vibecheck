"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoastRadar } from "@/components/roast-radar";
import { getIndustryInsiderPoints } from "@/lib/industry-insider-copy";
import { costOfInactionHeadlineClass } from "@/lib/revenue-scenario-accents";
import {
  RADAR_AXIS_EXPLANATIONS,
  radarScoreValueClass,
  type RadarAxisLabel,
} from "@/lib/radar-axis-scores";
import { cn } from "@/lib/utils";

export const SAMPLE_RADAR_PAIRS = [
  { label: "UX", score: 68 },
  { label: "Trust", score: 74 },
  { label: "Copy", score: 61 },
  { label: "Conversion", score: 55 },
  { label: "Visuals", score: 71 },
  { label: "Speed", score: 63 },
] as const;

export const SAMPLE_RADAR_METRICS = Object.fromEntries(
  SAMPLE_RADAR_PAIRS.map(({ label, score }) => [label, score]),
);

type SampleReportPreviewProps = {
  shellClassName?: string;
  chromeClassName?: string;
  bodyClassName?: string;
  cardClassName?: string;
  radarClassName?: string;
  scoreTileClassName?: string;
  industryKey?: string;
  caption?: string;
  browserTitle?: string;
  showBadges?: boolean;
  scoreTitles?: boolean;
};

export function SampleReportPreview({
  shellClassName,
  chromeClassName,
  bodyClassName,
  cardClassName,
  radarClassName,
  scoreTileClassName,
  industryKey = "SaaS",
  caption,
  browserTitle = "siteroast_mar26",
  showBadges = true,
  scoreTitles = true,
}: SampleReportPreviewProps) {
  const previewInsider = getIndustryInsiderPoints(industryKey);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface-1 shadow-surface-xs",
        shellClassName,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border-muted bg-surface-2/80 px-4 py-2.5",
          chromeClassName,
        )}
      >
        <span className="size-2.5 rounded-full bg-destructive/80" />
        <span className="size-2.5 rounded-full bg-warning/80" />
        <span className="size-2.5 rounded-full bg-success/80" />
        <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
          {browserTitle}
        </span>
      </div>
      <div className={cn("p-5 md:p-8", bodyClassName)}>
        {caption ? (
          <p className="text-label mb-4 text-muted-foreground">{caption}</p>
        ) : null}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground">Sample report</h3>
          {showBadges ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Preview</Badge>
              <Badge variant="outline">Not your site</Badge>
            </div>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={cn("border-border-muted bg-surface-2/40 md:col-span-2", cardClassName)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Executive pulse</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              Right now, visitors are guessing what you sell and why it matters to
              them—while you pay for every click. Most teams leak 15–40% of pipeline
              here before a form is ever touched. The full roast shows exactly where
              attention drops and what to change first so the next visitor is one step
              closer to buying—not one tab closer to leaving.
            </CardContent>
          </Card>
          <Card className={cn("border-border-muted bg-surface-2/40", cardClassName)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-sm">Overall score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-0">
              <div
                className="relative flex size-28 items-center justify-center rounded-full border-4 border-primary/25"
                aria-hidden
              >
                <span className="font-mono text-3xl font-semibold tabular-nums text-primary">
                  72
                </span>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Illustrative only
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className={cn("mt-4 border-border-muted bg-surface-2/30", cardClassName)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cost of inaction</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={cn(costOfInactionHeadlineClass(), "text-lg")}>
              ~$184,000/yr left on the table
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Illustrative annual opportunity cost from friction and unclear conversion
              path.
            </p>
          </CardContent>
        </Card>

        <div className={cn("mt-4 rounded-lg border border-border-muted bg-surface-2/25 px-4 py-3", cardClassName)}>
          <p className="text-label mb-2 text-muted-foreground">AI Insights</p>
          <ul className="space-y-2 text-sm text-foreground">
            {previewInsider.map((line, i) => (
              <li key={`preview-insider-${i}`} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          <p className="text-label mb-2 text-muted-foreground">Site Score</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {SAMPLE_RADAR_PAIRS.map(({ label, score }) => (
              <div
                key={label}
                title={scoreTitles ? RADAR_AXIS_EXPLANATIONS[label as RadarAxisLabel] : undefined}
                className={cn(
                  "flex min-h-[6.75rem] flex-col justify-center rounded-lg border border-border-muted bg-surface-2/30 px-3 py-4 text-center sm:min-h-[7.25rem]",
                  scoreTileClassName,
                )}
              >
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
                <div
                  className={cn(
                    "mt-1 font-mono text-sm font-semibold tabular-nums",
                    radarScoreValueClass(score),
                  )}
                >
                  {score}
                </div>
                <p className="mt-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                  {RADAR_AXIS_EXPLANATIONS[label as RadarAxisLabel]}
                </p>
              </div>
            ))}
          </div>
          <div className={cn("mt-3 w-full min-w-0", radarClassName)}>
            <RoastRadar radarMetrics={SAMPLE_RADAR_METRICS} />
          </div>
        </div>
      </div>
    </div>
  );
}
