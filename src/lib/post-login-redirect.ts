/**
 * After login, route to onboarding only when the user still needs tiles and either
 * session says "just signed up" or `next` explicitly targets onboarding (marketing signup CTAs).
 * Otherwise respects `next` (e.g. `/dashboard`) so ambient navigation never forces onboarding.
 */
export function resolvePostLoginPath(params: {
  hasExplicitNextQuery: boolean;
  nextPath: string;
  onboardingCompleted: boolean;
  postSignupOnboardingPending: boolean;
}): string {
  const { nextPath, onboardingCompleted, postSignupOnboardingPending } = params;
  if (onboardingCompleted) return nextPath;
  const pathOnly = nextPath.split("?")[0] ?? "";
  if (pathOnly === "/checkout") return nextPath;
  if (postSignupOnboardingPending || pathOnly === "/onboarding") return "/onboarding";
  return nextPath;
}
