/** Session flag: show `/onboarding` once after new account creation (email sign-up or Google new user). */

export const POST_SIGNUP_ONBOARDING_SESSION_KEY = "vibecheck_post_signup_onboarding";

export function setPostSignupOnboardingPending(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(POST_SIGNUP_ONBOARDING_SESSION_KEY, "1");
}

export function peekPostSignupOnboardingPending(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(POST_SIGNUP_ONBOARDING_SESSION_KEY) === "1";
}

export function clearPostSignupOnboardingPending(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(POST_SIGNUP_ONBOARDING_SESSION_KEY);
}
