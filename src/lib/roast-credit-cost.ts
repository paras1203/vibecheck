import { ROAST_ANALYSIS_MESSAGES } from "@/lib/roast-analysis-messages";

export const ROAST_LOADER_STEP_COUNT = ROAST_ANALYSIS_MESSAGES.length;

/**
 * Credits debited when a logged-in user starts POST /api/roast (after token verify).
 * Default 1 credit per roast. Set `ROAST_CREDITS_PER_GENERATION` (server) or
 * `NEXT_PUBLIC_ROAST_CREDITS_PER_GENERATION` (client-visible mirror) to override (0 = free for logged-in).
 */
export function roastGenerationCreditCost(): number {
  const raw =
    process.env.NEXT_PUBLIC_ROAST_CREDITS_PER_GENERATION ?? process.env.ROAST_CREDITS_PER_GENERATION;
  if (raw !== undefined && raw !== "") {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return 1;
}
