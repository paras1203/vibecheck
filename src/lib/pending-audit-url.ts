const STORAGE_KEY = "vibecheck_pending_audit_url";

export function stashPendingAuditUrl(url: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, url.trim());
  } catch {
    /* ignore quota / private mode */
  }
}

export function readPendingAuditUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function clearPendingAuditUrl(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
