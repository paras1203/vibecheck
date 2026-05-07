import { estimateGeminiCallCostUsd } from "@/lib/gemini-client";

type TokChunk = {
  model?: string;
  promptTokens?: number;
  candidatesTokens?: number;
};

/**
 * Sum heuristic USD cost across worker + narrative + insight token usage in `_meta.auditTokenBreakdown`.
 */
export function estimateTotalAuditCostUsd(meta: {
  estimatedCost?: number;
  auditTokenBreakdown?: {
    workers?: TokChunk[];
    narrativeRoast?: TokChunk | null;
    insightLayers?: TokChunk;
  };
}): number {
  const bd = meta.auditTokenBreakdown;
  let sum = 0;
  for (const w of bd?.workers ?? []) {
    if (w?.model) {
      sum += estimateGeminiCallCostUsd(
        w.model,
        Number(w.promptTokens) || 0,
        Number(w.candidatesTokens) || 0
      );
    }
  }
  const n = bd?.narrativeRoast;
  if (n?.model) {
    sum += estimateGeminiCallCostUsd(
      n.model,
      Number(n.promptTokens) || 0,
      Number(n.candidatesTokens) || 0
    );
  }
  const il = bd?.insightLayers;
  if (il?.model) {
    sum += estimateGeminiCallCostUsd(
      il.model,
      Number(il.promptTokens) || 0,
      Number(il.candidatesTokens) || 0
    );
  }
  if (sum > 0) return sum;
  return typeof meta.estimatedCost === "number" && Number.isFinite(meta.estimatedCost)
    ? meta.estimatedCost
    : 0;
}
