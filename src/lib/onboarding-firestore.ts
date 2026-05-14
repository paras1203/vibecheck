/** Firestore `users/{uid}.onboardingCompleted`: booleans only; missing field → incomplete (requires onboarding tiles). Legacy accounts: run admin `grandfather-onboarding-missing` once to set true. */
export function parseOnboardingCompletedFromFirestore(raw: unknown): boolean {
  if (raw === undefined || raw === null) return false;
  return Boolean(raw);
}
