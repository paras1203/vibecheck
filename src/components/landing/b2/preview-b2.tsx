"use client";

import { SampleReportPreview } from "@/components/landing/shared/sample-report-preview";

export function PreviewB2() {
  return (
    <section
      id="preview"
      className="border-t border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12">
          <p className="text-label text-[var(--lv-minimal-accent)]">Product output</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--lv-minimal-text)] md:text-4xl">
            What your audit looks like
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground md:mx-0">
            Static preview — run a roast to see your real scores, radar, and quick wins.
          </p>
          <p className="mt-4 text-sm font-medium text-[var(--lv-minimal-text)]">
            Your report in 60 seconds
          </p>
        </div>
        <div className="rounded-xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)]/50 p-3 shadow-surface-xs md:p-4">
          <div className="-mt-2 translate-y-2 rounded-lg border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] shadow-surface-xs">
            <SampleReportPreview
              shellClassName="rounded-lg border-0 shadow-none"
              chromeClassName="rounded-t-lg border-b border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)]"
              bodyClassName="bg-[var(--lv-minimal-bg)]"
              cardClassName="border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)]"
              scoreTitles
            />
          </div>
        </div>
      </div>
    </section>
  );
}
