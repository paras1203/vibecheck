export type InsightPriority = "high" | "medium" | "low";

export type ScoreTriple = {
  current: number;
  proposed: number;
  impact: string;
};

export type RevenueScenario = {
  label: string;
  conversionUpliftRate: number;
};

export type RevenueLeakEstimate = {
  disclaimer: string;
  methodology: string;
  assumptions: string[];
  scenarios: {
    low: RevenueScenario;
    base: RevenueScenario;
    high: RevenueScenario;
  };
  /** Precomputed annual USD at default traffic/price for static exports */
  annualLeakUsdDefaults?: {
    low: number;
    base: number;
    high: number;
  };
};

export type InsightLayerBlock = {
  layerSummary: string;
  priority: InsightPriority;
  composite: ScoreTriple;
  subscores: Record<string, ScoreTriple>;
  highPrioritySignals: string[];
};

export type FirstImpressionInsight = InsightLayerBlock & {
  subscores: {
    headlineClarity: ScoreTriple;
    ctaVisibility: ScoreTriple;
    visualHierarchy: ScoreTriple;
  };
};

export type TrustGapInsight = InsightLayerBlock & {
  subscores: {
    testimonials: ScoreTriple;
    guarantees: ScoreTriple;
    proof: ScoreTriple;
    perceivedRisk: ScoreTriple;
  };
};

export type MessagingClarityInsight = InsightLayerBlock & {
  subscores: {
    valueProposition: ScoreTriple;
    readability: ScoreTriple;
    specificity: ScoreTriple;
  };
};
