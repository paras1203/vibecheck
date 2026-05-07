"use client";

import { IconFrame } from "@/components/ui/icon-frame";
import { SCROLL_BULLET_ARROW } from "@/lib/scroll-effectiveness-from-audit";
import type { ScrollEvidenceZone } from "@/lib/scroll-effectiveness-from-audit";
import { Gem, Skull, TrendingDown } from "lucide-react";

export function ScrollIssueFixLine({ line }: { line: string }) {
  const arrow = SCROLL_BULLET_ARROW;
  const j = line.indexOf(arrow);
  const box =
    "min-w-0 overflow-visible rounded-md border border-border-muted bg-muted/20 px-2.5 py-2 text-xs leading-snug [overflow-wrap:anywhere] break-words text-foreground";
  if (j === -1) {
    return <div className={box}>{line}</div>;
  }
  return (
    <div className={box}>
      <p className="min-w-0">
        <span className="text-muted-foreground">Issue </span>
        <span>{line.slice(0, j)}</span>
      </p>
      <p className="mt-1.5 min-w-0 border-t border-border-muted/80 pt-1.5">
        <span className="text-muted-foreground">Fix </span>
        <span>{line.slice(j + arrow.length)}</span>
      </p>
    </div>
  );
}

export const SCROLL_ZONE_META: {
  key: ScrollEvidenceZone;
  title: string;
  subtitle: string;
  titleLineClass: string;
  icon: typeof Gem;
  iconClass: string;
  bandClass: string;
}[] = [
  {
    key: "top",
    title: "Top",
    subtitle: "Money zone",
    titleLineClass: "text-chart-4",
    icon: Gem,
    iconClass: "text-chart-4",
    bandClass: "from-chart-4/20 via-chart-4/8 to-transparent",
  },
  {
    key: "mid",
    title: "Middle",
    subtitle: "Engagement drop",
    titleLineClass: "text-chart-2",
    icon: TrendingDown,
    iconClass: "text-chart-2",
    bandClass: "from-chart-2/18 via-chart-2/6 to-transparent",
  },
  {
    key: "deep",
    title: "Bottom",
    subtitle: "Graveyard",
    titleLineClass: "text-muted-foreground",
    icon: Skull,
    iconClass: "text-muted-foreground",
    bandClass: "from-muted/40 via-surface-2/40 to-transparent",
  },
];

export function scrollZoneHint(key: ScrollEvidenceZone, foldHeight: number): string {
  switch (key) {
    case "top":
      return `Roughly the first ${foldHeight}px of the capture—hero, headline, primary CTA; where revenue is won or lost first.`;
    case "mid":
      return "Proof, features, fatigue—attention bleeds here if the story drags.";
    default:
      return "Footer clutter and weak closes—secondary CTAs only help if scroll is earned.";
  }
}
