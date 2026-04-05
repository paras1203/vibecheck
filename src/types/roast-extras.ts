import type { PageSpeedSummary } from "@/lib/pagespeed";

export type PerformanceGeminiSummary = {
  summary: string;
  quickFixes: [string, string];
};

export type TrafficEstimateSource = "gemini" | "industry_default";

export type TrafficEstimate = {
  monthlySessions: number;
  source: TrafficEstimateSource;
  note?: string;
};

export type ScrollEffectiveness = {
  situation: string;
  action: string;
  evidenceBullets: string[];
};

export type RoastExtras = {
  performanceGemini?: PerformanceGeminiSummary | null;
  trafficEstimate?: TrafficEstimate;
  scrollEffectiveness?: ScrollEffectiveness;
  performance?: PageSpeedSummary | null;
};
