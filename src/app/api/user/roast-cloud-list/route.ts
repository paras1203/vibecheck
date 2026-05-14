import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireFirebaseApiUser } from "@/lib/require-firebase-api-auth";
import { userMayMirrorRoastsToCloud } from "@/lib/roast-cloud-eligibility-server";

export async function GET(request: NextRequest) {
  const auth = await requireFirebaseApiUser(request);
  if (!auth.ok) return auth.response;
  const { uid } = auth;

  const allowed = await userMayMirrorRoastsToCloud(uid);
  if (!allowed) {
    return NextResponse.json({ entries: [] as unknown[] });
  }

  const db = getAdminDb();
  const snap = await db.collection("roasts").where("userId", "==", uid).limit(80).get();
  const entries = snap.docs
    .map((d) => {
      const x = d.data();
      const id = typeof x.clientRoastId === "string" ? x.clientRoastId : "";
      if (!id) return null;
      return {
        id,
        savedAt: typeof x.savedAt === "number" ? x.savedAt : 0,
        overallScore: typeof x.overallScore === "number" ? x.overallScore : undefined,
        auditedUrl: typeof x.auditedUrl === "string" ? x.auditedUrl : undefined,
        planAtSave:
          x.planAtSave === "pro" || x.planAtSave === "agency" || x.planAtSave === "free"
            ? x.planAtSave
            : undefined,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => b.savedAt - a.savedAt);

  return NextResponse.json({ entries });
}
