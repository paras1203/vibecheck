import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isMasterAdminEmail } from "@/lib/admin";
import { newUserCreditsDefault } from "@/lib/credits-config";

/** Creates `users/{uid}` via Admin SDK when missing (bypasses client Firestore rules). */
export async function ensureUserProfileForUid(uid: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (snap.exists) return;

  const auth = getAdminAuth();
  let fbUser: Awaited<ReturnType<typeof auth.getUser>>;
  try {
    fbUser = await auth.getUser(uid);
  } catch {
    await ref.set(
      {
        uid,
        credits: newUserCreditsDefault(),
        plan: "free" as const,
        onboardingCompleted: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }

  const email = fbUser.email?.trim() ?? "";
  const master = isMasterAdminEmail(email);
  await ref.set(
    {
      uid,
      email: email || null,
      credits: newUserCreditsDefault(),
      plan: master ? ("pro" as const) : ("free" as const),
      displayName: fbUser.displayName ?? null,
      photoURL: fbUser.photoURL ?? null,
      onboardingCompleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(master ? { isMasterUser: true } : {}),
    },
    { merge: true },
  );
}
