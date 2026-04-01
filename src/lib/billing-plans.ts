export type PaidPlanId = "pro" | "agency";

export const PLAN_CURRENCY = "INR" as const;

function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const PLAN_AMOUNT_PAISE: Record<PaidPlanId, number> = {
  pro: 159900,
  agency: 409900,
};

/** Credits granted after a successful Razorpay purchase (override via env). */
export const PLAN_PURCHASE_CREDITS: Record<PaidPlanId, number> = {
  pro: intEnv("PLAN_PRO_AUDIT_CREDITS", 1),
  agency: intEnv("PLAN_AGENCY_AUDIT_CREDITS", 5),
};
