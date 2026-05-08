import type { User } from "@/context/AuthContext";
import type { BillingCheckoutPlanId } from "@/lib/billing-plans";

export function billingPath(plan: BillingCheckoutPlanId) {
  return `/checkout?plan=${plan}`;
}

export function checkoutHref(user: User | null, plan: "pro" | "agency") {
  const path = billingPath(plan);
  return user ? path : `/login?next=${encodeURIComponent(path)}`;
}

export function freeTestBillingPath() {
  return billingPath("free_test");
}

export function freeTestCheckoutHref(user: User | null) {
  const path = freeTestBillingPath();
  return user ? path : `/login?next=${encodeURIComponent(path)}`;
}

export const LANDING_LIST_SINGLE_USD = 79;
export const LANDING_CHECKOUT_SINGLE_USD = 29;
export const LANDING_PRO_SAVE_USD = LANDING_LIST_SINGLE_USD - LANDING_CHECKOUT_SINGLE_USD;
/** Marketing line (exact %). */
export const LANDING_PRO_SAVE_PCT = 65;

export const LANDING_BUNDLE_USD = 99;
export const LANDING_BUNDLE_LIST_USD = LANDING_LIST_SINGLE_USD * 5;
export const LANDING_BUNDLE_SAVE_USD = LANDING_BUNDLE_LIST_USD - LANDING_BUNDLE_USD;
/** Marketing line (rounded %). */
export const LANDING_BUNDLE_SAVE_PCT = 75;

export const LANDING_FREE_TEST_USD = 0.1;

export function usdLanding(n: number) {
  const hasCents = Math.abs(n % 1) > 1e-9;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

export function perCreditAgencyApprox(): string {
  return (LANDING_BUNDLE_USD / 5).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
