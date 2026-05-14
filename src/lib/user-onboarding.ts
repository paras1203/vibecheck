import type { User } from "@/context/AuthContext";

export function userNeedsOnboarding(user: User | null): boolean {
  if (!user?.firestoreSynced) return false;
  return !user.onboardingCompleted;
}
