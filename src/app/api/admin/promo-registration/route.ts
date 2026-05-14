import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdminBearer } from "@/lib/request-admin-auth";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  addSlots: z.number().int().positive(),
  creditsPerRegistration: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdminBearer(request);
  } catch (e) {
    const status = e instanceof Error && e.message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "Forbidden" : "Unauthorized" }, { status });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection("admin_config").doc("promo_registration");
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const cur = Number(snap.data()?.remainingSlots) || 0;
      const cpr =
        body.creditsPerRegistration ??
        (typeof snap.data()?.creditsPerRegistration === "number"
          ? snap.data()!.creditsPerRegistration
          : 1);
      tx.set(
        ref,
        {
          remainingSlots: cur + body.addSlots,
          creditsPerRegistration: cpr,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/promo-registration]", err);
    return NextResponse.json({ error: "Failed to update promo pool" }, { status: 500 });
  }
}
