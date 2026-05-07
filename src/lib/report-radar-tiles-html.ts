import {
  RADAR_AXIS_EXPLANATIONS,
  RADAR_AXIS_LABELS,
  scoreForRadarAxis,
  type RadarAxisLabel,
} from "@/lib/radar-axis-scores";
import { pdfAxisScoreHex, reportHex } from "@/lib/report-theme";

/**
 * Site Score pillar tiles for static HTML + PDF (matches live `/roast` tile grid).
 */
export function buildRadarPillarTilesHtml(
  radar: Record<string, number>,
  esc: (s: string) => string,
  hasRadar: boolean
): string {
  if (!hasRadar) {
    return `<p class="muted report-nojustify">Pillar breakdown not included in this export.</p>`;
  }
  const h = reportHex;
  const tiles = RADAR_AXIS_LABELS.map((label) => {
    const v = scoreForRadarAxis(radar, label);
    const col = pdfAxisScoreHex(v);
    const expl = RADAR_AXIS_EXPLANATIONS[label as RadarAxisLabel];
    return `<div class="report-radar-tile" style="min-height:6.75rem;display:flex;flex-direction:column;justify-content:center;border:1px solid ${h.border};border-radius:10px;background:${h.surfaceMuted};padding:12px 10px;text-align:center;">
      <div style="font-size:11px;font-weight:600;color:${h.muted};">${esc(label)}</div>
      <div class="report-figure" style="margin-top:6px;font-size:14px;font-weight:700;color:${col};">${v}</div>
      <p style="margin:8px 0 0;font-size:10px;line-height:1.35;color:${h.muted};">${esc(expl)}</p>
    </div>`;
  }).join("");
  return `<div class="report-radar-tile-grid">${tiles}</div>`;
}
