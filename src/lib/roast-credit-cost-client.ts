/**
 * Client mirror of roast per-generation debit (must match [`roastGenerationCreditCost`](./roast-credit-cost.ts)).
 * Browser only exposes `NEXT_PUBLIC_ROAST_CREDITS_PER_GENERATION`.
 */
export function roastGenerationCreditCostClient(): number {
  const raw =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_ROAST_CREDITS_PER_GENERATION : undefined;
  if (raw !== undefined && raw !== "") {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return 1;
}
