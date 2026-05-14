import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireFirebaseApiUser } from "@/lib/require-firebase-api-auth";
import { userMayMirrorRoastsToCloud } from "@/lib/roast-cloud-eligibility-server";

export async function GET(request: NextRequest) {
  const auth = await requireFirebaseApiUser(request);
  if (!auth.ok) return auth.response;
  const { uid } = auth;

  const clientRoastId = request.nextUrl.searchParams.get("clientRoastId")?.trim();
  if (!clientRoastId) {
    return NextResponse.json({ error: "clientRoastId required" }, { status: 400 });
  }

  const allowed = await userMayMirrorRoastsToCloud(uid);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getAdminDb();
  const snap = await db.collection("roasts").doc(`${uid}_${clientRoastId}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const payload = snap.data()?.payload;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "No payload" }, { status: 404 });
  }
  return NextResponse.json({ payload });
}
