"use client";

import { IconFrame } from "@/components/ui/icon-frame";
import { SCROLL_BULLET_ARROW } from "@/lib/scroll-effectiveness-from-audit";
import type { ScrollEvidenceZone } from "@/lib/scroll-effectiveness-from-audit";
import { Gem, Skull, TrendingDown } from "lucide-react";

export function ScrollIssueFixLine({ line }: { line: string }) {
  const arrow = SCROLL_BULLET_ARROW;
  const j = line.indexOf(arrow);
  const box =
    "min-w-0 overflow-visible rounded-md border border-border-muted bg-muted/25 px-3 py-2.5 text-sm leading-relaxed [overflow-wrap:anywhere] break-words";
  if (j === -1) {
    return <div className={`${box} text-foreground`}>{line}</div>;
  }
  return (
    <div className={box}>
      <p className="min-w-0">
        <span className="font-medium text-muted-foreground">Issue </span>
        <span className="text-foreground">{line.slice(0, j)}</span>
      </p>
      <p className="mt-2 min-w-0 border-t border-border-muted pt-2">
        <span className="font-medium text-muted-foreground">Fix </span>
        <span className="font-medium text-foreground">{line.slice(j + arrow.length)}</span>
      </p>
    </div>
  );
}

export const SCROLL_ZONE_META: {
  key: ScrollEvidenceZone;
  title: string;
  subtitle: string;
  icon: typeof Gem;
  iconClass: string;
  bandClass: string;
}[] = [
  {
    key: "top",
    title: "Above the fold",
    subtitle: "First-screen band (~money zone)",
    icon: Gem,
    iconClass: "text-chart-4",
    bandClass: "from-chart-4/20 via-chart-4/8 to-transparent",
  },
  {
    key: "mid",
    title: "Mid-scroll",
    subtitle: "Proof, sections, and pacing",
    icon: TrendingDown,
    iconClass: "text-chart-2",
    bandClass: "from-chart-2/18 via-chart-2/6 to-transparent",
  },
  {
    key: "deep",
    title: "Deep scroll",
    subtitle: "Lower page & late CTAs",
    icon: Skull,
    iconClass: "text-muted-foreground",
    bandClass: "from-muted/40 via-surface-2/40 to-transparent",
  },
];

export function scrollZoneHint(key: ScrollEvidenceZone, foldHeight: number): string {
  switch (key) {
    case "top":
      return `Roughly the first ${foldHeight}px of the capture—where attention and primary CTAs concentrate.`;
    case "mid":
      return "Where features and social proof live—visitors skim or drop if the story drags.";
    default:
      return "Everything past the first band—secondary offers and footer actions only help if scroll is earned.";
  }
}
