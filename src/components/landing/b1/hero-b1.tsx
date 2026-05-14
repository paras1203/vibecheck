"use client";

import { UrlInputForm } from "@/components/landing/shared/url-input-form";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export function HeroB1({ roastForm }: { roastForm: LandingRoastFormProps }) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-10 bg-[var(--lv-minimal-bg)] px-4 py-28 md:px-8">
      <div className="max-w-3xl space-y-8 text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.02em] text-[var(--lv-minimal-text)] md:text-6xl md:leading-[1.08]">
          Your Landing Page is{" "}
          <span className="lv-text-gradient-bold">Leaking Money.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-normal text-muted-foreground md:text-xl">
          AI-powered audit. Fix your conversion rate in minutes.
        </p>
        <UrlInputForm {...roastForm} variant="b1" secondaryHref="#preview" />
      </div>
    </section>
  );
}
