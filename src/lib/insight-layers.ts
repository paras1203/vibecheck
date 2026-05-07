import type {
  FirstImpressionInsight,
  InsightLayerBlock,
  InsightPriority,
  MessagingClarityInsight,
  RevenueLeakEstimate,
  ScoreTriple,
  TrustGapInsight,
} from "@/types/insight-layers";

/** Base scenario — must stay 0.02 (product baseline). */
export const REVENUE_LIFT_BASE = 0.02;
export const REVENUE_LIFT_LOW = 0.01;
export const REVENUE_LIFT_HIGH = 0.035;

export const REVENUE_LEAK_DISCLAIMER =
  "Illustrative estimate only—not a guarantee of results. Actual outcomes depend on traffic quality, offer, and execution.";

export const REVENUE_LEAK_METHODOLOGY =
  "Annual revenue at risk is modeled as monthly sessions × assumed incremental conversion rate × average order value × 12 months. Low, base, and high use different uplift assumptions; base uses the standard 2% incremental conversion benchmark.";

/** When we have no traffic model, revenue UI uses this illustrative monthly session count. */
export const DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS = 5000;

/** When on-page price isn’t detected, revenue UI uses this illustrative deal value (USD). */
export const DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD = 29;

export const REVENUE_LEAK_ASSUMPTIONS_FALLBACK = [
  "Monthly sessions default to 5,000 illustrative visits when we don’t have a better estimate; adjust in the model. Average order value uses on-page pricing when detected; otherwise DEFAULT_REVENUE_MODEL_AOV_USD (default 29).",
  "Uplift is interpreted as incremental conversion rate (not additive revenue percentage).",
  "Scenarios bracket uncertainty; base matches the product’s historical 2% benchmark.",
];

/** Conservative default monthly sessions for revenue math (no site analytics). */
export function defaultMonthlySessionsForRoast(industry: string): number {
  const map: Record<string, number> = {
    SaaS: 1000,
    Agency: 900,
    "E-commerce": 1200,
  };
  return map[industry.trim()] ?? 1000;
}

/** Illustrative monthly sessions by detected industry (not live analytics). */
export function estimatedMonthlySessionsForIndustry(industry: string): number {
  const key = industry.trim();
  const map: Record<string, number> = {
    SaaS: 12000,
    Agency: 6500,
    "E-commerce": 28000,
  };
  return map[key] ?? 10000;
}

export function clampScore(n: unknown): number {
  const x = typeof n === "number" && !Number.isNaN(n) ? n : 50;
  return Math.max(0, Math.min(100, Math.round(x)));
}

export function priorityFromComposite(current: number): InsightPriority {
  if (current < 45) return "high";
  if (current < 70) return "medium";
  return "low";
}

function normalizeTriple(raw: Partial<ScoreTriple> | undefined, fallbackCurrent: number): ScoreTriple {
  let current = clampScore(raw?.current ?? fallbackCurrent);
  let proposed = clampScore(raw?.proposed ?? current + 10);
  const impact = typeof raw?.impact === "string" && raw.impact.trim() ? raw.impact.trim() : "Address gaps surfaced in the detailed audit to lift clarity and conversion.";
  if (proposed < current) proposed = current;
  return { current, proposed, impact };
}

function normalizeLayer(
  raw: Partial<InsightLayerBlock> | undefined,
  subKeys: string[],
  radarBlend: number
): InsightLayerBlock {
  const composite = normalizeTriple(raw?.composite, radarBlend);
  const subscores: Record<string, ScoreTriple> = {};
  for (const key of subKeys) {
    const sub = (raw?.subscores as Record<string, Partial<ScoreTriple>> | undefined)?.[key];
    subscores[key] = normalizeTriple(sub, composite.current);
  }
  const highPrioritySignals = Array.isArray(raw?.highPrioritySignals)
    ? raw!.highPrioritySignals!.filter((s) => typeof s === "string" && s.trim()).slice(0, 4).map((s) => s.trim())
    : [];
  const layerSummary =
    typeof raw?.layerSummary === "string" && raw.layerSummary.trim()
      ? raw.layerSummary.trim()
      : "Derived from audit signals; see detailed findings for evidence.";
  const priority = priorityFromComposite(composite.current);
  return {
    layerSummary,
    priority,
    composite,
    subscores,
    highPrioritySignals,
  };
}

