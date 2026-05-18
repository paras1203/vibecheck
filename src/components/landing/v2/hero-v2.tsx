"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";
import { trackEvent } from "@/lib/analytics-events";

type HeroV2Props = {
  roastForm: LandingRoastFormProps;
};

const TRUST_ITEMS = [
  "Built for SaaS founders, marketers, and growth teams",
  "Scores UX, trust, copy, conversion, visuals, and speed",
  "PDF export and action plan included on paid audits",
  "We only analyse the page you submit",
] as const;

export function HeroV2({ roastForm }: HeroV2Props) {
  const { url, setUrl, loading, error, onRoast } = roastForm;

  const handleCta = () => {
    trackEvent("hero_cta_click");
    onRoast();
  };

  return (
    <section
      className="relative flex min-h-[calc(100svh-4rem)] w-full min-w-0 flex-col items-center justify-center gap-8 overflow-hidden px-4 py-16 md:min-h-[calc(100svh-5rem)] md:px-8 md:py-20"
      aria-label="Hero"
    >
      {/* Subtle mesh background */}
      <div className="pointer-events-none absolute inset-0 lv-gradient-mesh-bg opacity-[0.35] dark:opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-background/85" />

      <div className="relative z-10 flex max-w-3xl min-w-0 flex-col items-center gap-5 text-center">
        {/* Eyebrow */}
        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          AI conversion audit for SaaS landing pages
        </span>

        {/* H1 */}
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Find the conversion leaks on your landing page{" "}
          <span className="lv-text-gradient-bold">in under a minute</span>
        </h1>

        {/* Supporting copy */}
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
          Paste your URL to get a scored audit with quick wins, trust gaps, copy
          issues, UX friction, and a step-by-step action plan.
        </p>

        {/* Reassurance */}
        <p className="text-sm font-medium text-muted-foreground">
          No setup.{" "}
          <span className="text-foreground">First pass in under 60 seconds.</span>
        </p>

        {/* Input + CTA */}
        <div className="flex w-full max-w-2xl flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <Input
              id="hero-url-input-v2"
              type="text"
              placeholder="Paste your landing page URL…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleCta();
              }}
              disabled={loading}
              aria-label="Landing page URL"
              className="h-12 min-w-0 flex-1 rounded-2xl border-border bg-background text-center text-sm text-foreground shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_30%,transparent)] ring-2 ring-primary/25 ring-offset-2 ring-offset-background placeholder:text-muted-foreground focus-visible:ring-primary/45 sm:h-14"
            />
            <Button
              id="hero-run-audit-btn-v2"
              onClick={handleCta}
              disabled={loading}
              size="lg"
              className="h-12 shrink-0 rounded-2xl bg-primary px-8 font-semibold text-primary-foreground hover:opacity-90 sm:h-14"
            >
              {loading ? "Analysing…" : "Run my audit"}
            </Button>
          </div>

          {/* Microcopy */}
          <p className="text-center text-xs text-muted-foreground">
            We analyse one live URL and generate a practical audit report. No
            traffic access required.
          </p>

          {/* Secondary CTA */}
          <div className="flex justify-center">
            <Button
              id="hero-sample-report-btn-v2"
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              asChild
              onClick={() => trackEvent("sample_preview_cta_click")}
            >
              <Link href="#v2-preview">See sample report</Link>
            </Button>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        {/* Trust strip */}
        <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2">
          {TRUST_ITEMS.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs"
            >
              <span className="text-primary" aria-hidden>
                ✓
              </span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
