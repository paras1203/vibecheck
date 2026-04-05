import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { coerceUserCreditsFromDocument } from "@/lib/credits-config";

export type DebitRoastResult =
  | { ok: true; creditsAfter: number }
  | { ok: false; reason: "insufficient" | "no_profile" | "persistence_error" };

export async function debitRoastCreditsIfSufficient(
  uid: string,
  cost: number
): Promise<DebitRoastResult> {
  if (cost <= 0) {
    const snap = await getAdminDb().collection("users").doc(uid).get();
    return {
      ok: true,
      creditsAfter: coerceUserCreditsFromDocument(snap.data()?.credits),
    };
  }
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        return { ok: false, reason: "no_profile" } as const;
      }
      const current = coerceUserCreditsFromDocument(snap.data()?.credits);
      if (current < cost) {
        return { ok: false, reason: "insufficient" } as const;
      }
      const next = current - cost;
      tx.set(ref, { credits: next, updatedAt: new Date() }, { merge: true });
      return { ok: true, creditsAfter: next } as const;
    });
  } catch (e) {
    console.error("[debitRoastCreditsIfSufficient]", e);
    return { ok: false, reason: "persistence_error" };
  }
}

export async function refundRoastCredits(uid: string, cost: number): Promise<void> {
  if (cost <= 0) return;
  const ref = getAdminDb().collection("users").doc(uid);
  try {
    await ref.set(
      {
        credits: FieldValue.increment(cost),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } catch (e) {
    console.error("[refundRoastCredits]", e);
  }
}
