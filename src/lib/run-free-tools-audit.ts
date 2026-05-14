import "server-only";

import { captureScreenshotFromUrl } from "@/lib/capture";
import { quickScan } from "@/lib/quick-scan";
import { analyzeSEO } from "@/lib/seo-analyzer";
import { detectPageType } from "@/lib/page-type";
import {
  fetchPerformanceAuditResult,
  type PerformanceAuditResult,
  type PSIReportItem,
} from "@/lib/audits/performance-pagespeed";
import { pageSpeedSummaryFromPerformanceAuditMobile } from "@/lib/pagespeed";
import { fetchOptionalTechStackApi } from "@/lib/audits/tech-stack-external";
import {
  mergeTechStackResults,
  runMetaPreviewAudit,
  runOnPageSeoAudit,
  runPatternTechStackAudit,
  deriveBehaviourToolsAdvice,
} from "@/lib/audits";
import { analyzeLegalSignalsFromHtml } from "@/lib/legal-html-signals";
import {
  buildRevenueLeakEstimate,
  DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
} from "@/lib/insight-layers";
import { buildScrollEffectiveness } from "@/lib/scroll-effectiveness-from-audit";
import { safeErrorMessage } from "@/lib/json-utils";
import type {
  FreeReportGap,
  FreeReportPayload,
  FreeReportScoreBreakdown,
} from "@/types/free-report";

const SEO_ISSUE_COPY: Record<string, { title: string; detail: string; pro: string }> = {
  TITLE_LENGTH: {
    title: "Title tag length hurts CTR",
    detail: "Search snippets work best with roughly 30–60 characters. Off-range titles get rewritten or truncated.",
    pro: "Full audit reframes headline + SERP strategy together.",
  },
  MISSING_TITLE: {
    title: "Missing page title",
    detail: "Search and browser tabs have no strong label—expect weak CTR and unclear relevance.",
    pro: "AI rewrite pack aligns H1, title, and hero promise.",
  },
  META_DESCRIPTION_LENGTH: {
    title: "Meta description length",
    detail: "Descriptions outside ~70–160 characters are often rewritten by Google.",
    pro: "Pro report pairs description with proof points and CTA language.",
  },
  MISSING_META_DESCRIPTION: {
    title: "No meta description",
    detail: "Google invents snippets; you lose control of the pitch in search results.",
    pro: "Full audit drafts conversion-focused descriptions per section.",
  },
  H1_COUNT_INVALID: {
    title: "H1 structure is off",
    detail: "Multiple or zero H1s dilute topical signal and confuse skim readers.",
    pro: "Visual hierarchy review shows exactly what to change above the fold.",
  },
};

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function computeBreakdown(input: {
  seo: ReturnType<typeof analyzeSEO>;
  pageSpeed: ReturnType<typeof pageSpeedSummaryFromPerformanceAuditMobile>;
  onPage: ReturnType<typeof runOnPageSeoAudit> | null;
  legal: ReturnType<typeof analyzeLegalSignalsFromHtml>;
  submittedHttp: boolean;
  meta: ReturnType<typeof runMetaPreviewAudit>;
}): { score: number; breakdown: FreeReportScoreBreakdown } {
  const seoScore = input.seo?.score ?? 45;
  const perfRaw = input.pageSpeed?.performanceScore;
  const perfScore = typeof perfRaw === "number" ? perfRaw : 62;

  let structure = 85;
  const msgs = input.onPage?.messages ?? [];
  structure -= Math.min(36, msgs.length * 4);
  const h1c = input.onPage?.headingH1Count ?? 0;
  if (h1c !== 1) structure -= 8;
  if (input.onPage?.robotsNoindex) structure -= 25;
  if (input.onPage?.xRobotsNoindex) structure -= 20;

  let trust = 88;
  if (input.submittedHttp) trust -= 45;
  if (!input.legal.privacyLink) trust -= 12;
  if (!input.legal.termsLink) trust -= 8;
  if (!input.legal.cookieLink) trust -= 4;

  let metaHits = 0;
  if (input.meta.missingOgImage) metaHits++;
  if (input.meta.missingOgTitle) metaHits++;
  if (input.meta.missingOgDescription) metaHits++;
  if (input.meta.missingTwitterCard) metaHits++;
  structure -= Math.min(16, metaHits * 4);

  const breakdown: FreeReportScoreBreakdown = {
    seo: clampScore(seoScore),
    performance: clampScore(perfScore),
    structure: clampScore(structure),
    trust: clampScore(trust),
  };

  const score = clampScore(
    breakdown.seo * 0.28 +
      breakdown.performance * 0.28 +
      breakdown.structure * 0.24 +
      breakdown.trust * 0.2
  );

  return { score, breakdown };
}

