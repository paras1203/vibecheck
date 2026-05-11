import type { RadarAxisLabel } from "@/lib/radar-axis-scores";
import { RADAR_AXIS_LABELS, scoreForRadarAxis } from "@/lib/radar-axis-scores";
import type { QuickWin } from "@/lib/report-html";

export function filterQuickWinsByKeywords(
  wins: QuickWin[],
  keywords: string[],
  max: number
): QuickWin[] {
  const kws = keywords.map((k) => k.toLowerCase());
  const out: QuickWin[] = [];
  for (const w of wins) {
    const t = `${w.title || ""} ${w.elementName || ""}`.toLowerCase();
    if (kws.some((k) => t.includes(k))) out.push(w);
    if (out.length >= max) break;
  }
  return out;
}

export function weakestRadarAxis(
  radar: Record<string, number>
): { label: RadarAxisLabel; score: number } {
  let best: { label: RadarAxisLabel; score: number } | null = null;
  for (const label of RADAR_AXIS_LABELS) {
    const s = scoreForRadarAxis(radar, label);
    if (!best || s < best.score) best = { label, score: s };
  }
  return best ?? { label: "UX", score: 0 };
}

export function instrumentationLines(input: {
  techIds: Set<string>;
  hasClarityHint: boolean;
}): string[] {
  const lines: string[] = [];
  const { techIds, hasClarityHint } = input;
  lines.push(
    "Define primary conversion event(s) and validate firing on hero + checkout/sign-up completion paths."
  );
  if (techIds.has("ga4") || techIds.has("gtag")) {
    lines.push(
      "In GA4, enable Enhanced Measurement sparingly and add custom events for CTA clicks, form submits, and scroll depth milestones."
    );
  } else {
    lines.push(
      "Add analytics that captures sessions and conversions (GA4 or equivalent); wire conversion goals tied to revenue."
    );
  }
  lines.push("Track funnel steps between landing → signup/checkout → activation.");
  lines.push("Set aside labeled UTMs on acquisition landing URLs.");
  if (hasClarityHint) {
    lines.push(
      "Use session replay sparingly for hypotheses—not browsing—for UX regressions after launches."
    );
  } else {
    lines.push(
      "Consider Microsoft Clarity or similar replay tooling when diagnosing funnel friction."
    );
  }
  lines.push("Baseline desktop/mobile breakdown weekly once tagging ships.");
  return lines.slice(0, 7);
}
