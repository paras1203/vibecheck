/** Numeric score → semantic band (thresholds aligned site-wide). */

export type ScoreBand = "strong" | "mid" | "weak";

/** Same thresholds as legacy radar/PDF styling: >80 strong, ≥60 mid, else weak. */
export function getScoreBand(n: number): ScoreBand {
  const x = Number(n);
  if (!Number.isFinite(x)) return "mid";
  if (x > 80) return "strong";
  if (x >= 60) return "mid";
  return "weak";
}
