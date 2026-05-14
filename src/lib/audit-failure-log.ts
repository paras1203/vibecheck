import "server-only";

import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export async function recordAuditFailure(input: {
  userId: string;
  auditedUrl: string;
  device: string;
  httpStatus: number;
  code?: string;
  message?: string;
}): Promise<void> {
  try {
    const url =
      input.auditedUrl.length > 2000
        ? `${input.auditedUrl.slice(0, 2000)}…`
        : input.auditedUrl;
    await getAdminDb().collection("audit_failures").add({
      createdAt: FieldValue.serverTimestamp(),
      userId: input.userId,
      auditedUrl: url,
      device: input.device === "mobile" ? "mobile" : "desktop",
      httpStatus: input.httpStatus,
      code: typeof input.code === "string" ? input.code.slice(0, 64) : "",
      message: typeof input.message === "string" ? input.message.slice(0, 500) : "",
    });
  } catch (e) {
    console.warn(
      "[audit-failure] Failed to persist:",
      e instanceof Error ? e.message : String(e),
    );
  }
}

export type AuditFailureRow = {
  id: string;
  createdAtMs: number;
  userId: string;
  auditedUrl: string;
  device: string;
  httpStatus: number;
  code: string;
  message: string;
};

function failureDocToRow(id: string, data: DocumentData): AuditFailureRow | null {
  const created = data.createdAt as Timestamp | undefined;
  const createdAtMs = created?.toMillis?.() ?? 0;
  if (!createdAtMs) return null;
  return {
    id,
    createdAtMs,
    userId: String(data.userId ?? ""),
    auditedUrl: String(data.auditedUrl ?? ""),
    device: String(data.device ?? "desktop"),
    httpStatus: Number(data.httpStatus) || 0,
    code: String(data.code ?? ""),
    message: String(data.message ?? ""),
  };
}

export async function fetchAuditFailuresSince(startMs: number): Promise<AuditFailureRow[]> {
  const db = getAdminDb();
  const start = Timestamp.fromMillis(startMs);
  const snap = await db
    .collection("audit_failures")
    .where("createdAt", ">=", start)
    .orderBy("createdAt", "desc")
    .limit(3000)
    .get();

  const out: AuditFailureRow[] = [];
  for (const d of snap.docs) {
    const row = failureDocToRow(d.id, d.data());
    if (row) out.push(row);
  }
  return out;
}
