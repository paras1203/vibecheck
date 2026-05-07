/** Canonical labels aligned with `RoastRadar` / sample report. */
import { getScoreBand } from "@/lib/score-band";

export const RADAR_AXIS_LABELS = [
  "UX",
  "Trust",
  "Copy",
  "Conversion",
  "Visuals",
  "Speed",
] as const;

export type RadarAxisLabel = (typeof RADAR_AXIS_LABELS)[number];

/** Short plain-language gloss (~7–8 words) for each radar axis. */
export const RADAR_AXIS_EXPLANATIONS: Record<RadarAxisLabel, string> = {
  UX: "How easily visitors navigate and complete key tasks.",
  Trust: "How safe and credible it feels to buy.",
  Copy: "How clear and persuasive the messaging reads overall.",
  Conversion: "How well the page drives sign-ups or sales.",
  Visuals: "How polished and professional the design appears.",
  Speed: "How quickly the page loads and responds to input.",
};

function normalizeKey(k: string): string {
  return k.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/**
 * Map arbitrary radar key names (e.g. "ux", "UX & Layout") to a score for a canonical axis.
 */
export function scoreForRadarAxis(
  scores: Record<string, number>,
  axis: RadarAxisLabel
): number {
  const target = normalizeKey(axis);
  for (const [k, v] of Object.entries(scores)) {
    if (normalizeKey(k) === target) return Number(v);
  }
  for (const [k, v] of Object.entries(scores)) {
    const nk = normalizeKey(k);
    if (nk.includes(target) || target.includes(nk)) return Number(v);
  }
  return 0;
}

/** Ordered UX → Trust → Copy → … for grids that must match `RoastRadar` / exports. */
export function radarTilesForDisplay(
  radarMetrics: Record<string, number>
): { label: RadarAxisLabel; score: number }[] {
  return RADAR_AXIS_LABELS.map((label) => ({
    label,
    score: scoreForRadarAxis(radarMetrics, label),
  }));
}

/** Tailwind classes for axis score: &gt;80 strong, 60–80 middling, &lt;60 weak. */
export function radarScoreValueClass(score: number): string {
  const n = Number(score);
  if (!Number.isFinite(n)) return "text-foreground";
  switch (getScoreBand(n)) {
    case "strong":
      return "text-emerald-600 dark:text-emerald-400";
    case "mid":
      return "text-amber-600 dark:text-amber-500";
    default:
      return "text-destructive";
  }
}
