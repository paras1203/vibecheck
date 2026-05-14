"use client";

import type { BillingCheckoutPlanId } from "@/lib/billing-plans";
import type { DodoSdkDisplayMode } from "@/lib/dodo-sdk-display-mode";

export type DodoPurchaseOk = {
  credits: number;
  plan: "free" | "pro" | "agency";
};

export type DodoCheckoutSessionResult = {
  checkoutUrl: string;
  sdkMode: DodoSdkDisplayMode;
};

export async function fetchDodoCheckoutSessionUrl(
  planId: BillingCheckoutPlanId,
  idToken: string,
  quantity?: number
): Promise<DodoCheckoutSessionResult> {
  const res = await fetch("/api/dodo/create-session", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      "X-Firebase-Authorization": `Bearer ${idToken}`,
    },
    body: JSON.stringify({ planId, quantity, idToken }),
  });
  const data = (await res.json()) as {
    checkoutUrl?: string;
    sdkMode?: DodoSdkDisplayMode;
    error?: string;
    details?: string;
  };
  if (!res.ok || !data.checkoutUrl) {
    const parts = [data.error, data.details].filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    );
    const msg =
      parts.length > 0 ? parts.join(": ") : `Could not start checkout (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return {
    checkoutUrl: data.checkoutUrl,
    sdkMode: data.sdkMode ?? "test",
  };
}

const VERIFY_MAX_ATTEMPTS = 8;
const VERIFY_BASE_DELAY_MS = 450;

export async function verifyDodoPaymentReturn(
  paymentId: string,
  idToken: string
): Promise<DodoPurchaseOk> {
  let lastMessage = "";
  for (let attempt = 0; attempt < VERIFY_MAX_ATTEMPTS; attempt++) {
    const res = await fetch("/api/dodo/verify", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
        "X-Firebase-Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ paymentId, idToken }),
    });
    const out = (await res.json()) as {
      error?: string;
      credits?: number;
      plan?: string;
      details?: string;
    };
    if (res.ok) {
      const raw = out.plan;
      const plan =
        raw === "pro" || raw === "agency" || raw === "free" ? raw : "free";
      return { credits: Number(out.credits ?? 0), plan };
    }
    lastMessage =
      [out.error, out.details].filter(Boolean).join(": ") ||
      `Verification failed (${res.status})`;
    const maybeProcessing =
      res.status === 409 &&
      /\b(processing|unknown)\b/i.test(lastMessage);
    if (maybeProcessing && attempt < VERIFY_MAX_ATTEMPTS - 1) {
      await new Promise((r) =>
        setTimeout(r, VERIFY_BASE_DELAY_MS * (attempt + 1))
      );
      continue;
    }
    throw new Error(lastMessage);
  }
  throw new Error(lastMessage || "Verification failed");
}
