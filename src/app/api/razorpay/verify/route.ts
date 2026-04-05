import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { PLAN_PURCHASE_CREDITS, type PaidPlanId } from "@/lib/billing-plans";
import {
  assertRazorpayPaymentMatchesPlan,
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay-server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { mergePlanAfterPurchase } from "@/lib/plan-merge";
import { newUserCreditsDefault } from "@/lib/credits-config";

const bodySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  userId: z.string(),
  planId: z.enum(["pro", "agency"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.parse(body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId } = parsed;

    if (
      !verifyRazorpayPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      )
    ) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    await assertRazorpayPaymentMatchesPlan(
      razorpay_payment_id,
      razorpay_order_id,
      planId as PaidPlanId
    );

    try {
      await getAdminAuth().getUser(userId);
    } catch {
      return NextResponse.json({ error: "Invalid or unknown user" }, { status: 401 });
    }

    const credits = PLAN_PURCHASE_CREDITS[planId as PaidPlanId];
    const userRef = getAdminDb().collection("users").doc(userId);
    let userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set(
        {
          credits: newUserCreditsDefault(),
          plan: "free",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      userDoc = await userRef.get();
    }

    const paySnap = await getAdminDb()
      .collection("payments")
      .where("paymentId", "==", razorpay_payment_id)
      .limit(1)
      .get();

    if (!paySnap.empty) {
      const fresh = await userRef.get();
      const d = fresh.data();
      return NextResponse.json({
        success: true,
        credits: Number(d?.credits ?? 0),
        plan: (d?.plan as string) || "free",
        duplicate: true,
      });
    }

    const currentCredits = userDoc.data()?.credits || 0;
    const newCredits = currentCredits + credits;
    const prevPlan = userDoc.data()?.plan as string | undefined;
    const nextPlan = mergePlanAfterPurchase(prevPlan, planId);

    await userRef.update({
      credits: newCredits,
      plan: nextPlan,
      updatedAt: new Date(),
    });

    await getAdminDb().collection("payments").add({
      userId,
      provider: "razorpay",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      planId,
      credits,
      creditsAfter: newCredits,
      planAfter: nextPlan,
      status: "paid",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      credits: newCredits,
      plan: nextPlan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Razorpay verify:", error);
    return NextResponse.json(
      {
        error: "Payment verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
