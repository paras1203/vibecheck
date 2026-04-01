/**
 * Shared heatmap overlay markup for HTML report + PDF (jet-style warm spots on hero capture).
 */

export function buildAttentionHeatmapFigureHtml(
  heatSrc: string | null,
  opts?: { borderColor?: string }
): string {
  const border = opts?.borderColor ?? "var(--border,#e2e8f0)";
  if (!heatSrc) {
    return `<div class="chart-box heatmap-schematic-fallback" style="padding:12px 0;">${buildInlineJetHeatmapSvg()}</div>`;
  }

  return `<div class="heatmap-frame heatmap-figure" style="position:relative;border-radius:10px;overflow:hidden;border:1px solid ${border};background:#0f172a;max-height:min(70vh,560px);width:100%;">
  <img src="${heatSrc}" alt="Page capture with attention overlay" style="width:100%;height:auto;display:block;object-fit:contain;object-position:top center;max-height:min(70vh,560px);vertical-align:top;" />
  <div class="heatmap-overlay-root" style="pointer-events:none;position:absolute;left:0;top:0;right:0;height:42%;mix-blend-mode:hard-light;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 85% 70% at 22% 28%, rgba(255,0,60,0.55) 0%, rgba(255,140,0,0.35) 28%, rgba(255,230,80,0.2) 52%, transparent 72%);"></div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 55% at 58% 22%, rgba(0,180,255,0.22) 0%, rgba(0,90,255,0.12) 40%, transparent 65%);opacity:0.9;"></div>
    <div style="position:absolute;left:0;right:0;top:52%;height:42%;background:radial-gradient(ellipse 110% 80% at 50% 0%, rgba(255,80,0,0.4) 0%, rgba(255,200,0,0.18) 45%, transparent 70%);"></div>
    <div style="position:absolute;left:3%;top:8%;width:46%;height:38%;border-radius:50%;box-shadow:0 0 40px 18px rgba(255,60,0,0.35), inset 0 0 30px rgba(255,0,0,0.15);opacity:0.85;"></div>
  </div>
  <div style="position:absolute;left:8px;bottom:6px;right:8px;display:flex;flex-wrap:wrap;gap:8px;pointer-events:none;font-size:10px;line-height:1.2;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.85);">
    <span style="padding:2px 6px;border-radius:4px;background:linear-gradient(90deg,#ff003c,#ff8c00);font-weight:600;">Hot</span>
    <span style="padding:2px 6px;border-radius:4px;background:linear-gradient(90deg,#ffd700,#fff176);color:#1a1a1a;font-weight:600;">Warm</span>
    <span style="padding:2px 6px;border-radius:4px;background:rgba(30,64,175,0.85);font-weight:600;">Cool</span>
  </div>
</div>`;
}

/** Inline SVG heatmap strip when no screenshot (PDF-safe). */
export function buildInlineJetHeatmapSvg(): string {
  const w = 420;
  const h = 200;
  let rects = "";
  const cols = 14;
  const rows = 8;
  const cw = w / cols;
  const ch = (h - 28) / rows;
  const jet = (t: number): string => {
    const x = Math.max(0, Math.min(1, t));
    if (x < 0.25) {
      const u = x / 0.25;
      return `rgb(${Math.round(0 + u * 0)},${Math.round(0 + u * 0)},${Math.round(128 + u * 127)})`;
    }
    if (x < 0.5) {
      const u = (x - 0.25) / 0.25;
      return `rgb(${Math.round(0 + u * 255)},${Math.round(0 + u * 255)},${Math.round(255 - u * 255)})`;
    }
    if (x < 0.75) {
      const u = (x - 0.5) / 0.25;
      return `rgb(${Math.round(255)},${Math.round(255 - u * 255)},${Math.round(0)})`;
    }
    const u = (x - 0.75) / 0.25;
    return `rgb(${Math.round(255)},${Math.round(0 + u * 0)},${Math.round(0)})`;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) / cols;
      const cy = (r + 0.5) / rows;
      const d = Math.hypot(cx - 0.28, cy - 0.35);
      const d2 = Math.hypot(cx - 0.72, cy - 0.28);
      let t = Math.max(0, 1 - d * 1.35) * 0.55 + Math.max(0, 1 - d2 * 1.1) * 0.35;
      t = Math.min(1, t + (1 - cy) * 0.12);
      rects += `<rect x="${(c * cw).toFixed(1)}" y="${(24 + r * ch).toFixed(1)}" width="${(cw - 0.5).toFixed(1)}" height="${(ch - 0.5).toFixed(1)}" rx="2" fill="${jet(t)}" fill-opacity="0.92"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Attention heatmap schematic">
    <text x="4" y="16" fill="#64748b" font-size="11" font-family="system-ui,sans-serif">Attention heatmap (illustrative grid)</text>
    ${rects}
    <text x="${w / 2}" y="${h - 4}" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">Hotter cells = higher expected visual attention</text>
  </svg>`;
}
