import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadialChart } from "@/components/ui/radial-chart";
import { cn } from "@/lib/utils";
import {
  CTA_PREVIEW_SAMPLE_REPORT,
  FULL_REPORT_BODY,
  FULL_REPORT_HEADLINE,
  FULL_REPORT_PRICE_ANCHOR,
  FULL_REPORT_REASSURANCE,
  FULL_REPORT_SUBLINE,
  FULL_REPORT_WHAT_YOU_GET,
} from "@/lib/report-copy";
import { UnlockFullReportButton } from "@/components/roast/unlock-full-report-button";

function truncateText(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

const MASK = "██████";

export interface FullReportUpgradePanelProps {
  overallScore: number;
  verdictLabel: string;
  categoryTeasers: string[];
  beforeSnippet: string | null;
  afterSnippet: string | null;
  benchmarkLine: string;
  impactLine: string;
  className?: string;
  /** Wires primary CTA; with NEXT_PUBLIC_SKIP_PAYMENT_UNLOCK=true, unlocks without checkout. */
  onUnlockFullReport: () => void;
}

export function FullReportUpgradePanel({
  overallScore,
  verdictLabel,
  categoryTeasers,
  beforeSnippet,
  afterSnippet,
  benchmarkLine,
  impactLine,
  className,
  onUnlockFullReport,
}: FullReportUpgradePanelProps) {
  const rounded = Math.round(overallScore);
  const teaserRows =
    categoryTeasers.length > 0
      ? categoryTeasers.slice(0, 3)
      : ["Conversion signals", "Trust & proof", "Above-fold clarity"];
  const before =
    beforeSnippet && beforeSnippet.trim().length > 0
      ? truncateText(beforeSnippet, 140)
      : "Hero value prop competes with secondary actions—visitors hesitate before the primary CTA.";
  const after =
    afterSnippet && afterSnippet.trim().length > 0
      ? truncateText(afterSnippet, 140)
      : "Tighten the headline-to-CTA path so the next step is obvious in one screen.";

  return (
    <section
      id="full-report-upgrade"
      className={cn(
        "scroll-mt-24 rounded-xl border border-border bg-gradient-to-b from-primary/[0.06] to-transparent p-6 shadow-surface-xs md:p-8",
        className
      )}
      aria-labelledby="full-report-upgrade-heading"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-primary">{FULL_REPORT_SUBLINE}</p>
            <h2
              id="full-report-upgrade-heading"
              className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
            >
              {FULL_REPORT_HEADLINE}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {FULL_REPORT_BODY}
            </p>
          </div>

          <div>
            <p className="text-label mb-2 text-foreground">What you get</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {FULL_REPORT_WHAT_YOU_GET.map((line) => (
                <li
                  key={line}
                  className="flex gap-2 text-sm text-muted-foreground before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-primary/70 before:content-['']"
                >
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{FULL_REPORT_PRICE_ANCHOR}</p>
          <p className="text-xs text-muted-foreground/90">{FULL_REPORT_REASSURANCE}</p>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <UnlockFullReportButton
              size="lg"
              onUnlock={onUnlockFullReport}
              showPriceAnchor
            />
            <Button size="lg" variant="outline" className="font-semibold" asChild>
              <Link href="/#preview">{CTA_PREVIEW_SAMPLE_REPORT}</Link>
            </Button>
          </div>
        </div>

        <Card className="border-border/80 bg-card/80 shadow-surface-xs backdrop-blur-sm">
          <CardContent className="space-y-4 p-5">
            <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
              Premium preview
            </p>
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-4">
              <RadialChart value={rounded} size={96} strokeWidth={10} showLabel={false} />
              <div className="text-center sm:text-left">
                <p className="font-mono text-2xl font-semibold tabular-nums text-primary">
                  {rounded}
                  <span className="text-base font-normal text-muted-foreground">/100</span>
                </p>
                <p className="text-xs font-medium text-foreground">{verdictLabel}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{impactLine}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-border-muted pt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Deeper insights (full report)
              </p>
              {teaserRows.map((label) => (
                <div
                  key={label}
                  className="rounded-md border border-border-muted bg-muted/25 px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className="font-medium text-foreground/90">{label}</span>
                  <span className="text-muted-foreground/80"> · </span>
                  <span className="select-none blur-[3px]" aria-hidden>
                    {MASK}
                  </span>
                  <span className="sr-only">Detail available in full report</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
              <p className="text-[11px] font-medium text-primary">Before → after (sample)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Before:</span> {before}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">After:</span> {after}
              </p>
            </div>

            <p className="text-[11px] leading-snug text-muted-foreground">
              <span className="font-medium text-foreground/90">Benchmark:</span> {benchmarkLine}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
