import { reportHex } from "@/lib/report-theme";

export function exportStatusPillColor(
  status: string,
  exactMap: Record<string, string>
): string {
  const h = reportHex;
  const key = status.trim();
  if (exactMap[key]) return exactMap[key];
  const low = key.toLowerCase();
  if (low.includes("excellent") || /^good\b/i.test(key)) return h.success;
  if (low.includes("satisfactory") || low.includes("needs improvement")) return h.warning;
  if (low.includes("fail")) return h.destructive;
  return h.muted;
}

export function exportCategoryVerdictColor(verdict: string): string {
  const h = reportHex;
  const v = verdict.trim();
  if (v === "Excellent" || v === "Good") return h.success;
  if (v === "Needs Improvement") return h.warning;
  return h.destructive;
}
