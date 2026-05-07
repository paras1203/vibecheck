"use client";

import { SampleReportPreview } from "@/components/landing/shared/sample-report-preview";

export function PreviewB1() {
  return (
    <section
      id="preview"
      className="border-t border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-label text-[var(--lv-minimal-accent)]">Product output</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--lv-minimal-text)] md:text-4xl">
            What your audit looks like
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Static preview — run a roast to see your real scores, radar, and quick wins.
          </p>
          <p className="mt-4 text-sm font-medium text-muted-foreground">Sample audit preview</p>
        </div>
        <SampleReportPreview
          shellClassName="rounded-3xl border-0 bg-[var(--lv-minimal-bg)] shadow-surface-sm"
          chromeClassName="rounded-t-3xl border-b border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)]"
          bodyClassName="bg-[var(--lv-minimal-bg)]"
          cardClassName="border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)]"
        />
      </div>
    </section>
  );
}
