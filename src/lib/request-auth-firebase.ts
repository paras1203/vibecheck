import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function requireFirebaseBearerUid(request: NextRequest): Promise<string> {
  const h = request.headers.get("authorization") || "";
  const m = /^Bearer\s+(\S+)/i.exec(h);
  const token = m?.[1];
  if (!token) {
    throw new Error("Unauthorized");
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new Error("Unauthorized");
  }
}
