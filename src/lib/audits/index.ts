export type { PageSpeedStrategy } from "@/lib/audits/types";
export { fetchPerformanceAuditResult, getPageSpeedReport } from "@/lib/audits/performance-pagespeed";
export type {
  PerformanceAuditResult,
  PerformanceStrategyResult,
  PSIReportItem,
} from "@/lib/audits/performance-pagespeed";

export type { BehaviourToolsAdvice } from "@/lib/audits/behaviour-tools";
export { deriveBehaviourToolsAdvice } from "@/lib/audits/behaviour-tools";

export type { DetectedTechTool, TechConfidence, TechStackAuditResult } from "@/lib/audits/tech-stack-audit";
export { mergeTechStackResults, runPatternTechStackAudit } from "@/lib/audits/tech-stack-audit";
export { fetchOptionalTechStackApi } from "@/lib/audits/tech-stack-external";

export type { OnPageSeoAuditResult } from "@/lib/audits/on-page-seo";
export {
  analyzeOnPageSeoWithCheerio,
  runOnPageSeoAudit,
} from "@/lib/audits/on-page-seo";

export type { MetaPreviewAuditResult } from "@/lib/audits/meta-preview-audit";
export { runMetaPreviewAudit } from "@/lib/audits/meta-preview-audit";
