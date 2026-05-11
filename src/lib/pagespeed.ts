import { fetchPerformanceAuditResult } from "@/lib/audits/performance-pagespeed";
import type {
  PerformanceAuditResult,
  PerformanceStrategyResult,
} from "@/lib/audits/performance-pagespeed";
import type { PageSpeedStrategy } from "@/lib/audits/types";

export type { PageSpeedStrategy };

export type PageSpeedSummary = {
  performanceScore?: number;
  lcp?: string;
  cls?: string;
  tbt?: string;
  /** Lab INP string from Lighthouse when present */
  inp?: string;
  strategy?: PageSpeedStrategy;
};

function strategyToSummary(
  r: PerformanceStrategyResult | null | undefined
): PageSpeedSummary | null {
  if (!r) return null;
  if (
    r.performanceScore == null &&
    (r.lcp == null || r.lcp === "") &&
    (r.cls == null || r.cls === "") &&
    (r.tbt == null || r.tbt === "") &&
    (r.inp == null || r.inp === "")
  ) {
    return null;
  }
  return {
    strategy: r.strategy,
    ...(r.performanceScore != null ? { performanceScore: r.performanceScore } : {}),
    ...(r.lcp != null && r.lcp !== "" ? { lcp: r.lcp } : {}),
    ...(r.cls != null && r.cls !== "" ? { cls: r.cls } : {}),
    ...(r.tbt != null && r.tbt !== "" ? { tbt: r.tbt } : {}),
    ...(r.inp != null && r.inp !== "" ? { inp: r.inp } : {}),
  };
}

/**
 * PageSpeed Insights — uses mobile Lighthouse slice aligned with roast `performance`.
 */
export async function getPageSpeed(url: string): Promise<PageSpeedSummary | null> {
  const full = await fetchPerformanceAuditResult(url);
  if (!full) return null;
  return strategyToSummary(full.mobile);
}

export function pageSpeedSummaryFromPerformanceAuditMobile(
  full: PerformanceAuditResult | null
): PageSpeedSummary | null {
  if (!full) return null;
  return strategyToSummary(full.mobile);
}
