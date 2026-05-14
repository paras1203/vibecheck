function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const MASTER_ADMIN_EMAIL_LIST = ["paraskumarvyas@gmail.com", "connect@blenz.in"] as const;

const MASTER_ADMIN_EMAIL_SET = new Set(
  MASTER_ADMIN_EMAIL_LIST.map((e) => normalizeEmail(e)),
);

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return MASTER_ADMIN_EMAIL_SET.has(normalizeEmail(email));
}

export function getClientAdminEmail(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").trim();
}

export function getServerAdminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  const parts = raw
    .split(/[,;]/)
    .map((s) => normalizeEmail(s))
    .filter(Boolean);
  const set = new Set(parts);
  for (const e of MASTER_ADMIN_EMAIL_SET) set.add(e);
  return set;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const norm = normalizeEmail(email);
  if (MASTER_ADMIN_EMAIL_SET.has(norm)) return true;
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  const envParts = raw
    .split(/[,;]/)
    .map((s) => normalizeEmail(s))
    .filter(Boolean);
  return envParts.includes(norm);
}

export function isServerAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getServerAdminEmailSet().has(normalizeEmail(email));
}
