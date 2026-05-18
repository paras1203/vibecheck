import { coerceUserCreditsFromDocument } from "@/lib/credits-config";
import { parseOnboardingCompletedFromFirestore } from "@/lib/onboarding-firestore";

export type UserProfilePayload = {
  uid: string;
  email: string;
  credits: number;
  plan: "free" | "pro" | "agency";
  displayName?: string;
  photoURL?: string;
  onboardingCompleted: boolean;
  onboardingRole?: string;
  onboardingGoal?: string;
  pendingHomeMessage?: string;
  guestCheckoutEmail?: string;
};

function parsePendingHomeMessage(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return t.length ? t : undefined;
}

export function mapFirestoreUserDocToProfile(
  uid: string,
  data: Record<string, unknown>,
  authEmail?: string | null,
  authDisplayName?: string | null,
  authPhotoURL?: string | null,
): UserProfilePayload {
  const rawPlan = data.plan;
  const normalizedPlan =
    typeof rawPlan === "string"
      ? (["free", "pro", "agency"].includes(rawPlan.toLowerCase())
          ? (rawPlan.toLowerCase() as UserProfilePayload["plan"])
          : "free")
      : "free";
  const roleRaw = data.onboardingRole;
  const goalRaw = data.onboardingGoal;
  const guestMail =
    typeof data.guestCheckoutEmail === "string" ? data.guestCheckoutEmail.trim() : "";
  const email =
    (typeof data.email === "string" && data.email.trim()) ||
    authEmail?.trim() ||
    "";

  return {
    uid,
    email,
    credits: coerceUserCreditsFromDocument(data.credits),
    plan: normalizedPlan,
    displayName:
      (typeof data.displayName === "string" && data.displayName.trim()) ||
      authDisplayName?.trim() ||
      undefined,
    photoURL:
      (typeof data.photoURL === "string" && data.photoURL.trim()) ||
      authPhotoURL?.trim() ||
      undefined,
    onboardingCompleted: parseOnboardingCompletedFromFirestore(data.onboardingCompleted),
    onboardingRole: typeof roleRaw === "string" ? roleRaw : undefined,
    onboardingGoal: typeof goalRaw === "string" ? goalRaw : undefined,
    pendingHomeMessage: parsePendingHomeMessage(data.pendingHomeMessage),
    ...(guestMail ? { guestCheckoutEmail: guestMail } : {}),
  };
}
