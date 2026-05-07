/** Must match `compileRoast` radarCategories order and count. */
export const SITE_SCORE_RADAR_KEYS = [
  "ux",
  "conversion",
  "copy",
  "visuals",
  "trust",
  "speed",
] as const;

export type SiteScoreRadarKey = (typeof SITE_SCORE_RADAR_KEYS)[number];

/**
 * Normalize API/stored radar (mixed-case keys) into lowercase scores for math + verdict.
 */
const RADAR_KEY_ALIASES: Record<SiteScoreRadarKey, readonly string[]> = {
  ux: ["ux", "UX"],
  conversion: ["conversion", "Conversion"],
  copy: ["copy", "Copy"],
  visuals: ["visuals", "Visuals"],
  trust: ["trust", "Trust"],
  speed: ["speed", "Speed"],
};

export function coerceRadarScoresToLowercase(
  radar: Record<string, unknown> | null | undefined
): Record<SiteScoreRadarKey, number> {
  const out: Record<string, number> = {};
  for (const k of SITE_SCORE_RADAR_KEYS) {
    let n: number | undefined;
    for (const alias of RADAR_KEY_ALIASES[k]) {
      const raw = radar?.[alias];
      const x = Number(raw);
      if (Number.isFinite(x)) {
        n = x;
        break;
      }
    }
    out[k] = n ?? 50;
  }
  return out as Record<SiteScoreRadarKey, number>;
}

/** Arithmetic mean of the six pillar scores (same definition as compileRoast overall). */
export function meanRadarSiteScore(radar: Record<string, unknown> | null | undefined): number {
  const row = coerceRadarScoresToLowercase(radar);
  const sum = SITE_SCORE_RADAR_KEYS.reduce((acc, k) => acc + row[k], 0);
  return Math.round(sum / SITE_SCORE_RADAR_KEYS.length);
}

/**
 * Headline score must match the six radar pillars shown in the report (not blended with SEO).
 */
export function syncOverallScoreWithRadarPayload(result: {
  radarMetrics?: Record<string, number>;
  overall_score?: number;
  overview?: { overallScore?: number };
  headline_roast?: string;
}): void {
  const rm = result.radarMetrics;
  if (!rm || typeof rm !== "object") return;
  const mean = meanRadarSiteScore(rm as Record<string, unknown>);
  result.overall_score = mean;
  if (result.overview && typeof result.overview === "object") {
    result.overview.overallScore = mean;
  }
  result.headline_roast = `Site Score: ${mean}/100`;
}

/**
 * Verdict uses the weakest pillar too, so a high blended score cannot read "EXCELLENT" with Trust 43 / Speed 37.
 */
export function verdictLabelFromSiteScore(
  overall: number,
  radar?: Record<string, unknown> | null
): string {
  const row = coerceRadarScoresToLowercase(radar);
  const minAxis = Math.min(...SITE_SCORE_RADAR_KEYS.map((k) => row[k]));
  if (overall < 50 || minAxis < 40) return "CRITICAL CONDITION";
  if (overall < 80 || minAxis < 55) return "NEEDS OPTIMIZATION";
  return "EXCELLENT";
}
