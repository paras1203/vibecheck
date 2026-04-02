import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { mergePlanAfterPurchase } from "@/lib/plan-merge";

const verifyPaymentSchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
  userId: z.string(),
  credits: z.number().min(1),
  planId: z.enum(["pro", "agency"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, userId, credits, planId } =
      verifyPaymentSchema.parse(body);
    const purchasedPlan: "pro" | "agency" =
      planId ?? (credits >= 5 ? "agency" : "pro");

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json(
        { error: "Payment not successful", status: payment.status },
        { status: 400 }
      );
    }

    const userRef = getAdminDb().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const currentCredits = userDoc.data()?.credits || 0;
    const newCredits = currentCredits + credits;
    const prevPlan = userDoc.data()?.plan as string | undefined;
    const nextPlan = mergePlanAfterPurchase(prevPlan, purchasedPlan);

    await userRef.update({
      credits: newCredits,
      plan: nextPlan,
      updatedAt: new Date(),
    });

    await getAdminDb().collection("payments").add({
      userId,
      orderId,
      paymentId,
      amount: Number(payment.amount) / 100,
      currency: payment.currency,
      credits,
      planId: purchasedPlan,
      status: payment.status,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      credits: newCredits,
      plan: nextPlan,
      message: "Payment verified and credits added",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

