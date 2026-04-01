const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export function siteSlugFromAuditedUrl(url: string | undefined): string {
  if (!url?.trim()) return "report";
  try {
    const normalized = url.includes("://") ? url.trim() : `https://${url.trim()}`;
    const host = new URL(normalized).hostname.replace(/^www\./i, "");
    const first = host.split(".")[0] ?? "report";
    const slug = first.replace(/[^a-z0-9]/gi, "").toLowerCase();
    return slug || "report";
  } catch {
    return "report";
  }
}

export function reportDateSuffix(epochMs: number): string {
  const d = new Date(epochMs);
  const mon = MONTHS[d.getMonth()] ?? "jan";
  return `${mon}${d.getDate()}`;
}

export function formatReportDisplayName(
  auditedUrl: string | undefined,
  completedAtMs: number
): string {
  return `${siteSlugFromAuditedUrl(auditedUrl)}_${reportDateSuffix(completedAtMs)}`;
}

export function reportTimestampFromRoastId(roastId: string, fallbackMs: number): number {
  if (/^\d+$/.test(roastId)) {
    const n = parseInt(roastId, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return fallbackMs;
}
