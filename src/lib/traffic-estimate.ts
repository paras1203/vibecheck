import "server-only";

import { initializeGeminiClient, generateRoastWithFallback } from "@/lib/gemini-client";
import { DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS } from "@/lib/insight-layers";
import type { TrafficEstimate } from "@/types/roast-extras";

const MIN_SESSIONS = 500;
const MAX_SESSIONS = 15_000_000;

function clampSessions(n: number): number {
  if (!Number.isFinite(n)) return MIN_SESSIONS;
  return Math.min(MAX_SESSIONS, Math.max(MIN_SESSIONS, Math.round(n)));
}

function hostnameFromUrl(url: string): string {
  try {
    const u = url.trim();
    const withProto = u.includes("://") ? u : `https://${u}`;
    return new URL(withProto).hostname.replace(/^www\./i, "");
  } catch {
    return "unknown";
  }
}

/**
 * Illustrative monthly sessions: Gemini bounded estimate when API key present,
 * else industry default. No live analytics — copy must stay disclaimer-friendly.
 */
export async function estimateMonthlySessionsForUrl(
  auditedUrl: string,
  industryGuess: string,
  pageType: string,
  pageTextSample: string
): Promise<TrafficEstimate> {
  const fallback = DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS;
  const host = hostnameFromUrl(auditedUrl);
  const sample = pageTextSample.slice(0, 1200).replace(/\s+/g, " ").trim();

  try {
    if (!process.env.GOOGLE_GENAI_API_KEY?.trim()) {
      return {
        monthlySessions: fallback,
        source: "industry_default",
        note: "Gemini not configured; using default illustrative benchmark (5,000 visits/mo).",
      };
    }

    const { genAI, workerPrimary, workerFallback } = initializeGeminiClient();

    const prompt = `Estimate ILLUSTRATIVE monthly website sessions (not exact analytics) for this domain.

Return JSON ONLY:
{
  "monthlySessions": <integer between ${MIN_SESSIONS} and ${MAX_SESSIONS}>,
  "confidence": "low" | "medium",
  "rationale": "<= 120 chars, no line breaks>"
}

Context:
- hostname: ${host}
- full URL: ${auditedUrl}
- guessed industry: ${industryGuess}
- page type: ${pageType}
- page text sample (truncated): ${sample || "(none)"}

Use public knowledge of brand scale when the domain is well-known (e.g. major SaaS, retailers). For unknown sites, prefer conservative mid-range values. Never claim you have analytics data.`;

    const { text } = await generateRoastWithFallback(
      genAI,
      workerPrimary,
      workerFallback,
      prompt,
      undefined,
      {
        temperature: 0.25,
        maxOutputTokens: 256,
        responseMimeType: "application/json",
      }
    );

    const parsed = JSON.parse(text.trim()) as {
      monthlySessions?: unknown;
      rationale?: string;
    };
    const raw = parsed.monthlySessions;
    const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
    if (!Number.isFinite(n)) {
      return {
        monthlySessions: fallback,
        source: "industry_default",
        note: "Model returned invalid estimate; using default illustrative benchmark (5,000 visits/mo).",
      };
    }

    return {
      monthlySessions: clampSessions(n),
      source: "gemini",
      note:
        typeof parsed.rationale === "string" && parsed.rationale.trim()
          ? parsed.rationale.trim()
          : "Illustrative model estimate—not analytics.",
    };
  } catch (e) {
    console.warn("[traffic-estimate]", e instanceof Error ? e.message : e);
    return {
      monthlySessions: fallback,
      source: "industry_default",
      note: "Traffic estimate failed; using default illustrative benchmark (5,000 visits/mo).",
    };
  }
}
