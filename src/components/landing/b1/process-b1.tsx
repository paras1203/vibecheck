"use client";

import { MousePointerClick, MessageSquareWarning, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "UX Analysis",
    description:
      "We detect confusing navigation, hidden CTAs, and friction points that kill conversions.",
    icon: MousePointerClick,
  },
  {
    title: "Copy Roast",
    description:
      "We rewrite your boring headlines and jargon into punchy, benefit-driven sales copy.",
    icon: MessageSquareWarning,
  },
  {
    title: "Tech Audit",
    description: "We check SEO tags, mobile responsiveness, and load speed bottlenecks.",
    icon: Code2,
  },
] as const;

export function ProcessB1() {
  return (
    <section
      id="features"
      className="border-t border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--lv-minimal-text)] md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Three pillars: diagnose UX, sharpen copy, harden the technical layer.
          </p>
        </div>
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <div
            className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-[var(--lv-minimal-border)] md:block"
            aria-hidden
          />
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative flex flex-col items-center text-center">
              <div
                className={cn(
                  "relative z-10 mb-6 flex size-16 items-center justify-center rounded-full border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)] shadow-surface-xs transition-transform hover:scale-105",
                )}
              >
                <span className="absolute -top-2 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--lv-minimal-accent)] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <s.icon className="size-6 stroke-[1.5] text-[var(--lv-minimal-accent)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--lv-minimal-text)]">{s.title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
