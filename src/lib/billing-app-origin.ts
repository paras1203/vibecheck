import type { NextRequest } from "next/server";

function firstCommaSeparated(value: string | null): string {
  if (!value) return "";
  return value.split(",")[0]?.trim() ?? "";
}

function originFromRequestHeaders(request: NextRequest): string {
  const host =
    firstCommaSeparated(request.headers.get("x-forwarded-host")) ||
    firstCommaSeparated(request.headers.get("host"));
  const proto = firstCommaSeparated(request.headers.get("x-forwarded-proto")) || "http";
  const safeProto = proto === "https" || proto === "http" ? proto : "https";
  if (!host) return "http://localhost:3000";
  return `${safeProto}://${host}`;
}

/**
 * Turns user/host input into `scheme://host` (no path, no trailing slash) so Dodo
 * `return_url` / `cancel_url` always get a valid absolute URL.
 * If the value has no scheme (common mistake: `NEXT_PUBLIC_APP_URL=myapp.railway.app`), https is assumed.
 */
export function normalizePublicSiteOrigin(raw: string): string {
  let s = raw.trim();
  if (!s) return "http://localhost:3000";
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return "http://localhost:3000";
  }
  if (!u.hostname) return "http://localhost:3000";

  const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (isLocal) {
    const p = u.protocol === "https:" ? "http:" : u.protocol;
    return `${p}//${u.host}`;
  }

  if (u.protocol === "http:" && process.env.NODE_ENV === "production") {
    return `https://${u.host}`;
  }

  return `${u.protocol}//${u.host}`;
}

export function publicAppOriginFromRequest(request: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const raw = env?.length ? env.replace(/\/$/, "") : originFromRequestHeaders(request);
  return normalizePublicSiteOrigin(raw);
}
