import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireFirebaseApiUser } from "@/lib/require-firebase-api-auth";
import { userMayMirrorRoastsToCloud } from "@/lib/roast-cloud-eligibility-server";
import { roastCloudExpiresAtMs } from "@/lib/roast-cloud-retention-ms";

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
  const ref = db.collection("roasts").doc(`${uid}_${clientRoastId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const x = snap.data()!;
  const savedAt = typeof x.savedAt === "number" ? x.savedAt : 0;
  const expiresMs = roastCloudExpiresAtMs(savedAt, x.expiresAt);
  if (Date.now() > expiresMs) {
    await ref.delete();
    return NextResponse.json({ error: "Expired" }, { status: 404 });
  }

  const payload = x.payload;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "No payload" }, { status: 404 });
  }
  return NextResponse.json({ payload });
}
