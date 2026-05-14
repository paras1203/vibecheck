import { NextRequest, NextResponse } from "next/server";
import { AuthenticationError } from "dodopayments";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import type { BillingCheckoutPlanId } from "@/lib/billing-plans";
import { normalizeCheckoutQty } from "@/lib/billing-plans";
import { publicAppOriginFromRequest } from "@/lib/billing-app-origin";
import {
  dodoPaymentsSdkDisplayMode,
  dodoProductAgencyPackId,
  dodoProductFreeTestId,
  dodoProductProId,
  getDodoPaymentsClient,
  resolveDodoEnvironment,
} from "@/lib/dodo-server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { newUserCreditsDefault } from "@/lib/credits-config";
import { requireFirebaseApiUser } from "@/lib/require-firebase-api-auth";
import { firebaseBearerUnauthorizedResponse } from "@/lib/request-auth-firebase";

const bodySchema = z.object({
  planId: z.enum(["pro", "agency", "free_test"]),
  quantity: z.number().int().positive().optional(),
  /** Fallback when proxies strip `Authorization` (same JWT as Bearer). */
  idToken: z.string().min(20).optional(),
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
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bodyParsed = bodySchema.safeParse(json);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: bodyParsed.error.flatten() },
      { status: 400 }
    );
  }
  const { planId, quantity: rawQty, idToken: bodyIdToken } = bodyParsed.data;

  const auth = await requireFirebaseApiUser(request, { fallbackIdToken: bodyIdToken });
  if (!auth.ok) return auth.response;
  const { uid } = auth;

  try {
    const unitQty = normalizeCheckoutQty(planId, rawQty ?? 1);

    const adminAuth = getAdminAuth();
    let fbUser;
    try {
      fbUser = await adminAuth.getUser(uid);
    } catch {
      return NextResponse.json({ error: "Invalid or unknown user" }, { status: 401 });
    }
    let email = fbUser.email?.trim() ?? "";

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set(
        {
          credits: newUserCreditsDefault(),
          plan: "free",
          onboardingCompleted: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      await userRef.set(
        {
          email: email || null,
          displayName: fbUser.displayName ?? null,
        },
        { merge: true }
      );
    }

    const freshSnap = await userRef.get();
    const d = freshSnap.data() as {
      guestCheckoutEmail?: string;
      guestCheckoutDisplayName?: string;
    } | undefined;
    const guestEmail = typeof d?.guestCheckoutEmail === "string" ? d.guestCheckoutEmail.trim() : "";
    if (!email && guestEmail) {
      email = guestEmail;
    }

    if (!email) {
      return NextResponse.json(
        { error: "Account email is required to start checkout", details: "Add an email on the checkout page if you are not signed in." },
        { status: 400 }
      );
    }

    const displayNameForDodo =
      fbUser.displayName?.trim() ||
      (typeof d?.guestCheckoutDisplayName === "string" ? d.guestCheckoutDisplayName.trim() : "") ||
      undefined;
    const origin = publicAppOriginFromRequest(request);
    const returnUrl = `${origin}/billing`;

    // #region agent log
    fetch("http://127.0.0.1:7848/ingest/82f5425f-b2b1-4559-a030-418ece2f80c9", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "b9a3d6" },
      body: JSON.stringify({
        sessionId: "b9a3d6",
        runId: "pre-fix",
        hypothesisId: "H5",
        location: "create-session/route.ts:before-dodo-create",
        message: "resolved return_url origin",
        data: { originPrefix: origin.slice(0, 64), planId },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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
        ...(displayNameForDodo ? { name: displayNameForDodo } : {}),
      },
      return_url: returnUrl,
      cancel_url: returnUrl,
      metadata,
      feature_flags: {
        redirect_immediately: false,
      },
    });

    if (!session.checkout_url) {
      return NextResponse.json(
        { error: "Checkout URL missing from Dodo session" },
        { status: 502 }
      );
    }

    // #region agent log
    let checkoutHost = "";
    try {
      checkoutHost = new URL(session.checkout_url).hostname;
    } catch {
      checkoutHost = "parse_fail";
    }
    fetch("http://127.0.0.1:7848/ingest/82f5425f-b2b1-4559-a030-418ece2f80c9", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "b9a3d6" },
      body: JSON.stringify({
        sessionId: "b9a3d6",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "create-session/route.ts:after-dodo-create",
        message: "dodo session created",
        data: {
          checkoutHost,
          hasCheckoutUrl: true,
          sessionIdPrefix: session.session_id?.slice(0, 6) ?? "",
          sdkMode: dodoPaymentsSdkDisplayMode(),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
      sdkMode: dodoPaymentsSdkDisplayMode(),
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      const dodoEnv = resolveDodoEnvironment();
      // #region agent log
      fetch("http://127.0.0.1:7848/ingest/82f5425f-b2b1-4559-a030-418ece2f80c9", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "b9a3d6" },
        body: JSON.stringify({
          sessionId: "b9a3d6",
          runId: "post-dodo-diagnosis",
          hypothesisId: "H-DODO-401",
          location: "create-session/route.ts:dodo-authentication-error",
          message: "Dodo API returned 401 (invalid or wrong-environment API key)",
          data: { dodoEnv, status: error.status },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      console.error("[dodo] create-session: Dodo AuthenticationError", error);
      return NextResponse.json(
        {
          error: "Dodo Payments rejected the server API key",
          details: `Dodo returned HTTP ${error.status}. In production, set DODO_PAYMENTS_API_KEY on your host (e.g. runway.app service env) to a valid Bearer key from the Dodo dashboard. test_mode keys require DODO_PAYMENTS_ENVIRONMENT=test_mode; live keys require live_mode (currently: ${dodoEnv}).`,
        },
        { status: 502 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    const unauthorized = firebaseBearerUnauthorizedResponse(error);
    if (unauthorized) return unauthorized;
    // #region agent log
    fetch("http://127.0.0.1:7848/ingest/82f5425f-b2b1-4559-a030-418ece2f80c9", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "b9a3d6" },
      body: JSON.stringify({
        sessionId: "b9a3d6",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "create-session/route.ts:catch",
        message: "create-session error",
        data: { errName: error instanceof Error ? error.name : "unknown", errSlice: msg.slice(0, 200) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    console.error("[dodo] create-session:", error);
    return NextResponse.json(
      { error: "Could not start checkout", details: msg },
      { status: 500 }
    );
  }
}
