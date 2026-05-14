import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdminBearer } from "@/lib/request-admin-auth";

/** One-time ops: set `onboardingCompleted: true` where the field was never written (legacy users). */
export async function POST(request: NextRequest) {
  try {
    await requireAdminBearer(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json(
      { error: msg === "Forbidden" ? "Forbidden" : "Unauthorized" },
      { status: msg === "Forbidden" ? 403 : 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    dryRun?: boolean;
    limit?: number;
  };
  const dryRun = Boolean(body.dryRun);
  const limit = typeof body.limit === "number" && body.limit > 0 ? Math.min(body.limit, 5000) : 500;

  const db = getAdminDb();
  const snap = await db.collection("users").limit(5000).get();
  let scanned = 0;
  let matched = 0;

  for (const doc of snap.docs) {
    if (matched >= limit) break;
    scanned++;
    const data = doc.data() as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(data, "onboardingCompleted")) {
      matched++;
      if (!dryRun) {
        await doc.ref.set(
          { onboardingCompleted: true, updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      }
    }
  }

  return NextResponse.json({
    ok: true as const,
    dryRun,
    scanned,
    matched,
    note: dryRun
      ? "No writes. Omit dryRun to set onboardingCompleted:true on matched docs."
      : "Docs without an onboardingCompleted field were set to true.",
  });
}
