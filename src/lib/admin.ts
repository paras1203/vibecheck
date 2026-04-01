function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getClientAdminEmail(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").trim();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const allow = getClientAdminEmail();
  if (!allow || !email) return false;
  return normalizeEmail(email) === normalizeEmail(allow);
}

export function getServerAdminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  const parts = raw
    .split(/[,;]/)
    .map((s) => normalizeEmail(s))
    .filter(Boolean);
  return new Set(parts);
}

export function isServerAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const set = getServerAdminEmailSet();
  if (set.size === 0) return false;
  return set.has(normalizeEmail(email));
}
