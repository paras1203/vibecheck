import type { PageSpeedStrategy } from "@/lib/audits/types";

export type PSIReportItem = {
  id: string;
  title?: string;
  description?: string;
  displayValue?: string;
  numericValue?: number;
  /** Rough impact 0–100 when Lighthouse exposes a fractional score */
  scoreImpactApprox?: number;
};

export type PerformanceStrategyResult = {
  strategy: PageSpeedStrategy;
  performanceScore?: number;
  lcp?: string;
  inp?: string;
  cls?: string;
  tbt?: string;
};

export type PerformanceAuditResult = {
  mobile: PerformanceStrategyResult | null;
  desktop: PerformanceStrategyResult | null;
  opportunities: PSIReportItem[];
  diagnostics: PSIReportItem[];
};

type LhAudit = {
  title?: string;
  description?: string;
  displayValue?: string;
  score?: number | null;
  numericValue?: number;
  scoreDisplayMode?: string;
  details?: {
    type?: string;
    overallSavingsMs?: number;
    wastedMs?: number;
  };
};

type LhResult = {
  categories?: {
    performance?: { score?: number | null };
  };
  audits?: Record<string, LhAudit>;
};

const PSI_TIMEOUT_MS = 25_000;
const MAX_OPS = 8;
const MAX_DIAG = 8;

function opportunitySavingMs(a: LhAudit): number {
  const d = a.details;
  const m =
    (typeof d?.overallSavingsMs === "number" ? d.overallSavingsMs : undefined) ??
    (typeof d?.wastedMs === "number" ? d.wastedMs : undefined);
  return typeof m === "number" && Number.isFinite(m) ? m : 0;
}

function auditToItem(id: string, a: LhAudit): PSIReportItem {
  const frac = typeof a.score === "number" && a.score != null ? a.score : undefined;
  return {
    id,
    title: typeof a.title === "string" ? a.title : undefined,
    description:
      typeof a.description === "string" ? a.description.slice(0, 380) : undefined,
    displayValue: typeof a.displayValue === "string" ? a.displayValue : undefined,
    numericValue: typeof a.numericValue === "number" ? a.numericValue : undefined,
    scoreImpactApprox:
      typeof frac === "number" ? Math.max(0, Math.round((1 - frac) * 100)) : undefined,
  };
}

function extractOpportunitiesAndDiagnostics(lh: LhResult | undefined): {
  opportunities: PSIReportItem[];
  diagnostics: PSIReportItem[];
} {
  const audits = lh?.audits ?? {};
  const opItems: PSIReportItem[] = [];
  for (const [id, audit] of Object.entries(audits)) {
    if (!audit || audit.details?.type !== "opportunity") continue;
    opItems.push(auditToItem(id, audit));
  }
  opItems.sort((a, b) => {
    const idA =
      audits[a.id] != null ? opportunitySavingMs(audits[a.id] as LhAudit) : 0;
    const idB =
      audits[b.id] != null ? opportunitySavingMs(audits[b.id] as LhAudit) : 0;
    return idB - idA;
  });

  const diagItems: PSIReportItem[] = [];
  for (const [id, audit] of Object.entries(audits)) {
    if (!audit || audit.details?.type === "opportunity") continue;
    if (audit.scoreDisplayMode !== "informative" && audit.scoreDisplayMode !== "numeric")
      continue;
    if (
      diagItems.some((d) => d.id === id) ||
      opItems.some((o) => o.id === id)
    ) {
      continue;
    }
    if (audit.title && audit.description) {
      diagItems.push(auditToItem(id, audit));
    }
  }

  return {
    opportunities: opItems.slice(0, MAX_OPS),
    diagnostics: diagItems.slice(0, MAX_DIAG),
  };
}

function metricDisplay(audits: Record<string, LhAudit>, id: string): string | undefined {
  const dv = audits[id]?.displayValue;
  return typeof dv === "string" && dv.trim() ? dv : undefined;
}

