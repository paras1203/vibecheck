import "server-only";
import crypto from "crypto";
import Razorpay from "razorpay";
import { PLAN_AMOUNT_PAISE, PLAN_CURRENCY, type PaidPlanId } from "@/lib/billing-plans";

function getRazorpay(): InstanceType<typeof Razorpay> {
  const key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!key_id || !key_secret) {
    throw new Error("Razorpay not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)");
  }
  return new Razorpay({ key_id, key_secret });
}

export async function razorpayCreateOrder(planId: PaidPlanId): Promise<{
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
}> {
  const rzp = getRazorpay();
  const amount = PLAN_AMOUNT_PAISE[planId];
  const receipt = `vc_${planId}_${Date.now()}`.slice(0, 40);
  const order = await rzp.orders.create({
    amount,
    currency: PLAN_CURRENCY,
    receipt,
    notes: { planId },
  });
  const keyId = process.env.RAZORPAY_KEY_ID!.trim();
  return {
    orderId: order.id,
    keyId,
    amount,
    currency: PLAN_CURRENCY,
  };
}

export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret || !signature) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Prefer payment fetch over order status: demo/test checkouts sometimes lag on
 * `order.status === "paid"` while the payment is already captured; notes on
 * orders can also be missing depending on dashboard/API behavior.
 */
export async function assertRazorpayPaymentMatchesPlan(
  paymentId: string,
  orderId: string,
  planId: PaidPlanId
): Promise<void> {
  const rzp = getRazorpay();
  const payment = await rzp.payments.fetch(paymentId);
  const ok = payment.status === "captured" || payment.status === "authorized";
  if (!ok) {
    throw new Error(`Payment not successful (${String(payment.status)})`);
  }
  if (String(payment.order_id) !== String(orderId)) {
    throw new Error("Payment does not match order");
  }
  const expected = PLAN_AMOUNT_PAISE[planId];
  const paidAmount = Number(payment.amount);
  if (!Number.isFinite(paidAmount) || paidAmount !== expected) {
    throw new Error(
      `Payment amount mismatch (expected ${expected} minor units, got ${String(payment.amount)})`
    );
  }
  const cur = String(payment.currency ?? "").toUpperCase();
  if (cur !== PLAN_CURRENCY) {
    throw new Error(`Currency mismatch (expected ${PLAN_CURRENCY}, got ${String(payment.currency)})`);
  }
}
