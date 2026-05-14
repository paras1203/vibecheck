import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdminBearer } from "@/lib/request-admin-auth";
import { coerceUserCreditsFromDocument } from "@/lib/credits-config";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  uid: z.string().min(1),
  credits: z.number().int().positive(),
  reason: z.string().max(240).optional(),
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
    const uref = db.collection("users").doc(body.uid);
    await db.runTransaction(async (tx) => {
      const us = await tx.get(uref);
      if (!us.exists) {
        throw new Error("not_found");
      }
      const cur = coerceUserCreditsFromDocument(us.data()?.credits);
      const msg = `You received ${body.credits} bonus credit${body.credits === 1 ? "" : "s"}.${body.reason ? ` ${body.reason}` : ""}`.trim();
      tx.update(uref, {
        credits: cur + body.credits,
        pendingHomeMessage: msg,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "not_found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("[admin/grant-credits]", err);
    return NextResponse.json({ error: "Grant failed" }, { status: 500 });
  }
}
