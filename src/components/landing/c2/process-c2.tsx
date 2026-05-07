"use client";

import { MousePointerClick, MessageSquareWarning, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "UX analysis",
    description:
      "Surface navigation friction, weak hierarchy, and CTAs that visitors never reach.",
    icon: MousePointerClick,
  },
  {
    title: "Copy roast",
    description: "Tighten headlines and proof so the page earns attention—not polish that hides gaps.",
    icon: MessageSquareWarning,
  },
  {
    title: "Technical pass",
    description: "Catch SEO, mobile, and speed issues that quietly cap your conversion ceiling.",
    icon: Code2,
  },
] as const;

export function ProcessC2() {
  return (
    <section
      id="features"
      className="border-t border-[var(--lv-c2-border)] bg-[var(--lv-c2-bg)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--lv-c2-text)] md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            One pipeline: diagnose experience, sharpen messaging, stress-test the stack.
          </p>
        </div>
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <div
            className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-[var(--lv-c2-border)] md:block"
            aria-hidden
          />
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative flex flex-col items-center text-center">
              <div
                className={cn(
                  "relative z-10 mb-6 flex size-16 items-center justify-center rounded-full border border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)] shadow-[0_8px_24px_rgba(28,25,23,0.08)] transition-transform hover:scale-[1.02]",
                )}
              >
                <span className="absolute -top-2 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--lv-c2-accent)] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <s.icon className="size-6 stroke-[1.5] text-[var(--lv-c2-accent)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--lv-c2-text)]">{s.title}</h3>
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
