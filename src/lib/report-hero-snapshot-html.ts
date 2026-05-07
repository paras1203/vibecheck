/**
 * First-viewport snapshot markup for HTML report + PDF.
 */

export function buildHeroSnapshotFigureHtml(
  heroSrc: string | null,
  opts?: { borderColor?: string }
): string {
  const border = opts?.borderColor ?? "var(--border,#e2e8f0)";
  if (!heroSrc) {
    return `<div class="chart-box hero-snapshot-fallback" style="padding:20px;border:1px dashed ${border};border-radius:10px;text-align:center;color:#64748b;font-size:13px;">No first-viewport capture stored for this audit.</div>`;
  }
  return `<div class="hero-snapshot-frame" style="position:relative;border-radius:10px;overflow-x:auto;overflow-y:visible;border:1px solid ${border};background:#0f172a;width:100%;max-width:100%;box-sizing:border-box;">
  <img src="${heroSrc}" alt="" style="width:auto;max-width:none;height:auto;display:block;object-fit:contain;object-position:top center;vertical-align:top;margin:0 auto;" />
</div>`;
}
