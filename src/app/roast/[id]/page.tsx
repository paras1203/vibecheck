"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSidebar } from "@/components/app-sidebar";
import { RoastRadar } from "@/components/roast-radar";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadialChart } from "@/components/ui/radial-chart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  FileDown,
  Download,
  Globe,
  Radar,
  DollarSign,
  Swords,
  Brain,
  Lightbulb,
  Calculator,
  Rocket,
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
import { UnlockFullReportButton } from "@/components/roast/unlock-full-report-button";
import { ShareYourScore } from "@/components/roast/share-your-score";
import {
  ScoreIntelFootnote,
  MetricIntelFootnote,
  BenchmarkHint,
  INTEL_ESTIMATED_IMPROVEMENT,
} from "@/components/roast/report-intel-captions";
import { IconFrame } from "@/components/ui/icon-frame";
import {
  generateAuditReportHTML,
  type AuditReportPayload,
} from "@/lib/report-html";
import { upsertRoastHistory } from "@/lib/roast-history";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { formatReportDisplayName, reportTimestampFromRoastId } from "@/lib/report-display-name";
import {
  formatEffortLine,
  formatImpactLine,
  LOCKED_INSIGHT_BULLETS,
  scrollDepthNarrative,
} from "@/lib/report-ui";
import {
  mergeRoastHeroFromSession,
  persistRoastForClientNavigation,
} from "@/lib/roast-storage";
import { AttentionHeatmapPanel } from "@/components/roast/attention-heatmap-panel";
import {
  FULL_DIAGNOSTIC_UPGRADE_HOOK,
  INLINE_UPGRADE_NUDGE,
  PRO_UPGRADE_STRIP,
  stripNarrativeSegmentLabels,
} from "@/lib/report-copy";
import {
  buildRevenueLeakEstimate,
  defaultMonthlySessionsForRoast,
  fallbackInsightLayers,
} from "@/lib/insight-layers";
import { partitionLegalComplianceAuditLast } from "@/lib/legal-compliance-audit";
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
} from "@/components/roast/roast-seo-performance-section";
import { ScrollOfDeathCard } from "@/components/roast/scroll-of-death-card";
import type { SeoAnalysisResult } from "@/lib/seo-analyzer";
import type { PageSpeedSummary } from "@/lib/pagespeed";

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
  }>;
  quick_wins?: Array<{
    title?: string;
    elementName?: string;
    problem?: string;
    fix?: string;
    example?: string;
    effort?: string;
    lift?: string;
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

function auditStatusBadgeVariant(
  status: string
): "success" | "secondary" | "warning" | "destructive" | "outline" {
  switch (status) {
    case "Excellent":
      return "success";
    case "Good":
      return "secondary";
    case "Satisfactory":
      return "outline";
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
  const pathname = usePathname();
  const {
    user,
    firebaseUser,
    handleGoogleAuth,
    handleEmailSignIn,
    handleEmailSignUp,
    sendEmailSignInLink,
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
  const [price, setPrice] = useState(50.0);
  const [traffic, setTraffic] = useState(1000);
  const [industry, setIndustry] = useState<"SaaS" | "Agency" | "E-commerce">("SaaS");
  const [openQuickFixIndex, setOpenQuickFixIndex] = useState<number | null>(null);

  const reportFileBase = useMemo(() => {
    if (!roastData) return "";
    const id = params.id as string;
    const ts = reportTimestampFromRoastId(id, Date.now());
    return formatReportDisplayName(roastData.audited_url, ts);
  }, [roastData, params.id]);

  const isPaidPlan = Boolean(
    user && (user.plan === "pro" || user.plan === "agency")
  );
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

        async function ensureHeroScreenshot(data: RoastData): Promise<RoastData> {
          if (data.heroScreenshot && String(data.heroScreenshot).trim()) {
            return data;
          }
          const u = data.audited_url?.trim();
          if (!u) return data;
          try {
            const res = await fetch("/api/roast/hero", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: u, device: "desktop" }),
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

        const heroMissing =
          !cached?.heroScreenshot ||
          !String(cached.heroScreenshot).trim();

        if (cached && !heroMissing) {
          setRoastData(cached);
          setLoading(false);
          return;
        }

        if (cached && heroMissing) {
          const withHero = await ensureHeroScreenshot(cached);
          setRoastData(withHero);
          persistRoastForClientNavigation(id, withHero as AuditReportPayload);
          setLoading(false);
          return;
        }

        try {
          const response = await fetch(`/api/roast/${id}`);
          if (response.ok) {
            const data = (await response.json()) as RoastData;
            const mergedRaw =
              cached != null
                ? {
                    ...cached,
                    ...data,
                    heroScreenshot: data.heroScreenshot ?? cached.heroScreenshot,
                  }
                : data;
            const merged = mergeRoastHeroFromSession(
              id,
              mergedRaw as AuditReportPayload
            ) as RoastData;
            const withHero = await ensureHeroScreenshot(merged);
            setRoastData(withHero);
            persistRoastForClientNavigation(id, withHero as AuditReportPayload);
          } else {
            throw new Error("Roast not found");
          }
        } catch {
          throw new Error("Failed to load roast");
        }
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
    if (!roastData || !params.id) return;
    const id = params.id as string;
    upsertRoastHistory(user?.uid, {
      id,
      savedAt: Date.now(),
      overallScore:
        roastData.overall_score || roastData.overview?.overallScore,
      auditedUrl: roastData.audited_url,
      planAtSave: user?.plan,
    });
  }, [roastData, params.id, user?.uid, user?.plan]);

  // Update price and industry when roastData loads
  useEffect(() => {
    if (roastData) {
      const defaultPrice = roastData.price_guess || 50.0;
      const defaultIndustry = (roastData.industry_guess || "SaaS") as "SaaS" | "Agency" | "E-commerce";
      setPrice(defaultPrice);
      setIndustry(defaultIndustry);
      setTraffic(defaultMonthlySessionsForRoast(roastData.industry_guess || "SaaS"));
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

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-muted-foreground">Loading roast analysis...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !roastData) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-destructive">{error || "Roast not found"}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Extract data (exact from Python)
  const overallScore = roastData.overall_score || roastData.overview?.overallScore || 50;
  const radarScores = roastData.radar_scores || roastData.radarMetrics || {};
  const quickWins = roastData.quickWins || roastData.quick_wins || [];
  const detailedAudit = roastData.detailedAudit || {};
  
  // Executive summary + long-form narrative (same fields as API)
  const briefSummary = roastData.hook || roastData.overview?.executiveSummary || roastData.roastSummary || "";
  
  // Detailed Roast Summary: All 4 parts (for Large 1x1 Grid)
  const stopper = roastData.hook || roastData.overview?.executiveSummary || roastData.roastSummary || "";
  
  const roast = roastData.script || roastData.analysis || roastData.overview?.roastAnalysis || "";
  const verdict = roastData.verdict || "";
  const closer = roastData.closer || "";

  // Check if we have detailed roast data to display
  const hasDetailedRoast = stopper || roast || verdict || closer;
  const auditItems = partitionLegalComplianceAuditLast(roastData.audit_items || []);

  const CATEGORY_TAB_ORDER = [
    "UX & Layout",
    "Conversion & Funnel",
    "Copy & Messaging",
    "Visuals & Brand",
    "Trust & Credibility",
    "Speed & Technical Health",
  ] as const;
  
  // ROI Calculator data (exact from Python lines 2163-2165, 4772-4775)
  const pageHeight = roastData.pageHeight || 3000;
  const scrollHelp = scrollDepthNarrative(roastData.audited_url, pageHeight);

  const getVerdictText = (score: number) => {
    if (score < 50) return "CRITICAL CONDITION";
    if (score < 80) return "NEEDS OPTIMIZATION";
    return "EXCELLENT";
  };

  // Build categories from detailedAudit (exact from Python lines 5165-5214)
  const categoryNames: Record<string, string> = {
    ux: "UX & Layout",
    conversion: "Conversion & Funnel",
    copy: "Copy & Messaging",
    visuals: "Visuals & Brand",
    trust: "Trust & Credibility",
    speed: "Speed & Technical Health",
  };

  const categories: Array<{
    name: string;
    score: number;
    verdict: string;
    impact: string;
    what_works: string;
    what_failed: string;
    fix_steps: string[];
  }> = [];

  if (detailedAudit && Object.keys(detailedAudit).length > 0) {
    const statusPoints: Record<string, number> = {
      Excellent: 95,
      Good: 80,
      Satisfactory: 60,
      "Needs Improvement": 35,
      Failed: 5,
    };

    for (const [catKey, items] of Object.entries(detailedAudit)) {
      if (items && items.length > 0) {
        const catName = categoryNames[catKey.toLowerCase()] || catKey;
        const scores = items.map((item) =>
          statusPoints[item.status || "Satisfactory"] || 60
        );
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

        const whatWorksItems = items.filter(
          (item) => item.status === "Excellent" || item.status === "Good"
        );
        const whatFailedItems = items.filter(
          (item) => item.status === "Failed" || item.status === "Needs Improvement"
        );

        const whatWorks = whatWorksItems
          .slice(0, 3)
          .map((item) => item.elementName || "")
          .join("; ");
        const whatFailed = whatFailedItems
          .slice(0, 3)
          .map((item) => item.elementName || "")
          .join("; ");

        const fixSteps: string[] = [];
        for (const item of whatFailedItems.slice(0, 3)) {
          const fix = item.fix || {};
          if (typeof fix === "object" && fix !== null) {
            const quickFix = fix.quickFix || "";
            if (quickFix) {
              fixSteps.push(`${item.elementName || "Item"}: ${quickFix}`);
            }
          } else if (fix) {
            fixSteps.push(`${item.elementName || "Item"}: ${String(fix)}`);
          }
        }

        const verdict =
          avgScore < 60 ? "Needs Improvement" : avgScore < 80 ? "Good" : "Excellent";
        const impact = whatFailedItems.length > 0 ? "High" : "Medium";

        categories.push({
          name: catName,
          score: avgScore,
          verdict,
          impact,
          what_works: whatWorks,
          what_failed: whatFailed,
          fix_steps: fixSteps,
        });
      }
    }
    categories.sort((a, b) => {
      const ia = CATEGORY_TAB_ORDER.indexOf(a.name as (typeof CATEGORY_TAB_ORDER)[number]);
      const ib = CATEGORY_TAB_ORDER.indexOf(b.name as (typeof CATEGORY_TAB_ORDER)[number]);
      return (ia === -1 ? 100 : ia) - (ib === -1 ? 100 : ib);
    });
  }

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
  const revenueLeakEstimateResolved = buildRevenueLeakEstimate(traffic, price, {
    industryLabel: industry,
    priceFromScrape: Boolean(roastData.price_from_page),
  });
  const insightFallback = fallbackInsightLayers(radarMetricsLower);
  const firstImpressionLayer =
    roastData.firstImpressionScore ?? insightFallback.firstImpressionScore;
  const trustGapLayer = roastData.trustGapIndex ?? insightFallback.trustGapIndex;
  const messagingLayer =
    roastData.messagingClarityScore ?? insightFallback.messagingClarityScore;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "14.4rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-auto">
        <div className="ml-[14.4rem] flex min-h-screen w-[calc(100%-14.4rem)] max-w-[min(100%,88rem)] flex-col items-stretch justify-start gap-10 bg-background p-6 pt-8 md:gap-12 md:p-10 md:pt-10">
          <div className="flex w-full flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Site Conversion Report
              </h1>
              {reportFileBase ? (
                <p className="mt-1 font-mono text-sm text-muted-foreground">{reportFileBase}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>

          <div className="grid w-full gap-6 rounded-lg border border-border bg-surface-1 p-6 md:grid-cols-12 md:items-stretch md:gap-8 md:p-8">
            <div className="flex flex-col items-center justify-center md:col-span-5">
              <p className="text-caption mb-3 uppercase tracking-wide text-muted-foreground">
                Overall score
              </p>
              <RadialChart value={overallScore} size={160} strokeWidth={12} showLabel={false} />
              <p className="mt-3 text-center font-mono text-2xl font-semibold tabular-nums text-primary">
                {Math.round(overallScore)}
                <span className="text-sm font-normal text-muted-foreground">/100</span>
              </p>
              <ScoreIntelFootnote
                overallScore={Math.round(overallScore)}
                auditItemCount={auditItems.length}
                className="md:px-0"
              />
            </div>
            <div className="flex flex-col justify-center gap-5 border-t border-border-muted pt-6 md:col-span-7 md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <div>
                <p className="text-caption mb-1.5 text-muted-foreground">Verdict</p>
                <p className="text-xl font-semibold tracking-tight text-primary md:text-2xl">
                  {getVerdictText(overallScore)}
                </p>
              </div>
              {briefSummary ? (
                <div className="rounded-lg border border-border-muted bg-surface-2/40 p-4 md:p-5">
                  <p className="text-sm leading-relaxed text-foreground md:text-base whitespace-pre-line">
                    {stripNarrativeSegmentLabels(briefSummary)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {hasRoastSeoHealthContent({
            seo: roastData.seo,
            page_type: roastData.page_type,
            performance: roastData.performance,
          }) ? (
            <>
              <SectionHeader title="SEO health" size="compact" />
              <RoastSeoHealthBlock
                data={{
                  seo: roastData.seo,
                  page_type: roastData.page_type,
                  performance: roastData.performance,
                }}
              />
            </>
          ) : null}

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

          {isAdmin ? (
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
              verdictLabel={getVerdictText(overallScore)}
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
            description="Lab speed (when available), radar, revenue at risk, competitive context, scroll behavior, and viewport attention."
            size="compact"
          />

          <RoastPageSpeedBlock
            data={{
              seo: roastData.seo,
              page_type: roastData.page_type,
              performance: roastData.performance,
            }}
          />

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {Object.keys(radarScores).length > 0 && (
              <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <IconFrame size="sm" className="bg-primary/10 text-primary">
                      <Radar className="size-4 stroke-[1.5]" />
                    </IconFrame>
                    Site Score Radar
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative flex flex-1 flex-col justify-center pb-4 pt-0">
                  {!hasFullReportAccess && (
                    <div className="mb-2 grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                      {Object.entries(radarScores).map(([k, v]) => (
                        <span
                          key={k}
                          className="truncate rounded border border-border-muted px-1 py-0.5 text-center font-mono tabular-nums"
                          title={`${k}: ${v}`}
                        >
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex min-h-[200px] flex-1 items-center justify-center">
                    <RoastRadar radarMetrics={radarScores} />
                  </div>
                </CardContent>
              </Card>
            )}

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
                <div className="mb-1 font-mono text-2xl font-semibold tabular-nums text-primary">
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
                    <span className="font-mono font-semibold tabular-nums text-primary">
                      {competitorTraffic.toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Competitors get{" "}
                  <span className="font-semibold text-primary">{multiplier.toFixed(1)}×</span> your traffic.
                </p>
              </CardContent>
            </Card>
          </div>

          <ScrollOfDeathCard
            belowFoldPercent={belowFoldPercent}
            foldHeight={foldHeight}
            pageHeight={pageHeight}
            scrollHelp={scrollHelp}
          />

          <AttentionHeatmapPanel
            heroBase64={roastData.heroScreenshot}
            siteLabel={roastData.audited_url}
          />

          <SectionHeader
            title="Insights & actions"
            description="Industry signal, revenue model, and prioritized quick wins."
            size="compact"
          />

          {/* 3x1 Grid: Industry Insight, Revenue Impact Calculator, Quick Fixes (25%, 25%, 50%) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full" style={{ minHeight: '240px' }}>
            {/* Industry Insight - 25% (1/4) */}
            <Card className="border-border bg-card flex flex-col h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <IconFrame size="sm" className="bg-primary/10 text-primary">
                    <Brain className="size-4 stroke-[1.5]" />
                  </IconFrame>
                  Industry Insider
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col justify-center flex-1 gap-2">
                <ul className="space-y-2">
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
                      <p className="text-xs text-foreground leading-snug">{line}</p>
                    </li>
                  ))}
                </ul>
                <BenchmarkHint className="mt-1" />
              </CardContent>
            </Card>

            {/* Revenue Impact Calculator - 25% (1/4) */}
            <Card className="border-border bg-card flex flex-col h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconFrame size="sm" className="bg-primary/10 text-primary">
                    <Calculator className="size-4 stroke-[1.5]" />
                  </IconFrame>
                  Revenue Impact Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col justify-center flex-1">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="price" className="text-xs">Est. monthly order value ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min={1}
                      max={10000}
                      step={1}
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="traffic" className="text-xs">Monthly Traffic</Label>
                    <Input
                      id="traffic"
                      type="number"
                      min={100}
                      max={1000000}
                      step={100}
                      value={traffic}
                      onChange={(e) => setTraffic(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry" className="text-xs">Industry</Label>
                    <select
                      id="industry"
                      value={industry}
                      onChange={(e) =>
                        setIndustry(e.target.value as "SaaS" | "Agency" | "E-commerce")
                      }
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="SaaS">SaaS</option>
                      <option value="Agency">Agency</option>
                      <option value="E-commerce">E-commerce</option>
                    </select>
                  </div>
                  {roastData.price_billing_note ? (
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {roastData.price_billing_note}
                    </p>
                  ) : null}
                  <BenchmarkHint className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Fixes - 50% (2/4) */}
            <Card className="md:col-span-2 border-border bg-card flex flex-col h-full overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconFrame size="sm" className="bg-primary/10 text-primary">
                    <Rocket className="size-4 stroke-[1.5]" />
                  </IconFrame>
                  Quick Fixes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2 overflow-y-auto pt-0">
                <MetricIntelFootnote className="mt-0 mb-0.5">
                  {INTEL_ESTIMATED_IMPROVEMENT} when prioritized fixes ship (typical range, not guaranteed).
                </MetricIntelFootnote>
                {quickWins.length > 0 ? (
                  quickWins.slice(0, hasFullReportAccess ? quickWins.length : 3).map((win, idx) => {
                    const effortLine = formatEffortLine(win.effort);
                    const impactLine = formatImpactLine(win.lift);
                    const detailLocked = !hasFullReportAccess && idx >= 1;

                    return (
                      <Sheet key={idx} open={openQuickFixIndex === idx} onOpenChange={(open) => setOpenQuickFixIndex(open ? idx : null)}>
                        <div className="relative rounded-lg border border-border bg-surface-2/35 p-4 transition-colors hover:bg-surface-2/50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="mb-2 text-sm font-semibold leading-tight">
                                {idx + 1}. {win.title || win.elementName || "Quick win"}
                              </h4>
                              <p className="text-xs text-muted-foreground">{effortLine}</p>
                              <p className="text-xs text-muted-foreground">{impactLine}</p>
                              {detailLocked ? (
                                <ul className="mt-3 list-none space-y-1 border-t border-border-muted pt-3 text-xs text-muted-foreground">
                                  {LOCKED_INSIGHT_BULLETS.map((line, i) => (
                                    <li key={i} className="flex gap-2 border-l-2 border-primary/25 pl-2">
                                      <span className="select-none">•</span>
                                      <span>{line}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                            <SheetTrigger asChild disabled={detailLocked}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0 text-xs"
                                disabled={detailLocked}
                              >
                                View Details
                              </Button>
                            </SheetTrigger>
                          </div>
                          {detailLocked ? (
                            <div className="mt-3 border-t border-border-muted pt-3 text-center">
                              <p className="text-[11px] text-muted-foreground">{INLINE_UPGRADE_NUDGE}</p>
                              <div className="mt-2 flex flex-wrap justify-center gap-2">
                                <UnlockFullReportButton
                                  size="sm"
                                  onUnlock={unlockFullReport}
                                />
                                <Button size="sm" variant="outline" className="text-xs" asChild>
                                  <Link href="#full-report-upgrade">Upgrade section</Link>
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>{win.title || win.elementName || "Quick Win"}</SheetTitle>
                          </SheetHeader>
                          <div className="mt-6 space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-sm">Effort</h4>
                              <p className="text-sm text-muted-foreground">{effortLine}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2 text-sm">Impact</h4>
                              <p className="text-sm text-muted-foreground">{impactLine}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2 text-sm">Problem</h4>
                              <p className="text-sm text-muted-foreground">{win.problem || "No specific problem identified."}</p>
                            </div>
                      <div>
                              <h4 className="font-semibold mb-2 text-sm">How to Fix</h4>
                              <p className="text-sm text-muted-foreground">{win.fix || "No fix details available."}</p>
                      </div>
                            <div>
                              <h4 className="font-semibold mb-2 text-sm">Technical Details</h4>
                              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                {win.example ? (
                                  <code className="text-xs block whitespace-pre-wrap break-all">{win.example}</code>
                                ) : (
                                  <p className="text-xs italic">{win.fix || "No technical details available."}</p>
                    )}
                  </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">No quick fixes available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Roast Summary Box - 4-Part Viral Video Script */}
          {hasDetailedRoast && (
            <Card
              className="w-full overflow-visible border-border bg-surface-1"
              style={{ height: "auto", minHeight: "auto" }}
            >
              <CardContent className="space-y-8 overflow-visible pb-8 pt-8">
                {stopper && (
                  <div className="rounded-lg border border-border bg-muted/30 p-6">
                    <p className="text-lg font-medium leading-relaxed text-card-foreground whitespace-pre-line">
                      {stripNarrativeSegmentLabels(stopper)}
                    </p>
                  </div>
                )}

                {roast && (
                  <div className="rounded-lg border border-border bg-muted/30 p-8">
                    <p className="text-base leading-relaxed text-card-foreground whitespace-pre-wrap">
                      {stripNarrativeSegmentLabels(roast)}
                    </p>
                  </div>
                )}

                {verdict && (
                  <div className="rounded-lg border border-border bg-muted/30 p-6">
                    <p className="text-lg font-medium leading-relaxed text-card-foreground whitespace-pre-line">
                      {stripNarrativeSegmentLabels(verdict)}
                    </p>
                  </div>
                )}

                {closer && (
                  <div className="rounded-lg border border-border bg-muted/30 p-6">
                    <p className="text-lg font-medium leading-relaxed text-card-foreground whitespace-pre-line">
                      {stripNarrativeSegmentLabels(closer)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Element-by-element audit (above deep dive) */}
          {auditItems.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {auditItems.slice(0, 6).map((item, idx) => {
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
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              {item.working && item.working.length > 0 && (
                                <div>
                                  <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                                    <CircleCheck className="size-4 shrink-0 stroke-[1.5] text-chart-4" />
                                    What&apos;s Working:
                                  </p>
                                  <ul className="list-inside list-disc space-y-1 text-sm">
                                    {item.working.map((w, i) => (
                                      <li key={i}>{w}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {item.not_working && item.not_working.length > 0 && (
                                <div>
                                  <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                                    <CircleX className="size-4 shrink-0 stroke-[1.5] text-destructive" />
                                    What&apos;s Not Working:
                                  </p>
                                  <ul className="list-inside list-disc space-y-1 text-sm">
                                    {item.not_working.map((nw, i) => (
                                      <li key={i}>{nw}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
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

          {/* Deep dive (after element audit) */}
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
                          <span className="font-mono font-semibold tabular-nums">
                            {cat.score}
                          </span>
                          /100 | <strong>Verdict:</strong> {cat.verdict}
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
                <p className="text-muted-foreground">No category data available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
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
        onSendEmailLink={(email) => sendEmailSignInLink(email, pathname || "/dashboard")}
        loading={authLoading || isSyncing}
      />
    </SidebarProvider>
  );
}
