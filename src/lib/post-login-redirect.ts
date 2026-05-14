/** Incomplete onboarding goes to `/onboarding` unless the destination is `/checkout` (buy flow preserves query string). */
export function resolvePostLoginPath(params: {
  hasExplicitNextQuery: boolean;
  nextPath: string;
  onboardingCompleted: boolean;
}): string {
  const { nextPath, onboardingCompleted } = params;
  if (onboardingCompleted) return nextPath;
  const pathOnly = nextPath.split("?")[0] ?? "";
  if (pathOnly === "/checkout") return nextPath;
  return "/onboarding";
}
