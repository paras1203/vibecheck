/**
 * Pure SVG chart snippets for PDF and static HTML (Puppeteer-safe, no canvas).
 */

import { reportHex } from "./report-theme";

const CATEGORY_LABELS: Record<string, string> = {
  ux: "UX",
  conversion: "Conv",
  copy: "Copy",
  visuals: "Visual",
  trust: "Trust",
  speed: "Speed",
};

export function buildRadarSvg(
  radarScores: Record<string, number>,
  size = 320
): string {
  const entries = Object.entries(radarScores).filter(
    ([, v]) => typeof v === "number" && !Number.isNaN(v)
  );
  if (entries.length === 0) return "";

  const h = reportHex;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = entries.length;

  const gridRings = [0.25, 0.5, 0.75, 1].map(
    (t) =>
      `<circle cx="${cx}" cy="${cy}" r="${(maxR * t).toFixed(1)}" fill="none" stroke="${h.muted}" stroke-width="0.75" stroke-opacity="0.35" />`
  );

  const axes = entries
    .map((_, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const x2 = cx + maxR * Math.cos(angle);
      const y2 = cy + maxR * Math.sin(angle);
      return `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${h.muted}" stroke-width="0.75" stroke-opacity="0.35" />`;
    })
    .join("");

  const labels = entries
    .map(([key], i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const lr = maxR * 1.12;
      const tx = cx + lr * Math.cos(angle);
      const ty = cy + lr * Math.sin(angle);
      const label =
        CATEGORY_LABELS[key.toLowerCase()] ||
        key.slice(0, 8).replace(/_/g, " ");
      return `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${h.muted}" font-size="10" font-family="Inter, sans-serif" opacity="0.85">${label}</text>`;
    })
    .join("");

  const poly = entries
    .map(([_, raw], i) => {
      const v = Math.min(100, Math.max(0, Number(raw) || 0)) / 100;
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const x = cx + maxR * v * Math.cos(angle);
      const y = cy + maxR * v * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const fillPoly = `<polygon points="${poly}" fill="${h.primary}22" stroke="${h.primary}" stroke-width="1.25" stroke-opacity="0.9" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Radar chart">
    <rect width="100%" height="100%" fill="${h.codeBg}" rx="8"/>
    ${gridRings.join("")}
    ${axes}
    ${fillPoly}
    ${labels}
  </svg>`;
}

export function buildScrollHeatStripSvg(
  pageHeight: number,
  foldHeight = 800
): string {
  const h = reportHex;
  const w = 400;
  const barH = 48;
  const belowFold = Math.max(0, pageHeight - foldHeight);
  const pctAbove =
    pageHeight > 0 ? Math.min(100, (foldHeight / pageHeight) * 100) : 50;
  const pctBelow = Math.max(0, 100 - pctAbove);

  const aboveFill = "#2D3B4D";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${barH + 36}" viewBox="0 0 ${w} ${barH + 36}">
    <text x="0" y="14" fill="${h.muted}" font-size="11" font-family="Inter, sans-serif" opacity="0.85">Scroll depth</text>
    <rect x="0" y="22" width="${(w * pctAbove) / 100}" height="${barH}" fill="${aboveFill}" rx="4" opacity="0.92"/>
    <defs>
      <linearGradient id="belowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#3A4A5C;stop-opacity:0.95"/>
        <stop offset="100%" style="stop-color:#252F3D;stop-opacity:0.95"/>
      </linearGradient>
    </defs>
    <rect x="${(w * pctAbove) / 100}" y="22" width="${(w * pctBelow) / 100}" height="${barH}" fill="url(#belowGrad)" rx="4"/>
    <line x1="${(w * pctAbove) / 100}" y1="22" x2="${(w * pctAbove) / 100}" y2="${22 + barH}" stroke="${h.muted}" stroke-width="1.5" stroke-opacity="0.55"/>
    <text x="${w / 2}" y="${barH + 34}" text-anchor="middle" fill="${h.muted}" font-size="12" font-family="Inter, sans-serif">${belowFold.toFixed(0)}px below fold (${pctBelow.toFixed(0)}% of page)</text>
  </svg>`;
}

export function buildAttentionHeatmapSvg(): string {
  const h = reportHex;
  const w = 400;
  const rows = 12;
  const cellH = 14;
  const height = rows * cellH + 40;
  let rects = "";
  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const opacity = 0.06 + t * 0.2;
    rects += `<rect x="0" y="${20 + r * cellH}" width="${w}" height="${cellH - 1}" fill="${h.primary}" fill-opacity="${opacity.toFixed(2)}" />`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}" viewBox="0 0 ${w} ${height}" role="img" aria-label="Attention heatmap">
    <text x="0" y="14" fill="${h.muted}" font-size="11" font-family="Inter, sans-serif" opacity="0.9">Attention heatmap (fold → footer)</text>
    ${rects}
    <text x="${w / 2}" y="${height - 6}" text-anchor="middle" fill="${h.muted}" font-size="11" font-family="Inter, sans-serif">Hotter = higher expected attention</text>
  </svg>`;
}
