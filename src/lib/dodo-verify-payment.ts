import "server-only";
import type { BillingCheckoutPlanId, PaidPlanId } from "@/lib/billing-plans";
import { creditsForPurchase, normalizeCheckoutQty } from "@/lib/billing-plans";
import {
  dodoProductAgencyPackId,
  dodoProductFreeTestId,
  dodoProductProId,
} from "@/lib/dodo-server";
import type { Payment as DodoPayment } from "dodopayments/resources/payments";

type CartRow = { product_id: string; quantity: number };

function sortCart(c: CartRow[]): CartRow[] {
  return [...c].sort((a, b) => a.product_id.localeCompare(b.product_id));
}

function expectedCart(planId: BillingCheckoutPlanId, qty: number): CartRow[] {
  switch (planId) {
    case "pro":
      return sortCart([{ product_id: dodoProductProId(), quantity: qty }]);
    case "agency":
      return sortCart([{ product_id: dodoProductAgencyPackId(), quantity: qty }]);
    case "free_test":
      return sortCart([{ product_id: dodoProductFreeTestId(), quantity: 1 }]);
    default:
      return [];
  }
}

function cartsEqual(a: CartRow[], b: CartRow[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function parseVcPlan(raw: unknown): BillingCheckoutPlanId | null {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return s === "pro" || s === "agency" || s === "free_test" ? s : null;
}

export function assertPaymentMatchesCheckout(
  payment: DodoPayment,
  firebaseUidFromToken: string
): {
  credits: number;
  planForMerge?: PaidPlanId;
  vcPlanId: BillingCheckoutPlanId;
} {
  const meta = payment.metadata || {};
  const uid = meta.firebase_uid?.trim();
  if (!uid || uid !== firebaseUidFromToken) {
    throw new Error("Payment does not belong to signed-in account");
  }
  const vcPlanId = parseVcPlan(meta.vc_plan);
  if (!vcPlanId) throw new Error("Invalid checkout metadata");
  const unitQty = normalizeCheckoutQty(vcPlanId, meta.vc_unit_qty);

  const fromPayment =
    payment.product_cart?.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })) ?? [];

  const exp = expectedCart(vcPlanId, unitQty);
  const normalized = sortCart(fromPayment);

  if (!cartsEqual(normalized, exp)) {
    throw new Error("Payment line items mismatch");
  }

  if (vcPlanId === "free_test") {
    return { credits: 0, vcPlanId };
  }

  const credits = creditsForPurchase(vcPlanId, unitQty);
  return { credits, planForMerge: vcPlanId, vcPlanId };
}
