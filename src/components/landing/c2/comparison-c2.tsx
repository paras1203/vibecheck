"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BRAND_NAME } from "@/lib/brand";
import { getRoastInputMicrocopy } from "@/lib/landing-copy";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export function ComparisonC2({ roastForm }: { roastForm: LandingRoastFormProps }) {
  const { url, setUrl, loading, error, onRoast } = roastForm;
  const roastMicrocopy = getRoastInputMicrocopy();

  return (
    <section
      id="comparison"
      className="border-t border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-[var(--lv-c2-text)] md:text-4xl">
          Senior-level audit speed—without the agency calendar.
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Same checklist mindset as a pricey review; none of the scheduling tax.
        </p>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-[var(--lv-c2-border)] bg-[var(--lv-c2-bg)] shadow-[0_12px_40px_rgba(28,25,23,0.1)]">
            <div className="border-b border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-2)] px-4 py-2 text-xs font-medium text-muted-foreground">
              Output timeline
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-[var(--lv-c2-border)] border-b border-[var(--lv-c2-border)]">
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Agency
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-muted-foreground">
                  14d
                </p>
                <p className="text-xs text-muted-foreground">Typical turnaround</p>
              </div>
              <div className="bg-[color-mix(in_srgb,var(--lv-c2-accent)_10%,var(--lv-c2-bg))] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lv-c2-accent)]">
                  {BRAND_NAME}
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--lv-c2-accent)]">
                  &lt;60s
                </p>
                <p className="text-xs text-muted-foreground">First pass report</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-[var(--lv-c2-border)]">
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Kickoff + revisions</p>
                <p className="mt-1 text-sm font-medium text-[var(--lv-c2-text)]">
                  Meetings, SOW, reschedules
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="mt-1 text-sm font-medium text-[var(--lv-c2-text)]">
                  Score, radar, fixes, export
                </p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-4 text-2xl font-semibold text-[var(--lv-c2-text)]">
              Weeks of agency time, compressed to one focused pass.
            </p>
            <p className="mb-6 text-2xl font-semibold text-[var(--lv-c2-text)]">
              You keep the narrative— we surface what to fix first.
            </p>
            <p className="mb-8 text-lg text-muted-foreground">
              Operators use this when they can&apos;t afford another vague deck. You get scores,
              radar, and actions you can assign—not filler slides.
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
                  className="h-12 flex-1 rounded-2xl border-[var(--lv-c2-border)] bg-[var(--lv-c2-bg)] shadow-surface-sm sm:h-14"
                />
                <Button
                  onClick={onRoast}
                  disabled={loading}
                  size="lg"
                  className="h-12 shrink-0 rounded-2xl bg-[var(--lv-c2-accent)] px-8 font-semibold text-white hover:bg-[color-mix(in_srgb,var(--lv-c2-accent)_92%,black)] sm:h-14"
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
