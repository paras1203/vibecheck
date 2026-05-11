import "server-only";

import type { PageSpeedSummary } from "@/lib/pagespeed";
import type { PerformanceGeminiSummary } from "@/types/roast-extras";
import { initializeGeminiClient, generateRoastWithFallback } from "@/lib/gemini-client";

function hasAnyMetric(p: PageSpeedSummary | null): p is PageSpeedSummary {
  if (!p) return false;
  return (
    typeof p.performanceScore === "number" ||
    (p.lcp != null && p.lcp !== "") ||
    (p.cls != null && p.cls !== "") ||
    (p.tbt != null && p.tbt !== "") ||
    (p.inp != null && p.inp !== "")
  );
}

export async function summarizePageSpeedWithGemini(
  auditedUrl: string,
  metrics: PageSpeedSummary
): Promise<PerformanceGeminiSummary | null> {
  if (!hasAnyMetric(metrics)) return null;

  try {
    const { genAI, workerPrimary, workerFallback } = initializeGeminiClient();
    const payload = {
      url: auditedUrl,
      performanceScore: metrics.performanceScore,
      lcp: metrics.lcp,
      cls: metrics.cls,
      tbt: metrics.tbt,
      inp: metrics.inp,
      strategy: metrics.strategy ?? "mobile",
    };

    const prompt = `You are a web performance expert. Given lab metrics from Google PageSpeed Insights (Lighthouse) for the URL below, respond with JSON ONLY (no markdown):
{
  "summary": "2-4 sentences explaining what these numbers mean for real users and conversion risk",
  "quickFixes": ["first concrete speed fix tied to the metrics", "second concrete speed fix"]
}

Rules:
- quickFixes must be exactly two strings, each actionable in one line.
- Do not invent metrics; only interpret those provided.
- If a metric is missing, do not claim you measured it.

Metrics (JSON): ${JSON.stringify(payload)}`;

    const { text } = await generateRoastWithFallback(
      genAI,
      workerPrimary,
      workerFallback,
      prompt,
      undefined,
      {
        temperature: 0.35,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      }
    );

    const parsed = JSON.parse(text.trim()) as {
      summary?: string;
      quickFixes?: unknown;
    };
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const qf = Array.isArray(parsed.quickFixes)
      ? parsed.quickFixes.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];
    if (!summary || qf.length < 2) return null;

    return {
      summary,
      quickFixes: [qf[0]!.trim(), qf[1]!.trim()],
    };
  } catch (e) {
    console.warn("[pagespeed-gemini-summary]", e instanceof Error ? e.message : e);
    return null;
  }
}
