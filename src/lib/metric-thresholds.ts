/** Scroll-depth emphasis: higher below-fold share = harder for first-screen conversion. */

export function belowFoldPercentValueClass(percent: number): string {
  const p = Number(percent);
  if (!Number.isFinite(p)) return "text-muted-foreground";
  if (p >= 70) return "text-destructive dark:text-destructive font-semibold";
  if (p >= 55) return "text-amber-600 dark:text-amber-500 font-semibold";
  if (p >= 40) return "text-amber-600/90 dark:text-amber-400/90 font-medium";
  return "text-emerald-600 dark:text-emerald-400 font-medium";
}
