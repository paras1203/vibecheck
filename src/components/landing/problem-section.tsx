"use client";

import { ArrowDown, Gem, TrendingDown, Skull } from "lucide-react";
import { scrollToSection } from "./landing-scroll";

export function ProblemSection() {
  return (
    <section
      id="problem"
      className="relative border-t border-border bg-surface-2 px-4 py-24 md:px-8"
    >
      <button
        type="button"
        className="absolute bottom-14 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground animate-bounce"
        onClick={() => scrollToSection("preview")}
        aria-label="Scroll to preview"
      >
        <ArrowDown className="size-5 stroke-[1.5]" />
      </button>
      <div className="container mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              The Scroll of Death
            </h2>
            <p className="text-lg text-muted-foreground">
              60% of your visitors never see your CTA. We show you exactly where you lose them.
            </p>
          </div>
          <div className="relative h-80 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-card via-surface-1 to-card shadow-surface-sm md:h-[22rem]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.22),transparent)]" />
            <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
              <div className="relative rounded-xl border border-chart-4/40 bg-gradient-to-br from-chart-4/25 via-chart-4/10 to-transparent p-4 shadow-inner backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-chart-4">
                  <Gem className="size-4 shrink-0 stroke-[1.75]" aria-hidden />
                  Top — Money zone
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Hero, headline, primary CTA — where revenue is won or lost first.
                </p>
                <div className="mt-3 h-px rounded-full bg-gradient-to-r from-chart-4/50 via-chart-4/20 to-transparent" />
              </div>
              <div className="relative rounded-xl border border-chart-2/35 bg-gradient-to-br from-chart-2/20 via-chart-2/8 to-transparent p-4 text-center shadow-inner backdrop-blur-sm">
                <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-chart-2">
                  <TrendingDown className="size-4 shrink-0 stroke-[1.75]" aria-hidden />
                  Middle — engagement drop
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Proof, features, fatigue — attention bleeds here if the story drags.
                </p>
                <div className="mt-3 h-px rounded-full bg-gradient-to-r from-transparent via-chart-2/30 to-transparent" />
              </div>
              <div className="relative rounded-xl border border-muted-foreground/25 bg-gradient-to-br from-muted/30 via-surface-2/80 to-transparent p-4 shadow-inner backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Skull className="size-4 shrink-0 stroke-[1.75]" aria-hidden />
                  Bottom — graveyard
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Footer clutter and weak closes — where intent goes to die.
                </p>
                <div className="mt-3 h-px rounded-full bg-gradient-to-r from-muted-foreground/30 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
