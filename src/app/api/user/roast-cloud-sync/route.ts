import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireFirebaseApiUser } from "@/lib/require-firebase-api-auth";
import { userMayMirrorRoastsToCloud } from "@/lib/roast-cloud-eligibility-server";
import { ROAST_CLOUD_RETENTION_MS } from "@/lib/roast-cloud-retention-ms";

const bodySchema = z.object({
  clientRoastId: z.string().min(1).max(200),
  savedAt: z.number(),
  overallScore: z.number().optional(),
  auditedUrl: z.string().optional(),
  planAtSave: z.enum(["free", "pro", "agency"]).optional(),
  payload: z.record(z.string(), z.unknown()),
});

const MAX_JSON = 900_000;

export async function POST(request: NextRequest) {
  const auth = await requireFirebaseApiUser(request);
  if (!auth.ok) return auth.response;
  const { uid } = auth;

  try {
    const json = await request.json();
    const body = bodySchema.parse(json);
    const allowed = await userMayMirrorRoastsToCloud(uid);
    if (!allowed) {
      return NextResponse.json({ error: "Cloud report sync is for Pro, Agency, or admin accounts." }, { status: 403 });
    }

    const raw = JSON.stringify(body.payload);
    if (raw.length > MAX_JSON) {
      return NextResponse.json(
        { error: "Report payload too large for cloud sync", details: `Max ${MAX_JSON} characters` },
        { status: 413 },
      );
    }

    const db = getAdminDb();
    const docId = `${uid}_${body.clientRoastId}`;
    const expiresAtMs = body.savedAt + ROAST_CLOUD_RETENTION_MS;

    await db
      .collection("roasts")
      .doc(docId)
      .set(
        {
          userId: uid,
          clientRoastId: body.clientRoastId,
          savedAt: body.savedAt,
          expiresAt: Timestamp.fromMillis(expiresAtMs),
          overallScore: body.overallScore ?? null,
          auditedUrl: body.auditedUrl ?? null,
          planAtSave: body.planAtSave ?? null,
          payload: body.payload,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return NextResponse.json({ ok: true as const });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.flatten() }, { status: 400 });
    }
    console.error("[roast-cloud-sync]", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