function strategySlice(
  lh: LhResult | undefined,
  strategy: PageSpeedStrategy
): PerformanceStrategyResult {
  const audits = lh?.audits ?? {};
  const perf = lh?.categories?.performance?.score;
  const performanceScore =
    typeof perf === "number" && Number.isFinite(perf)
      ? Math.round(perf * 100)
      : undefined;

  return {
    strategy,
    ...(performanceScore != null ? { performanceScore } : {}),
    ...(metricDisplay(audits, "largest-contentful-paint")
      ? { lcp: metricDisplay(audits, "largest-contentful-paint") }
      : {}),
    ...(metricDisplay(audits, "interaction-to-next-paint")
      ? { inp: metricDisplay(audits, "interaction-to-next-paint") }
      : {}),
    ...(metricDisplay(audits, "cumulative-layout-shift")
      ? { cls: metricDisplay(audits, "cumulative-layout-shift") }
      : {}),
    ...(metricDisplay(audits, "total-blocking-time")
      ? { tbt: metricDisplay(audits, "total-blocking-time") }
      : {}),
  };
}

function strategyHasMetrics(r: PerformanceStrategyResult): boolean {
  return (
    typeof r.performanceScore === "number" ||
    (r.lcp != null && r.lcp !== "") ||
    (r.inp != null && r.inp !== "") ||
    (r.cls != null && r.cls !== "") ||
    (r.tbt != null && r.tbt !== "")
  );
}

/**
 * Typed PageSpeed Insights v5 runner for one strategy (lab / Lighthouse-backed).
 */
export async function getPageSpeedReport(
  url: string,
  strategy: PageSpeedStrategy,
  signal?: AbortSignal
): Promise<{
  lh: LhResult | undefined;
} | null> {
  try {
    const apiKey = process.env.PAGESPEED_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }

    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("key", apiKey);
    endpoint.searchParams.set("strategy", strategy);
    endpoint.searchParams.append("category", "PERFORMANCE");

    const res = await fetch(endpoint.toString(), { signal });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      lighthouseResult?: LhResult;
    };

    const lh = data.lighthouseResult;
    if (!lh) return null;
    return { lh };
  } catch {
    return null;
  }
}

export async function fetchPerformanceAuditResult(
  auditedUrl: string
): Promise<PerformanceAuditResult | null> {
  const apiKey = process.env.PAGESPEED_API_KEY?.trim();
  if (!apiKey) return null;

  const controllerMobile = new AbortController();
  const controllerDesktop = new AbortController();
  const tMob = setTimeout(() => controllerMobile.abort(), PSI_TIMEOUT_MS);
  const tDesk = setTimeout(() => controllerDesktop.abort(), PSI_TIMEOUT_MS);
  try {
    const [mRaw, dRaw] = await Promise.all([
      getPageSpeedReport(auditedUrl, "mobile", controllerMobile.signal),
      getPageSpeedReport(auditedUrl, "desktop", controllerDesktop.signal),
    ]);

    const mLh = mRaw?.lh;
    const dLh = dRaw?.lh;

    const mobileCand = mLh ? strategySlice(mLh, "mobile") : null;
    const desktopCand = dLh ? strategySlice(dLh, "desktop") : null;

    const { opportunities, diagnostics } = extractOpportunitiesAndDiagnostics(
      mLh ?? dLh
    );

    const mobile =
      mobileCand != null && strategyHasMetrics(mobileCand) ? mobileCand : null;
    const desktop =
      desktopCand != null && strategyHasMetrics(desktopCand) ? desktopCand : null;

    if (
      !mobile &&
      !desktop &&
      opportunities.length === 0 &&
      diagnostics.length === 0
    ) {
      return null;
    }

    return {
      mobile,
      desktop,
      opportunities,
      diagnostics,
    };
  } finally {
    clearTimeout(tMob);
    clearTimeout(tDesk);
  }
}
