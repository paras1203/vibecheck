/** Matches Dodo Checkout SDK `Initialize({ mode })`. Mirror `DODO_PAYMENTS_ENVIRONMENT` via NEXT_PUBLIC in production. */
export function dodoCheckoutSdkMode(): "test" | "live" {
  const raw = process.env.NEXT_PUBLIC_DODO_PAYMENTS_ENVIRONMENT?.trim().toLowerCase();
  if (raw === "live_mode" || raw === "live") return "live";
  return "test";
}
