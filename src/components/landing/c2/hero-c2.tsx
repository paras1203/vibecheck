"use client";

import Link from "next/link";
import { UrlInputForm } from "@/components/landing/shared/url-input-form";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export function HeroC2({ roastForm }: { roastForm: LandingRoastFormProps }) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--lv-c2-bg)] px-4 py-28 md:px-8">
      <div className="pointer-events-none absolute inset-0 lv-hero-dot-mesh-c2 opacity-70" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-[var(--lv-c2-surface-2)]/40 to-transparent"
        aria-hidden
      />
      <div className="relative z-[1] max-w-3xl space-y-8 text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.02em] text-[var(--lv-c2-text)] md:text-6xl md:leading-[1.08]">
          Know exactly what your landing is costing you.
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-normal text-muted-foreground md:text-xl">
          Paste a URL—get a conversion-minded audit: clarity, trust, CTA flow, and fixes you can ship
          today.
        </p>
        <UrlInputForm {...roastForm} variant="c2" secondaryHref="#preview" />
        <p className="text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:text-[var(--lv-c2-text)] hover:underline">
            Default landing
          </Link>
        </p>
      </div>
    </section>
  );
}
