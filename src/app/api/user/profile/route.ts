import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import {
  firebaseBearerUnauthorizedResponse,
  requireFirebaseBearerUid,
} from "@/lib/request-auth-firebase";
import { ensureUserProfileForUid } from "@/lib/ensure-user-profile-server";
import { mapFirestoreUserDocToProfile } from "@/lib/user-profile-from-firestore";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest) {
  let uid: string;
  try {
    uid = await requireFirebaseBearerUid(request);
  } catch (e) {
    const unauthorized = firebaseBearerUnauthorizedResponse(e);
    if (unauthorized) return unauthorized;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureUserProfileForUid(uid);

    const auth = getAdminAuth();
    const fbUser = await auth.getUser(uid);
    const snap = await getAdminDb().collection("users").doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = mapFirestoreUserDocToProfile(
      uid,
      snap.data() as Record<string, unknown>,
      fbUser.email,
      fbUser.displayName,
      fbUser.photoURL,
    );

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[user/profile GET]", error);
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: "Could not load profile", details: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    const { displayName } = bodySchema.parse(json);

    await ensureUserProfileForUid(uid);

    const auth = getAdminAuth();
    await auth.updateUser(uid, { displayName });

    const fbUser = await auth.getUser(uid);
    const email = fbUser.email?.trim() ?? "";

    await getAdminDb()
      .collection("users")
      .doc(uid)
      .set(
        {
          uid,
          email: email || null,
          displayName,
          photoURL: fbUser.photoURL || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return NextResponse.json({ ok: true as const });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[user/profile]", error);
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: "Could not update profile", details: msg }, { status: 500 });
  }
}
