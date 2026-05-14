import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import {
  firebaseBearerUnauthorizedResponse,
  requireFirebaseBearerUid,
} from "@/lib/request-auth-firebase";
import { ensureUserProfileForUid } from "@/lib/ensure-user-profile-server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  displayName: z.string().optional(),
  onboardingRole: z.string().min(1),
  onboardingGoal: z.string().min(1),
});

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
    const json = await request.json();
    const { displayName, onboardingRole, onboardingGoal } = bodySchema.parse(json);

    await ensureUserProfileForUid(uid);

    const auth = getAdminAuth();
    const fbUser = await auth.getUser(uid);
    const email = fbUser.email?.trim() ?? "";
    const trimmedName = (displayName ?? "").trim();

    const db = getAdminDb();
    const ref = db.collection("users").doc(uid);
    await ref.set(
      {
        uid,
        email: email || null,
        displayName: trimmedName || fbUser.displayName || null,
        photoURL: fbUser.photoURL || null,
        onboardingCompleted: true,
        onboardingRole,
        onboardingGoal,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (trimmedName) {
      await auth.updateUser(uid, { displayName: trimmedName });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[complete-onboarding]", error);
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: "Could not save onboarding", details: msg }, { status: 500 });
  }
}
