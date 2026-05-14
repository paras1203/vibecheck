import type { RevenueLeakEstimate } from "@/types/insight-layers";
import type { BehaviourToolsAdvice } from "@/lib/audits/behaviour-tools";
import type { MetaPreviewAuditResult } from "@/lib/audits/meta-preview-audit";
import type { OnPageSeoAuditResult } from "@/lib/audits/on-page-seo";
import type { PerformanceAuditResult, PSIReportItem } from "@/lib/audits/performance-pagespeed";
import type { SeoAnalysisResult } from "@/lib/seo-analyzer";
import type { TechStackAuditResult } from "@/lib/audits/tech-stack-audit";
import type { PageSpeedSummary } from "@/lib/pagespeed";
import type { ScrollEffectiveness } from "@/types/roast-extras";
import type { LegalHtmlSignals } from "@/lib/legal-html-signals";

export type FreeReportGapSeverity = "high" | "medium" | "low";

export type FreeReportGap = {
  severity: FreeReportGapSeverity;
  title: string;
  detail: string;
  proUnlock: string;
};

export type FreeReportScoreBreakdown = {
  seo: number;
  performance: number;
  structure: number;
  trust: number;
};

export type FreeReportPayload = {
  kind: "free_tools_v1";
  generatedAt: string;
  audited_url: string;
  device: "desktop" | "mobile";
  conversionReadinessScore: number;
  scoreBreakdown: FreeReportScoreBreakdown;
  gaps: FreeReportGap[];
  heroScreenshot: string | null;
  pageHeight: number;
  page_type: string;
  seo: SeoAnalysisResult | null;
  performance: PageSpeedSummary | null;
  performance_audit: PerformanceAuditResult | null;
  performanceOpportunitiesTop: PSIReportItem[];
  on_page_seo: OnPageSeoAuditResult | null;
  meta_preview: MetaPreviewAuditResult | null;
  tech_stack: TechStackAuditResult | null;
  behaviour_tools: BehaviourToolsAdvice | null;
  legal_signals: LegalHtmlSignals;
  revenueLeakEstimate: RevenueLeakEstimate;
  scrollEffectiveness: ScrollEffectiveness;
  quickScan: {
    price_guess: number;
    industry_guess: string;
    price_from_page: boolean;
    price_billing_note: string;
  };
};
