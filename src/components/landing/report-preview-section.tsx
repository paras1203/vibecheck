"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown } from "lucide-react";
import { RoastRadar } from "@/components/roast-radar";
import { getIndustryInsiderPoints } from "@/lib/industry-insider-copy";
import { scrollToSection } from "./landing-scroll";
import { RADAR_AXIS_EXPLANATIONS, type RadarAxisLabel } from "@/lib/radar-axis-scores";

const RADAR_SAMPLE = [
  { label: "UX", score: 68 },
  { label: "Trust", score: 74 },
  { label: "Copy", score: 61 },
  { label: "Conversion", score: 55 },
  { label: "Visuals", score: 71 },
  { label: "Speed", score: 63 },
] as const;

const RADAR_SAMPLE_METRICS = Object.fromEntries(
  RADAR_SAMPLE.map(({ label, score }) => [label, score])
);

export function ReportPreviewSection() {
  const previewInsider = getIndustryInsiderPoints("SaaS");
  return (
    <section
      id="preview"
      className="relative border-t border-border bg-background px-4 py-24 md:px-8"
    >
      <button
        type="button"
        className="absolute bottom-14 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground animate-bounce"
        onClick={() => scrollToSection("how-it-works")}
        aria-label="Scroll to how it works"
      >
        <ArrowDown className="size-5 stroke-[1.5]" />
      </button>
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-label text-primary">Product output</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            What your audit looks like
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Static preview — run a roast to see your real scores, radar, and quick wins.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface-1 shadow-surface-xs">
          <div className="flex items-center gap-2 border-b border-border-muted bg-surface-2/80 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-destructive/80" />
            <span className="size-2.5 rounded-full bg-warning/80" />
            <span className="size-2.5 rounded-full bg-success/80" />
            <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
              siteroast_mar26
            </span>
          </div>
          <div className="p-5 md:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-foreground">Sample report</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Preview</Badge>
                <Badge variant="outline">Not your site</Badge>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border-muted bg-surface-2/40 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Executive pulse</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  Right now, visitors are guessing what you sell and why it matters to them—while you pay for
                  every click. Most teams leak 15–40% of pipeline here before a form is ever touched. The full
                  roast shows exactly where attention drops and what to change first so the next visitor is one
                  step closer to buying—not one tab closer to leaving.
                </CardContent>
              </Card>
              <Card className="border-border-muted bg-surface-2/40">
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
                  <p className="mt-2 text-center text-xs text-muted-foreground">Illustrative only</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4 border-border-muted bg-surface-2/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cost of inaction</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-mono text-lg font-semibold tabular-nums text-primary">
                  ~$184,000/yr left on the table
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Illustrative annual opportunity cost from friction and unclear conversion path.
                </p>
              </CardContent>
            </Card>

            <div className="mt-4 rounded-lg border border-border-muted bg-surface-2/25 px-4 py-3">
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
                {RADAR_SAMPLE.map(({ label, score }) => (
                  <div
                    key={label}
                    className="flex min-h-[6.75rem] flex-col justify-center rounded-lg border border-border-muted bg-surface-2/30 px-3 py-4 text-center sm:min-h-[7.25rem]"
                  >
                    <div className="text-xs font-medium text-muted-foreground">{label}</div>
                    <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                      {score}
                    </div>
                    <p className="mt-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                      {RADAR_AXIS_EXPLANATIONS[label as RadarAxisLabel]}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 w-full min-w-0">
                <RoastRadar radarMetrics={RADAR_SAMPLE_METRICS} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
