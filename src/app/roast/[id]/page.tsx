"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { RoastRadar } from "@/components/roast-radar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadialChart } from "@/components/ui/radial-chart";
import {
  FileDown,
  Download,
  Globe,
  Radar,
  DollarSign,
  Swords,
  Brain,
  Lightbulb,
  Wrench,
  CircleCheck,
  CircleX,
  LayoutGrid,
  Target,
  AlignLeft,
  Palette,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getIndustryInsiderPoints,
  industryInsiderBenchmarkLine,
} from "@/lib/industry-insider-copy";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useBillingBypassUnlock } from "@/hooks/use-billing-bypass-unlock";
import { SocialContentPackSection } from "@/components/admin/social-content-pack-section";
import { AuthRequiredDialog } from "@/components/auth-required-dialog";
import { FullReportUpgradePanel } from "@/components/roast/full-report-upgrade-panel";
import { ReportQuickFixesBlock } from "@/components/roast/report-quick-fixes-block";
import { HowToReadThisReport } from "@/components/roast/how-to-read-this-report";
import { ReportContextCard } from "@/components/roast/report-context-card";
import { ReportAnalyticsReadinessCard } from "@/components/roast/report-analytics-readiness-card";
import { ExperimentBacklogSection } from "@/components/roast/experiment-backlog-section";
import { ImplementationChecklistSection } from "@/components/roast/implementation-checklist-section";
import { UnlockFullReportButton } from "@/components/roast/unlock-full-report-button";
import { ShareYourScore } from "@/components/roast/share-your-score";
import {
  ScoreIntelFootnote,
  MetricIntelFootnote,
  INTEL_ESTIMATED_IMPROVEMENT,
} from "@/components/roast/report-intel-captions";
import { IconFrame } from "@/components/ui/icon-frame";
import {
  generateAuditReportHTML,
  type AuditReportPayload,
  REPORT_CATEGORY_SUB,
  REPORT_ELEMENT_SUB,
} from "@/lib/report-html";
import { generateAuditReportHTMLV2 } from "@/lib/report-html-v2";
import { RoastReportV2 } from "@/components/roast/roast-report-v2";
import { upsertRoastHistory, type RoastHistoryEntry } from "@/lib/roast-history";
import { syncRoastPayloadToCloud } from "@/lib/roast-cloud-client";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { formatReportDisplayName, reportTimestampFromRoastId } from "@/lib/report-display-name";
import {
  formatImpactLine,
  LOCKED_INSIGHT_BULLETS,
  scrollDepthNarrative,
} from "@/lib/report-ui";
import {
  meanRadarSiteScore,
  verdictLabelFromSiteScore,
} from "@/lib/site-score";
import {
  mergeRoastHeroFromSession,
  persistRoastForClientNavigation,
} from "@/lib/roast-storage";
import { FirstViewportSnapshotPanel } from "@/components/roast/first-viewport-snapshot-panel";
import {
  FULL_DIAGNOSTIC_UPGRADE_HOOK,
  INLINE_UPGRADE_NUDGE,
  PRO_UPGRADE_STRIP,
  stripDisplayMarkdown,
  stripNarrativeSegmentLabels,
} from "@/lib/report-copy";
import {
  buildRevenueLeakEstimate,
  DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD,
  DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
  fallbackInsightLayers,
} from "@/lib/insight-layers";
import { partitionLegalComplianceAuditLast } from "@/lib/legal-compliance-audit";
import { ensureQuickWinsUpTo } from "@/lib/quick-wins-fill";
import type {
  FirstImpressionInsight,
  MessagingClarityInsight,
  RevenueLeakEstimate,
  TrustGapInsight,
} from "@/types/insight-layers";
import { RevenueLeakEstimateCard } from "@/components/roast/revenue-leak-estimate-card";
import { InsightLayerCard } from "@/components/roast/insight-layer-card";
import {
  RoastSeoHealthBlock,
  RoastPageSpeedBlock,
  hasRoastSeoHealthContent,
  hasRoastPageSpeedContent,
} from "@/components/roast/roast-seo-performance-section";
import {
  RoastExpandedDiagnosticsSection,
  hasRoastExpandedDiagnosticsContent,
} from "@/components/roast/roast-expanded-diagnostics-section";
import { ScrollOfDeathCard } from "@/components/roast/scroll-of-death-card";
import type { SeoAnalysisResult } from "@/lib/seo-analyzer";
import type { PageSpeedSummary } from "@/lib/pagespeed";
import { buildScrollEffectiveness } from "@/lib/scroll-effectiveness-from-audit";
import { costOfInactionHeadlineClass } from "@/lib/revenue-scenario-accents";
import {
  RADAR_AXIS_EXPLANATIONS,
  RADAR_AXIS_LABELS,
  scoreForRadarAxis,
  radarScoreValueClass,
} from "@/lib/radar-axis-scores";
import {
  categoriesFromDetailedAudit,
  type DetailedAuditRow,
} from "@/lib/report-category-score";
import type {
  PerformanceGeminiSummary,
  ScrollEffectiveness,
  TrafficEstimate,
} from "@/types/roast-extras";
import type { ExperimentBacklogItem, ImplementationChecklistItem } from "@/types/report-artifacts";
import type { ReportArtifactsInput } from "@/lib/report-artifacts-html";

/**
 * Exact 1:1 migration from main.py render_main_audit_dashboard function (lines 4647-5283)
 * Replicates the complete dashboard structure with all sections
 */

type DetailedAuditItem = {
  status?: string;
  elementName?: string;
  fix?: string | { quickFix?: string } | null;
};

