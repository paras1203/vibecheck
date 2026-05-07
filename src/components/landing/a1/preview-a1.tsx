"use client";

import { SampleReportPreview } from "@/components/landing/shared/sample-report-preview";
import { cn } from "@/lib/utils";

export function PreviewA1() {
  return (
    <section id="preview" className="border-t border-[var(--lv-bold-border)] bg-[var(--lv-bold-bg)] px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-label text-[var(--lv-bold-accent)]">Product output</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            What your audit looks like
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/65">
            Static preview — run a roast to see your real scores, radar, and quick wins.
          </p>
          <p className="mt-4 text-sm font-medium text-[var(--lv-bold-primary)]">
            See what you&apos;ll get
          </p>
        </div>
        <div className="lv-glow-violet relative rounded-2xl p-[1px]">
          <div
            className={cn(
              "relative rounded-2xl bg-[var(--lv-bold-surface-1)] p-2 shadow-surface-sm md:p-3",
            )}
          >
            <SampleReportPreview
              shellClassName="rounded-xl border border-[var(--lv-bold-border)] bg-[var(--lv-bold-surface-2)] shadow-none"
              chromeClassName="border-b border-[var(--lv-bold-border)] bg-[var(--lv-bold-surface-1)]"
              bodyClassName="bg-[var(--lv-bold-surface-2)]"
              cardClassName="border-[var(--lv-bold-border)] bg-[var(--lv-bold-surface-1)]/90"
              radarClassName="lv-glow-violet rounded-xl p-2"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
