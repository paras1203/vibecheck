import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import type { BillingCheckoutPlanId } from "@/lib/billing-plans";
import { normalizeCheckoutQty } from "@/lib/billing-plans";
import { publicAppOriginFromRequest } from "@/lib/billing-app-origin";
import {
  dodoProductAgencyPackId,
  dodoProductFreeTestId,
  dodoProductProId,
  getDodoPaymentsClient,
} from "@/lib/dodo-server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { newUserCreditsDefault } from "@/lib/credits-config";
import { requireFirebaseBearerUid } from "@/lib/request-auth-firebase";

const bodySchema = z.object({
  planId: z.enum(["pro", "agency", "free_test"]),
  quantity: z.number().int().positive().optional(),
});

function productCartForPlan(planId: BillingCheckoutPlanId, unitQty: number) {
  switch (planId) {
    case "pro":
      return [{ product_id: dodoProductProId(), quantity: unitQty }];
    case "agency":
      return [{ product_id: dodoProductAgencyPackId(), quantity: unitQty }];
    case "free_test":
      return [{ product_id: dodoProductFreeTestId(), quantity: 1 }];
    default:
      return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = await requireFirebaseBearerUid(request);
    const json = await request.json();
    const { planId, quantity: rawQty } = bodySchema.parse(json);
    const unitQty = normalizeCheckoutQty(planId, rawQty ?? 1);

    const auth = getAdminAuth();
    let fbUser;
    try {
      fbUser = await auth.getUser(uid);
    } catch {
      return NextResponse.json({ error: "Invalid or unknown user" }, { status: 401 });
    }
    const email = fbUser.email?.trim();
    if (!email) {
      return NextResponse.json(
        { error: "Account email is required to start checkout" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set(
        {
          credits: newUserCreditsDefault(),
          plan: "free",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      await userRef.set(
        {
          email,
          displayName: fbUser.displayName ?? null,
        },
        { merge: true }
      );
    }

    const origin = publicAppOriginFromRequest(request);
    const returnUrl = `${origin}/billing`;

    const metadata: Record<string, string> = {
      firebase_uid: uid,
      vc_plan: planId,
      vc_unit_qty: String(planId === "free_test" ? 1 : unitQty),
    };

    const client = getDodoPaymentsClient();
    const session = await client.checkoutSessions.create({
      product_cart: productCartForPlan(planId, unitQty),
      customer: {
        email,
        name: fbUser.displayName?.trim() || undefined,
      },
      return_url: returnUrl,
      cancel_url: returnUrl,
      metadata,
      feature_flags: {
        redirect_immediately: true,
      },
    });

    if (!session.checkout_url) {
      return NextResponse.json(
        { error: "Checkout URL missing from Dodo session" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[dodo] create-session:", error);
    return NextResponse.json(
      { error: "Could not start checkout", details: msg },
      { status: 500 }
    );
  }
}
