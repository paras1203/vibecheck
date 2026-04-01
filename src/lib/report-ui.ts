/** Display helpers for audit report UI (no audit data changes). */

export function formatEffortLine(effortRaw: string | undefined): string {
  const raw = (effortRaw || "").trim();
  const m = raw.match(/(\d+)\s*(min|minute|minutes|hour|hours|hr|hrs)/i);
  if (!m) {
    if (!raw) return "Effort: Low (—)";
    return `Effort: Low (${raw})`;
  }
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  const minutes = u.startsWith("h") ? n * 60 : n;
  let tier = "Low";
  if (minutes > 120) tier = "High";
  else if (minutes > 45) tier = "Medium";
  const human = u.startsWith("h") ? `${n} hr${n === 1 ? "" : "s"}` : `${n} min`;
  return `Effort: ${tier} (${human})`;
}

export function formatImpactLine(lift: string | undefined): string {
  const t = (lift || "").trim();
  if (!t) return "Impact: — (full report for expected lift detail)";
  const cleaned = t.replace(/\s*[Ll]ift\s*$/, "").trim();
  return `Impact: ${cleaned}`;
}

export const LOCKED_INSIGHT_BULLETS = [
  "Issue → evidence → fix sequence (full layer)",
  "Benchmarked context vs. generic tips",
  "Export-ready narrative and prioritized backlog",
] as const;

export function scrollDepthNarrative(
  auditedUrl: string | undefined,
  pageHeight: number,
  foldHeight = 800
): { situation: string; action: string } {
  let host = "this page";
  try {
    const raw = auditedUrl?.trim();
    if (raw) {
      const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
      host = u.hostname.replace(/^www\./i, "");
    }
  } catch {
    /* keep default */
  }
  const below = Math.max(0, pageHeight - foldHeight);
  const pct = pageHeight > 0 ? (below / pageHeight) * 100 : 0;
  const situation = `For ${host}, about ${pct.toFixed(0)}% of total page height sits below a typical first viewport (~${foldHeight}px). Visitors who never scroll that far miss CTAs, pricing, and proof placed deeper on the page.`;
  const action = `Move your clearest value line, one proof point, and the primary CTA into the first screen; add a second, lighter CTA after the first full section so scanners who scroll only partway still have a path to convert.`;
  return { situation, action };
}
