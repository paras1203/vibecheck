import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { firebaseBearerUnauthorizedPayload } from "@/lib/firebase-bearer-unauthorized-payload";

export { firebaseBearerUnauthorizedPayload };

/** Maps requireFirebaseBearerUid failures to API JSON (same messaging as Dodo routes). */
export function firebaseBearerUnauthorizedResponse(error: unknown): NextResponse | null {
  const payload = firebaseBearerUnauthorizedPayload(error);
  if (!payload) return null;
  return NextResponse.json(payload, { status: 401 });
}

function bearerFromHeaderValue(h: string): string | undefined {
  const m = /^Bearer\s+(\S+)/i.exec(h);
  return m?.[1];
}

export async function requireFirebaseBearerUid(
  request: NextRequest,
  fallbackRawJwt?: string | null
): Promise<string> {
  try {
    getAdminAuth();
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    console.error("[requireFirebaseBearerUid] Firebase Admin init failed", e);
    throw new Error(`ServiceMisconfigured:${m}`);
  }

  const headerPairs: [typeof tokenSource, string | null][] = [
    ["auth-header", request.headers.get("authorization")],
    ["alt-header", request.headers.get("x-firebase-authorization")],
  ];
  let token = "";
  let tokenSource: "auth-header" | "alt-header" | "body" | "missing" = "missing";
  for (const [source, raw] of headerPairs) {
    if (!raw) continue;
    const t = bearerFromHeaderValue(raw)?.trim();
    if (t) {
      token = t;
      tokenSource = source;
      break;
    }
  }
  if (!token && fallbackRawJwt?.trim()) {
    token = fallbackRawJwt.trim();
    tokenSource = "body";
  }
  if (!token) {
    // #region agent log
    fetch("http://127.0.0.1:7848/ingest/82f5425f-b2b1-4559-a030-418ece2f80c9", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "b9a3d6" },
      body: JSON.stringify({
        sessionId: "b9a3d6",
        runId: "auth-debug",
        hypothesisId: "H401",
        location: "request-auth-firebase.ts:missing-token",
        message: "no bearer or body idToken",
        data: { tokenSource },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw new Error("Unauthorized:missing_token");
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    // #region agent log
    fetch("http://127.0.0.1:7848/ingest/82f5425f-b2b1-4559-a030-418ece2f80c9", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "b9a3d6" },
      body: JSON.stringify({
        sessionId: "b9a3d6",
        runId: "auth-debug",
        hypothesisId: "H401",
        location: "request-auth-firebase.ts:verify-ok",
        message: "verifyIdToken ok",
        data: { tokenSource, uidPrefix: decoded.uid.slice(0, 6) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return decoded.uid;
  } catch (err) {
    const code =
      err &&
      typeof err === "object" &&
      "code" in err &&
      typeof (err as { code: unknown }).code === "string"
        ? (err as { code: string }).code
        : "";

    let hint =
      "Your sign-in token could not be verified. Try refreshing, or sign out and back in. For dev: ensure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are from the same Firebase project as NEXT_PUBLIC_FIREBASE_* / FIREBASE_WEB_* (project id must match).";
    if (code === "auth/id-token-expired") {
      hint = "Your session expired. Refresh the page or sign in again.";
    } else if (code === "auth/argument-error" || code === "auth/invalid-id-token") {
      hint =
        "The sign-in token is not valid for this server configuration. Confirm the Firebase project matches between client and server env vars, then sign out and back in.";
    }

    console.error("[requireFirebaseBearerUid] verifyIdToken failed", code || err);
    // #region agent log
    fetch("http://127.0.0.1:7848/ingest/82f5425f-b2b1-4559-a030-418ece2f80c9", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "b9a3d6" },
      body: JSON.stringify({
        sessionId: "b9a3d6",
        runId: "auth-debug",
        hypothesisId: "H401",
        location: "request-auth-firebase.ts:verify-fail",
        message: "verifyIdToken failed",
        data: { tokenSource, code: code || "unknown" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw new Error(`Unauthorized:invalid_token:${hint}`);
  }
}
