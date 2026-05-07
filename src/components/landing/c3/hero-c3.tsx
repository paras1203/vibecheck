"use client";

import Link from "next/link";
import { UrlInputForm } from "@/components/landing/shared/url-input-form";
import { SampleReportPreview } from "@/components/landing/shared/sample-report-preview";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";
import { Check } from "lucide-react";

const CHECKS = [
  "Agency timelines → your first pass in under a minute",
  "PDF-ready narrative: scores, radar, prioritized fixes",
  "Built for operators who’d rather ship than sit in reviews",
] as const;

export function HeroC3({ roastForm }: { roastForm: LandingRoastFormProps }) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--lv-c3-border)] bg-[var(--lv-c3-bg)] px-4 py-20 md:px-8 md:py-28">
      <div className="pointer-events-none absolute inset-0 lv-grid-faint-c3 opacity-50" />
      <div className="pointer-events-none absolute -right-24 top-1/4 size-72 rounded-full bg-[var(--lv-c3-accent)]/10 blur-3xl" />
      <div className="container relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-[var(--lv-c3-text)] md:text-5xl lg:text-6xl">
              Stop guessing where revenue leaks on your landing.
            </h1>
            <p className="mt-6 text-lg text-[var(--lv-c3-muted)] md:text-xl">
              Paste a URL—get an operator-grade audit: what hurts conversion, what to rewrite, and
              what to ship first.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-[var(--lv-c3-text)]">
              {CHECKS.map((line) => (
                <li key={line} className="flex gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-[var(--lv-c3-accent)]" strokeWidth={2.5} aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 max-w-xl">
              <UrlInputForm {...roastForm} variant="c3" secondaryHref="#preview" />
            </div>
            <p className="mt-6 text-xs text-[var(--lv-c3-muted)]">
              <Link href="/" className="underline-offset-4 hover:text-[var(--lv-c3-text)] hover:underline">
                Default landing
              </Link>
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-lg lg:mx-0">
            <div id="preview" className="lv-c3-glow-accent rounded-2xl border border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-1)] p-3 md:p-4">
              <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-[var(--lv-c3-muted)]">
                Sample output snapshot
              </p>
              <div className="max-h-[420px] overflow-hidden rounded-xl border border-[var(--lv-c3-border)] bg-[var(--lv-c3-bg)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)]">
                <SampleReportPreview
                  shellClassName="rounded-none border-0 bg-transparent shadow-none"
                  chromeClassName="rounded-none border-b border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-1)]"
                  bodyClassName="bg-[var(--lv-c3-bg)]"
                  cardClassName="border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-1)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
