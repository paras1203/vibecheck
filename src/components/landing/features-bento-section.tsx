"use client";

import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { TrendingUp, BarChart3, FileText, Zap, ArrowDown } from "lucide-react";
import { scrollToSection } from "./landing-scroll";

export function FeaturesBentoSection() {
  return (
    <section
      id="features"
      className="relative border-t border-border bg-background px-4 py-24 md:px-8"
    >
      <button
        type="button"
        className="absolute bottom-14 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground animate-bounce"
        onClick={() => scrollToSection("comparison")}
        aria-label="Scroll to comparison"
      >
        <ArrowDown className="size-5 stroke-[1.5]" />
      </button>
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Built for operators, not slide decks
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Signals from real audits — volume and outcomes teams care about.
          </p>
        </div>
        <BentoGrid className="mx-auto max-w-6xl">
          <BentoCard
            name="20M+ Elements Scanned"
            description="Our AI has analyzed millions of landing page elements to identify conversion killers"
            icon={<BarChart3 className="size-5 stroke-[1.5]" />}
            className="border-border bg-card hover:border-primary/25"
          />
          <BentoCard
            name="$650M+ Ad Spend Optimized"
            description="We've helped optimize campaigns worth over half a billion dollars"
            icon={<TrendingUp className="size-5 stroke-[1.5]" />}
            className="border-border bg-card hover:border-primary/25"
          />
          <BentoCard
            name="10k+ Audits Generated"
            description="Thousands of businesses have used our AI to identify and fix conversion issues"
            icon={<FileText className="size-5 stroke-[1.5]" />}
            className="border-border bg-card hover:border-primary/25"
          />
          <BentoCard
            name="Avg. Lift: 22% Conversion"
            description="On average, our recommendations lead to a 22% increase in conversion rates"
            icon={<Zap className="size-5 stroke-[1.5]" />}
            className="border-border bg-card hover:border-primary/25"
          />
        </BentoGrid>
      </div>
    </section>
  );
}
