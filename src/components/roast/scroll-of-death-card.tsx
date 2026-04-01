"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Gem, Skull, TrendingDown } from "lucide-react";

type ScrollHelp = { situation: string; action: string };

type Props = {
  belowFoldPercent: number;
  foldHeight: number;
  pageHeight: number;
  scrollHelp: ScrollHelp;
};

export function ScrollOfDeathCard({
  belowFoldPercent,
  foldHeight,
  pageHeight,
  scrollHelp,
}: Props) {
  const foldPct = pageHeight > 0 ? ((foldHeight / pageHeight) * 100).toFixed(0) : "0";

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <TrendingDown className="size-4 stroke-[1.5]" aria-hidden />
          </IconFrame>
          The Scroll of Death
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Most visitors never see the bottom of the page. Below is how your layout splits attention from
          hero to footer—so you can place proof and CTAs where eyes actually go.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="flex flex-wrap items-end gap-4 border-b border-border-muted pb-4">
          <div>
            <p className="text-caption text-muted-foreground">Below first screen</p>
            <p className="font-mono text-2xl font-semibold tabular-nums text-primary md:text-3xl">
              {belowFoldPercent.toFixed(0)}%
            </p>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Of this page sits past the first viewport—secondary CTAs and proof blocks lower on the page
            compete with drop-off unless the story earns the scroll.
          </p>
        </div>

        <div>
          <p className="mb-3 text-caption font-medium uppercase tracking-wide text-muted-foreground">
            Visitor journey (schematic)
          </p>
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-surface-xs">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,hsl(var(--primary)/0.08),transparent)]" />
            <div className="relative grid min-h-[5.5rem] grid-cols-3 divide-x divide-border">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-help flex-col items-center justify-center gap-2 bg-gradient-to-b from-chart-4/25 via-chart-4/10 to-transparent px-3 py-4">
                      <Gem className="size-5 shrink-0 text-chart-4 stroke-[1.75]" aria-hidden />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-chart-4">Above the fold</p>
                        <p className="mt-1 text-xs text-muted-foreground">Money zone</p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px] text-xs">
                    Hero and primary CTA (~first {foldHeight}px, {foldPct}% of scroll height). This is where
                    first impressions and conversions concentrate.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-help flex-col items-center justify-center gap-2 bg-gradient-to-b from-chart-2/22 via-chart-2/8 to-transparent px-3 py-4">
                      <TrendingDown className="size-5 shrink-0 text-chart-2 stroke-[1.75]" aria-hidden />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-chart-2">Mid-scroll</p>
                        <p className="mt-1 text-xs text-muted-foreground">Attention dip</p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px] text-xs">
                    Proof, features, and repeats—if pacing drags, visitors skim or bounce before your best
                    arguments land.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-help flex-col items-center justify-center gap-2 bg-gradient-to-b from-muted/35 via-surface-2/50 to-transparent px-3 py-4">
                      <Skull className="size-5 shrink-0 text-muted-foreground stroke-[1.75]" aria-hidden />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-foreground">Deep scroll</p>
                        <p className="mt-1 text-xs text-muted-foreground">Graveyard risk</p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px] text-xs">
                    {belowFoldPercent.toFixed(0)}% of pixels sit below the first screen—footer CTAs and late
                    offers only work if you re-earn intent on the way down.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border-muted pt-4 sm:grid-cols-3 sm:gap-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Top — </span>
            Hero, headline, and primary CTA: where revenue is usually won or lost in seconds.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground sm:border-x sm:border-border-muted sm:px-6">
            <span className="font-medium text-foreground">Middle — </span>
            Social proof and features; attention is fragile here if the narrative feels long or generic.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Bottom — </span>
            Footer, legal, and weak closes—intent often fades unless you recap value and repeat the CTA.
          </p>
        </div>

        <div className="rounded-lg border border-border-muted bg-surface-2/30 p-4">
          <p className="text-sm text-muted-foreground">{scrollHelp.situation}</p>
          <p className="mt-2 text-sm font-medium text-foreground">{scrollHelp.action}</p>
        </div>
      </CardContent>
    </Card>
  );
}
