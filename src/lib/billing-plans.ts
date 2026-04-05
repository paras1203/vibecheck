export type PaidPlanId = "pro" | "agency";

export type RazorpayBillingCurrency = "INR" | "USD";

/**
 * Razorpay order currency. Default **INR** (typical India merchant keys); USD requires
 * international payments enabled on the Razorpay account. Set `RAZORPAY_CURRENCY=USD` when supported.
 */
function resolveRazorpayCurrency(): RazorpayBillingCurrency {
  const c = process.env.RAZORPAY_CURRENCY?.trim().toUpperCase();
  return c === "USD" ? "USD" : "INR";
}

export const PLAN_CURRENCY = resolveRazorpayCurrency();

function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Order total in smallest currency units (INR → paise, USD → cents).
 * INR defaults match common test/live checkouts; override with PLAN_*_AMOUNT_PAISE.
 */
export const PLAN_AMOUNT_PAISE: Record<PaidPlanId, number> =
  PLAN_CURRENCY === "USD"
    ? {
        pro: 1900,
        agency: 5900,
      }
    : {
        pro: intEnv("PLAN_PRO_AMOUNT_PAISE", 159900),
        agency: intEnv("PLAN_AGENCY_AMOUNT_PAISE", 409900),
      };

/** Credits granted after a successful Razorpay purchase (override via env). */
export const PLAN_PURCHASE_CREDITS: Record<PaidPlanId, number> = {
  pro: intEnv("PLAN_PRO_AUDIT_CREDITS", 1),
  agency: intEnv("PLAN_AGENCY_AUDIT_CREDITS", 5),
};
