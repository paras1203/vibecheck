import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseApiUser } from "@/lib/require-firebase-api-auth";
import { CaptureBlockedError } from "@/lib/capture-page-health";
import { safeErrorMessage } from "@/lib/json-utils";
import { runFreeToolsAudit } from "@/lib/run-free-tools-audit";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFirebaseApiUser(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as { url?: string; device?: string };
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const deviceRaw = body.device === "mobile" ? "mobile" : "desktop";

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const payload = await runFreeToolsAudit({ url, device: deviceRaw });
    return NextResponse.json(payload, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof CaptureBlockedError) {
      console.warn(`[free-report] capture blocked: ${error.code} ${error.message}`);
      return NextResponse.json(
        {
          error: "Page could not be audited",
          details: error.message,
          code: error.code,
        },
        { status: 422 }
      );
    }
    console.error(`[free-report] ${safeErrorMessage(error)}`);
    return NextResponse.json(
      { error: "Free report failed", details: safeErrorMessage(error) },
      { status: 500 }
    );
  }
}
