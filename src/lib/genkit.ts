import "server-only";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { getWorkerGeminiModels } from "@/lib/llm-models";

const apiKey = process.env.GOOGLE_GENAI_API_KEY;
console.log("Using Key:", apiKey?.substring(0, 5) || "NOT SET");
if (!apiKey) {
  console.warn("WARNING: GOOGLE_GENAI_API_KEY environment variable is not set!");
}

const googleAIPlugin = googleAI({
  apiKey: apiKey,
});

const workerModelsAtBoot = getWorkerGeminiModels();
const defaultGenkitModelRef = googleAI.model(workerModelsAtBoot.primary);

export const ai = genkit({
  plugins: [googleAIPlugin],
  model: defaultGenkitModelRef,
});

export const DEFAULT_MODEL = workerModelsAtBoot.primary;

export function googleGeminiModel(modelId: string) {
  return googleAI.model(modelId);
}
