import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export async function debitRoastCreditsIfSufficient(
  uid: string,
  cost: number
): Promise<{ ok: true; creditsAfter: number } | { ok: false }> {
  if (cost <= 0) {
    const snap = await getAdminDb().collection("users").doc(uid).get();
    return {
      ok: true,
      creditsAfter: Number(snap.data()?.credits ?? 0),
    };
  }
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid);
  try {
    const creditsAfter = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = Number(snap.data()?.credits ?? 0);
      if (current < cost) {
        return null;
      }
      const next = current - cost;
      tx.update(ref, { credits: next, updatedAt: new Date() });
      return next;
    });
    if (creditsAfter === null) {
      return { ok: false };
    }
    return { ok: true, creditsAfter };
  } catch {
    return { ok: false };
  }
}

export async function refundRoastCredits(uid: string, cost: number): Promise<void> {
  if (cost <= 0) return;
  const ref = getAdminDb().collection("users").doc(uid);
  await ref.update({
    credits: FieldValue.increment(cost),
    updatedAt: new Date(),
  });
}
