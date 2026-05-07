"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BRAND_NAME } from "@/lib/brand";
import { getRoastInputMicrocopy } from "@/lib/landing-copy";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export function ComparisonB1({ roastForm }: { roastForm: LandingRoastFormProps }) {
  const { url, setUrl, loading, error, onRoast } = roastForm;
  const roastMicrocopy = getRoastInputMicrocopy();

  return (
    <section
      id="comparison"
      className="border-t border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-[var(--lv-minimal-text)] md:text-4xl">
          The AI consultant vs. the agency
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Same rigor as a senior review — without the calendar ping-pong.
        </p>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] shadow-surface-sm">
            <div className="border-b border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-2)] px-4 py-2 text-xs font-medium text-muted-foreground">
              Output timeline
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-[var(--lv-minimal-border)] border-b border-[var(--lv-minimal-border)]">
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Agency
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-muted-foreground">
                  14d
                </p>
                <p className="text-xs text-muted-foreground">Typical turnaround</p>
              </div>
              <div className="bg-[var(--lv-minimal-accent)]/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lv-minimal-accent)]">
                  {BRAND_NAME}
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--lv-minimal-accent)]">
                  &lt;60s
                </p>
                <p className="text-xs text-muted-foreground">First pass report</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-[var(--lv-minimal-border)]">
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Kickoff + revisions</p>
                <p className="mt-1 text-sm font-medium text-[var(--lv-minimal-text)]">
                  Meetings, SOW, reschedules
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="mt-1 text-sm font-medium text-[var(--lv-minimal-text)]">
                  Score, radar, fixes, export
                </p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-4 text-2xl font-semibold text-[var(--lv-minimal-text)]">
              Agencies charge $2,000 and take weeks.
            </p>
            <p className="mb-6 text-2xl font-semibold text-[var(--lv-minimal-text)]">
              We charge $29 and take seconds.
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
                  className="h-12 flex-1 rounded-2xl border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] sm:h-14"
                />
                <Button
                  onClick={onRoast}
                  disabled={loading}
                  size="lg"
                  className="h-12 shrink-0 rounded-2xl px-8 font-semibold sm:h-14"
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
