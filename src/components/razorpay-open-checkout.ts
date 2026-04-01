"use client";

import { toast } from "sonner";
import type { PaidPlanId } from "@/lib/billing-plans";

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }
  if (window.Razorpay) return Promise.resolve();
  const existing = document.querySelector("script[data-razorpay-checkout]");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed"));
    document.body.appendChild(script);
  });
}

export type RazorpayPurchaseOk = { credits: number; plan: "pro" | "agency" };

export async function openRazorpayCheckout(
  planId: PaidPlanId,
  userId: string,
  userEmail: string | undefined,
  userDisplayName: string | undefined
): Promise<RazorpayPurchaseOk> {
  const res = await fetch("/api/razorpay/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  const data = (await res.json()) as {
    orderId?: string;
    keyId?: string;
    amount?: number;
    currency?: string;
    error?: string;
    details?: string;
  };
  if (!res.ok || !data.orderId || !data.keyId) {
    throw new Error(data.details || data.error || "Could not start checkout");
  }

  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.orderId,
      name: "Vibecheck",
      description: planId === "pro" ? "Pro Pack" : "Agency Pack",
      prefill: {
        email: userEmail || undefined,
        name: userDisplayName || undefined,
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const v = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId,
              planId,
            }),
          });
          const out = await v.json();
          if (!v.ok) {
            throw new Error(out.error || out.details || "Verification failed");
          }
          toast.success("Payment successful");
          resolve({
            credits: out.credits as number,
            plan: out.plan as "pro" | "agency",
          });
        } catch (e) {
          reject(e instanceof Error ? e : new Error("Verification failed"));
        }
      },
      modal: {
        ondismiss: () => reject(new Error("CLOSED")),
      },
      theme: { color: "#0f172a" },
    });
    rzp.open();
  });
}
