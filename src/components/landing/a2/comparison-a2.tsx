"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BRAND_NAME } from "@/lib/brand";
import { getRoastInputMicrocopy } from "@/lib/landing-copy";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export function ComparisonA2({ roastForm }: { roastForm: LandingRoastFormProps }) {
  const { url, setUrl, loading, error, onRoast } = roastForm;
  const roastMicrocopy = getRoastInputMicrocopy();

  return (
    <section id="comparison" className="border-t-2 border-white bg-black px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
          The AI consultant vs. the agency
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-white/65">
          Same rigor as a senior review — without the calendar ping-pong.
        </p>
        <div className="grid gap-12 md:grid-cols-2">
          <div className="border-2 border-white">
            <div className="border-b-2 border-white bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-black">
              Output timeline
            </div>
            <div className="grid grid-cols-2 divide-x-2 divide-white border-b-2 border-white">
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-white/55">Agency</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-white/55">14d</p>
                <p className="text-xs text-white/55">Typical turnaround</p>
              </div>
              <div className="bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black">{BRAND_NAME}</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-black">&lt;60s</p>
                <p className="text-xs text-black/70">First pass report</p>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x-2 divide-white">
              <div className="p-4">
                <p className="text-xs text-white/55">Kickoff + revisions</p>
                <p className="mt-1 text-sm font-semibold text-white">Meetings, SOW, reschedules</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-white/55">Delivery</p>
                <p className="mt-1 text-sm font-semibold text-white">Score, radar, fixes, export</p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-4 text-2xl font-bold text-white">
              Agencies charge $2,000 and take weeks.
            </p>
            <p className="mb-6 text-2xl font-bold text-white">
              We charge $29 and take seconds.
            </p>
            <p className="mb-8 text-lg text-white/65">
              Get the same level of analysis that agencies charge thousands for, delivered instantly by
              our AI-powered system. No meetings, no waiting, no BS.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  type="text"
                  placeholder="Enter URL (e.g., https://example.com or www.example.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) onRoast();
                  }}
                  disabled={loading}
                  className="h-12 flex-1 rounded-none border-2 border-white bg-black text-white placeholder:text-white/50 sm:h-14"
                />
                <Button
                  onClick={onRoast}
                  disabled={loading}
                  size="lg"
                  className="h-12 shrink-0 rounded-none border-2 border-white bg-white px-8 font-bold text-black hover:bg-white/90 sm:h-14"
                >
                  {loading ? "Roasting..." : "Roast My Site"}
                </Button>
              </div>
              {roastMicrocopy ? <p className="text-sm text-white/55">{roastMicrocopy}</p> : null}
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
