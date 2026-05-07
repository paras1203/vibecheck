import type { User } from "@/context/AuthContext";

/** Shown when the numeric balance is shown but Firestore read failed. */
export const CREDITS_UNSYNCED_TOOLTIP =
  "Balance not confirmed with Firestore — check rules or network";

export function formatCreditsBalance(user: User | null | undefined): string {
  if (!user) return "—";
  return String(user.credits);
}

export function creditsBalanceTitle(user: User | null | undefined): string | undefined {
  if (!user?.firestoreSynced) return user ? CREDITS_UNSYNCED_TOOLTIP : undefined;
  return undefined;
}
