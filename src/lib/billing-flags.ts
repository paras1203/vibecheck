/** When true, "Unlock Full Report" skips payment and unlocks for the browser session on click. */
export function skipPaymentUnlockEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SKIP_PAYMENT_UNLOCK === "true";
}

export const SESSION_FULL_REPORT_KEY = "vibecheck_full_report_unlocked";
