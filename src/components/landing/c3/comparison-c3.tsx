"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BRAND_NAME } from "@/lib/brand";
import { getRoastInputMicrocopy } from "@/lib/landing-copy";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export function ComparisonC3({ roastForm }: { roastForm: LandingRoastFormProps }) {
  const { url, setUrl, loading, error, onRoast } = roastForm;
  const roastMicrocopy = getRoastInputMicrocopy();

  return (
    <section
      id="comparison"
      className="border-t border-[var(--lv-c3-border)] bg-[var(--lv-c3-bg)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-[var(--lv-c3-text)] md:text-4xl">
          The agency stack vs. one decisive pass
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[var(--lv-c3-muted)]">
          Same problems surfaced—without the proposal phase.
        </p>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-1)] shadow-surface-xs">
            <div className="border-b border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-2)] px-4 py-2 text-xs font-medium text-[var(--lv-c3-muted)]">
              Output timeline
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-[var(--lv-c3-border)] border-b border-[var(--lv-c3-border)]">
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lv-c3-muted)]">
                  Agency
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--lv-c3-muted)]">
                  14d
                </p>
                <p className="text-xs text-[var(--lv-c3-muted)]">Typical turnaround</p>
              </div>
              <div className="bg-[color-mix(in_srgb,var(--lv-c3-accent)_12%,var(--lv-c3-surface-1))] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lv-c3-accent)]">
                  {BRAND_NAME}
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--lv-c3-accent)]">
                  &lt;60s
                </p>
                <p className="text-xs text-[var(--lv-c3-muted)]">First pass report</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-[var(--lv-c3-border)]">
              <div className="p-4">
                <p className="text-xs text-[var(--lv-c3-muted)]">Kickoff + revisions</p>
                <p className="mt-1 text-sm font-medium text-[var(--lv-c3-text)]">
                  Meetings, SOW, reschedules
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-[var(--lv-c3-muted)]">Delivery</p>
                <p className="mt-1 text-sm font-medium text-[var(--lv-c3-text)]">
                  Score, radar, fixes, export
                </p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-4 text-2xl font-semibold text-[var(--lv-c3-text)]">
              What you get in the export
            </p>
            <p className="mb-6 text-lg text-[var(--lv-c3-muted)]">
              Radar per axis, element-level callouts, and a fix order your team can run with—
              formatted for sharing, not buried in slides.
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
                  className="h-12 flex-1 rounded-lg border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-1)] text-[var(--lv-c3-text)] placeholder:text-[var(--lv-c3-muted)] sm:h-14"
                />
                <Button
                  onClick={onRoast}
                  disabled={loading}
                  size="lg"
                  className="h-12 shrink-0 rounded-lg bg-[var(--lv-c3-accent)] px-8 font-semibold text-[var(--lv-c3-bg)] hover:opacity-90 sm:h-14"
                >
                  {loading ? "Roasting..." : "Roast My Site"}
                </Button>
              </div>
              {roastMicrocopy ? (
                <p className="text-sm text-[var(--lv-c3-muted)]">{roastMicrocopy}</p>
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
