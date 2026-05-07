import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import {
  getRoastGeminiModels,
  getWorkerGeminiModels,
  isRetryableGeminiModelError,
} from "@/lib/llm-models";

export type GeminiUsageChunk = {
  modelId: string;
  promptTokens: number;
  candidatesTokens: number;
};

export async function generateWithTwoModelFallback<T>(
  genAI: GoogleGenerativeAI,
  primary: string,
  fallback: string,
  run: (
    model: GenerativeModel,
    modelId: string
  ) => Promise<{ value: T; usage?: GeminiUsageChunk }>
): Promise<{ value: T; usage: GeminiUsageChunk }> {
  const ids = primary === fallback ? [primary] : [primary, fallback];
  let lastError: unknown;
  for (const id of ids) {
    try {
      const model = genAI.getGenerativeModel({ model: id });
      const out = await run(model, id);
      const u = out.usage ?? {
        modelId: id,
        promptTokens: 0,
        candidatesTokens: 0,
      };
      return { value: out.value, usage: { ...u, modelId: u.modelId || id } };
    } catch (e) {
      const isLast = id === ids[ids.length - 1];
      if (!isLast && isRetryableGeminiModelError(e)) {
        console.warn(
          `[WARN] Gemini model ${id} failed (${e instanceof Error ? e.message : String(e)}); trying fallback ${ids[ids.indexOf(id) + 1]}...`
        );
        lastError = e;
        continue;
      }
      throw e;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? "Unknown model error"));
}

const PRICING_TIERS = {
  flash: 0.1,
  pro: 5.0,
};

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENAI_API_KEY not found. For Next.js, add it to .env.local file."
    );
  }
  return apiKey.trim().replace(/^["']|["']$/g, "");
}

function isFlashModel(modelName: string): boolean {
  return modelName.toLowerCase().includes("flash");
}

/** Rough USD estimate ($/1M total tokens) for admin analytics — flash vs non-flash heuristic. */
export function estimateGeminiCallCostUsd(
  modelName: string,
  inputTokens: number,
  outputTokens: number
): number {
  const tier = isFlashModel(modelName) ? "flash" : "pro";
  const ratePerMillion = PRICING_TIERS[tier];
  const totalTokens = inputTokens + outputTokens;
  return (totalTokens / 1_000_000) * ratePerMillion;
}

function estimateCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number
): number {
  return estimateGeminiCallCostUsd(modelName, inputTokens, outputTokens);
}

export function initializeGeminiClient(): {
  genAI: GoogleGenerativeAI;
  workerPrimary: string;
  workerFallback: string;
  roastPrimary: string;
  roastFallback: string;
} {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const worker = getWorkerGeminiModels();
  const roast = getRoastGeminiModels();
  console.log(
    `[DEBUG] LLM models — worker: ${worker.primary} → ${worker.fallback}; roast: ${roast.primary} → ${roast.fallback}`
  );
  return {
    genAI,
    workerPrimary: worker.primary,
    workerFallback: worker.fallback,
    roastPrimary: roast.primary,
    roastFallback: roast.fallback,
  };
}

export async function generateRoastWithFallback(
  genAI: GoogleGenerativeAI,
  roastPrimary: string,
  roastFallback: string,
  prompt: string,
  systemInstruction?: string,
  options?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    /** When set (e.g. application/json), model returns structured JSON text. */
    responseMimeType?: string;
  }
): Promise<{
  text: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}> {
  const {
    temperature = 0.9,
    topP = 0.95,
    topK = 40,
    maxOutputTokens = 8192,
    responseMimeType,
  } = options || {};

  const generationConfig: Record<string, unknown> = {
    temperature,
    topP,
    topK,
    maxOutputTokens,
  };
  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType;
  }

  const requestBase: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  };

  if (systemInstruction) {
    try {
      requestBase.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
      console.log("[DEBUG] Using systemInstruction parameter");
    } catch {
      console.log(
        "[DEBUG] systemInstruction not supported, embedding in prompt"
      );
      (requestBase.contents as { role: string; parts: { text: string }[] }[])[0]
        .parts[0].text = `${systemInstruction}\n\n${prompt}`;
    }
  }

  const modelsToTry =
    roastPrimary === roastFallback
      ? [roastPrimary]
      : [roastPrimary, roastFallback];

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const currentModel = genAI.getGenerativeModel({ model: modelName });
      console.log(`[DEBUG] Generating content with model: ${modelName}`);
      console.log(`[DEBUG] Prompt length: ${prompt.length} characters`);
      console.log(`[DEBUG] Max output tokens: ${maxOutputTokens}`);

      const response = await currentModel.generateContent(
        requestBase as unknown as Parameters<
          GenerativeModel["generateContent"]
        >[0]
      );
      const text = response.response.text().trim();

      const usageMetadata = response.response.usageMetadata;
      const inputTokens =
        usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
      const outputTokens =
        usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);

      const estimatedCost = estimateCost(modelName, inputTokens, outputTokens);

      console.log(`[DEBUG] ✅ Generation successful with ${modelName}`);
      console.log(
        `[DEBUG] Input tokens: ${inputTokens}, Output tokens: ${outputTokens}`
      );
      console.log(`[DEBUG] Estimated cost: $${estimatedCost.toFixed(4)}`);
      console.log(
        `[DEBUG] Response length: ${text.length} characters, ${text.split(/\s+/).length} words`
      );

      return {
        text,
        modelUsed: modelName,
        inputTokens,
        outputTokens,
        estimatedCost,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isLast = modelName === modelsToTry[modelsToTry.length - 1];
      if (!isLast && isRetryableGeminiModelError(error)) {
        console.warn(
          `[WARN] ⚠️ Model ${modelName} failed (${errorMessage}). Retrying with fallback...`
        );
        lastError =
          error instanceof Error ? error : new Error(String(error));
        continue;
      }
      console.error(`[ERROR] Non-retryable or final failure with ${modelName}:`, errorMessage);
      throw error;
    }
  }

  const triedModels = modelsToTry.join(", ");
  throw new Error(
    `Failed to generate content with configured roast models. Tried: ${triedModels}. ` +
      `Last error: ${lastError?.message || "Unknown error"}`
  );
}

export function getModelInfo(modelName: string): {
  tier: "flash" | "pro";
  estimatedCostPer1M: number;
} {
  return {
    tier: isFlashModel(modelName) ? "flash" : "pro",
    estimatedCostPer1M: isFlashModel(modelName)
      ? PRICING_TIERS.flash
      : PRICING_TIERS.pro,
  };
}
