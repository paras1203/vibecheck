import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function requireFirebaseBearerUid(request: NextRequest): Promise<string> {
  const h = request.headers.get("authorization") || "";
  const m = /^Bearer\s+(\S+)/i.exec(h);
  const token = m?.[1];
  if (!token) {
    throw new Error("Unauthorized:missing_token");
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch (err) {
    const code =
      err &&
      typeof err === "object" &&
      "code" in err &&
      typeof (err as { code: unknown }).code === "string"
        ? (err as { code: string }).code
        : "";
    console.error("[requireFirebaseBearerUid] verifyIdToken failed", code || err);
    throw new Error("Unauthorized:invalid_token");
  }
}
