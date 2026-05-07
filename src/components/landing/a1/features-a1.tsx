"use client";

import { TrendingUp, BarChart3, FileText, Zap } from "lucide-react";
import { IconFrame } from "@/components/ui/icon-frame";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    name: "20M+ Elements Scanned",
    description:
      "Our AI has analyzed millions of landing page elements to identify conversion killers",
    icon: BarChart3,
  },
  {
    name: "$650M+ Ad Spend Optimized",
    description:
      "We've helped optimize campaigns worth over half a billion dollars",
    icon: TrendingUp,
  },
  {
    name: "10k+ Audits Generated",
    description:
      "Thousands of businesses have used our AI to identify and fix conversion issues",
    icon: FileText,
  },
  {
    name: "Avg. Lift: 22% Conversion",
    description:
      "On average, our recommendations lead to a 22% increase in conversion rates",
    icon: Zap,
  },
] as const;

export function FeaturesA1() {
  return (
    <section id="features" className="border-t border-[var(--lv-bold-border)] bg-[var(--lv-bold-surface-2)] px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Built for operators, not slide decks
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/65">
            Signals from real audits — volume and outcomes teams care about.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => (
            <div
              key={c.name}
              className={cn(
                "group lv-hover-lift rounded-2xl border border-[var(--lv-bold-border)] bg-[var(--lv-bold-surface-1)] p-6 transition-colors hover:border-[var(--lv-bold-primary)]/50",
              )}
            >
              <IconFrame
                size="lg"
                className="mb-4 border-[var(--lv-bold-border)] bg-[var(--lv-bold-primary)]/15 text-[var(--lv-bold-primary)]"
              >
                <c.icon className="size-5 stroke-[1.5]" />
              </IconFrame>
              <h3 className="text-lg font-semibold tracking-tight text-white">{c.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
