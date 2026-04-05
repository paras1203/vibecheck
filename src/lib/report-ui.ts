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

/** Same as formatEffortLine / formatImpactLine without the leading "Effort:" / "Impact:" (for UI that already labels the section). */
export function effortDetailBody(effortRaw: string | undefined): string {
  return formatEffortLine(effortRaw).replace(/^Effort:\s*/i, "").trim();
}

export function impactDetailBody(lift: string | undefined): string {
  return formatImpactLine(lift).replace(/^Impact:\s*/i, "").trim();
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
  const situation =
    pct >= 55
      ? `${host} reads as a long page in this snapshot: most of what we show appears after the first screen, so visitors who don’t scroll may miss key offers or proof.`
      : `${host} shows more in the first screen in this snapshot—still keep one clear action and one proof line up top.`;
  const action =
    "Put your main ask and one trust signal high; add a lighter second action after the first section if the page is long.";
  return { situation, action };
}
