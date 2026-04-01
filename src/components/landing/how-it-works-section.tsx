"use client";

import { ArrowDown } from "lucide-react";
import { SolutionsGrid } from "@/components/landing/solutions-grid";
import { scrollToSection } from "./landing-scroll";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative border-t border-border bg-surface-2 px-4 py-24 md:px-8"
    >
      <button
        type="button"
        className="absolute bottom-14 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground animate-bounce"
        onClick={() => scrollToSection("features")}
        aria-label="Scroll to features"
      >
        <ArrowDown className="size-5 stroke-[1.5]" />
      </button>
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Three pillars: diagnose UX, sharpen copy, harden the technical layer.
          </p>
        </div>
        <SolutionsGrid />
      </div>
    </section>
  );
}
