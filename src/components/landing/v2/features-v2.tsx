"use client";

import { BarChart3, FileText, Zap, Users } from "lucide-react";
import { IconFrame } from "@/components/ui/icon-frame";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    name: "Scores six conversion pillars",
    description:
      "Every audit covers UX, trust, copy, conversion, visuals, and page speed — scored independently so you know exactly where to focus.",
    icon: BarChart3,
  },
  {
    name: "Scored report, radar, quick wins, and action plan",
    description:
      "You receive an overall site score, a radar breakdown by pillar, prioritised quick wins, and a step-by-step action plan.",
    icon: FileText,
  },
  {
    name: "Designed to brief founders, marketers, and dev teams",
    description:
      "The output is structured for fast handoff — whether you are fixing copy yourself or briefing a developer to update the page.",
    icon: Users,
  },
  {
    name: "From URL to first-pass audit in under 60 seconds",
    description:
      "Paste your URL. The audit runs immediately. No scheduling, no onboarding, no waiting for a human to become available.",
    icon: Zap,
  },
] as const;

export function FeaturesV2() {
  return (
    <section
      id="v2-features"
      className="border-t border-border bg-surface-2 px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-6xl min-w-0">
        <div className="mb-12 text-center">
          <p className="text-label text-primary">What you get</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            A practical audit, not a slide deck
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Everything below is produced by a single audit run on the URL you
            submit — no account setup, no integrations required.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => (
            <div
              key={c.name}
              className={cn(
                "group lv-hover-lift rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40",
              )}
            >
              <IconFrame
                size="lg"
                className="mb-4 border-border bg-primary/15 text-primary"
              >
                <c.icon className="size-5 stroke-[1.5]" />
              </IconFrame>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {c.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {c.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
