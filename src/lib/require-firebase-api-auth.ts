import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  firebaseBearerUnauthorizedResponse,
  requireFirebaseBearerUid,
} from "@/lib/request-auth-firebase";

export type FirebaseApiAuthResult =
  | { ok: true; uid: string }
  | { ok: false; response: NextResponse };

/**
 * Verifies Firebase ID token for API routes. Maps Admin SDK init failures to 503 (not 401).
 */
export async function requireFirebaseApiUser(
  request: NextRequest,
  options?: { fallbackIdToken?: string | null }
): Promise<FirebaseApiAuthResult> {
  try {
    const uid = await requireFirebaseBearerUid(request, options?.fallbackIdToken ?? null);
    return { ok: true, uid };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("ServiceMisconfigured:")) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: "Service misconfigured",
            details: e.message.slice("ServiceMisconfigured:".length).trim(),
          },
          { status: 503 },
        ),
      };
    }
    const unauthorized = firebaseBearerUnauthorizedResponse(e);
    if (unauthorized) {
      return { ok: false, response: unauthorized };
    }
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Unauthorized",
          details: "Request could not be authenticated. Check server logs or try signing out and back in.",
        },
        { status: 401 },
      ),
    };
  }
}
