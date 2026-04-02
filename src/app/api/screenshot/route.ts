import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { takeScreenshot } from "@/lib/screenshot";
import { getAdminStorage } from "@/lib/firebase-admin";

// Schema for request validation
const screenshotRequestSchema = z.object({
  url: z.string().min(1, "URL is required"),
  device: z.enum(["desktop", "mobile"]).optional().default("desktop"),
});

/**
 * Normalizes a URL by adding https:// if no protocol is present
 */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  // If it already has a protocol, return as is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // Otherwise, add https://
  return `https://${trimmed}`;
}

/**
 * POST /api/screenshot
 * Captures a screenshot of the provided URL and uploads it to Firebase Storage
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { url, device } = screenshotRequestSchema.parse(body);
    
    // Normalize the URL (add https:// if missing)
    const normalizedUrl = normalizeUrl(url);
    
    // Validate the normalized URL is actually a valid URL
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format", details: `"${url}" is not a valid URL` },
        { status: 400 }
      );
    }

    console.log(`Taking screenshots in ${device} mode for URL: ${normalizedUrl}`);

    // Take rolling screenshots (returns array of base64 strings)
    const screenshotBase64Array = await takeScreenshot(normalizedUrl, device);

    console.log(`Captured ${screenshotBase64Array.length} screenshot chunks`);

    // Upload all screenshots to Firebase Storage and get signed URLs
    const bucket = getAdminStorage().bucket();
    const timestamp = Date.now();
    const screenshotUrls: string[] = [];

    // Upload each screenshot chunk
    for (let i = 0; i < screenshotBase64Array.length; i++) {
      const base64String = screenshotBase64Array[i];
      
      // Convert base64 to buffer
      const screenshotBuffer = Buffer.from(base64String, "base64");

      // Generate unique filename for each chunk
      const filename = `screenshots/${timestamp}-chunk-${i + 1}-${Math.random().toString(36).substring(7)}.jpg`;

      // Upload to Firebase Storage
      const file = bucket.file(filename);
      await file.save(screenshotBuffer, {
        metadata: {
          contentType: "image/jpeg",
        },
      });

      // Generate signed URL (accessible for 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const [screenshotUrl] = await file.getSignedUrl({
        action: "read",
        expires: expiresAt,
      });

      screenshotUrls.push(screenshotUrl);
      console.log(`Uploaded chunk ${i + 1}/${screenshotBase64Array.length}: ${filename}`);
    }

    return NextResponse.json(
      { screenshotUrls }, // Return array of URLs
      { status: 200 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((issue) => issue.message).join(", ");
      return NextResponse.json(
        { error: "Invalid request", details: errorMessages },
        { status: 400 }
      );
    }

    // Handle other errors with detailed logging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Screenshot API error:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { 
        error: "Failed to capture screenshot", 
        details: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === "development" && errorStack ? { stack: errorStack } : {}),
      },
      { status: 500 }
    );
  }
}

