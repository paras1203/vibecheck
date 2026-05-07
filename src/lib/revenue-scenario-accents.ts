export type RevenueScenarioKey = "low" | "base" | "high";

/** Matches `scenarioRowHtml` in insight-layers-report (muted / warning / destructive). */
export function revenueScenarioTileClass(key: RevenueScenarioKey): string {
  switch (key) {
    case "low":
      return "border-slate-400/35 bg-surface-2/20 dark:border-slate-500/40";
    case "base":
      return "border-amber-500/40 bg-amber-500/[0.06] dark:border-amber-500/45";
    default:
      return "border-destructive/40 bg-destructive/[0.06] dark:border-destructive/50";
  }
}

export function revenueScenarioAmountClass(key: RevenueScenarioKey): string {
  switch (key) {
    case "low":
      return "text-slate-600 dark:text-slate-400";
    case "base":
      return "text-amber-700 dark:text-amber-400";
    default:
      return "text-destructive dark:text-red-400";
  }
}

/** Headline “cost of inaction” lines (single Dollar amount, not scenario split). */
export function costOfInactionHeadlineClass(): string {
  return "font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400";
}
