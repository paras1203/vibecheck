import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { razorpayCreateOrder } from "@/lib/razorpay-server";
import type { PaidPlanId } from "@/lib/billing-plans";

const bodySchema = z.object({
  planId: z.enum(["pro", "agency"]),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { planId } = bodySchema.parse(json);
    const { orderId, keyId, amount, currency } = await razorpayCreateOrder(planId as PaidPlanId);
    return NextResponse.json({ orderId, keyId, amount, currency });
  } catch (error) {
    console.error("Razorpay create-order:", error);
    return NextResponse.json(
      {
        error: "Failed to create Razorpay order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