export function buildRevenueLeakEstimate(
  defaultTraffic = DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
  defaultPrice = DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD,
  ctx?: {
    industryLabel?: string;
    priceFromScrape?: boolean;
    /** Overrides default "industry benchmark" traffic assumption line when set (e.g. model estimate). */
    trafficAssumptionLine?: string;
  }
): RevenueLeakEstimate {
  const annual = (rate: number) => defaultTraffic * rate * defaultPrice * 12;
  const ind = ctx?.industryLabel?.trim() || "your segment";
  const priceLine = ctx?.priceFromScrape
    ? `Order value uses a price found in visible page text (median of detected amounts → $${defaultPrice}).`
    : `Order value defaults to $${defaultPrice} when no clear on-page price is detected.`;
  const trafficLine =
    ctx?.trafficAssumptionLine?.trim() ||
    `Monthly sessions use an industry-style benchmark for ${ind} (${defaultTraffic.toLocaleString()} visits/mo, illustrative—not pulled from your analytics).`;
  const assumptions = [
    trafficLine,
    priceLine,
    "Uplift is incremental conversion rate; scenarios bracket uncertainty; base uses the 2% benchmark.",
  ];
  return {
    disclaimer: REVENUE_LEAK_DISCLAIMER,
    methodology: REVENUE_LEAK_METHODOLOGY,
    assumptions,
    scenarios: {
      low: { label: "Low scenario (conservative uplift)", conversionUpliftRate: REVENUE_LIFT_LOW },
      base: { label: "Base scenario (standard benchmark)", conversionUpliftRate: REVENUE_LIFT_BASE },
      high: { label: "High scenario (stronger uplift)", conversionUpliftRate: REVENUE_LIFT_HIGH },
    },
    annualLeakUsdDefaults: {
      low: annual(REVENUE_LIFT_LOW),
      base: annual(REVENUE_LIFT_BASE),
      high: annual(REVENUE_LIFT_HIGH),
    },
  };
}

export function annualLeakUsd(traffic: number, price: number, rate: number): number {
  return traffic * rate * price * 12;
}

export function fallbackInsightLayers(radarMetrics: Record<string, number>): {
  firstImpressionScore: FirstImpressionInsight;
  trustGapIndex: TrustGapInsight;
  messagingClarityScore: MessagingClarityInsight;
} {
  const copy = radarMetrics.copy ?? 50;
  const visuals = radarMetrics.visuals ?? 50;
  const conversion = radarMetrics.conversion ?? 50;
  const trust = radarMetrics.trust ?? 50;
  const firstBlend = Math.round((copy + visuals + conversion) / 3);
  const trustBlend = trust;
  const msgBlend = Math.round((copy + conversion) / 2);

  const neutral = (current: number): ScoreTriple => ({
    current,
    proposed: Math.min(100, current + 12),
    impact: "Prioritize fixes in the detailed audit; projected scores assume implementation of recommended changes.",
  });

  const fi = normalizeLayer(
    undefined,
    ["headlineClarity", "ctaVisibility", "visualHierarchy"],
    firstBlend
  );
  const tg = normalizeLayer(undefined, ["testimonials", "guarantees", "proof", "perceivedRisk"], trustBlend);
  const mc = normalizeLayer(undefined, ["valueProposition", "readability", "specificity"], msgBlend);

  return {
    firstImpressionScore: {
      ...fi,
      subscores: {
        headlineClarity: neutral(fi.composite.current),
        ctaVisibility: neutral(Math.max(0, fi.composite.current - 5)),
        visualHierarchy: neutral(Math.max(0, fi.composite.current - 3)),
      },
      highPrioritySignals: [
        "Validate hero headline against primary offer",
        "Confirm primary CTA visibility above the fold",
      ],
    } as FirstImpressionInsight,
    trustGapIndex: {
      ...tg,
      subscores: {
        testimonials: neutral(tg.composite.current),
        guarantees: neutral(Math.max(0, tg.composite.current - 4)),
        proof: neutral(Math.max(0, tg.composite.current - 2)),
        perceivedRisk: neutral(Math.max(0, 100 - tg.composite.current)),
      },
      highPrioritySignals: [
        "Strengthen proof points (logos, outcomes, credentials)",
        "Surface guarantees or risk-reversal where appropriate",
      ],
    } as TrustGapInsight,
    messagingClarityScore: {
      ...mc,
      subscores: {
        valueProposition: neutral(mc.composite.current),
        readability: neutral(Math.max(0, mc.composite.current - 5)),
        specificity: neutral(Math.max(0, mc.composite.current - 4)),
      },
      highPrioritySignals: [
        "Tighten value proposition in one clear line",
        "Replace vague claims with specific outcomes",
      ],
    } as MessagingClarityInsight,
  };
}

