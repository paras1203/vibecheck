"use client";

import { SampleReportPreview } from "@/components/landing/shared/sample-report-preview";
import { cn } from "@/lib/utils";

export function PreviewC1() {
  return (
    <section id="preview" className="border-t-2 border-white bg-black px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-label text-[var(--lv-c1-accent)]">Sample output</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            This is the shape of your audit
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/65">
            Executive pulse, cost-of-inaction framing, pillar scores, radar—then your real roast
            replaces every number when you run your URL.
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--lv-c1-accent)]">
            See what you&apos;ll get
          </p>
        </div>
        <div className="lv-c1-frame-glow relative rounded-2xl p-[1px]">
          <div className={cn("relative rounded-2xl bg-[#0c0c0e] p-2 md:p-3")}>
            <SampleReportPreview
              shellClassName="rounded-xl border-2 border-white/15 bg-black shadow-none"
              chromeClassName="rounded-t-xl border-b-2 border-white/12 bg-[#0c0c0e]"
              bodyClassName="bg-black"
              cardClassName="border border-white/15 bg-[#0c0c0e] text-white [&_.text-muted-foreground]:text-white/55 [&_.text-foreground]:text-white [&_.text-primary]:text-[var(--lv-c1-accent)]"
              scoreTileClassName="border-white/12 bg-black"
              radarClassName="lv-c1-frame-glow rounded-xl border border-white/12 p-2"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
