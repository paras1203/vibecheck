"use client";

import { SampleReportPreview } from "@/components/landing/shared/sample-report-preview";
import { trackEvent } from "@/lib/analytics-events";
import { Button } from "@/components/ui/button";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

const STEPS = [
  {
    num: "1",
    title: "Paste your landing page URL",
    body: "Enter any live URL — the page is fetched in real time.",
  },
  {
    num: "2",
    title: "We analyse copy, UX, trust, speed, and technical signals",
    body: "Our AI scores six conversion pillars and surfaces the most impactful friction points.",
  },
  {
    num: "3",
    title: "You get a scored report with quick fixes and export options",
    body: "Download the PDF or use the on-screen action plan to start improving straight away.",
  },
] as const;

export function PreviewV2({ onRoast }: { onRoast: LandingRoastFormProps["onRoast"] }) {
  return (
    <section
      id="v2-preview"
      className="border-t border-border bg-background px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-5xl min-w-0">
        <div className="mb-12 text-center">
          <p className="text-label text-primary">Product output</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            What your audit looks like
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            The preview below uses illustrative data. Your live audit will score
            the URL you submit.
          </p>
        </div>

        {/* 3-step explainer */}
        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.num} className="flex gap-4">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
                aria-hidden
              >
                {step.num}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {step.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Sample preview with labels */}
        <div className="relative">
          {/* Disclaimer banner */}
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Sample report</span>
            <span aria-hidden>·</span>
            <span>Illustrative data shown</span>
            <span aria-hidden>·</span>
            <span>Your live audit will use your submitted URL</span>
          </div>

          <SampleReportPreview
            shellClassName="rounded-2xl border border-border bg-card shadow-surface-sm"
            chromeClassName="rounded-t-2xl border-b border-border bg-surface-2"
            bodyClassName="bg-background"
            cardClassName="border-border bg-card"
          />
        </div>

        {/* CTA below preview */}
        <div className="mt-10 flex justify-center">
          <Button
            id="preview-run-audit-btn-v2"
            size="lg"
            className="rounded-2xl px-10 font-semibold"
            onClick={() => {
              trackEvent("sample_preview_cta_click");
              window.scrollTo({ top: 0, behavior: "smooth" });
              onRoast();
            }}
          >
            Run my audit
          </Button>
        </div>
      </div>
    </section>
  );
}
