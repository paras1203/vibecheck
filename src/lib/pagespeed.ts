export type PageSpeedSummary = {
  performanceScore?: number;
  lcp?: string;
  cls?: string;
};

const PSI_TIMEOUT_MS = 25_000;

export async function getPageSpeed(url: string): Promise<PageSpeedSummary | null> {
  try {
    const apiKey = process.env.PAGESPEED_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }

    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("key", apiKey);
    endpoint.searchParams.set("strategy", "mobile");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PSI_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(endpoint.toString(), { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: { performance?: { score?: number | null } };
        audits?: {
          "largest-contentful-paint"?: { displayValue?: string };
          "cumulative-layout-shift"?: { displayValue?: string };
        };
      };
    };

    const perf = data.lighthouseResult?.categories?.performance?.score;
    const performanceScore =
      typeof perf === "number" && Number.isFinite(perf)
        ? Math.round(perf * 100)
        : undefined;

    const lcp = data.lighthouseResult?.audits?.["largest-contentful-paint"]?.displayValue;
    const cls = data.lighthouseResult?.audits?.["cumulative-layout-shift"]?.displayValue;

    if (
      performanceScore == null &&
      lcp == null &&
      cls == null
    ) {
      return null;
    }

    return {
      ...(performanceScore != null ? { performanceScore } : {}),
      ...(lcp != null ? { lcp } : {}),
      ...(cls != null ? { cls } : {}),
    };
  } catch {
    return null;
  }
}
