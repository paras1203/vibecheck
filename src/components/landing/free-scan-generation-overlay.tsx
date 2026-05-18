"use client";

import { RoastAnalysisLoader } from "@/components/landing/roast-analysis-loader";
import { cn } from "@/lib/utils";

type Props = {
  loaderKey: number;
  analysisComplete: boolean;
  onReveal: () => void;
};

export function FreeScanGenerationOverlay({ loaderKey, analysisComplete, onReveal }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh flex-col bg-background/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-scan-session-title"
    >
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-3 py-6 sm:px-5 sm:py-8">
        <div
          className={cn(
            "flex w-full max-w-xl shrink-0 flex-col rounded-xl border border-border bg-card/95 px-4 py-5 shadow-surface-sm backdrop-blur-md",
            "max-h-[calc(100dvh-2rem)] min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain sm:max-h-[min(92dvh,900px)] sm:px-6 sm:py-7",
          )}
        >
          <p
            id="free-scan-session-title"
            className="mb-1 text-center text-base font-semibold tracking-tight text-foreground sm:text-lg"
          >
            Running free conversion scan
          </p>
          <p className="mb-4 text-center text-xs text-muted-foreground sm:text-sm">
            Programmatic checks (no credits). This usually finishes within a minute.
          </p>
          <RoastAnalysisLoader
            key={loaderKey}
            isActive
            analysisComplete={analysisComplete}
            onReveal={onReveal}
            finalizeDelayMs={480}
          />
        </div>
      </div>
    </div>
  );
}
