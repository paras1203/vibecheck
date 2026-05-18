import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireFirebaseApiUser } from "@/lib/require-firebase-api-auth";
import { userMayMirrorRoastsToCloud } from "@/lib/roast-cloud-eligibility-server";
import { roastCloudExpiresAtMs } from "@/lib/roast-cloud-retention-ms";

export async function GET(request: NextRequest) {
  const auth = await requireFirebaseApiUser(request);
  if (!auth.ok) return auth.response;
  const { uid } = auth;

  const allowed = await userMayMirrorRoastsToCloud(uid);
  if (!allowed) {
    return NextResponse.json({ entries: [] as unknown[], purgedClientRoastIds: [] as string[] });
  }

  const db = getAdminDb();
  const snap = await db.collection("roasts").where("userId", "==", uid).limit(80).get();
  const now = Date.now();
  const batch = db.batch();
  const purgedClientRoastIds: string[] = [];
  let deletes = 0;

  type EntryRow = {
    id: string;
    savedAt: number;
    overallScore?: number;
    auditedUrl?: string;
    planAtSave?: "free" | "pro" | "agency";
  };

  const kept: EntryRow[] = [];

  for (const d of snap.docs) {
    const x = d.data();
    const id = typeof x.clientRoastId === "string" ? x.clientRoastId : "";
    if (!id) continue;
    const savedAt = typeof x.savedAt === "number" ? x.savedAt : 0;
    const expiresMs = roastCloudExpiresAtMs(savedAt, x.expiresAt);
    if (now > expiresMs) {
      batch.delete(d.ref);
      purgedClientRoastIds.push(id);
      deletes += 1;
      continue;
    }
    kept.push({
      id,
      savedAt,
      overallScore: typeof x.overallScore === "number" ? x.overallScore : undefined,
      auditedUrl: typeof x.auditedUrl === "string" ? x.auditedUrl : undefined,
      planAtSave:
        x.planAtSave === "pro" || x.planAtSave === "agency" || x.planAtSave === "free"
          ? x.planAtSave
          : undefined,
    });
  }

  if (deletes > 0) {
    await batch.commit();
  }

  const entries = kept.sort((a, b) => b.savedAt - a.savedAt);

  return NextResponse.json({ entries, purgedClientRoastIds });
}
