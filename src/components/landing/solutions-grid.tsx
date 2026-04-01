"use client";

import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { MousePointerClick, MessageSquareWarning, Code2 } from "lucide-react";

export function SolutionsGrid() {
  return (
    <BentoGrid className="max-w-6xl mx-auto md:grid-cols-3">
      <BentoCard
        name="UX Analysis"
        description="We detect confusing navigation, hidden CTAs, and friction points that kill conversions."
        icon={<MousePointerClick className="size-5 stroke-[1.5]" />}
        className="border-border bg-card transition-colors hover:border-primary/25"
      />
      <BentoCard
        name="Copy Roast"
        description="We rewrite your boring headlines and jargon into punchy, benefit-driven sales copy."
        icon={<MessageSquareWarning className="size-5 stroke-[1.5]" />}
        className="border-border bg-card transition-colors hover:border-primary/25"
      />
      <BentoCard
        name="Tech Audit"
        description="We check SEO tags, mobile responsiveness, and load speed bottlenecks."
        icon={<Code2 className="size-5 stroke-[1.5]" />}
        className="border-border bg-card transition-colors hover:border-primary/25"
      />
    </BentoGrid>
  );
}
