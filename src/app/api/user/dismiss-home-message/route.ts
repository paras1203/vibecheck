import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  firebaseBearerUnauthorizedResponse,
  requireFirebaseBearerUid,
} from "@/lib/request-auth-firebase";

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
    await getAdminDb().collection("users").doc(uid).set(
      {
        pendingHomeMessage: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return NextResponse.json({ ok: true as const });
  } catch (err) {
    console.error("[user/dismiss-home-message]", err);
    return NextResponse.json({ error: "Could not dismiss message" }, { status: 500 });
  }
}
