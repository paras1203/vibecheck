/**
 * Subtle “signal quality” copy near metrics. Keep conservative—mostly Medium confidence.
 */

export const INTEL_AUDIT_SCOPE = "Analyzed 120+ conversion factors";

export const INTEL_BENCHMARK = "Based on industry benchmarks";

/** Illustrative range; not a guarantee—paired with calculator / qualitative context elsewhere. */
export const INTEL_ESTIMATED_IMPROVEMENT = "Estimated improvement: +15–35%";

export function getAssessmentConfidence(
  overallScore: number,
  auditItemCount: number
): "High" | "Medium" | "Low" {
  if (auditItemCount < 4 || overallScore < 28) return "Low";
  if (auditItemCount >= 10 && overallScore >= 40 && overallScore <= 76) return "High";
  return "Medium";
}

export function formatConfidenceLine(
  overallScore: number,
  auditItemCount: number
): string {
  const c = getAssessmentConfidence(overallScore, auditItemCount);
  return `Confidence: ${c} · ${INTEL_BENCHMARK}`;
}

export function formatIntelScoreFootnote(
  overallScore: number,
  auditItemCount: number
): string {
  return `${INTEL_AUDIT_SCOPE}. ${formatConfidenceLine(overallScore, auditItemCount)}`;
}
