"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ROAST_ANALYSIS_MESSAGES } from "@/lib/roast-analysis-messages";
import { cn } from "@/lib/utils";

const MESSAGES = ROAST_ANALYSIS_MESSAGES;

/** Steps 1–19 (indices 0..length-2): ~42.5s total for a ~1min audit feel */
const EARLY_STEP_MS = Math.round(42250 / (MESSAGES.length - 2));
/** Fast-forward remaining early steps when the API returns early */
const CATCH_UP_MS = 130;
/** Step 20 (final row) hold before teaser reveal */
const FINAL_HOLD_MS = 15_000;
const LAST_PREFINAL_INDEX = MESSAGES.length - 2;

type RoastAnalysisLoaderProps = {
  isActive: boolean;
  analysisComplete: boolean;
  onReveal: () => void;
};

export function RoastAnalysisLoader({
  isActive,
  analysisComplete,
  onReveal,
}: RoastAnalysisLoaderProps) {
  const [step, setStep] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRevealRef = useRef(onReveal);
  const finishScheduledRef = useRef(false);
  const stepRef = useRef(0);
  const activeRowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (!isActive || analysisComplete) return;

    tickRef.current = setInterval(() => {
      setStep((s) => (s < LAST_PREFINAL_INDEX ? s + 1 : s));
    }, EARLY_STEP_MS);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [isActive, analysisComplete]);

  useEffect(() => {
    if (!isActive || !analysisComplete || finishScheduledRef.current) return;

    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    let cancelled = false;
    let catchUpId: ReturnType<typeof setInterval> | null = null;

    const startFinalHold = () => {
      if (cancelled || finishScheduledRef.current) return;
      finishScheduledRef.current = true;
      setStep(MESSAGES.length - 1);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      finishTimerRef.current = setTimeout(() => {
        if (!cancelled) onRevealRef.current();
      }, FINAL_HOLD_MS);
    };

    const atComplete = stepRef.current;
    if (atComplete < LAST_PREFINAL_INDEX) {
      catchUpId = setInterval(() => {
        setStep((prev) => {
          const next = Math.min(prev + 1, LAST_PREFINAL_INDEX);
          if (next === LAST_PREFINAL_INDEX) {
            if (catchUpId) {
              clearInterval(catchUpId);
              catchUpId = null;
            }
            queueMicrotask(startFinalHold);
          }
          return next;
        });
      }, CATCH_UP_MS);
    } else {
      startFinalHold();
    }

    return () => {
      cancelled = true;
      if (catchUpId) clearInterval(catchUpId);
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
      finishScheduledRef.current = false;
    };
  }, [isActive, analysisComplete]);

  const displayStep = step;
  const progressPct = Math.min(100, ((displayStep + 1) / MESSAGES.length) * 100);
  const doneCount = displayStep;

  useEffect(() => {
    if (!isActive) return;
    const el = activeRowRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [displayStep, isActive]);

  if (!isActive) return null;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          Step {displayStep + 1} of {MESSAGES.length}
        </span>
        <span>
          {doneCount} complete
          {analysisComplete && step === MESSAGES.length - 1 ? " · Finalizing…" : ""}
        </span>
      </div>
      <Progress value={progressPct} className="h-2" />
      <div className="max-h-[min(52vh,22rem)] space-y-2 overflow-y-auto overscroll-contain rounded-md border border-border-muted bg-surface-2/20 py-2 pl-2 pr-1">
        <ul className="space-y-2 text-left">
          {MESSAGES.map((msg, i) => {
            const done = i < displayStep;
            const active = i === displayStep;
            const pending = i > displayStep;
            return (
              <li
                key={msg}
                data-step-index={i}
                ref={active ? activeRowRef : undefined}
                className={cn(
                  "flex gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors sm:text-[15px]",
                  pending && "border-border-muted/50 bg-muted/5 text-muted-foreground/45",
                  done && "border-border-muted bg-muted/20 text-muted-foreground",
                  active &&
                    "border-primary/35 bg-primary/5 font-medium text-foreground shadow-surface-xs"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                    pending && "border-border-muted text-muted-foreground/50",
                    done && "border-success/40 bg-success/15 text-success",
                    active && "border-primary/50 bg-primary/10 text-primary"
                  )}
                  aria-hidden
                >
                  {done ? (
                    <Check className="size-3 stroke-[2.5]" />
                  ) : (
                    <span className="font-mono tabular-nums">{i + 1}</span>
                  )}
                </span>
                <span className="leading-snug">{msg}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
