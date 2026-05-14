"use client";

import { UrlInputForm } from "@/components/landing/shared/url-input-form";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export function HeroA1({ roastForm }: { roastForm: LandingRoastFormProps }) {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] w-full min-w-0 flex-col items-center justify-center gap-9 overflow-hidden px-4 py-16 md:min-h-[calc(100svh-5rem)] md:px-8 md:py-20">
      <div className="pointer-events-none absolute inset-0 lv-gradient-mesh-bg opacity-[0.35] dark:opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-background/85" />
      <div className="relative z-10 flex max-w-4xl min-w-0 flex-col items-center gap-[1.35rem] text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
          Your Landing Page is{" "}
          <span className="lv-text-gradient-bold">Leaking Money.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
          AI-powered audit. Fix your conversion rate in minutes.
        </p>
        <UrlInputForm {...roastForm} variant="a1" showSecondarySample={false} secondaryHref="#preview" />
      </div>
    </section>
  );
}
