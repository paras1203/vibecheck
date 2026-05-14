import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { isServerAdminEmail } from "@/lib/admin";

export async function requireAdminBearer(request: NextRequest): Promise<{
  uid: string;
  email: string;
}> {
  const authHeader = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match?.[1]) {
    throw new Error("Unauthorized");
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(match[1]);
    const email = decoded.email ?? "";
    if (!isServerAdminEmail(email)) {
      throw new Error("Forbidden");
    }
    return { uid: decoded.uid, email };
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") throw e;
    throw new Error("Unauthorized");
  }
}
