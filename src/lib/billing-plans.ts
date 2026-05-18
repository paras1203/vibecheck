/**
 * Paid product units and display amounts (USD). Checkout is wired through Dodo product IDs in env.
 */

export type PaidPlanId = "pro" | "agency";

/** Includes one-off gateway test SKU (does not upgrade plan). */
export type BillingCheckoutPlanId = PaidPlanId | "free_test";

export const LIST_SINGLE_USD = 79;
export const CHECKOUT_SINGLE_USD = 29;
export const AGENCY_PACK_CREDITS = 5;
export const LIST_AGENCY_PACK_USD = LIST_SINGLE_USD * AGENCY_PACK_CREDITS;
export const CHECKOUT_AGENCY_PACK_USD = 99;

function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Credits per purchased unit:
 * — Pro unit = 1 credit line item in cart (qty = number of roast credits).
 * — Agency unit = 1 bundle of credits (qty = pack count).
 */
export const PLAN_PURCHASE_CREDITS_PER_UNIT: Record<PaidPlanId, number> = {
  pro: intEnv("PLAN_PRO_AUDIT_CREDITS", 1),
  agency: intEnv("PLAN_AGENCY_AUDIT_CREDITS", AGENCY_PACK_CREDITS),
};

export function creditsForPurchase(planId: PaidPlanId, unitQuantity: number): number {
  return PLAN_PURCHASE_CREDITS_PER_UNIT[planId] * unitQuantity;
}

export const CHECKOUT_FREE_TEST_USD = 0.5;

/** Max selectable quantity per checkout (invoice size). */
export const MAX_PRO_CHECKOUT_UNITS = 50;
export const MAX_AGENCY_PACK_UNITS = 20;

export function normalizeCheckoutQty(planId: BillingCheckoutPlanId, raw: unknown): number {
  if (planId === "free_test") return 1;
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return 1;
  const i = Math.floor(n);
  if (planId === "agency") {
    return Math.min(MAX_AGENCY_PACK_UNITS, Math.max(1, i));
  }
  return Math.min(MAX_PRO_CHECKOUT_UNITS, Math.max(1, i));
}
