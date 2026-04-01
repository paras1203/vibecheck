"use client";

import { RoastAnalysisLoader } from "@/components/landing/roast-analysis-loader";
import { RoastTeaserPanel } from "@/components/landing/roast-teaser-panel";
import type { RoastTeaserContent } from "@/lib/roast-teaser";
import { cn } from "@/lib/utils";

export type RoastSessionPhase = "idle" | "analyzing" | "teaser";

type Props = {
  phase: RoastSessionPhase;
  analysisComplete: boolean;
  loaderKey: number;
  teaserContent: RoastTeaserContent | null;
  accountCreditsLine?: string | null;
  onReveal: () => void;
  onContinueToReport: () => void;
};

export function RoastGenerationOverlay({
  phase,
  analysisComplete,
  loaderKey,
  teaserContent,
  accountCreditsLine,
  onReveal,
  onContinueToReport,
}: Props) {
  if (phase === "idle") return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-background/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="roast-session-title"
    >
      <div className="flex min-h-full items-start justify-center px-4 py-8 sm:items-center sm:py-10">
        <div
          className={cn(
            "my-auto w-full rounded-xl border border-border bg-card/95 shadow-surface-sm backdrop-blur-md",
            "max-h-[min(88dvh,800px)] overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 sm:py-8",
            phase === "teaser" ? "max-w-3xl" : "max-w-2xl"
          )}
        >
          {phase === "analyzing" ? (
            <>
              <p
                id="roast-session-title"
                className="mb-1 text-center text-lg font-semibold tracking-tight text-foreground"
              >
                Running conversion analysis
              </p>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                This usually takes under a minute.
              </p>
              <RoastAnalysisLoader
                key={loaderKey}
                isActive={phase === "analyzing"}
                analysisComplete={analysisComplete}
                onReveal={onReveal}
              />
            </>
          ) : phase === "teaser" && teaserContent ? (
            <>
              <span id="roast-session-title" className="sr-only">
                {teaserContent
                  ? `${teaserContent.auditPreviewTitle} audit preview`
                  : "Audit preview"}
              </span>
              <RoastTeaserPanel
                teaser={teaserContent}
                accountCreditsLine={accountCreditsLine}
                onContinue={onContinueToReport}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
