"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { cn } from "@/lib/utils";
import {
  SCROLL_ZONE_META,
  ScrollIssueFixLine,
  scrollZoneHint,
} from "@/components/roast/scroll-of-death-zones";
import { partitionScrollEvidenceByZone } from "@/lib/scroll-effectiveness-from-audit";
import { belowFoldPercentValueClass } from "@/lib/metric-thresholds";
import type { ScrollEffectiveness } from "@/types/roast-extras";
import { TrendingDown } from "lucide-react";

type ScrollHelp = { situation: string; action: string };

type Props = {
  belowFoldPercent: number;
  foldHeight: number;
  pageHeight: number;
  scrollHelp: ScrollHelp;
  scrollEffectiveness?: ScrollEffectiveness | null;
};

export function ScrollOfDeathCard({
  belowFoldPercent,
  foldHeight,
  pageHeight: _pageHeight,
  scrollHelp,
  scrollEffectiveness,
}: Props) {
  const situation = scrollEffectiveness?.situation ?? scrollHelp.situation;
  const action = scrollEffectiveness?.action ?? scrollHelp.action;
  const evidence = scrollEffectiveness?.evidenceBullets?.filter(Boolean) ?? [];
  const byZone = partitionScrollEvidenceByZone(evidence);

  const scoreMeaning =
    belowFoldPercent >= 55
      ? "A high share usually means key proof and secondary CTAs sit far below the first screen—visitors who never scroll may never see them."
      : "A lower share means more of the page fits the first-screen band, but you should still check that the main CTA and one proof line read clearly without scrolling.";

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
          One metric for how tall this capture is vs. the first screen, plus where scroll-related audit
          fixes fall along the page.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="rounded-xl border border-border bg-muted/15 p-4 md:p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            How to read this snapshot
          </p>
          <div className="mt-2.5 flex flex-col gap-3 border-b border-border-muted pb-3 sm:flex-row sm:items-start sm:gap-5">
            <div className="shrink-0">
              <p className="text-[11px] text-muted-foreground">Below first screen</p>
              <p
                className={cn(
                  "font-mono text-xl font-semibold tabular-nums sm:text-2xl",
                  belowFoldPercentValueClass(belowFoldPercent)
                )}
              >
                {belowFoldPercent.toFixed(0)}%
              </p>
            </div>
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">{scoreMeaning}</p>
          </div>
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p className="text-foreground/90">{situation}</p>
            <p>
              <span className="font-medium text-foreground">Next step: </span>
              {action}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Issues &amp; fixes by scroll zone
          </p>
          <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
            Grouped from audit wording (hero, nav, footer, etc.); use the percentage above for context.
          </p>
          <div className="flex flex-col overflow-x-auto overflow-y-visible rounded-xl border border-border shadow-surface-xs">
            {SCROLL_ZONE_META.map((z) => {
              const Icon = z.icon;
              const lines = byZone[z.key];
              return (
                <div
                  key={z.key}
                  className={`flex flex-none flex-col border-b border-border bg-gradient-to-b ${z.bandClass} px-3 py-3 last:border-b-0 sm:px-4 sm:py-3.5`}
                >
                  <div className="flex gap-2.5">
                    <IconFrame size="sm" className={`shrink-0 bg-background/80 ${z.iconClass}`}>
                      <Icon className="size-4 stroke-[1.75]" aria-hidden />
                    </IconFrame>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold leading-snug",
                          z.titleLineClass
                        )}
                      >
                        {z.title} — {z.subtitle}
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                        {scrollZoneHint(z.key, foldHeight)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 min-w-0 border-t border-border-muted pt-2.5">
                    {lines.length > 0 ? (
                      <ul className="min-w-0 space-y-3">
                        {lines.map((line, i) => (
                          <li key={`${z.key}-${i}`} className="min-w-0">
                            <ScrollIssueFixLine line={line} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs italic text-muted-foreground">
                        No audit lines tagged for this band—check the other zones or the rest of the
                        report.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
