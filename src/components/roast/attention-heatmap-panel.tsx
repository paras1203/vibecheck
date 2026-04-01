"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { LayoutGrid } from "lucide-react";
import { heroScreenshotDataUrl } from "@/lib/hero-image";

type Props = {
  heroBase64?: string;
  siteLabel?: string;
};

/** Share of screenshot height used for “above the fold” heatmap (rest stays un-tinted). */
const TOP_SECTION_FRACTION = 0.4;

/**
 * Illustrative hotspots only (not eye-tracking): typical landing scan — nav strip,
 * F-pattern headline block, upper-right cluster (nav CTA / hero visual), CTA band.
 * All zones live in the top portion of the capture; lower page stays clear.
 */
function TopSectionHeatmapZones() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[1] overflow-hidden rounded-t-lg"
      style={{ height: `${TOP_SECTION_FRACTION * 100}%` }}
      aria-hidden
    >
      <div
        className="absolute inset-0 mix-blend-hard-light opacity-95"
        style={{
          background: `
            radial-gradient(ellipse 85% 70% at 22% 28%, rgba(255,0,60,0.5) 0%, rgba(255,140,0,0.32) 28%, rgba(255,230,80,0.18) 52%, transparent 72%),
            radial-gradient(ellipse 70% 55% at 58% 22%, rgba(0,180,255,0.2) 0%, rgba(0,90,255,0.1) 40%, transparent 65%)
          `,
        }}
      />
      <div
        className="absolute left-[3%] top-[8%] h-[38%] w-[46%] rounded-[100%] opacity-80"
        style={{
          boxShadow:
            "0 0 40px 18px rgba(255,60,0,0.38), inset 0 0 28px rgba(255,0,0,0.12)",
        }}
      />
      <div
        className="absolute inset-x-[8%] top-[52%] h-[42%] rounded-[999px] mix-blend-overlay blur-sm"
        style={{
          background:
            "linear-gradient(to top, rgba(255,80,0,0.35) 0%, rgba(255,200,0,0.15) 45%, transparent 70%)",
        }}
      />
    </div>
  );
}

function HeatmapLegend() {
  return (
    <ul className="mt-2 flex list-none flex-wrap gap-x-5 gap-y-1.5 border-t border-border-muted pt-2 text-[11px] text-muted-foreground">
      <li className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-[#ff003c] shadow-[0_0_0_1px_var(--border)]"
          aria-hidden
        />
        Hot
      </li>
      <li className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-[#ff8c00] shadow-[0_0_0_1px_var(--border)]"
          aria-hidden
        />
        Warm
      </li>
      <li className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-[#1e40af] shadow-[0_0_0_1px_var(--border)]"
          aria-hidden
        />
        Cool
      </li>
    </ul>
  );
}

export function AttentionHeatmapPanel({ heroBase64, siteLabel }: Props) {
  const dataUrl = heroScreenshotDataUrl(heroBase64);
  return (
    <Card className="overflow-hidden border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <IconFrame size="sm" className="bg-muted text-foreground">
            <LayoutGrid className="size-4 stroke-[1.5]" />
          </IconFrame>
          Attention heatmap
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Top-of-page viewport only — key scan zones highlighted (illustrative, not eye-tracking).
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="w-full">
          <div className="relative w-full overflow-hidden rounded-lg border border-border bg-surface-2">
            {dataUrl ? (
              <div className="relative w-full">
                <img
                  src={dataUrl}
                  alt=""
                  className="relative z-0 block h-auto max-h-[min(65vh,560px)] w-full object-contain object-top bg-[#0f172a]"
                  decoding="async"
                />
                <TopSectionHeatmapZones />
              </div>
            ) : (
              <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No screenshot stored for this report. Run a new roast to attach the first-viewport capture.
                </p>
                {siteLabel ? (
                  <p className="font-mono text-xs text-foreground/80">{siteLabel}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
        {dataUrl ? <HeatmapLegend /> : null}
        <p className="text-xs text-muted-foreground">
          Warmer zones follow common landing-page attention patterns; use as a layout cue only.
        </p>
      </CardContent>
    </Card>
  );
}
