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
      className="fixed inset-0 z-[100] flex min-h-dvh flex-col bg-background/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="roast-session-title"
    >
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-3 py-6 sm:px-5 sm:py-8">
        <div
          className={cn(
            "flex w-full shrink-0 flex-col rounded-xl border border-border bg-card/95 shadow-surface-sm backdrop-blur-md",
            "max-h-[calc(100dvh-2rem)] min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5 sm:max-h-[min(92dvh,900px)] sm:px-6 sm:py-7",
            phase === "teaser" ? "max-w-3xl" : "max-w-xl",
          )}
        >
          {phase === "analyzing" ? (
            <>
              <p
                id="roast-session-title"
                className="mb-1 text-center text-base font-semibold tracking-tight text-foreground sm:text-lg"
              >
                Running conversion analysis
              </p>
              <p className="mb-4 text-center text-xs text-muted-foreground sm:text-sm">
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
