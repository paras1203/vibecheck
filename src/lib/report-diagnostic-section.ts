import { stripDisplayMarkdown, stripNarrativeSegmentLabels } from "@/lib/report-copy";

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
  const diagnostic = stripDisplayMarkdown(
    stripNarrativeSegmentLabels(
      data.overview?.roastAnalysis ||
        data.roastAnalysis ||
        data.script ||
        data.analysis ||
        ""
    )
  );
  const verdictRaw = data.verdict || "";
  const closerRaw = data.closer || "";

  const prettifyExec = (s: string) =>
    stripDisplayMarkdown(stripNarrativeSegmentLabels(s.trim()));

  const extraFraming =
    primarySummary &&
    hook &&
    normalizeText(hook) !== normalizeText(primarySummary)
      ? hook
      : "";

  const blocks: string[] = [];
  if (summaryText) {
    const cleanSummary = prettifyExec(summaryText);
    blocks.push(
      `<p class="report-label">Summary</p><div class="report-prose report-section-head"><p>${esc(cleanSummary).replace(/\n/g, "<br/>")}</p></div>`
    );
  }
  if (extraFraming) {
    const cleanHook = prettifyExec(extraFraming);
    blocks.push(
      `<p class="report-label" style="margin-top:var(--rs-md)">Framing</p><div class="report-prose"><p>${esc(cleanHook).replace(/\n/g, "<br/>")}</p></div>`
    );
  }
  if (diagnostic) {
    blocks.push(
      `<div class="report-prose" style="margin-top:var(--rs-md)"><p>${esc(diagnostic).replace(/\n/g, "<br/>")}</p></div>`
    );
  }
  if (verdictRaw) {
    const verdict = prettifyExec(verdictRaw);
    blocks.push(
      `<p class="report-label" style="margin-top:var(--rs-md)">Assessment</p><div class="report-prose"><p>${esc(verdict).replace(/\n/g, "<br/>")}</p></div>`
    );
  }
  if (closerRaw) {
    const closer = prettifyExec(closerRaw);
    blocks.push(
      `<p class="report-label" style="margin-top:var(--rs-md)">Next steps</p><div class="report-prose"><p>${esc(closer).replace(/\n/g, "<br/>")}</p></div>`
    );
  }

  return blocks.join("");
}
