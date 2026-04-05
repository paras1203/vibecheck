/** Credits assigned to brand-new Firestore user profiles (not existing docs). */
export function newUserCreditsDefault(): number {
  const raw = process.env.NEXT_PUBLIC_DEFAULT_NEW_USER_CREDITS;
  const base = raw !== undefined && raw !== "" ? parseInt(raw, 10) : 20;
  const safeBase = Number.isFinite(base) && base >= 0 ? base : 20;
  if (process.env.NEXT_PUBLIC_PROMO_ACTIVE !== "true") return safeBase;
  const bonusRaw = process.env.NEXT_PUBLIC_PROMO_BONUS_ROAST_CREDITS;
  const bonus =
    bonusRaw !== undefined && bonusRaw !== "" ? parseInt(bonusRaw, 10) : 0;
  const safeBonus = Number.isFinite(bonus) && bonus > 0 ? bonus : 0;
  return safeBase + safeBonus;
}

/** Shown in UI: preview/roast from the marketing funnel does not consume paid credits. */
export function isPreviewRoastFree(): boolean {
  return process.env.NEXT_PUBLIC_PREVIEW_ROAST_USES_CREDITS !== "true";
}
