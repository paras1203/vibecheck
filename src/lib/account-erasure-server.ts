import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

const BATCH_SIZE = 400;

async function deleteWhereEq(
  db: Firestore,
  collectionId: string,
  field: string,
  value: string,
): Promise<number> {
  let total = 0;
  for (;;) {
    const snap = await db.collection(collectionId).where(field, "==", value).limit(BATCH_SIZE).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    total += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }
  return total;
}

async function anonymizePaymentsForUid(db: Firestore, uid: string): Promise<number> {
  let total = 0;
  for (;;) {
    const snap = await db.collection("payments").where("userId", "==", uid).limit(BATCH_SIZE).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.update(doc.ref, {
        userId: FieldValue.delete(),
        personalAccountReferenceRemovedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    total += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }
  return total;
}

export type AccountErasureStats = {
  deletedRoasts: number;
  deletedScans: number;
  deletedAuditLogs: number;
  deletedAuditFailures: number;
  anonymizedPayments: number;
  userDocDeleted: boolean;
};

/** Removes personal data stored under this Firebase uid. Call before `deleteUser` on Auth. */
export async function eraseFirestorePersonalDataForUid(uid: string): Promise<AccountErasureStats> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  const [deletedRoasts, deletedScans, deletedAuditLogs, deletedAuditFailures] = await Promise.all([
    deleteWhereEq(db, "roasts", "userId", uid),
    deleteWhereEq(db, "scans", "userId", uid),
    deleteWhereEq(db, "audit_logs", "userId", uid),
    deleteWhereEq(db, "audit_failures", "userId", uid),
  ]);

  const anonymizedPayments = await anonymizePaymentsForUid(db, uid);

  let userDocDeleted = false;
  if (userSnap.exists) {
    await userRef.delete();
    userDocDeleted = true;
  }

  return {
    deletedRoasts,
    deletedScans,
    deletedAuditLogs,
    deletedAuditFailures,
    anonymizedPayments,
    userDocDeleted,
  };
}

export async function deleteAuthUserIfExists(uid: string): Promise<{ deleted: boolean }> {
  try {
    await getAdminAuth().deleteUser(uid);
    return { deleted: true };
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e && typeof (e as { code: unknown }).code === "string"
        ? (e as { code: string }).code
        : "";
    if (code === "auth/user-not-found") {
      return { deleted: false };
    }
    throw e;
  }
}