/** Merge AI JSON with validation and fallbacks. */
export function mergeInsightLayersFromAI(
  parsed: unknown,
  radarMetrics: Record<string, number>
): {
  firstImpressionScore: FirstImpressionInsight;
  trustGapIndex: TrustGapInsight;
  messagingClarityScore: MessagingClarityInsight;
} {
  const fb = fallbackInsightLayers(radarMetrics);
  if (!parsed || typeof parsed !== "object") return fb;

  const o = parsed as Record<string, unknown>;

  const firstRaw = o.firstImpressionScore as Partial<InsightLayerBlock> | undefined;
  const first = normalizeLayer(firstRaw, ["headlineClarity", "ctaVisibility", "visualHierarchy"], fb.firstImpressionScore.composite.current);
  const fiSub = (firstRaw?.subscores ?? {}) as Record<string, Partial<ScoreTriple>>;
  const firstMerged: FirstImpressionInsight = {
    ...first,
    subscores: {
      headlineClarity: normalizeTriple(fiSub.headlineClarity, first.composite.current),
      ctaVisibility: normalizeTriple(fiSub.ctaVisibility, first.composite.current),
      visualHierarchy: normalizeTriple(fiSub.visualHierarchy, first.composite.current),
    },
    highPrioritySignals: first.highPrioritySignals.length ? first.highPrioritySignals : fb.firstImpressionScore.highPrioritySignals,
    layerSummary:
      typeof firstRaw?.layerSummary === "string" && firstRaw.layerSummary.trim().length > 0
        ? firstRaw.layerSummary.trim()
        : first.layerSummary,
  };

  const trustRaw = o.trustGapIndex as Partial<InsightLayerBlock> | undefined;
  const trust = normalizeLayer(trustRaw, ["testimonials", "guarantees", "proof", "perceivedRisk"], fb.trustGapIndex.composite.current);
  const tgSub = (trustRaw?.subscores ?? {}) as Record<string, Partial<ScoreTriple>>;
  const trustMerged: TrustGapInsight = {
    ...trust,
    subscores: {
      testimonials: normalizeTriple(tgSub.testimonials, trust.composite.current),
      guarantees: normalizeTriple(tgSub.guarantees, trust.composite.current),
      proof: normalizeTriple(tgSub.proof, trust.composite.current),
      perceivedRisk: normalizeTriple(tgSub.perceivedRisk, trust.composite.current),
    },
    highPrioritySignals: trust.highPrioritySignals.length ? trust.highPrioritySignals : fb.trustGapIndex.highPrioritySignals,
    layerSummary:
      typeof trustRaw?.layerSummary === "string" && trustRaw.layerSummary.trim().length > 0
        ? trustRaw.layerSummary.trim()
        : trust.layerSummary,
  };

  const msgRaw = o.messagingClarityScore as Partial<InsightLayerBlock> | undefined;
  const msg = normalizeLayer(msgRaw, ["valueProposition", "readability", "specificity"], fb.messagingClarityScore.composite.current);
  const mcSub = (msgRaw?.subscores ?? {}) as Record<string, Partial<ScoreTriple>>;
  const msgMerged: MessagingClarityInsight = {
    ...msg,
    subscores: {
      valueProposition: normalizeTriple(mcSub.valueProposition, msg.composite.current),
      readability: normalizeTriple(mcSub.readability, msg.composite.current),
      specificity: normalizeTriple(mcSub.specificity, msg.composite.current),
    },
    highPrioritySignals: msg.highPrioritySignals.length ? msg.highPrioritySignals : fb.messagingClarityScore.highPrioritySignals,
    layerSummary:
      typeof msgRaw?.layerSummary === "string" && msgRaw.layerSummary.trim().length > 0
        ? msgRaw.layerSummary.trim()
        : msg.layerSummary,
  };

  return {
    firstImpressionScore: firstMerged,
    trustGapIndex: trustMerged,
    messagingClarityScore: msgMerged,
  };
}

export const INSIGHT_LAYERS_SYSTEM_PROMPT = `You are a senior conversion consultant. Output concise, precise JSON only. Tone: professional, neutral, actionable—no hype, jokes, or dramatic language.

Scoring: integers 0–100 only for current and proposed. proposed must be >= current unless the impact text explicitly explains a staged rollback (rare); prefer proposed >= current.

Return ONLY valid JSON matching this shape (no markdown):
{
  "firstImpressionScore": {
    "layerSummary": "1-2 sentences",
    "composite": { "current": 0, "proposed": 0, "impact": "one sentence" },
    "subscores": {
      "headlineClarity": { "current": 0, "proposed": 0, "impact": "short" },
      "ctaVisibility": { "current": 0, "proposed": 0, "impact": "short" },
      "visualHierarchy": { "current": 0, "proposed": 0, "impact": "short" }
    },
    "highPrioritySignals": ["2-4 short items"]
  },
  "trustGapIndex": {
    "layerSummary": "1-2 sentences",
    "composite": { "current": 0, "proposed": 0, "impact": "one sentence" },
    "subscores": {
      "testimonials": { "current": 0, "proposed": 0, "impact": "short" },
      "guarantees": { "current": 0, "proposed": 0, "impact": "short" },
      "proof": { "current": 0, "proposed": 0, "impact": "short" },
      "perceivedRisk": { "current": 0, "proposed": 0, "impact": "short" }
    },
    "highPrioritySignals": ["2-4 short items"]
  },
  "messagingClarityScore": {
    "layerSummary": "1-2 sentences",
    "composite": { "current": 0, "proposed": 0, "impact": "one sentence" },
    "subscores": {
      "valueProposition": { "current": 0, "proposed": 0, "impact": "short" },
      "readability": { "current": 0, "proposed": 0, "impact": "short" },
      "specificity": { "current": 0, "proposed": 0, "impact": "short" }
    },
    "highPrioritySignals": ["2-4 short items"]
  }
}

Do not include priority fields; the client derives priority from composite.current.

Do not invent dollar prices, subscription tiers, or “$X/mo” figures in summaries; rely on audit signals and radar only.

QUALITY RULES:

* Avoid generic summaries; tie each layer to a concrete weakness in user perception or behavior.
* Prioritize clarity, trust, and decision-making gaps over cosmetic or vague observations.`;