interface RoastData {
  overall_score?: number;
  overview?: {
    overallScore?: number;
    executiveSummary?: string;
    roastAnalysis?: string;
  };
  roastSummary?: string;
  headline_roast?: string;
  // Four-part narrative (hook / script / verdict / closer)
  hook?: string;
  script?: string;
  verdict?: string;
  closer?: string;
  // Legacy fields for backward compatibility
  analysis?: string;
  radarMetrics?: Record<string, number>;
  radar_scores?: Record<string, number>;
  quickWins?: Array<{
    title?: string;
    elementName?: string;
    problem?: string;
    fix?: string;
    example?: string;
    effort?: string;
    lift?: string;
    impactCode?: string;
  }>;
  quick_wins?: Array<{
    title?: string;
    elementName?: string;
    problem?: string;
    fix?: string;
    example?: string;
    effort?: string;
    lift?: string;
    impactCode?: string;
  }>;
  detailedAudit?: Record<string, DetailedAuditItem[]>;
  summary_bullets?: string[];
  audit_items?: Array<{
    element?: string;
    status?: string;
    rationale?: string;
    working?: string[];
    not_working?: string[];
    fix?: string;
    expected_impact?: string;
  }>;
  pageHeight?: number;
  price_guess?: number;
  price_from_page?: boolean;
  price_billing_note?: string;
  industry_guess?: string;
  audited_url?: string;
  heroScreenshot?: string;
  revenueLeakEstimate?: RevenueLeakEstimate;
  firstImpressionScore?: FirstImpressionInsight;
  trustGapIndex?: TrustGapInsight;
  messagingClarityScore?: MessagingClarityInsight;
  seo?: SeoAnalysisResult | null;
  page_type?: string;
  performance?: PageSpeedSummary | null;
  performanceGemini?: PerformanceGeminiSummary | null;
  performance_audit?: import("@/lib/audits/performance-pagespeed").PerformanceAuditResult | null;
  on_page_seo?: import("@/lib/audits/on-page-seo").OnPageSeoAuditResult | null;
  meta_preview?: import("@/lib/audits/meta-preview-audit").MetaPreviewAuditResult | null;
  tech_stack?: import("@/lib/audits/tech-stack-audit").TechStackAuditResult | null;
  behaviour_tools?: import("@/lib/audits/behaviour-tools").BehaviourToolsAdvice | null;
  trafficEstimate?: TrafficEstimate;
  scrollEffectiveness?: ScrollEffectiveness;
  device?: "desktop" | "mobile";
  experimentBacklog?: ExperimentBacklogItem[];
  implementationChecklist?: ImplementationChecklistItem[];
}

function categoryTabIcon(name: string): LucideIcon {
  if (name.includes("UX")) return LayoutGrid;
  if (name.includes("Conversion")) return Target;
  if (name.includes("Copy")) return AlignLeft;
  if (name.includes("Visuals")) return Palette;
  if (name.includes("Trust")) return Shield;
  if (name.includes("Speed")) return Zap;
  return LayoutGrid;
}

function roastSupplementHasContent(
  se: ScrollEffectiveness | null | undefined,
  te: TrafficEstimate | null | undefined
): boolean {
  if (
    se &&
    (String(se.situation || "").trim() ||
      String(se.action || "").trim() ||
      (se.evidenceBullets?.length ?? 0) > 0)
  ) {
    return true;
  }
  if (te?.note?.trim()) return true;
  return false;
}

function auditStatusBadgeVariant(
  status: string
): "success" | "secondary" | "warning" | "destructive" | "outline" {
  switch (status) {
    case "Excellent":
    case "Good":
      return "success";
    case "Satisfactory":
    case "Needs Improvement":
      return "warning";
    case "Failed":
      return "destructive";
    default:
      return "outline";
  }
}

