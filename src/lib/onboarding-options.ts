export const ONBOARDING_ROLE_OPTIONS = [
  { id: "founder", label: "Founder or business owner" },
  { id: "marketer", label: "Marketing or growth" },
  { id: "designer", label: "Design or UX" },
  { id: "developer", label: "Developer or product" },
  { id: "agency", label: "Agency or consultant" },
  { id: "other", label: "Other" },
] as const;

export const ONBOARDING_GOAL_OPTIONS = [
  { id: "conversions", label: "Improve conversions or sign-ups" },
  { id: "messaging", label: "Sharpen messaging and clarity" },
  { id: "trust", label: "Build trust and credibility" },
  { id: "cta", label: "Fix calls to action and user flow" },
  { id: "benchmark", label: "Benchmark against competitors" },
  { id: "other_goal", label: "Something else" },
] as const;

export type OnboardingRoleId = (typeof ONBOARDING_ROLE_OPTIONS)[number]["id"];
export type OnboardingGoalId = (typeof ONBOARDING_GOAL_OPTIONS)[number]["id"];
