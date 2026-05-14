/** Loader steps 0..N-2 align with pre-final messages; index N-1 is the final hold row. */
export const ROAST_LOADER_PHASE_RANGES = [
  { label: "Structure & conversion scan", start: 0, end: 2 },
  { label: "First impression & report prep", start: 3, end: 5 },
  { label: "Scroll depth & messaging checks", start: 6, end: 8 },
  { label: "CTAs, forms & visual hierarchy", start: 9, end: 11 },
  { label: "Speed, offer & objections", start: 12, end: 13 },
  { label: "Mobile trust & radar layering", start: 14, end: 15 },
  { label: "Quick wins & executive framing", start: 16, end: 17 },
  { label: "Preview packaging", start: 18, end: 19 },
] as const;

export type LoaderTimingRow = { stepIndex: number; seconds: number };

function phaseIndexForStep(stepIndex: number): number {
  for (let i = 0; i < ROAST_LOADER_PHASE_RANGES.length; i++) {
    const { start, end } = ROAST_LOADER_PHASE_RANGES[i];
    if (stepIndex >= start && stepIndex <= end) return i;
  }
  return ROAST_LOADER_PHASE_RANGES.length - 1;
}

/** Sums per-step client timings into eight high-level phases (URL → report narrative). */
export function aggregateLoaderPhaseTimings(rows: LoaderTimingRow[]): { label: string; seconds: number }[] {
  const totals = ROAST_LOADER_PHASE_RANGES.map(() => 0);
  for (const r of rows) {
    const pi = phaseIndexForStep(r.stepIndex);
    totals[pi] += r.seconds;
  }
  return ROAST_LOADER_PHASE_RANGES.map((p, i) => ({
    label: p.label,
    seconds: Math.round(totals[i] * 100) / 100,
  }));
}
