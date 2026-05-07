"use client";

import Link from "next/link";
import { UrlInputForm } from "@/components/landing/shared/url-input-form";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export function HeroA2({ roastForm }: { roastForm: LandingRoastFormProps }) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-28 md:px-8">
      <div className="max-w-3xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/55">
          CRO AUDIT TOOL
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-[1.05]">
          Your Landing Page is Leaking Money.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/65 md:text-xl">
          AI-powered audit. Fix your conversion rate in minutes.
        </p>
      </div>
      <UrlInputForm {...roastForm} variant="a2" secondaryHref="#preview" />
      <p className="text-xs text-white/40">
        <Link href="/" className="underline-offset-4 hover:underline">
          Default landing
        </Link>
      </p>
    </section>
  );
}