function buildGaps(input: {
  seo: ReturnType<typeof analyzeSEO>;
  onPage: ReturnType<typeof runOnPageSeoAudit> | null;
  meta: ReturnType<typeof runMetaPreviewAudit>;
  behaviour: ReturnType<typeof deriveBehaviourToolsAdvice>;
  legal: ReturnType<typeof analyzeLegalSignalsFromHtml>;
  submittedHttp: boolean;
  pageSpeed: ReturnType<typeof pageSpeedSummaryFromPerformanceAuditMobile>;
  opportunities: PSIReportItem[];
}): FreeReportGap[] {
  const out: FreeReportGap[] = [];

  if (input.submittedHttp) {
    out.push({
      severity: "high",
      title: "HTTP instead of HTTPS",
      detail:
        "Visitors may see insecure warnings. Trust and checkout readiness drop before anyone reads your copy.",
      proUnlock: "Full audit maps TLS, redirects, and trust pillars to conversion risk.",
    });
  }

  if (input.onPage?.robotsNoindex || input.onPage?.xRobotsNoindex) {
    out.push({
      severity: "high",
      title: "Indexing blocked (noindex signal)",
      detail:
        "A noindex meta or header tells search engines not to surface this page—you may be hiding revenue.",
      proUnlock: "Pro report explains search visibility vs. landing tests with evidence from your markup.",
    });
  }

  const perf = input.pageSpeed?.performanceScore;
  if (typeof perf === "number" && perf < 50) {
    out.push({
      severity: "high",
      title: "Lab performance is weak",
      detail: `Mobile Lighthouse performance ~${perf}/100. Slow first screens increase bounce on ads and organic.`,
      proUnlock: "Paid report ties LCP/CLS to funnel steps and prioritizes fixes by conversion impact.",
    });
  }

  for (const issue of input.seo?.issues ?? []) {
    const row = SEO_ISSUE_COPY[issue.type];
    if (row) {
      out.push({
        severity: issue.type.includes("MISSING") ? "high" : "medium",
        title: row.title,
        detail: row.detail,
        proUnlock: row.pro,
      });
    }
  }

  for (const msg of (input.onPage?.messages ?? []).slice(0, 6)) {
    if (!msg.trim()) continue;
    out.push({
      severity: "medium",
      title: "On-page technical signal",
      detail: msg,
      proUnlock: "Full audit groups these into a prioritized fix list with screenshots.",
    });
  }

  if (input.meta.missingOgImage) {
    out.push({
      severity: "medium",
      title: "Missing Open Graph image",
      detail: "Shared links look bland—fewer clicks from social and referrals.",
      proUnlock: "Pro audit includes share-preview mockups and copy for key URLs.",
    });
  }

  if (input.behaviour.recommendBehaviourAnalytics && input.behaviour.recommendationMessage) {
    out.push({
      severity: "low",
      title: "Limited behaviour analytics",
      detail: input.behaviour.recommendationMessage,
      proUnlock: "Advanced roast connects qualitative UX issues to measurement gaps.",
    });
  }

  if (!input.legal.privacyLink) {
    out.push({
      severity: "medium",
      title: "Privacy policy link not detected",
      detail: "Checkout and signup flows expect visible privacy coverage; absence raises doubt.",
      proUnlock: "Trust section of the full report benchmarks policies and compliance surface.",
    });
  }

  for (const op of input.opportunities.slice(0, 3)) {
    const t = op.title || op.id;
    if (!t) continue;
    out.push({
      severity: "low",
      title: `Speed: ${t}`,
      detail: (op.displayValue || op.description || "").slice(0, 220) || "Lighthouse-flagged savings opportunity.",
      proUnlock: "Full report orders speed work by revenue exposure, not raw ms saved.",
    });
  }

  const seen = new Set<string>();
  const deduped: FreeReportGap[] = [];
  for (const g of out) {
    const k = `${g.title}|${g.detail.slice(0, 80)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(g);
    if (deduped.length >= 18) break;
  }

  deduped.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  return deduped;
}

export async function runFreeToolsAudit(params: {
  url: string;
  device: "desktop" | "mobile";
}): Promise<FreeReportPayload> {
  const { url, device } = params;
  const normalizedUrl = url.trim();

  const scanPromise = quickScan(normalizedUrl).catch((e: unknown) => {
    console.warn(`[free-report] quickScan: ${safeErrorMessage(e)}`);
    return null;
  });

  const { screenshots, htmlContent, pageText, pageHeight, documentHeaders } =
    await captureScreenshotFromUrl(normalizedUrl, device);

  const scanResolved = await scanPromise;
  const scanData = scanResolved ?? {
    page_height: pageHeight,
    price_guess: 29,
    industry_guess: "SaaS",
    price_from_page: false,
    price_billing_note: "",
  };

  let seoData = null as ReturnType<typeof analyzeSEO>;
  try {
    seoData = analyzeSEO(htmlContent, normalizedUrl);
  } catch {
    /* keep null */
  }

  let pageType = "unknown";
  try {
    pageType = detectPageType(normalizedUrl, htmlContent, pageText);
  } catch {
    /* keep */
  }

  let performanceAudit: PerformanceAuditResult | null = null;
  let pageSpeed: ReturnType<typeof pageSpeedSummaryFromPerformanceAuditMobile> | null = null;
  let onPageSeo: ReturnType<typeof runOnPageSeoAudit> | null = null;
  let metaPreview: ReturnType<typeof runMetaPreviewAudit> | null = null;
  let techStackMerged: ReturnType<typeof mergeTechStackResults> | null = null;
  let behaviourAdvice: ReturnType<typeof deriveBehaviourToolsAdvice> | null = null;

  try {
    const perfRes = await fetchPerformanceAuditResult(normalizedUrl).catch(() => null);
    const techApiTools = await fetchOptionalTechStackApi(normalizedUrl).catch(() => []);

    performanceAudit = perfRes;
    pageSpeed = pageSpeedSummaryFromPerformanceAuditMobile(perfRes ?? null);

    const techLocal = runPatternTechStackAudit(htmlContent);
    techStackMerged = mergeTechStackResults(techLocal, techApiTools);
    behaviourAdvice = deriveBehaviourToolsAdvice(techStackMerged);

    onPageSeo = runOnPageSeoAudit(htmlContent, normalizedUrl, documentHeaders);
    metaPreview = runMetaPreviewAudit(htmlContent, normalizedUrl);
  } catch (e) {
    console.warn(`[free-report] audits: ${safeErrorMessage(e)}`);
  }

  const legalSignals = analyzeLegalSignalsFromHtml(htmlContent, normalizedUrl);
  const submittedHttp = /^http:\/\//i.test(normalizedUrl);

  const { score, breakdown } = computeBreakdown({
    seo: seoData,
    pageSpeed,
    onPage: onPageSeo,
    legal: legalSignals,
    submittedHttp,
    meta: metaPreview ?? runMetaPreviewAudit(htmlContent, normalizedUrl),
  });

  const opportunitiesTop = (performanceAudit?.opportunities ?? []).slice(0, 5);

  const gaps = buildGaps({
    seo: seoData,
    onPage: onPageSeo,
    meta: metaPreview ?? runMetaPreviewAudit(htmlContent, normalizedUrl),
    behaviour: behaviourAdvice ?? deriveBehaviourToolsAdvice(null),
    legal: legalSignals,
    submittedHttp,
    pageSpeed,
    opportunities: opportunitiesTop,
  });

  const trafficAssumptionLine = `Free scan uses an illustrative benchmark (${DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS.toLocaleString()} visits/mo)—not your analytics. Industry context: ${scanData.industry_guess}.`;

  const revenueLeakEstimate = buildRevenueLeakEstimate(
    DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
    scanData.price_guess,
    {
      industryLabel: scanData.industry_guess,
      priceFromScrape: scanData.price_from_page,
      trafficAssumptionLine,
    }
  );

  const scrollEffectiveness = buildScrollEffectiveness(
    { audited_url: normalizedUrl },
    normalizedUrl,
    scanData.page_height,
    800
  );

  const heroScreenshot = screenshots[0] ?? null;

  return {
    kind: "free_tools_v1",
    generatedAt: new Date().toISOString(),
    audited_url: normalizedUrl,
    device,
    conversionReadinessScore: score,
    scoreBreakdown: breakdown,
    gaps,
    heroScreenshot,
    pageHeight: scanData.page_height,
    page_type: pageType,
    seo: seoData,
    performance: pageSpeed,
    performance_audit: performanceAudit,
    performanceOpportunitiesTop: opportunitiesTop,
    on_page_seo: onPageSeo,
    meta_preview: metaPreview,
    tech_stack: techStackMerged,
    behaviour_tools: behaviourAdvice,
    legal_signals: legalSignals,
    revenueLeakEstimate,
    scrollEffectiveness,
    quickScan: {
      price_guess: scanData.price_guess,
      industry_guess: scanData.industry_guess,
      price_from_page: scanData.price_from_page,
      price_billing_note: scanData.price_billing_note,
    },
  };
}
