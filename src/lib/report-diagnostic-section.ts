import { stripNarrativeSegmentLabels } from "@/lib/report-copy";

/** Shared executive summary + diagnostic markup for HTML and PDF exports (presentation only). */

export type DiagnosticSectionSource = {
  roastSummary?: string;
  roastAnalysis?: string;
  overview?: {
    executiveSummary?: string;
    roastAnalysis?: string;
  };
  hook?: string;
  script?: string;
  analysis?: string;
  verdict?: string;
  closer?: string;
};

function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/**
 * Returns inner HTML (no outer section). Empty string if no content.
 */
export function buildExecutiveDiagnosticInnerHtml(
  data: DiagnosticSectionSource,
  esc: (s: string) => string
): string {
  const primarySummary =
    data.roastSummary || data.overview?.executiveSummary || "";
  const hook = data.hook || "";
  const summaryText = primarySummary || hook;
  const diagnostic = stripNarrativeSegmentLabels(
    data.overview?.roastAnalysis ||
      data.roastAnalysis ||
      data.script ||
      data.analysis ||
      ""
  );
  const verdict = data.verdict || "";
  const closer = data.closer || "";

  const extraFraming =
    primarySummary &&
    hook &&
    normalizeText(hook) !== normalizeText(primarySummary)
      ? hook
      : "";

  const blocks: string[] = [];
  if (summaryText) {
    blocks.push(
      `<p class="report-label">Summary</p><div class="report-prose report-section-head"><p>${esc(summaryText).replace(/\n/g, "<br/>")}</p></div>`
    );
  }
  if (extraFraming) {
    blocks.push(
      `<p class="report-label" style="margin-top:var(--rs-md)">Framing</p><div class="report-prose"><p>${esc(extraFraming).replace(/\n/g, "<br/>")}</p></div>`
    );
  }
  if (diagnostic) {
    blocks.push(
      `<div class="report-prose" style="margin-top:var(--rs-md)"><p>${esc(diagnostic).replace(/\n/g, "<br/>")}</p></div>`
    );
  }
  if (verdict) {
    blocks.push(
      `<p class="report-label" style="margin-top:var(--rs-md)">Assessment</p><div class="report-prose"><p>${esc(verdict).replace(/\n/g, "<br/>")}</p></div>`
    );
  }
  if (closer) {
    blocks.push(
      `<p class="report-label" style="margin-top:var(--rs-md)">Next steps</p><div class="report-prose"><p>${esc(closer).replace(/\n/g, "<br/>")}</p></div>`
    );
  }

  return blocks.join("");
}
