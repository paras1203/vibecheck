"use client";

import { useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { LayoutGrid } from "lucide-react";
import { heroScreenshotDataUrl } from "@/lib/hero-image";

type Props = {
  heroBase64?: string;
  siteLabel?: string;
};

/** Many circular hotspots merge into irregular patches; SVG displacement warps edges away from smooth ovals. */
const GAZE_BLOBS = [
  "radial-gradient(circle 4.2% at 8% 5%, rgba(255,35,55,0.92) 0%, rgba(255,110,45,0.35) 52%, transparent 72%)",
  "radial-gradient(circle 3.1% at 16% 7%, rgba(255,50,48,0.85) 0%, transparent 68%)",
  "radial-gradient(circle 5% at 28% 5%, rgba(255,40,52,0.88) 0%, rgba(255,160,55,0.28) 48%, transparent 70%)",
  "radial-gradient(circle 3.8% at 41% 6%, rgba(255,55,50,0.82) 0%, transparent 66%)",
  "radial-gradient(circle 4.5% at 54% 5%, rgba(255,45,48,0.9) 0%, rgba(255,130,50,0.32) 50%, transparent 71%)",
  "radial-gradient(circle 3.4% at 67% 6%, rgba(255,48,52,0.84) 0%, transparent 67%)",
  "radial-gradient(circle 4% at 79% 5%, rgba(255,200,70,0.75) 0%, rgba(255,230,130,0.22) 55%, transparent 74%)",
  "radial-gradient(circle 3.2% at 91% 7%, rgba(255,210,80,0.65) 0%, transparent 70%)",
  "radial-gradient(circle 6% at 22% 18%, rgba(255,38,50,0.55) 0%, rgba(255,95,42,0.3) 45%, transparent 76%)",
  "radial-gradient(circle 5.2% at 38% 21%, rgba(255,42,48,0.5) 0%, rgba(255,180,70,0.15) 52%, transparent 78%)",
  "radial-gradient(circle 4.8% at 52% 19%, rgba(255,50,45,0.48) 0%, transparent 74%)",
  "radial-gradient(circle 5.5% at 18% 32%, rgba(255,32,48,0.72) 0%, rgba(255,100,38,0.38) 42%, transparent 75%)",
  "radial-gradient(circle 4.1% at 30% 35%, rgba(255,45,50,0.45) 0%, transparent 72%)",
  "radial-gradient(circle 6.2% at 26% 40%, rgba(255,28,45,0.68) 0%, rgba(255,115,40,0.36) 44%, transparent 77%)",
  "radial-gradient(circle 5% at 76% 30%, rgba(90,210,255,0.38) 0%, rgba(140,235,200,0.18) 50%, transparent 74%)",
  "radial-gradient(circle 4.4% at 84% 36%, rgba(70,195,255,0.32) 0%, transparent 70%)",
  "radial-gradient(circle 5.8% at 44% 46%, rgba(255,90,40,0.38) 0%, rgba(255,200,95,0.14) 48%, transparent 76%)",
  "radial-gradient(circle 3.9% at 58% 49%, rgba(255,120,50,0.28) 0%, transparent 72%)",
  "radial-gradient(circle 4.6% at 71% 51%, rgba(65,185,255,0.34) 0%, transparent 69%)",
  "radial-gradient(circle 5.1% at 48% 58%, rgba(255,85,45,0.32) 0%, transparent 73%)",
  "radial-gradient(circle 6.5% at 35% 66%, rgba(255,35,52,0.58) 0%, rgba(255,125,48,0.3) 46%, transparent 78%)",
  "radial-gradient(circle 4.3% at 50% 69%, rgba(255,45,48,0.42) 0%, transparent 74%)",
  "radial-gradient(circle 5.4% at 42% 78%, rgba(110,205,255,0.3) 0%, rgba(190,255,210,0.12) 55%, transparent 76%)",
  "radial-gradient(circle 7% at 58% 84%, rgba(95,200,250,0.26) 0%, transparent 72%)",
  "radial-gradient(circle 12% at 50% 52%, rgba(130,75,195,0.1) 0%, transparent 58%)",
].join(",\n    ");

function GazeHeatOverlay() {
  const filterId = `gaze-organic-${useId().replace(/:/g, "")}`;
  const f = `url(#${filterId})`;
  const layerStyle = (mixBlendMode: "screen" | "normal", opacity: number) =>
    ({
      mixBlendMode,
      opacity,
      backgroundImage: GAZE_BLOBS,
      filter: f,
    }) as const;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-lg"
      aria-hidden
    >
      <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden>
        <defs>
          <filter
            id={filterId}
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.0045 0.007"
              numOctaves="5"
              seed="31"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.8" result="smoothNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="smoothNoise"
              scale="42"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warped"
            />
            <feGaussianBlur in="warped" stdDeviation="1.2" />
          </filter>
        </defs>
      </svg>
      <div className="absolute inset-0" style={layerStyle("screen", 0.88)} />
      <div className="absolute inset-0" style={layerStyle("normal", 0.38)} />
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
          Illustrative gaze-style heatmap (red / warm / cool) over your full capture—typical scan patterns,
          not measured eye-tracking.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex w-full justify-center">
          <div className="relative w-full min-h-[12rem] max-w-full overflow-hidden rounded-lg border border-border bg-[#0f172a]">
            {dataUrl ? (
              <>
                <img
                  src={dataUrl}
                  alt=""
                  className="relative z-0 mx-auto block h-auto w-full max-h-[min(70vh,640px)] object-contain object-top"
                  decoding="async"
                />
                <GazeHeatOverlay />
              </>
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
          Warmer tones mark higher expected attention (nav, headline, primary CTA, proof blocks); cooler blobs
          are secondary scan targets. Use it as a layout sanity check, not analytics.
        </p>
      </CardContent>
    </Card>
  );
}
