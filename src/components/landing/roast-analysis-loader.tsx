"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ROAST_ANALYSIS_MESSAGES } from "@/lib/roast-analysis-messages";
import { aggregateLoaderPhaseTimings } from "@/lib/roast-loader-phase-timings";
import { cn } from "@/lib/utils";

const MESSAGES = ROAST_ANALYSIS_MESSAGES;

/** Steps 1–19 (indices 0..length-2): ~42.5s total for a ~1min audit feel */
const EARLY_STEP_MS = Math.round(42250 / (MESSAGES.length - 2));
/** Fast-forward remaining early steps when the API returns early */
const CATCH_UP_MS = 130;
/** Step 20 (final row) hold before teaser reveal */
const FINAL_HOLD_MS = 15_000;
const LAST_PREFINAL_INDEX = MESSAGES.length - 2;

export type TimingRow = {
  stepIndex: number;
  seconds: number;
};

function RoastStepTimingHud({ timingRows }: { timingRows: TimingRow[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const phaseRows = useMemo(
    () => aggregateLoaderPhaseTimings(timingRows),
    [timingRows],
  );

  const timingTotal = useMemo(
    () => Math.round(timingRows.reduce((a, r) => a + r.seconds, 0) * 100) / 100,
    [timingRows],
  );

  const phaseSum = useMemo(
    () => Math.round(phaseRows.reduce((a, r) => a + r.seconds, 0) * 100) / 100,
    [phaseRows],
  );

  if (!mounted || timingRows.length === 0) return null;

  return createPortal(
    <div
      className="fixed right-4 top-4 z-[200] max-h-[min(52vh,28rem)] w-[min(92vw,22rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-background/98 p-3 shadow-surface-sm backdrop-blur-sm"
      aria-live="polite"
    >
      <p className="border-b border-border-muted pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Phase timing (s)
      </p>
      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
        Eight rollup buckets for the URL → report flow. Open per-step detail to see which loader line
        was active (long rows usually mean waiting on the network).
      </p>
      <ul className="mt-2 space-y-1.5 text-xs leading-snug text-foreground">
        {phaseRows.map((r) => (
          <li
            key={r.label}
            className="flex justify-between gap-2 border-b border-border-muted/60 pb-1.5 last:border-0 last:pb-0"
          >
            <span className="min-w-0 flex-1 break-words text-muted-foreground">{r.label}</span>
            <span className="shrink-0 tabular-nums font-medium">{r.seconds}s</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-border-muted pt-2 text-[10px] text-muted-foreground">
        Phases Σ {phaseSum}s · Steps Σ {timingTotal}s
      </p>
      <details className="mt-2 rounded-md border border-border-muted bg-muted/15 px-2 py-1.5">
        <summary className="cursor-pointer select-none text-[10px] font-medium text-foreground">
          Per-step detail
        </summary>
        <ul className="mt-2 max-h-[28vh] space-y-2 overflow-y-auto overscroll-contain border-t border-border-muted pt-2">
          {timingRows.map((r, i) => (
            <li
              key={`${r.stepIndex}-${i}`}
              className="flex flex-col gap-0.5 border-b border-border-muted/50 pb-2 last:border-0 last:pb-0"
            >
              <span className="break-words text-[11px] text-foreground">{MESSAGES[r.stepIndex]}</span>
              <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                {r.seconds}s
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>,
    document.body,
  );
}

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
  const [timingRows, setTimingRows] = useState<TimingRow[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRevealRef = useRef(onReveal);
  const finishScheduledRef = useRef(false);
  const stepRef = useRef(0);
  const activeRowRef = useRef<HTMLLIElement>(null);
  const stepEnteredAtRef = useRef(0);
  const prevStepRef = useRef<number | null>(null);

  useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (!isActive) {
      setTimingRows([]);
      prevStepRef.current = null;
      return;
    }
    const now = performance.now();
    stepEnteredAtRef.current = now;
    prevStepRef.current = step;
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const now = performance.now();
    const prev = prevStepRef.current;
    if (prev !== null && prev !== step) {
      const seconds = Math.round(((now - stepEnteredAtRef.current) / 1000) * 100) / 100;
      setTimingRows((rows) => [...rows, { stepIndex: prev, seconds }]);
    }
    prevStepRef.current = step;
    stepEnteredAtRef.current = now;
  }, [step, isActive]);

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
    <>
      {timingRows.length > 0 ? <RoastStepTimingHud timingRows={timingRows} /> : null}
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Step {displayStep + 1} of {MESSAGES.length}
          </span>
          <span>
            {doneCount} complete
            {analysisComplete && step === MESSAGES.length - 1 ? " · Finalizing…" : ""}
          </span>
        </div>
        <Progress value={progressPct} className="h-1.5 sm:h-2" />
        <div className="max-h-[min(42vh,17rem)] space-y-2 overflow-y-auto overscroll-contain rounded-md border border-border-muted bg-surface-2/20 py-2 pl-2 pr-1 sm:max-h-[min(48vh,20rem)]">
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
                  "flex gap-3 rounded-md border px-2.5 py-2 text-xs transition-colors sm:px-3 sm:py-2.5 sm:text-[13px]",
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
    </>
  );
}
