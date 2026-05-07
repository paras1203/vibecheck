import type { AuditReportPayload } from "@/lib/report-html";

/** API-only keys; must not be persisted with the roast payload. */
export function stripRoastApiBillingFields(data: Record<string, unknown>): Record<string, unknown> {
  const { creditsRemaining: _c, ...rest } = data;
  return rest;
}

const heroSessionSuffix = "_hero_b64";

function sessionHeroKey(roastId: string): string {
  return `roast_${roastId}${heroSessionSuffix}`;
}

function stashHeroSession(roastId: string, hero: string): void {
  try {
    sessionStorage.setItem(sessionHeroKey(roastId), hero);
  } catch {
    /* ignore */
  }
}

/** Drop heavy fields before `localStorage` (quota). */
export function roastDataForLocalStorage(data: AuditReportPayload): AuditReportPayload {
  const { heroScreenshot: _h, ...rest } = data;
  return rest;
}

/** Prefer full payload (keeps hero snapshot). On quota error, strip body and stash hero in sessionStorage. */
export function persistRoastForClientNavigation(
  roastId: string,
  payload: AuditReportPayload
): void {
  const key = `roast_${roastId}`;
  const hero = payload.heroScreenshot;
  if (hero != null && String(hero).trim()) {
    stashHeroSession(roastId, String(hero));
  } else {
    try {
      sessionStorage.removeItem(sessionHeroKey(roastId));
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.setItem(key, JSON.stringify(payload));
    return;
  } catch {
    if (hero != null && String(hero).trim()) {
      stashHeroSession(roastId, String(hero));
    }
    localStorage.setItem(key, JSON.stringify(roastDataForLocalStorage(payload)));
  }
}

/** Attach hero from session fallback when localStorage row omits it. */
export function mergeRoastHeroFromSession(
  roastId: string,
  data: AuditReportPayload
): AuditReportPayload {
  if (data.heroScreenshot != null && String(data.heroScreenshot).trim()) {
    return data;
  }
  try {
    const h = sessionStorage.getItem(sessionHeroKey(roastId));
    if (h != null && h.trim()) {
      return { ...data, heroScreenshot: h };
    }
  } catch {
    /* ignore */
  }
  return data;
}