export default function RoastPage() {
  const params = useParams();
  const {
    user,
    firebaseUser,
    handleGoogleAuth,
    handleEmailSignIn,
    handleEmailSignUp,
    loading: authLoading,
    isSyncing,
  } = useAuth();
  const isAdmin = useIsAdmin();
  const { bypassPaymentUnlock, sessionUnlocked, unlockFullReport } =
    useBillingBypassUnlock();
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportAuthDialog, setShowExportAuthDialog] = useState(false);
  const [price, setPrice] = useState(DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD);
  const [traffic, setTraffic] = useState(DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS);
  const [industry, setIndustry] = useState<"SaaS" | "Agency" | "E-commerce">("SaaS");

  const reportFileBase = useMemo(() => {
    if (!roastData) return "";
    const id = params.id as string;
    const ts = reportTimestampFromRoastId(id, Date.now());
    return formatReportDisplayName(roastData.audited_url, ts);
  }, [roastData, params.id]);

  const planNorm = String(user?.plan ?? "").toLowerCase();
  const isPaidPlan = Boolean(user && (planNorm === "pro" || planNorm === "agency"));
  const hasFullReportAccess =
    isPaidPlan ||
    isAdmin ||
    (bypassPaymentUnlock && sessionUnlocked);

  useEffect(() => {
    async function fetchRoast() {
      try {
        const id = params.id as string;

        const storedRoast = localStorage.getItem(`roast_${id}`);
        let cached: RoastData | null = null;
        if (storedRoast) {
          try {
            cached = mergeRoastHeroFromSession(
              id,
              JSON.parse(storedRoast) as AuditReportPayload
            ) as RoastData;
          } catch {
            cached = null;
          }
        }

        const resolveDevice = (data: RoastData): "desktop" | "mobile" =>
          data.device === "mobile" ? "mobile" : "desktop";

        async function ensureHeroScreenshot(
          data: RoastData,
          dev: "desktop" | "mobile"
        ): Promise<RoastData> {
          if (data.heroScreenshot && String(data.heroScreenshot).trim()) {
            return data;
          }
          const u = data.audited_url?.trim();
          if (!u) return data;
          try {
            const res = await fetch("/api/roast/hero", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: u, device: dev }),
            });
            if (!res.ok) return data;
            const j = (await res.json()) as { heroScreenshot?: string | null };
            const h = j.heroScreenshot;
            if (h != null && String(h).trim()) {
              return { ...data, heroScreenshot: String(h).trim() };
            }
          } catch {
            /* ignore */
          }
          return data;
        }

        try {
          const response = await fetch(`/api/roast/${id}`);
          if (response.ok) {
            const serverData = (await response.json()) as RoastData;
            const mergedRaw =
              cached != null
                ? {
                    ...cached,
                    ...serverData,
                    heroScreenshot:
                      serverData.heroScreenshot && String(serverData.heroScreenshot).trim()
                        ? serverData.heroScreenshot
                        : cached.heroScreenshot,
                  }
                : serverData;
            const merged = mergeRoastHeroFromSession(
              id,
              mergedRaw as AuditReportPayload
            ) as RoastData;
            const withHero = await ensureHeroScreenshot(merged, resolveDevice(merged));
            setRoastData(withHero);
            persistRoastForClientNavigation(id, withHero as AuditReportPayload);
            return;
          }
        } catch {
          /* fall through to cache-only */
        }

        if (cached) {
          const merged = mergeRoastHeroFromSession(
            id,
            cached as AuditReportPayload
          ) as RoastData;
          const withHero = await ensureHeroScreenshot(merged, resolveDevice(merged));
          setRoastData(withHero);
          persistRoastForClientNavigation(id, withHero as AuditReportPayload);
          return;
        }

        throw new Error("Roast not found");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load roast");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchRoast();
    }
  }, [params.id]);

  useEffect(() => {
    if (!roastData || !params.id || !user?.uid) return;
    const id = params.id as string;
    const historyEntry: RoastHistoryEntry = {
      id,
      savedAt: Date.now(),
      overallScore: roastData.overall_score || roastData.overview?.overallScore,
      auditedUrl: roastData.audited_url,
      planAtSave: user?.plan,
    };
    upsertRoastHistory(user.uid, historyEntry);

    const cloudEligible =
      user.plan === "pro" || user.plan === "agency" || isAdmin;
    if (!cloudEligible || !firebaseUser) return;
    let cancelled = false;
    void (async () => {
      try {
        const token = await firebaseUser.getIdToken();
        await syncRoastPayloadToCloud(token, historyEntry, roastData as Record<string, unknown>);
      } catch {
        if (!cancelled) {
          /* cloud sync optional */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    firebaseUser,
    isAdmin,
    params.id,
    roastData,
    user?.plan,
    user?.uid,
  ]);

  // Update price and industry when roastData loads
  useEffect(() => {
    if (roastData) {
      const pg = Number(roastData.price_guess);
      const priceFromDom =
        Boolean(roastData.price_from_page) && Number.isFinite(pg) && pg > 0;
      const defaultPrice = priceFromDom ? pg : DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD;
      const defaultIndustry = (roastData.industry_guess || "SaaS") as "SaaS" | "Agency" | "E-commerce";
      setPrice(defaultPrice);
      setIndustry(defaultIndustry);
      setTraffic(
        roastData.trafficEstimate?.monthlySessions ?? DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS
      );
    }
  }, [roastData]);

  const handleExportAuthSuccess = useCallback(() => {
    setShowExportAuthDialog(false);
  }, []);

  const requireUserForExport = useCallback(
    (run: () => void | Promise<void>) => {
      if (!user) {
        setShowExportAuthDialog(true);
        return;
      }
      void Promise.resolve(run());
    },
    [user]
  );

  const handleDownloadPDF = async () => {
    try {
      const id = params.id as string;
      if (!roastData) {
        alert("Report data not available. Please refresh the page.");
        return;
      }

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roastData,
          isPaid: hasFullReportAccess,
          url: typeof window !== "undefined" ? window.location.origin : "https://siteroast.ai",
          calculator: { traffic, price, industry },
          reportVersion: "v1",
          reportId: id,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || data.details || "Failed to generate PDF. Please try again.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = reportFileBase || `roast-${id}`;
      a.download = `${base}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleDownloadPDFV2 = async () => {
    try {
      const id = params.id as string;
      if (!roastData) {
        alert("Report data not available. Please refresh the page.");
        return;
      }

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roastData,
          isPaid: hasFullReportAccess,
          url: typeof window !== "undefined" ? window.location.origin : "https://siteroast.ai",
          calculator: { traffic, price, industry },
          reportVersion: "v2",
          reportId: id,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || data.details || "Failed to generate PDF. Please try again.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = reportFileBase || `roast-${id}`;
      a.download = `${base}_v2.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download V2 PDF:", err);
      alert("Failed to download V2 PDF. Please try again.");
    }
  };

  const buildHtmlExport = () => {
    const id = params.id as string;
    if (!roastData) return null;
    return generateAuditReportHTML(roastData as AuditReportPayload, {
      reportId: id,
      isPaid: hasFullReportAccess,
      calculator: { traffic, price, industry },
    });
  };

  const handleDownloadHTML = () => {
    try {
      const id = params.id as string;
      const htmlContent = buildHtmlExport();
      if (!htmlContent) {
        alert("Report data not available. Please refresh the page.");
        return;
      }
      const base = reportFileBase || `roast-${id}`;
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${base}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error("Failed to download HTML report:", err);
      alert("Failed to download HTML report. Please try again.");
    }
  };

  const handleViewHTML = () => {
    try {
      const htmlContent = buildHtmlExport();
      if (!htmlContent) {
        alert("Report data not available. Please refresh the page.");
        return;
      }
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open HTML report:", err);
      alert("Failed to open HTML report. Please try again.");
    }
  };

  const buildHtmlExportV2 = () => {
    const id = params.id as string;
    if (!roastData) return null;
    return generateAuditReportHTMLV2(roastData as AuditReportPayload, {
      reportId: id,
      isPaid: hasFullReportAccess,
      calculator: { traffic, price, industry },
    });
  };

  const handleDownloadHTMLV2 = () => {
    try {
      const id = params.id as string;
      const htmlContent = buildHtmlExportV2();
      if (!htmlContent) {
        alert("Report data not available. Please refresh the page.");
        return;
      }
      const base = reportFileBase || `roast-${id}`;
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${base}_v2.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error("Failed to download V2 HTML:", err);
      alert("Failed to download V2 HTML report. Please try again.");
    }
  };

  const handleViewHTMLV2 = () => {
    try {
      const htmlContent = buildHtmlExportV2();
      if (!htmlContent) {
        alert("Report data not available. Please refresh the page.");
        return;
      }
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open V2 HTML report:", err);
      alert("Failed to open V2 HTML report. Please try again.");
    }
  };

  if (loading) {
    return (
      <AuthenticatedShell contentClassName="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading roast analysis...</div>
      </AuthenticatedShell>
    );
  }

  if (error || !roastData) {
    return (
      <AuthenticatedShell contentClassName="flex flex-1 items-center justify-center">
        <div className="text-destructive">{error || "Roast not found"}</div>
      </AuthenticatedShell>
    );
  }

  // Extract data (exact from Python)
  const radarScores = roastData.radar_scores || roastData.radarMetrics || {};
  const storedOverall =
    Number(roastData.overall_score ?? roastData.overview?.overallScore) || 50;
  const hasRadarGrid =
    typeof radarScores === "object" &&
    radarScores !== null &&
    Object.keys(radarScores).length > 0;
  const overallScore = hasRadarGrid
    ? meanRadarSiteScore(radarScores as Record<string, unknown>)
    : storedOverall;
  const quickWins = ensureQuickWinsUpTo(
    roastData.quickWins || roastData.quick_wins,
    roastData.audit_items
  );
  const detailedAudit = roastData.detailedAudit || {};
  
  // Executive summary + long-form narrative (same fields as API)
  const briefSummary = roastData.hook || roastData.overview?.executiveSummary || roastData.roastSummary || "";
  
  const roast = roastData.script || roastData.analysis || roastData.overview?.roastAnalysis || "";
  const verdict = roastData.verdict || "";
  const closer = roastData.closer || "";

  const execPara = (t: string) => stripDisplayMarkdown(stripNarrativeSegmentLabels(t));

  const hasDetailedRoastSection = Boolean(
    briefSummary.trim() || roast || verdict || closer
  );
  const auditItems = partitionLegalComplianceAuditLast(roastData.audit_items || []);

  const categories = categoriesFromDetailedAudit(
    detailedAudit as unknown as Record<string, DetailedAuditRow[]>
  );

  // ROI Calculator data (exact from Python lines 2163-2165, 4772-4775)
  const pageHeight = roastData.pageHeight || 3000;
  const scrollHelp = scrollDepthNarrative(roastData.audited_url, pageHeight);
  const scrollResolved =
    roastData.scrollEffectiveness ??
    buildScrollEffectiveness(roastData, roastData.audited_url || "", pageHeight, 800);

  const radarForVerdict = {
    ...(radarScores as Record<string, unknown>),
    ...(roastData.radarMetrics as Record<string, unknown> | undefined),
  };

  // Extract components from ROI Calculator for separate display
  const lift = 0.02;
  const lostRevenue = traffic * lift * price * 12;
  const foldHeight = 800;
  const belowFold = Math.max(0, pageHeight - foldHeight);
  const belowFoldPercent = pageHeight > 0 ? (belowFold / pageHeight) * 100 : 0;
  const industryMultipliers: Record<string, number> = {
    SaaS: 2.5,
    Agency: 3.0,
    "E-commerce": 2.0,
  };
  const multiplier = industryMultipliers[industry] || 2.5;
  const competitorTraffic = Math.max(1000, Math.floor(traffic * multiplier));
  const insiderPoints = getIndustryInsiderPoints(industry);
  const upgradeImpactLine =
    (quickWins[0]?.lift ?? "").trim().length > 0
      ? formatImpactLine(quickWins[0]?.lift)
      : `${INTEL_ESTIMATED_IMPROVEMENT} when prioritized fixes ship (typical range, not guaranteed).`;
  const categoryTeaserNames = categories.map((c) => c.name);

  const radarMetricsLower: Record<string, number> = roastData.radarMetrics
    ? { ...roastData.radarMetrics }
    : {
        ux: Number(radarScores.UX ?? radarScores.ux ?? 50),
        conversion: Number(radarScores.Conversion ?? radarScores.conversion ?? 50),
        copy: Number(radarScores.Copy ?? radarScores.copy ?? 50),
        visuals: Number(radarScores.Visuals ?? radarScores.visuals ?? 50),
        trust: Number(radarScores.Trust ?? radarScores.trust ?? 50),
        speed: Number(radarScores.Speed ?? radarScores.speed ?? 50),
      };
  const trafficSessionsBaseline =
    roastData.trafficEstimate?.monthlySessions ?? DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS;
  const trafficAssumptionLine =
    traffic === trafficSessionsBaseline && roastData.trafficEstimate?.note?.trim()
      ? roastData.trafficEstimate.note.trim()
      : `Monthly sessions set to ${traffic.toLocaleString()} (editable in model inputs below; illustrative—not from your analytics).`;
  const revenueLeakEstimateResolved = buildRevenueLeakEstimate(traffic, price, {
    industryLabel: roastData.industry_guess?.trim() || industry,
    priceFromScrape: Boolean(roastData.price_from_page),
    trafficAssumptionLine,
  });
  const insightFallback = fallbackInsightLayers(radarMetricsLower);
  const firstImpressionLayer =
    roastData.firstImpressionScore ?? insightFallback.firstImpressionScore;
  const trustGapLayer = roastData.trustGapIndex ?? insightFallback.trustGapIndex;
  const messagingLayer =
    roastData.messagingClarityScore ?? insightFallback.messagingClarityScore;

  const seoHealthBlockData = {
    seo: roastData.seo,
    page_type: roastData.page_type,
    performance: roastData.performance,
  };
  const showSeoHealthBlock = hasRoastSeoHealthContent(seoHealthBlockData);

  return (
    <AuthenticatedShell>
      <div className="flex w-full min-w-0 flex-col gap-10 md:gap-12">
          <div className="flex w-full min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 shrink">
              <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Site Conversion Report
              </h1>
              {reportFileBase ? (
                <p className="mt-1 font-mono text-sm text-muted-foreground">{reportFileBase}</p>
              ) : null}
            </div>
            <div className="flex w-full min-w-0 flex-col items-stretch gap-3 md:max-w-2xl md:items-end lg:max-w-none">
              {user && roastData ? (
                <ShareYourScore compact roastData={roastData} overallScore={overallScore} />
              ) : null}
              <div className="flex w-full min-w-0 flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => requireUserForExport(() => handleDownloadPDF())}
              >
                <FileDown className="size-4 shrink-0 stroke-[1.5]" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => requireUserForExport(() => handleDownloadHTML())}
              >
                <Download className="size-4 shrink-0 stroke-[1.5]" />
                Download HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => requireUserForExport(() => handleViewHTML())}
              >
                <Globe className="size-4 shrink-0 stroke-[1.5]" />
                View in Browser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => requireUserForExport(() => handleDownloadPDFV2())}
              >
                <FileDown className="size-4 shrink-0 stroke-[1.5]" />
                Download V2 PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => requireUserForExport(() => handleDownloadHTMLV2())}
              >
                <Download className="size-4 shrink-0 stroke-[1.5]" />
                Download V2 HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => requireUserForExport(() => handleViewHTMLV2())}
              >
                <Globe className="size-4 shrink-0 stroke-[1.5]" />
                View V2 HTML
              </Button>
            </div>
            </div>
          </div>

          <Tabs defaultValue="v1">
            <div className="flex w-full min-w-0 flex-col gap-8 overflow-x-hidden">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="v1">Report V1</TabsTrigger>
              <TabsTrigger value="v2">Report V2 (beta)</TabsTrigger>
            </TabsList>

            <TabsContent value="v1" className="mt-0 flex flex-col gap-10 outline-none">

          <div className="grid w-full gap-6 rounded-lg border border-border bg-surface-1 p-6 md:grid-cols-12 md:items-stretch md:gap-8 md:p-8">
            <div className="flex w-full flex-col items-center justify-center md:col-span-3">
              <div className="flex w-full flex-col items-center justify-center rounded-xl border border-border-muted bg-surface-2/30 px-4 py-5 md:px-5 md:py-6">
                <p className="text-caption mb-4 uppercase tracking-wide text-muted-foreground">
                  Overall score
                </p>
                <RadialChart value={overallScore} size={140} strokeWidth={10} showLabel={false} />
                <p className="mt-4 text-center font-mono text-3xl font-semibold tabular-nums text-primary">
                  {Math.round(overallScore)}
                  <span className="text-base font-normal text-muted-foreground">/100</span>
                </p>
                <ScoreIntelFootnote
                  overallScore={Math.round(overallScore)}
                  auditItemCount={auditItems.length}
                  className="mt-1 w-full max-w-none text-center md:text-center"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center gap-5 border-t border-border-muted pt-6 md:col-span-9 md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <div>
                <p className="text-caption mb-1.5 text-muted-foreground">Verdict</p>
                <p className="text-xl font-semibold tracking-tight text-primary md:text-2xl">
                  {verdictLabelFromSiteScore(Math.round(overallScore), radarForVerdict)}
                </p>
              </div>
              {briefSummary ? (
                <div className="rounded-xl border border-border-muted bg-surface-2/40 p-5 md:p-6">
                  <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                    {execPara(briefSummary)}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="col-span-full border-t border-border-muted pt-6">
              <ReportQuickFixesBlock
                quickWins={quickWins}
                hasFullReportAccess={hasFullReportAccess}
                onUnlockFullReport={unlockFullReport}
              />
            </div>
            {Object.keys(radarScores).length > 0 ? (
              <div className="col-span-full border-t border-border-muted pt-6">
                <Card className="overflow-hidden border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <IconFrame size="sm" className="bg-primary/10 text-primary">
                        <Radar className="size-4 stroke-[1.5]" />
                      </IconFrame>
                      Site Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
                      <div className="min-w-0 flex-1">
                        <div className="grid grid-cols-3 gap-2">
                          {RADAR_AXIS_LABELS.map((label) => {
                            const axisScore = scoreForRadarAxis(radarScores, label);
                            return (
                              <div
                                key={label}
                                className="flex min-h-[6.75rem] flex-col justify-center rounded-lg border border-border-muted bg-surface-2/30 px-3 py-4 text-center sm:min-h-[7.25rem]"
                              >
                                <div className="text-xs font-medium text-muted-foreground">{label}</div>
                                <div
                                  className={cn(
                                    "mt-1 font-mono text-sm font-semibold tabular-nums",
                                    radarScoreValueClass(axisScore)
                                  )}
                                >
                                  {axisScore}
                                </div>
                                <p className="mt-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                                  {RADAR_AXIS_EXPLANATIONS[label]}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mx-auto w-full min-w-0 max-w-[268px] shrink-0 lg:mx-0 lg:w-[268px] lg:max-w-[268px]">
                        <div className="min-h-[240px] w-full min-w-0">
                          <RoastRadar radarMetrics={radarScores} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex w-full flex-col gap-4">
            <HowToReadThisReport />
            <ReportContextCard
              page_type={roastData.page_type}
              trafficEstimate={roastData.trafficEstimate}
              performance={roastData.performance}
              performance_audit={roastData.performance_audit ?? null}
              price_guess={roastData.price_guess}
              price_from_page={roastData.price_from_page}
              price_billing_note={roastData.price_billing_note}
            />
            <ReportAnalyticsReadinessCard
              tech_stack={roastData.tech_stack}
              behaviour_tools={roastData.behaviour_tools}
            />
          </div>

          <SectionHeader
            title="Experiments & delivery"
            description="Hypotheses tied to Quick Fixes plus an ownership-focused rollout checklist."
            size="compact"
          />
          <div className="mb-10 flex w-full flex-col gap-4">
            <ExperimentBacklogSection roastLike={roastData as ReportArtifactsInput} />
            <ImplementationChecklistSection roastLike={roastData as ReportArtifactsInput} />
          </div>

          <SectionHeader
            title="Insights & actions"
            description="For marketers and builders: structured SEO signals, economics, and technical diagnostics."
            size="compact"
          />

          <div className={cn("w-full", !showSeoHealthBlock && "md:max-w-3xl")}>
            <Card className="flex h-full min-w-0 flex-col border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <IconFrame size="sm" className="bg-primary/10 text-primary">
                    <Brain className="size-4 stroke-[1.5]" />
                  </IconFrame>
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-center gap-2 pt-0">
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  {insiderPoints.map((line, i) => (
                    <li
                      key={`insider-${i}`}
                      className="flex gap-2 rounded-lg border border-border bg-muted/50 p-2"
                    >
                      <IconFrame
                        size="sm"
                        className="mt-0.5 shrink-0 border-accent/30 bg-accent/10 text-accent"
                      >
                        <Lightbulb className="size-4 stroke-[1.5]" />
                      </IconFrame>
                      <p className="text-xs leading-snug text-foreground">{line}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <SectionHeader
            title="Executive insight layers"
            description="Scenario-based revenue risk, first-impression quality, trust gaps, and messaging clarity—aligned to the detailed audit."
            size="compact"
          />

          <div className="flex w-full flex-col gap-4">
            <RevenueLeakEstimateCard
              estimate={revenueLeakEstimateResolved}
              traffic={traffic}
              price={price}
              onTrafficChange={setTraffic}
              onPriceChange={setPrice}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InsightLayerCard
                title="First impression score"
                layer={firstImpressionLayer}
                showSubscores={hasFullReportAccess}
              />
              <InsightLayerCard
                title="Trust gap index"
                layer={trustGapLayer}
                showSubscores={hasFullReportAccess}
              />
              <InsightLayerCard
                title="Messaging clarity score"
                layer={messagingLayer}
                showSubscores={hasFullReportAccess}
              />
            </div>
          </div>

          {showSeoHealthBlock ? (
            <div className="min-w-0 w-full">
              <RoastSeoHealthBlock
                data={seoHealthBlockData}
                hasFullReportAccess={hasFullReportAccess}
              />
            </div>
          ) : null}

          {user && roastData ? (
            <ShareYourScore roastData={roastData} overallScore={overallScore} />
          ) : null}

          {isAdmin && roastData ? (
            <SocialContentPackSection
              roastData={roastData}
              firebaseUser={firebaseUser}
              reportId={params.id as string}
            />
          ) : null}

          {!hasFullReportAccess ? (
            <FullReportUpgradePanel
              overallScore={overallScore}
              verdictLabel={verdictLabelFromSiteScore(Math.round(overallScore), radarForVerdict)}
              categoryTeasers={categoryTeaserNames}
              beforeSnippet={quickWins[0]?.problem ?? null}
              afterSnippet={quickWins[0]?.fix ?? null}
              benchmarkLine={industryInsiderBenchmarkLine(industry)}
              impactLine={upgradeImpactLine}
              onUnlockFullReport={unlockFullReport}
            />
          ) : null}

          <SectionHeader
            title="Performance & economics"
            description="For revenue and product owners: speed snapshot, revenue scenarios, market context, and scroll behavior."
            size="compact"
          />

          {hasRoastPageSpeedContent({
            seo: roastData.seo,
            page_type: roastData.page_type,
            performance: roastData.performance,
            performanceGemini: roastData.performanceGemini,
          }) ? (
            <RoastPageSpeedBlock
              data={{
                seo: roastData.seo,
                page_type: roastData.page_type,
                performance: roastData.performance,
                performanceGemini: roastData.performanceGemini,
              }}
            />
          ) : null}

          {roastData &&
          hasRoastExpandedDiagnosticsContent({
            performance_audit: roastData.performance_audit,
            on_page_seo: roastData.on_page_seo,
            meta_preview: roastData.meta_preview,
            tech_stack: roastData.tech_stack,
            behaviour_tools: roastData.behaviour_tools,
          }) ? (
            <RoastExpandedDiagnosticsSection
              performance_audit={roastData.performance_audit}
              on_page_seo={roastData.on_page_seo}
              meta_preview={roastData.meta_preview}
              tech_stack={roastData.tech_stack}
              behaviour_tools={roastData.behaviour_tools}
            />
          ) : null}

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <Card className="flex h-full flex-col border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <IconFrame size="sm" className="bg-primary/10 text-primary">
                    <DollarSign className="size-4 stroke-[1.5]" />
                  </IconFrame>
                  The Cost of Inaction
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-center pt-0">
                <div className={cn("mb-1 text-2xl font-semibold tabular-nums", costOfInactionHeadlineClass())}>
                  ${lostRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-sm text-muted-foreground">
                  Revenue you leave on the table annually (illustrative).
                </p>
                <MetricIntelFootnote className="mt-2">
                  {INTEL_ESTIMATED_IMPROVEMENT}
                </MetricIntelFootnote>
              </CardContent>
            </Card>

            <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <IconFrame size="sm" className="bg-primary/10 text-primary">
                    <Swords className="size-4 stroke-[1.5]" />
                  </IconFrame>
                  The Competitor Gap
                </CardTitle>
              </CardHeader>
              <CardContent className="relative flex flex-1 flex-col justify-center pb-4 pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">You</span>
                    <span className="font-mono font-semibold tabular-nums text-muted-foreground">
                      {traffic.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Top competitor</span>
                    <span className="font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {competitorTraffic.toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Competitors get{" "}
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {multiplier.toFixed(1)}×
                  </span> your traffic.
                </p>
              </CardContent>
            </Card>
          </div>

          <ScrollOfDeathCard
            belowFoldPercent={belowFoldPercent}
            foldHeight={foldHeight}
            pageHeight={pageHeight}
            scrollHelp={scrollHelp}
            scrollEffectiveness={scrollResolved}
          />

          <FirstViewportSnapshotPanel
            heroBase64={roastData.heroScreenshot}
            siteLabel={roastData.audited_url}
          />

          {hasDetailedRoastSection ? (
            <Card className="w-full overflow-visible border-border bg-surface-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Executive summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Condensed narrative from the full audit—analysis, verdict, and recommended direction.
                </p>
              </CardHeader>
              <CardContent className="overflow-visible pb-8 pt-0">
                <div className="space-y-8 rounded-lg border border-border bg-muted/30 p-6 md:p-8">
                  {briefSummary.trim() ? (
                    <section className="min-w-0">
                      <h3 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
                        Summary
                      </h3>
                      <p className="text-sm leading-relaxed text-card-foreground [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                        {execPara(briefSummary.trim())}
                      </p>
                    </section>
                  ) : null}
                  {roast ? (
                    <section
                      className={cn(
                        "min-w-0",
                        briefSummary.trim() && "border-t border-border-muted pt-8"
                      )}
                    >
                      <h3 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
                        Analysis
                      </h3>
                      <p className="text-sm leading-relaxed text-card-foreground [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                        {execPara(roast)}
                      </p>
                    </section>
                  ) : null}
                  {verdict ? (
                    <section className="min-w-0 border-t border-border-muted pt-8">
                      <h3 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
                        Verdict
                      </h3>
                      <p className="text-sm leading-relaxed text-card-foreground [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                        {execPara(verdict)}
                      </p>
                    </section>
                  ) : null}
                  {closer ? (
                    <section className="min-w-0 border-t border-border-muted pt-8">
                      <h3 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
                        What to do next
                      </h3>
                      <p className="text-sm leading-relaxed text-card-foreground [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                        {execPara(closer)}
                      </p>
                    </section>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {categories.length > 0 ? (
            <SectionHeader
              title="Category deep dive"
              description={REPORT_CATEGORY_SUB}
              size="compact"
            />
          ) : null}

          {/* Category deep dive (before element-by-element audit) */}
          <Card>
            <CardContent className="pt-6">
              {categories.length > 0 ? (
                <Tabs defaultValue={categories[0]?.name}>
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    {categories.map((cat) => {
                      const CatIcon = categoryTabIcon(cat.name);
                      return (
                        <TabsTrigger
                          key={cat.name}
                          value={cat.name}
                          className="gap-1.5 text-xs sm:text-sm"
                        >
                          <CatIcon className="size-4 shrink-0 stroke-[1.5] opacity-80" />
                          <span className="truncate">{cat.name}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {categories.map((cat) => (
                    <TabsContent key={cat.name} value={cat.name} className="space-y-4">
                      <div>
                        <Badge variant={cat.impact === "High" ? "destructive" : "secondary"}>
                          Impact: {cat.impact} {cat.impact === "High" ? "- Priority fix" : ""}
                        </Badge>
                        <p className="mt-2 text-sm">
                          <strong>Score:</strong>{" "}
                          <span
                            className={cn(
                              "font-mono font-semibold tabular-nums",
                              radarScoreValueClass(cat.score)
                            )}
                          >
                            {cat.score}
                          </span>
                          /100 | <strong>Verdict:</strong>{" "}
                          <span className={radarScoreValueClass(cat.score)}>{cat.verdict}</span>
                        </p>
                      </div>
                      {!hasFullReportAccess ? (
                        <>
                          <ul className="list-none space-y-1.5 text-sm text-muted-foreground">
                            {LOCKED_INSIGHT_BULLETS.map((line, i) => (
                              <li key={i} className="flex gap-2 border-l-2 border-primary/25 pl-2">
                                <span className="select-none">•</span>
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                            <p className="text-sm text-muted-foreground">{FULL_DIAGNOSTIC_UPGRADE_HOOK}</p>
                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                              <UnlockFullReportButton onUnlock={unlockFullReport} />
                              <Button variant="outline" asChild>
                                <Link href="#full-report-upgrade">Upgrade section</Link>
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {cat.what_works && (
                            <div className="rounded-lg border border-success/30 bg-success/10 p-3">
                              <p className="mb-1 flex items-center gap-1.5 font-semibold">
                                <CircleCheck className="size-4 stroke-[1.5] text-chart-4" />
                                What Works:
                              </p>
                              <p className="text-sm">{cat.what_works}</p>
                            </div>
                          )}
                          {cat.what_failed && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                              <p className="mb-1 flex items-center gap-1.5 font-semibold">
                                <CircleX className="size-4 stroke-[1.5] text-destructive" />
                                What Failed:
                              </p>
                              <p className="text-sm">{cat.what_failed}</p>
                            </div>
                          )}
                          {cat.fix_steps.length > 0 && (
                            <div>
                              <p className="mb-2 flex items-center gap-1.5 font-semibold">
                                <Wrench className="size-4 stroke-[1.5] text-muted-foreground" />
                                Fix Steps:
                              </p>
                              <ul className="space-y-2">
                                {cat.fix_steps.map((step, idx) => (
                                  <li
                                    key={idx}
                                    className="rounded-lg border border-border bg-muted/40 p-3 text-sm"
                                  >
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {!cat.what_works && !cat.what_failed && cat.fix_steps.length === 0 && (
                            <p className="text-muted-foreground">No specific findings for this category.</p>
                          )}
                        </>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <p className="text-muted-foreground">
                  {hasFullReportAccess
                    ? "Category-level breakdown was not returned for this roast. The element audit and quick wins below may still be complete—try re-running if you expected category tabs."
                    : "No category data available."}
                </p>
              )}
            </CardContent>
          </Card>

          {auditItems.length > 0 ? (
            <SectionHeader
              title="Element-by-element audit"
              description={REPORT_ELEMENT_SUB}
              size="compact"
            />
          ) : null}

          {auditItems.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {(hasFullReportAccess ? auditItems : auditItems.slice(0, 6)).map((item, idx) => {
                    const status = item.status || "Unknown";

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-border bg-card/50 p-4 shadow-surface-xs"
                      >
                        <h4 className="mb-2 flex flex-wrap items-center gap-2 font-semibold">
                          <span>{item.element || "Element"}</span>
                          <Badge variant={auditStatusBadgeVariant(status)}>
                            {status}
                          </Badge>
                        </h4>
                        {item.rationale && (
                          <p
                            className={cn(
                              "mb-3 text-sm",
                              !hasFullReportAccess && "line-clamp-2 text-muted-foreground"
                            )}
                          >
                            <strong>{hasFullReportAccess ? "Rationale" : "Context"}:</strong> {item.rationale}
                          </p>
                        )}
                        {!hasFullReportAccess ? (
                          <ul className="list-none space-y-1.5 text-sm text-muted-foreground">
                            {LOCKED_INSIGHT_BULLETS.map((line, i) => (
                              <li key={i} className="flex gap-2 border-l-2 border-primary/25 pl-2">
                                <span className="select-none">•</span>
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <>
                            {(item.working && item.working.length > 0) ||
                            (item.not_working && item.not_working.length > 0) ? (
                              <div className="rounded-xl border border-border-muted bg-muted/25 p-4 md:p-5">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                                  {item.working && item.working.length > 0 ? (
                                    <div className="min-w-0">
                                      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                                        <CircleCheck className="size-4 shrink-0 stroke-[1.5] text-chart-4" />
                                        What&apos;s working
                                      </p>
                                      <ul className="ml-1 list-outside list-disc space-y-2 pl-5 text-sm leading-snug text-foreground marker:text-chart-4">
                                        {item.working.map((w, i) => (
                                          <li key={i} className="pl-0.5">
                                            {w}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : null}
                                  {item.not_working && item.not_working.length > 0 ? (
                                    <div className="min-w-0">
                                      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                                        <CircleX className="size-4 shrink-0 stroke-[1.5] text-destructive" />
                                        What&apos;s not working
                                      </p>
                                      <ul className="ml-1 list-outside list-disc space-y-2 pl-5 text-sm leading-snug text-foreground marker:text-destructive">
                                        {item.not_working.map((nw, i) => (
                                          <li key={i} className="pl-0.5">
                                            {nw}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                            {item.fix && (
                              <div className="mt-3">
                                <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                                  <Wrench className="size-4 shrink-0 stroke-[1.5] text-muted-foreground" />
                                  Fix:
                                </p>
                                <p className="text-sm">{item.fix}</p>
                              </div>
                            )}
                            {item.expected_impact && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">
                                  <strong>Expected Impact:</strong> {item.expected_impact}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!hasFullReportAccess ? (
                  <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-center">
                    <p className="text-sm text-muted-foreground">{PRO_UPGRADE_STRIP}</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <UnlockFullReportButton onUnlock={unlockFullReport} />
                      <Button variant="outline" asChild>
                        <Link href="#full-report-upgrade">Upgrade section</Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {roastSupplementHasContent(scrollResolved, roastData.trafficEstimate) ? (
            <>
              <SectionHeader
                title="Supplementary audit coverage"
                description="Context from the roast pipeline that does not appear in other sections of this report."
                size="compact"
              />
              <Card>
                <CardContent className="space-y-4 pt-6">
                  {scrollResolved &&
                  (String(scrollResolved.situation || "").trim() ||
                    String(scrollResolved.action || "").trim() ||
                    (scrollResolved.evidenceBullets?.length ?? 0) > 0) ? (
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Scroll effectiveness
                      </p>
                      {scrollResolved.situation ? (
                        <p className="mt-2 text-sm">{scrollResolved.situation}</p>
                      ) : null}
                      {scrollResolved.action ? (
                        <p className="mt-2 text-sm">
                          <span className="font-semibold">Next step</span> {scrollResolved.action}
                        </p>
                      ) : null}
                      {scrollResolved.evidenceBullets && scrollResolved.evidenceBullets.length > 0 ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                          {scrollResolved.evidenceBullets.filter(Boolean).map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                  {roastData.trafficEstimate?.note?.trim() ? (
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Traffic estimate note
                      </p>
                      <p className="mt-2 text-sm">{roastData.trafficEstimate.note.trim()}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </>
          ) : null}
            </TabsContent>
            <TabsContent value="v2" className="mt-0 flex flex-col gap-10 outline-none">
              <RoastReportV2
                roastData={roastData as AuditReportPayload}
                reportId={params.id as string}
                hasFullReportAccess={hasFullReportAccess}
                unlockFullReport={unlockFullReport}
                traffic={traffic}
                price={price}
                industry={industry}
                setTraffic={setTraffic}
                setPrice={setPrice}
              />
            </TabsContent>
            </div>
          </Tabs>
          <AuthRequiredDialog
            open={showExportAuthDialog}
            onOpenChange={setShowExportAuthDialog}
            allowDismiss
            title="Sign in to export"
            description="Exports are tied to your account. Sign in to download PDF or HTML, or open the report in a new tab."
            onAuthSuccess={handleExportAuthSuccess}
            onGoogleAuth={handleGoogleAuth}
            onEmailSignIn={handleEmailSignIn}
            onEmailSignUp={handleEmailSignUp}
            loading={authLoading || isSyncing}
          />
        </div>
    </AuthenticatedShell>
  );
}
