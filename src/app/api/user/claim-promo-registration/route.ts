import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  firebaseBearerUnauthorizedResponse,
  requireFirebaseBearerUid,
} from "@/lib/request-auth-firebase";
import { coerceUserCreditsFromDocument } from "@/lib/credits-config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await requireFirebaseBearerUid(request);
  } catch (e) {
    const unauthorized = firebaseBearerUnauthorizedResponse(e);
    if (unauthorized) return unauthorized;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const pref = db.collection("admin_config").doc("promo_registration");
    const uref = db.collection("users").doc(uid);

    const outcome = await db.runTransaction(async (tx) => {
      const [ps, us] = await Promise.all([tx.get(pref), tx.get(uref)]);
      if (!us.exists) {
        return { type: "no_profile" as const };
      }
      const u = us.data()!;
      if (u.promoRegistrationClaimedAt != null) {
        return { type: "already_claimed" as const };
      }
      const remaining = Number(ps.data()?.remainingSlots) || 0;
      const cpr = Number(ps.data()?.creditsPerRegistration) || 1;
      if (remaining <= 0) {
        return { type: "pool_empty" as const };
      }
      const cur = coerceUserCreditsFromDocument(u.credits);
      const msg = `Promo credits for new registration: +${cpr} credit${cpr === 1 ? "" : "s"}.`;
      tx.set(
        pref,
        {
          remainingSlots: remaining - 1,
          creditsPerRegistration: cpr,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      tx.update(uref, {
        credits: cur + cpr,
        promoRegistrationClaimedAt: FieldValue.serverTimestamp(),
        pendingHomeMessage: msg,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return {
        type: "granted" as const,
        creditsAfter: cur + cpr,
        message: msg,
      };
    });

    if (outcome.type === "no_profile") {
      return NextResponse.json({ granted: false, error: "Profile not found" }, { status: 404 });
    }
    if (outcome.type === "already_claimed") {
      return NextResponse.json({ granted: false, reason: "already_claimed" });
    }
    if (outcome.type === "pool_empty") {
      return NextResponse.json({ granted: false, reason: "pool_empty" });
    }
    return NextResponse.json({
      granted: true,
      creditsAfter: outcome.creditsAfter,
      message: outcome.message,
    });
  } catch (err) {
    console.error("[user/claim-promo-registration]", err);
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }
}
