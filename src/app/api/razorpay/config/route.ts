import { NextResponse } from "next/server";

/**
 * Safe billing hints: no secrets. Key id prefix is already exposed to the browser at checkout.
 */
export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  const hasSecret = Boolean(process.env.RAZORPAY_KEY_SECRET?.trim());
  return NextResponse.json({
    configured: Boolean(keyId && hasSecret),
    testMode: keyId.startsWith("rzp_test_"),
  });
}
