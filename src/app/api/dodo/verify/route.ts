import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { assertPaymentMatchesCheckout } from "@/lib/dodo-verify-payment";
import { getDodoPaymentsClient } from "@/lib/dodo-server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { mergePlanAfterPurchase } from "@/lib/plan-merge";
import { newUserCreditsDefault } from "@/lib/credits-config";
import { coerceUserCreditsFromDocument } from "@/lib/credits-config";
import { requireFirebaseBearerUid } from "@/lib/request-auth-firebase";

const bodySchema = z.object({
  paymentId: z.string().min(3),
});

function normalizePlanStored(p: string | undefined): "free" | "pro" | "agency" {
  const u = typeof p === "string" ? p.toLowerCase() : "";
  if (u === "pro" || u === "agency" || u === "free") return u;
  return "free";
}

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await requireFirebaseBearerUid(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { paymentId } = bodySchema.parse(body);

    const client = getDodoPaymentsClient();
    const payment = await client.payments.retrieve(paymentId);

    const statusOk = payment.status === "succeeded";
    if (!statusOk) {
      return NextResponse.json(
        {
          error: `Payment not complete (${payment.status ?? "unknown"})`,
        },
        { status: 409 }
      );
    }

    const { credits: creditsGranted, planForMerge, vcPlanId } =
      assertPaymentMatchesCheckout(payment, uid);

    try {
      await getAdminAuth().getUser(uid);
    } catch {
      return NextResponse.json({ error: "Invalid or unknown user" }, { status: 401 });
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const paymentRef = db.collection("payments").doc(paymentId);

    const existingPaid = await paymentRef.get();
    if (existingPaid.exists) {
      const fresh = await userRef.get();
      const d = fresh.data();
      return NextResponse.json({
        success: true,
        credits: coerceUserCreditsFromDocument(d?.credits),
        plan: normalizePlanStored(d?.plan as string | undefined),
        duplicate: true,
        vcPlanId,
      });
    }

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

    const result = await db.runTransaction(async (tx) => {
      const paidSnap = await tx.get(paymentRef);
      if (paidSnap.exists) {
        const u = await tx.get(userRef);
        return {
          duplicate: true as const,
          credits: coerceUserCreditsFromDocument(u.data()?.credits),
          plan: normalizePlanStored(u.data()?.plan as string | undefined),
        };
      }

      const u = await tx.get(userRef);
      const cur = coerceUserCreditsFromDocument(u.data()?.credits);
      const prevPlanStored = normalizePlanStored(u.data()?.plan as string | undefined);
      let nextCredits = cur;
      let nextPlan: "free" | "pro" | "agency" = prevPlanStored;

      if (creditsGranted > 0 || planForMerge) {
        nextCredits = cur + creditsGranted;
        if (planForMerge) {
          nextPlan = mergePlanAfterPurchase(
            prevPlanStored,
            planForMerge
          ) as "pro" | "agency";
        }
        tx.set(
          userRef,
          {
            credits: nextCredits,
            plan: nextPlan,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }

      tx.set(paymentRef, {
        userId: uid,
        provider: "dodo",
        paymentId,
        planId: vcPlanId,
        creditsGranted,
        creditsAfter: nextCredits,
        planAfter: nextPlan,
        status: "paid",
        createdAt: new Date(),
      });
      return {
        duplicate: false as const,
        credits: nextCredits,
        plan: nextPlan,
      };
    });

    return NextResponse.json({
      success: true,
      credits: result.credits,
      plan: result.plan,
      ...(result.duplicate ? { duplicate: true } : {}),
      vcPlanId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("[dodo] verify:", error);
    return NextResponse.json(
      {
        error: "Payment verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
