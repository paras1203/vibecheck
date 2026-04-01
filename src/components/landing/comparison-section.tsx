"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowDown } from "lucide-react";
import type { LandingRoastFormProps } from "./hero-section";
import { scrollToSection } from "./landing-scroll";
import { getRoastInputMicrocopy } from "@/lib/landing-copy";
import { BRAND_NAME } from "@/lib/brand";

export function ComparisonSection({
  url,
  setUrl,
  loading,
  error,
  onRoast,
}: LandingRoastFormProps) {
  const roastMicrocopy = getRoastInputMicrocopy();
  return (
    <section
      id="comparison"
      className="relative border-t border-border bg-surface-2 px-4 py-24 md:px-8"
    >
      <button
        type="button"
        className="absolute bottom-14 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground animate-bounce"
        onClick={() => scrollToSection("pricing")}
        aria-label="Scroll to pricing"
      >
        <ArrowDown className="size-5 stroke-[1.5]" />
      </button>
      <div className="container mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          The AI consultant vs. the agency
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Same rigor as a senior review — without the calendar ping-pong.
        </p>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-lg border border-border bg-surface-1 shadow-surface-xs">
            <div className="border-b border-border-muted bg-surface-2/60 px-4 py-2 text-xs font-medium text-muted-foreground">
              Output timeline
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-border border-b border-border-muted">
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Agency
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-muted-foreground">
                  14d
                </p>
                <p className="text-xs text-muted-foreground">Typical turnaround</p>
              </div>
              <div className="bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {BRAND_NAME}
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-primary">
                  &lt;60s
                </p>
                <p className="text-xs text-muted-foreground">First pass report</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-border">
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Kickoff + revisions</p>
                <p className="mt-1 text-sm font-medium text-foreground">Meetings, SOW, reschedules</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="mt-1 text-sm font-medium text-foreground">Score, radar, fixes, export</p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-4 text-2xl font-semibold text-foreground">
              Agencies charge $2,000 and take weeks.
            </p>
            <p className="mb-6 text-2xl font-semibold text-foreground">
              We charge $19 and take seconds.
            </p>
            <p className="mb-8 text-lg text-muted-foreground">
              Get the same level of analysis that agencies charge thousands for, delivered instantly by
              our AI-powered system. No meetings, no waiting, no BS.
            </p>
            <div className="flex w-full max-w-xl flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
                <Input
                  type="text"
                  placeholder="Enter URL (e.g., https://example.com or www.example.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) onRoast();
                  }}
                  disabled={loading}
                  className="h-12 flex-1 rounded-lg border-border text-base sm:h-14 sm:text-lg"
                />
                <Button
                  onClick={onRoast}
                  disabled={loading}
                  size="lg"
                  className="h-12 shrink-0 rounded-lg px-8 font-semibold sm:h-14"
                >
                  {loading ? "Roasting..." : "Roast My Site"}
                </Button>
              </div>
              {roastMicrocopy ? (
                <p className="text-sm text-muted-foreground">{roastMicrocopy}</p>
              ) : null}
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
