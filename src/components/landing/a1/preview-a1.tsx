"use client";

import { SampleReportPreview } from "@/components/landing/shared/sample-report-preview";

export function PreviewA1() {
  return (
    <section id="preview" className="border-t border-border bg-background px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-5xl min-w-0">
        <div className="mb-12 text-center">
          <p className="text-label text-primary">Product output</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            What your audit looks like
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Static preview — run a roast to see your real scores, radar, and quick wins.
          </p>
          <p className="mt-4 text-sm font-medium text-primary">See what you&apos;ll get</p>
        </div>
        <SampleReportPreview
          shellClassName="rounded-2xl border border-border bg-card shadow-surface-sm"
          chromeClassName="rounded-t-2xl border-b border-border bg-surface-2"
          bodyClassName="bg-background"
          cardClassName="border-border bg-card"
        />
      </div>
    </section>
  );
}
