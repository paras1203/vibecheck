"use client";

import { SampleReportPreview } from "@/components/landing/shared/sample-report-preview";

export function PreviewC2() {
  return (
    <section
      id="preview"
      className="border-t border-[var(--lv-c2-border)] bg-[var(--lv-c2-bg)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-label text-[var(--lv-c2-accent)]">Product output</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--lv-c2-text)] md:text-4xl">
            What your audit looks like
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Static preview — run a roast to see your real scores, radar, and prioritized fixes.
          </p>
          <p className="mt-4 text-sm font-medium text-muted-foreground">Sample audit preview</p>
        </div>
        <div className="rounded-[2rem] border border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)] p-3 shadow-[0_24px_64px_rgba(28,25,23,0.12)] ring-1 ring-black/[0.03] md:p-4">
          <div className="overflow-hidden rounded-2xl border border-[var(--lv-c2-border)] bg-[var(--lv-c2-bg)] shadow-[inset_0_2px_8px_rgba(28,25,23,0.06)]">
            <SampleReportPreview
              shellClassName="rounded-none border-0 bg-transparent shadow-none"
              chromeClassName="rounded-none border-b border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)]"
              bodyClassName="bg-[var(--lv-c2-bg)]"
              cardClassName="border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
