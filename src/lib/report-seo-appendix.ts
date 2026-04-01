import type { SeoAnalysisResult } from "@/lib/seo-analyzer";
import type { PageSpeedSummary } from "@/lib/pagespeed";

export type SeoAppendixInput = {
  seo?: SeoAnalysisResult | null;
  page_type?: string;
  performance?: PageSpeedSummary | null;
};

const ISSUE_COPY: Record<string, string> = {
  TITLE_LENGTH: "Title length outside typical range (30–60 characters)",
  MISSING_TITLE: "Missing page title",
  META_DESCRIPTION_LENGTH:
    "Meta description length outside typical range (70–160 characters)",
  MISSING_META_DESCRIPTION: "Missing meta description",
  H1_COUNT_INVALID: "H1 heading count should be exactly one",
  IMAGE_ALT_COVERAGE_LOW: "Some images lack descriptive alt text",
};

export function formatSeoIssueLabel(type: string): string {
  return ISSUE_COPY[type] || type;
}

function pageTypeLabel(pt: string): string {
  switch (pt) {
    case "landing":
      return "Landing";
    case "blog":
      return "Blog";
    case "product":
      return "Product";
    case "unknown":
      return "Unknown";
    default:
      return pt;
  }
}

export function buildSeoPerformanceAppendixHtml(
  data: SeoAppendixInput,
  esc: (s: string) => string
): string {
  const seo = data.seo;
  const pt = data.page_type;
  const perf = data.performance;
  const hasPageType = Boolean(pt && pt !== "unknown");
  const hasSeo = seo != null;
  const hasPerf = Boolean(
    perf &&
      (typeof perf.performanceScore === "number" ||
        (perf.lcp != null && perf.lcp !== "") ||
        (perf.cls != null && perf.cls !== ""))
  );

  if (!hasPageType && !hasSeo && !hasPerf) {
    return "";
  }

  const parts: string[] = [];

  if (hasPageType && pt) {
    parts.push(
      `<div class="section report-major"><h2>Detected page type</h2><p class="report-prose report-nojustify">${esc(pageTypeLabel(pt))}</p></div>`
    );
  }

  if (hasSeo && seo) {
    const titleLen = seo.title?.length ?? 0;
    const titleStatus = !seo.title
      ? "Missing"
      : titleLen < 30 || titleLen > 60
        ? "Length warning"
        : "OK";
    const metaStatus = !seo.metaDescription
      ? "Missing"
      : seo.metaDescription.length < 70 || seo.metaDescription.length > 160
        ? "Length warning"
        : "OK";
    const issuesList =
      seo.issues?.length > 0
        ? `<ul style="margin:8px 0 0;padding-left:1.25rem;">${seo.issues
            .map(
              (i) =>
                `<li class="report-nojustify" style="margin:4px 0;">${esc(ISSUE_COPY[i.type] || i.type)}</li>`
            )
            .join("")}</ul>`
        : "";

    parts.push(
      `<div class="section report-major">
        <h2>SEO snapshot</h2>
        <p class="report-nojustify"><strong>SEO health score:</strong> ${esc(String(seo.score))}/100</p>
        <p class="muted report-nojustify">Title (${titleLen} chars): ${esc(titleStatus)}</p>
        <p class="muted report-nojustify">Meta description: ${esc(metaStatus)}</p>
        <p class="muted report-nojustify">H1 count: ${esc(String(seo.h1Count))}</p>
        <p class="muted report-nojustify">Canonical: ${seo.hasCanonical ? "Yes" : "No"} · Open Graph: ${seo.openGraph ? "Yes" : "No"} · Twitter cards: ${seo.twitterCards ? "Yes" : "No"}</p>
        <p class="muted report-nojustify">Image alt coverage: ${esc(String(Math.round(seo.imageAltCoverage * 100)))}%</p>
        ${issuesList ? `<p class="report-label" style="margin-top:12px;">Issues</p>${issuesList}` : ""}
      </div>`
    );
  }

  if (hasPerf && perf) {
    const perfScore =
      typeof perf.performanceScore === "number"
        ? `<p class="report-nojustify">Performance score: ${esc(String(perf.performanceScore))}</p>`
        : "";
    const lcp =
      perf.lcp != null && perf.lcp !== ""
        ? `<p class="muted report-nojustify">LCP: ${esc(perf.lcp)}</p>`
        : "";
    const cls =
      perf.cls != null && perf.cls !== ""
        ? `<p class="muted report-nojustify">CLS: ${esc(perf.cls)}</p>`
        : "";
    parts.push(
      `<div class="section report-major"><h2>Lighthouse performance (PageSpeed)</h2>${perfScore}${lcp}${cls}</div>`
    );
  }

  return parts.join("\n");
}
