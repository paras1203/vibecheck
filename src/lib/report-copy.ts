/** Strip model-inserted segment headers so UI/HTML don’t repeat titles like "DIAGNOSTIC_ANALYSIS". */
export function stripNarrativeSegmentLabels(text: string): string {
  let t = text.trim();
  for (let i = 0; i < 6; i++) {
    const next = t
      .replace(
        /^\s*(EXECUTIVE_SUMMARY|DIAGNOSTIC_ANALYSIS|DIAGNOSTIC\s*ANALYSIS|ASSESSMENT|NEXT_STEPS)\s*[:\-—]*\s*/i,
        ""
      )
      .trim();
    if (next === t) break;
    t = next;
  }
  t = t.replace(/^#{1,6}\s+[^\n]+\n?/m, "").trim();
  return t;
}

/** Plain-text-friendly display: remove common markdown markers from AI prose. */
export function stripDisplayMarkdown(text: string): string {
  let s = text;
  for (let i = 0; i < 8; i++) {
    const next = s
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1");
    if (next === s) break;
    s = next;
  }
  return s.replace(/\*([^*]+)\*/g, "$1").replace(/_([^_]+)_/g, "$1").trim();
}

/** Shared product copy for paid upgrade / full diagnostic (keep in sync with billing display price). */
export const PRO_REPORT_PRICE_DISPLAY = "$29";

export const FULL_REPORT_HEADLINE = "Unlock the full diagnostic layer";

export const FULL_REPORT_SUBLINE = "See the fixes that actually move conversion";

export const FULL_REPORT_BODY =
  "The full report adds exact issue breakdowns, deeper benchmarks, and a clear priority sequence so you ship what matters first. You get exportable PDF/HTML, richer radar and competitor context, and step-by-step fix guidance—not just a score.";

export const FULL_REPORT_WHAT_YOU_GET = [
  "Full reasoning behind every finding",
  "More detailed audit layers (element, category, narrative)",
  "Export & download (PDF and HTML)",
  "Deeper benchmarks and peer-style context",
  "Priority order for fixes",
  "Implementation guidance you can hand to design or dev",
] as const;

export const FULL_REPORT_PRICE_ANCHOR = `For ${PRO_REPORT_PRICE_DISPLAY} you unlock the complete diagnostic for this roast—structured findings, exports, and prioritized actions. A comparable manual audit often runs multiple hours at agency rates; this keeps the rigor and collapses the time.`;

export const FULL_REPORT_REASSURANCE =
  "No hidden fees—unlock instantly after checkout. PDF/HTML export is available right after purchase.";

export const CTA_UNLOCK_FULL_REPORT = "Unlock Full Report";

export const CTA_PREVIEW_SAMPLE_REPORT = "Preview Sample Report";

export const FULL_DIAGNOSTIC_UPGRADE_HOOK =
  "The full layer adds evidence, sequencing, and implementation detail for every issue.";

export const PRO_UPGRADE_STRIP =
  "Full report: deeper benchmarks, exports, and prioritized fix paths for this audit.";

export const INLINE_UPGRADE_NUDGE =
  "See everything in the full diagnostic—link below or unlock from the upgrade section above.";
