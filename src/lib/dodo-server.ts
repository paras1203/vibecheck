import "server-only";
import DodoPayments from "dodopayments";

export type DodoEnvMode = "test_mode" | "live_mode";

export function resolveDodoEnvironment(): DodoEnvMode {
  const raw = process.env.DODO_PAYMENTS_ENVIRONMENT?.trim().toLowerCase();
  return raw === "live_mode" || raw === "live" ? "live_mode" : "test_mode";
}

let cached: DodoPayments | null = null;

export function getDodoPaymentsClient(): DodoPayments {
  if (cached) return cached;
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY?.trim();
  if (!bearerToken) {
    throw new Error(
      "Dodo Payments not configured (set DODO_PAYMENTS_API_KEY and Dodo product env vars)."
    );
  }
  cached = new DodoPayments({
    bearerToken,
    environment: resolveDodoEnvironment(),
  });
  return cached;
}

export function dodoProductProId(): string {
  const v = process.env.DODO_PRODUCT_PRO_ID?.trim();
  if (!v) throw new Error("DODO_PRODUCT_PRO_ID is required");
  return v;
}

export function dodoProductAgencyPackId(): string {
  const v = process.env.DODO_PRODUCT_AGENCY_PACK_ID?.trim();
  if (!v) throw new Error("DODO_PRODUCT_AGENCY_PACK_ID is required");
  return v;
}

export function dodoProductFreeTestId(): string {
  const v = process.env.DODO_PRODUCT_FREE_TEST_ID?.trim();
  if (!v) throw new Error("DODO_PRODUCT_FREE_TEST_ID is required");
  return v;
}
