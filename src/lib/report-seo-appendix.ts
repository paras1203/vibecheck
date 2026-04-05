import type { SeoAnalysisResult } from "@/lib/seo-analyzer";
import type { PageSpeedSummary } from "@/lib/pagespeed";
import type { PerformanceGeminiSummary } from "@/types/roast-extras";

export type SeoAppendixInput = {
  seo?: SeoAnalysisResult | null;
  page_type?: string;
  performance?: PageSpeedSummary | null;
  performanceGemini?: PerformanceGeminiSummary | null;
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

const ISSUE_SOLUTION: Record<string, string> = {
  TITLE_LENGTH:
    "Write one clear title between 30–60 characters that names the page and primary keyword.",
  MISSING_TITLE:
    "Add a unique <title> in the document head that matches what users see on the page.",
  META_DESCRIPTION_LENGTH:
    "Set a meta description around 70–160 characters with benefit, proof, and a soft CTA.",
  MISSING_META_DESCRIPTION:
    "Add a meta description tag so search snippets can show a compelling summary.",
  H1_COUNT_INVALID:
    "Keep a single visible H1 for the main topic; change extras to H2/H3 for structure.",
  IMAGE_ALT_COVERAGE_LOW:
    "Add short descriptive alt text to informative images; use alt=\"\" for purely decorative ones.",
};

export function formatSeoIssueLabel(type: string): string {
  return ISSUE_COPY[type] || type;
}

export function formatSeoIssueSolution(type: string): string {
  return (
    ISSUE_SOLUTION[type] ||
    "Review this signal in your CMS or markup and align with current SEO best practices."
  );
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
        (perf.cls != null && perf.cls !== "") ||
        (perf.tbt != null && perf.tbt !== ""))
  );
  const gem = data.performanceGemini;

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
        ? `<ul style="margin:8px 0 0;padding-left:0;list-style:none;">${seo.issues
            .map((i) => {
              const label = ISSUE_COPY[i.type] || i.type;
              const fix = formatSeoIssueSolution(i.type);
              return `<li class="report-nojustify" style="margin:8px 0;padding:8px 10px;border:1px solid var(--rs-border,#e5e7eb);border-radius:8px;"><strong>${esc(label)}</strong><br/><span class="muted">${esc(fix)}</span></li>`;
            })
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
    const tbt =
      perf.tbt != null && perf.tbt !== ""
        ? `<p class="muted report-nojustify">TBT: ${esc(perf.tbt)}</p>`
        : "";
    const gemBlock =
      gem?.summary && gem.quickFixes?.length === 2
        ? `<p class="report-nojustify" style="margin-top:10px;">${esc(gem.summary)}</p><p class="report-label" style="margin-top:12px;">Top quick fixes (speed)</p><ol style="margin:6px 0 0;padding-left:1.25rem;">${gem.quickFixes
            .map((q) => `<li class="report-nojustify">${esc(q)}</li>`)
            .join("")}</ol>`
        : "";
    parts.push(
      `<div class="section report-major"><h2>Lighthouse performance (PageSpeed)</h2>${perfScore}${lcp}${cls}${tbt}${gemBlock}</div>`
    );
  }

  return parts.join("\n");
}
