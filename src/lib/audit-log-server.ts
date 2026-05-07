import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentData,
} from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { estimateTotalAuditCostUsd } from "@/lib/audit-meta-cost";

export type RoastMetaForAuditLog = {
  estimatedCost?: number;
  auditTokenUsageTotal?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
  auditTokenBreakdown?: {
    workers?: Array<{
      model?: string;
      promptTokens?: number;
      candidatesTokens?: number;
    }>;
    narrativeRoast?: {
      model?: string;
      promptTokens?: number;
      candidatesTokens?: number;
    } | null;
    insightLayers?: {
      model?: string;
      promptTokens?: number;
      candidatesTokens?: number;
    };
  };
};

/**
 * Persists one row per completed authenticated roast for admin analytics (Firestore `audit_logs`).
 * Failures are logged only — never throws to the client.
 */
export async function recordAuditLogEntry(input: {
  userId: string;
  auditedUrl: string;
  device: string;
  overallScore: number;
  industryGuess?: string;
  pageType?: string;
  meta: RoastMetaForAuditLog | null | undefined;
}): Promise<void> {
  try {
    const db = getAdminDb();
    const tu = input.meta?.auditTokenUsageTotal;
    const promptTokens = Number(tu?.promptTokens) || 0;
    const candidatesTokens = Number(tu?.candidatesTokens) || 0;
    const totalTokens =
      Number(tu?.totalTokens) || promptTokens + candidatesTokens;
    const estimatedCostUsd = estimateTotalAuditCostUsd(input.meta ?? {});

    const url =
      input.auditedUrl.length > 2000
        ? `${input.auditedUrl.slice(0, 2000)}…`
        : input.auditedUrl;

    await db.collection("audit_logs").add({
      createdAt: FieldValue.serverTimestamp(),
      userId: input.userId,
      auditedUrl: url,
      device: input.device === "mobile" ? "mobile" : "desktop",
      overallScore: Math.round(Number(input.overallScore) || 0),
      promptTokens,
      candidatesTokens,
      totalTokens,
      estimatedCostUsd,
      industryGuess:
        typeof input.industryGuess === "string" ? input.industryGuess.slice(0, 64) : "",
      pageType:
        typeof input.pageType === "string" ? input.pageType.slice(0, 32) : "",
    });
  } catch (e) {
    console.warn(
      "[audit-log] Failed to persist audit_logs row:",
      e instanceof Error ? e.message : e
    );
  }
}

export type AuditLogRow = {
  id: string;
  createdAtMs: number;
  userId: string;
  auditedUrl: string;
  device: string;
  overallScore: number;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  industryGuess: string;
  pageType: string;
};

function docToRow(id: string, data: DocumentData): AuditLogRow | null {
  const created = data.createdAt as Timestamp | undefined;
  const createdAtMs = created?.toMillis?.() ?? 0;
  if (!createdAtMs) return null;
  return {
    id,
    createdAtMs,
    userId: String(data.userId ?? ""),
    auditedUrl: String(data.auditedUrl ?? ""),
    device: String(data.device ?? "desktop"),
    overallScore: Number(data.overallScore) || 0,
    promptTokens: Number(data.promptTokens) || 0,
    candidatesTokens: Number(data.candidatesTokens) || 0,
    totalTokens: Number(data.totalTokens) || 0,
    estimatedCostUsd: Number(data.estimatedCostUsd) || 0,
    industryGuess: String(data.industryGuess ?? ""),
    pageType: String(data.pageType ?? ""),
  };
}

export async function fetchAuditLogsSince(startMs: number): Promise<AuditLogRow[]> {
  const db = getAdminDb();
  const start = Timestamp.fromMillis(startMs);
  const snap = await db
    .collection("audit_logs")
    .where("createdAt", ">=", start)
    .orderBy("createdAt", "desc")
    .limit(3000)
    .get();

  const out: AuditLogRow[] = [];
  for (const d of snap.docs) {
    const row = docToRow(d.id, d.data());
    if (row) out.push(row);
  }
  return out;
}
