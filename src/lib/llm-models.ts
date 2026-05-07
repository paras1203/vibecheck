import "server-only";

function trimModelId(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t.replace(/^["']|["']$/g, "") : undefined;
}

export type GeminiModelPair = { primary: string; fallback: string };

const DEFAULT_WORKER_PRIMARY = "gemini-2.5-flash-lite";
const DEFAULT_WORKER_FALLBACK = "gemini-2.5-flash";
const DEFAULT_ROAST_PRIMARY = "gemini-2.5-pro";
const DEFAULT_ROAST_FALLBACK = "gemini-3-flash-preview";

/**
 * Two LLM stacks (each: primary + one fallback):
 * - LLM 1 / workers: multimodal + copy + tech workers (`generateWithTwoModelFallback`).
 * - LLM 2 / narrative: roast script, insight JSON, PageSpeed summary (`generateRoastWithFallback`).
 *
 * Resolution order per slot: `LLM_1_*` / `LLM_2_*` → `GEMINI_WORKER_*` / `GEMINI_ROAST_*` → `GEMINI_MODEL_*` → defaults.
 */
export function getWorkerGeminiModels(): GeminiModelPair {
  const primary =
    trimModelId(process.env.LLM_1_PRIMARY) ??
    trimModelId(process.env.GEMINI_WORKER_MODEL_PRIMARY) ??
    trimModelId(process.env.GEMINI_MODEL_PRIMARY) ??
    DEFAULT_WORKER_PRIMARY;
  const fallback =
    trimModelId(process.env.LLM_1_FALLBACK) ??
    trimModelId(process.env.GEMINI_WORKER_MODEL_FALLBACK) ??
    trimModelId(process.env.GEMINI_MODEL_FALLBACK) ??
    DEFAULT_WORKER_FALLBACK;
  return { primary, fallback };
}

export function getRoastGeminiModels(): GeminiModelPair {
  const primary =
    trimModelId(process.env.LLM_2_PRIMARY) ??
    trimModelId(process.env.GEMINI_ROAST_MODEL_PRIMARY) ??
    trimModelId(process.env.GEMINI_MODEL_PRIMARY) ??
    DEFAULT_ROAST_PRIMARY;
  const fallback =
    trimModelId(process.env.LLM_2_FALLBACK) ??
    trimModelId(process.env.GEMINI_ROAST_MODEL_FALLBACK) ??
    trimModelId(process.env.GEMINI_MODEL_FALLBACK) ??
    DEFAULT_ROAST_FALLBACK;
  return { primary, fallback };
}

export type LlmStackPublicConfig = {
  provider: "google_gemini";
  llm1: { label: string; primary: string; fallback: string };
  llm2: { label: string; primary: string; fallback: string };
};

export function getLlmStackPublicConfig(): LlmStackPublicConfig {
  const w = getWorkerGeminiModels();
  const r = getRoastGeminiModels();
  return {
    provider: "google_gemini",
    llm1: {
      label: "Workers (visuals, copy, tech)",
      primary: w.primary,
      fallback: w.fallback,
    },
    llm2: {
      label: "Narrative & insight JSON (roast, insights, speed copy)",
      primary: r.primary,
      fallback: r.fallback,
    },
  };
}

export function getGenkitGeminiModels(): GeminiModelPair {
  return getWorkerGeminiModels();
}

export function isRetryableGeminiModelError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (!msg) return false;
  return (
    msg.includes("404") ||
    msg.includes("not found") ||
    msg.includes("not supported") ||
    msg.includes("invalid model") ||
    msg.includes("does not exist") ||
    msg.includes("429") ||
    msg.includes("resource exhausted") ||
    msg.includes("quota") ||
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("overloaded")
  );
}
