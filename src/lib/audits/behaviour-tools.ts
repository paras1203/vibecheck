import type { TechStackAuditResult } from "@/lib/audits/tech-stack-audit";

export type BehaviourToolsAdvice = {
  microsoftClarityPresent: boolean;
  hotjarOrSimilarPresent: boolean;
  recommendBehaviourAnalytics: boolean;
  recommendationMessage?: string;
};

export function deriveBehaviourToolsAdvice(
  tech: TechStackAuditResult | null | undefined
): BehaviourToolsAdvice {
  const tools = tech?.detectedTools ?? [];
  const microsoftClarityPresent = tools.some((t) => t.id === "microsoft-clarity");
  const hasHeatmapFamily = tools.some((t) => t.category === "heatmap");
  const hotjarOrSimilarPresent = tools.some(
    (t) => t.category === "heatmap" && t.id !== "microsoft-clarity"
  );
  const recommendBehaviourAnalytics = !microsoftClarityPresent && !hasHeatmapFamily;

  if (microsoftClarityPresent) {
    return {
      microsoftClarityPresent: true,
      hotjarOrSimilarPresent,
      recommendBehaviourAnalytics: false,
      recommendationMessage:
        "Microsoft Clarity appears to be installed — free heatmaps and session recordings.",
    };
  }

  if (hotjarOrSimilarPresent) {
    return {
      microsoftClarityPresent: false,
      hotjarOrSimilarPresent: true,
      recommendBehaviourAnalytics: false,
      recommendationMessage:
        "Behaviour analytics (e.g. Hotjar-style tooling) appears present for heatmaps or recordings.",
    };
  }

  return {
    microsoftClarityPresent: false,
    hotjarOrSimilarPresent: false,
    recommendBehaviourAnalytics,
    recommendationMessage: recommendBehaviourAnalytics
      ? "No lightweight behaviour analytics detected. Microsoft Clarity (free) can add heatmaps and session recordings for conversion debugging."
      : undefined,
  };
}
