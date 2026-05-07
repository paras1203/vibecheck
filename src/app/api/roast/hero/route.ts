import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { captureScreenshotFromUrl } from "@/lib/capture";
import { safeErrorMessage } from "@/lib/json-utils";

const bodySchema = z.object({
  url: z.string().min(1, "URL is required"),
  device: z.enum(["desktop", "mobile"]).optional().default("desktop"),
});

/**
 * POST /api/roast/hero
 * First-viewport capture when client storage omitted heroScreenshot.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { url, device } = bodySchema.parse(json);
    const { screenshots } = await captureScreenshotFromUrl(url, device);
    const heroScreenshot = screenshots[0] ?? null;
    return NextResponse.json({ heroScreenshot });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: "Invalid request", details }, { status: 400 });
    }
    console.error("[api/roast/hero]", safeErrorMessage(error));
    return NextResponse.json(
      {
        error: "Failed to capture viewport",
        details: safeErrorMessage(error),
        heroScreenshot: null,
      },
      { status: 500 }
    );
  }
}
