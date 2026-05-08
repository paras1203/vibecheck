import { NextResponse } from "next/server";
import { readFirebaseWebPublicConfigFromProcessEnv } from "@/lib/server-firebase-public-env";

export const dynamic = "force-dynamic";

/**
 * Public Firebase web SDK fields (same as Firebase Console “SDK setup”).
 * Lets the browser recover when NEXT_PUBLIC_* was empty at `next build` (e.g. Docker)
 * but variables exist at runtime on the server (Railway, etc.).
 */
export function GET() {
  const cfg = readFirebaseWebPublicConfigFromProcessEnv();
  if (!cfg) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const authDomain =
    cfg.authDomain?.trim() || `${cfg.projectId}.firebaseapp.com`;

  return NextResponse.json(
    {
      apiKey: cfg.apiKey,
      authDomain,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
      ...(cfg.measurementId ? { measurementId: cfg.measurementId } : {}),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
