import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { requireFirebaseApiUser } from "@/lib/require-firebase-api-auth";

const bodySchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().max(120).optional(),
});

/** Anonymous purchasers: capture email/name for Dodo customer before `/api/dodo/create-session`. */
export async function POST(request: NextRequest) {
  const auth = await requireFirebaseApiUser(request);
  if (!auth.ok) return auth.response;
  const { uid } = auth;

  try {
    const json = await request.json();
    const { email, displayName } = bodySchema.parse(json);

    const adminAuth = getAdminAuth();
    const rec = await adminAuth.getUser(uid);
    const isAnonymous =
      Array.isArray(rec.providerData) &&
      rec.providerData.some((p) => p.providerId === "anonymous");
    if (!isAnonymous && !rec.email) {
      return NextResponse.json(
        { error: "Guest checkout email is only for anonymous sessions." },
        { status: 400 },
      );
    }
    if (!isAnonymous && rec.email?.trim()) {
      return NextResponse.json(
        { error: "Account already has an email. Sign in normally." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    await userRef.set(
      {
        guestCheckoutEmail: email,
        ...(displayName?.trim()
          ? { guestCheckoutDisplayName: displayName.trim() }
          : { guestCheckoutDisplayName: FieldValue.delete() }),
        pendingFullRegistration: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ ok: true as const });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.flatten() }, { status: 400 });
    }
    console.error("[guest-checkout-contact]", error);
    return NextResponse.json({ error: "Could not save contact" }, { status: 500 });
  }
}
