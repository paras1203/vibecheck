"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BRAND_NAME } from "@/lib/brand";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";
import { trackEvent } from "@/lib/analytics-events";

export function ComparisonV2({ roastForm }: { roastForm: LandingRoastFormProps }) {
  const { url, setUrl, loading, error, onRoast } = roastForm;

  const handleCta = () => {
    trackEvent("pricing_cta_click");
    onRoast();
  };

  return (
    <section
      id="v2-comparison"
      className="border-t border-border bg-surface-1 px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-6xl min-w-0">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          A fast alternative to waiting weeks for a manual review
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Useful for finding obvious friction before you commit to a larger
          engagement — without the calendar ping-pong.
        </p>
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Comparison table */}
          <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-surface-sm">
            <div className="border-b border-border bg-surface-2 px-4 py-2 text-xs font-medium text-muted-foreground">
              Output timeline
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-border border-b border-border">
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Manual review
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-muted-foreground">
                  14d+
                </p>
                <p className="text-xs text-muted-foreground">
                  Kickoff, brief, revisions
                </p>
              </div>
              <div className="bg-primary/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {BRAND_NAME}
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-primary">
                  &lt;60s
                </p>
                <p className="text-xs text-muted-foreground">
                  First-pass report
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-border">
              <div className="p-4">
                <p className="text-xs text-muted-foreground">
                  Meetings, SOW, reschedules
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Weeks to first insight
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Score, radar, fixes, export
                </p>
              </div>
            </div>
          </div>

          {/* Copy + form */}
          <div className="min-w-0">
            <p className="mb-3 text-2xl font-semibold text-foreground">
              Get a first-pass audit for £29 — then decide whether you need
              more.
            </p>
            <p className="mb-8 text-lg text-muted-foreground">
              Identify the most obvious friction points quickly. Use the output
              to prioritise your own fixes, or hand it to a consultant with
              something concrete already done.
            </p>
            <p className="mb-4 text-xs italic text-muted-foreground">
              Illustrative estimates, not a guarantee of results.
            </p>
            <div className="flex w-full max-w-xl flex-col gap-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:gap-3">
                <Input
                  id="comparison-url-input-v2"
                  type="text"
                  placeholder="Paste your landing page URL…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) handleCta();
                  }}
                  disabled={loading}
                  aria-label="Landing page URL"
                  className="h-12 min-w-0 flex-1 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground sm:h-14"
                />
                <Button
                  id="comparison-run-audit-btn-v2"
                  onClick={handleCta}
                  disabled={loading}
                  size="lg"
                  className="h-12 shrink-0 rounded-2xl bg-primary px-8 font-semibold text-primary-foreground hover:opacity-90 sm:h-14"
                >
                  {loading ? "Analysing…" : "Run my audit"}
                </Button>
              </div>
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
