"use client";

import type { BillingCheckoutPlanId } from "@/lib/billing-plans";

export type DodoPurchaseOk = {
  credits: number;
  plan: "free" | "pro" | "agency";
};

export async function redirectToDodoCheckout(
  planId: BillingCheckoutPlanId,
  idToken: string,
  quantity?: number
): Promise<void> {
  const res = await fetch("/api/dodo/create-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ planId, quantity }),
  });
  const data = (await res.json()) as {
    checkoutUrl?: string;
    error?: string;
    details?: string;
  };
  if (!res.ok || !data.checkoutUrl) {
    throw new Error(data.details || data.error || "Could not start checkout");
  }
  window.location.href = data.checkoutUrl;
}

export async function verifyDodoPaymentReturn(
  paymentId: string,
  idToken: string
): Promise<DodoPurchaseOk> {
  const res = await fetch("/api/dodo/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ paymentId }),
  });
  const out = (await res.json()) as {
    error?: string;
    credits?: number;
    plan?: string;
    details?: string;
  };
  if (!res.ok) {
    throw new Error(
      [out.error, out.details].filter(Boolean).join(": ") || `Verification failed (${res.status})`
    );
  }
  const raw = out.plan;
  const plan =
    raw === "pro" || raw === "agency" || raw === "free" ? raw : "free";
  return { credits: Number(out.credits ?? 0), plan };
}
