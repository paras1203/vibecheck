"use client";

import { SampleReportPreview } from "@/components/landing/shared/sample-report-preview";

export function PreviewA2() {
  return (
    <section id="preview" className="border-t-2 border-white bg-black px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-label text-white/55">Product output</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            What your audit looks like
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/65">
            Static preview — run a roast to see your real scores, radar, and quick wins.
          </p>
        </div>
        <SampleReportPreview
          shellClassName="rounded-none border-2 border-white bg-black shadow-none"
          chromeClassName="rounded-none border-b-2 border-white bg-black"
          bodyClassName="bg-black"
          cardClassName="rounded-none border border-white/25 bg-black text-white [&_.text-muted-foreground]:text-white/55 [&_.text-foreground]:text-white [&_.text-primary]:text-white"
          scoreTileClassName="rounded-none border-white/20 bg-black"
          radarClassName="rounded-none border border-white/20 p-2"
        />
      </div>
    </section>
  );
}
