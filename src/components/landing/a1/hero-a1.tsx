"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UrlInputForm } from "@/components/landing/shared/url-input-form";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";
import { Activity } from "lucide-react";

export function HeroA1({ roastForm }: { roastForm: LandingRoastFormProps }) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center gap-10 overflow-hidden px-4 pb-24 pt-28 md:px-8">
      <div className="pointer-events-none absolute inset-0 lv-gradient-mesh-bg opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[var(--lv-bold-bg)]/80" />
      <div className="relative z-10 flex max-w-4xl flex-col items-center gap-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lv-bold-border)] bg-[var(--lv-bold-surface-1)] px-4 py-1.5 text-xs font-medium text-white/80">
          <Activity className="size-3.5 stroke-[1.5] text-[var(--lv-bold-accent)]" />
          <span className="font-mono tabular-nums">12,847 sites roasted</span>
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
          Your Landing Page is{" "}
                    <span className="lv-text-gradient-bold">Leaking Money.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-white/70 md:text-xl">
          AI-powered audit. Fix your conversion rate in minutes.
        </p>
        <UrlInputForm {...roastForm} variant="a1" secondaryHref="#preview" />
        <p className="text-xs text-white/45">
          <Link href="/" className="underline-offset-4 hover:underline">
            Default landing
          </Link>
        </p>
      </div>
    </section>
  );
}
