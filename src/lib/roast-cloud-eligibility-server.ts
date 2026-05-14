import "server-only";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isServerAdminEmail } from "@/lib/admin";

export async function userMayMirrorRoastsToCloud(uid: string): Promise<boolean> {
  const db = getAdminDb();
  const snap = await db.collection("users").doc(uid).get();
  const plan = typeof snap.data()?.plan === "string" ? snap.data()!.plan.toLowerCase() : "";
  if (plan === "pro" || plan === "agency") return true;
  try {
    const rec = await getAdminAuth().getUser(uid);
    return isServerAdminEmail(rec.email ?? null);
  } catch {
    return false;
  }
}
