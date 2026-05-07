"use client";

import Link from "next/link";
import { UrlInputForm } from "@/components/landing/shared/url-input-form";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export function HeroB2({ roastForm }: { roastForm: LandingRoastFormProps }) {
  return (
    <section className="relative overflow-hidden bg-[var(--lv-minimal-surface-1)] px-4 py-24 md:px-8 md:py-32">
      <div className="pointer-events-none absolute inset-0 lv-grid-faint opacity-70" />
      <div className="pointer-events-none absolute -right-20 top-20 size-64 rounded-full bg-[var(--lv-minimal-accent)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-16 size-48 rounded-full bg-[var(--lv-minimal-accent)]/8 blur-3xl" />
      <div className="container relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center md:mx-0 md:text-left">
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-[var(--lv-minimal-text)] md:text-5xl lg:text-6xl">
            Your Landing Page is Leaking Money.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            AI-powered audit. Fix your conversion rate in minutes.
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-4 md:max-w-xl">
            <UrlInputForm {...roastForm} variant="b2" secondaryHref="#preview" />
          </div>
          <p className="mt-6 text-xs text-muted-foreground md:text-left">
            <Link href="/" className="underline-offset-4 hover:underline">
              Default landing
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
