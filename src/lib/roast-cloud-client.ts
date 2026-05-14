import type { RoastHistoryEntry } from "@/lib/roast-history";

export type CloudRoastListResponse = { entries: RoastHistoryEntry[] };

export async function fetchCloudRoastHistory(idToken: string): Promise<RoastHistoryEntry[]> {
  const res = await fetch("/api/user/roast-cloud-list", {
    credentials: "same-origin",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as CloudRoastListResponse;
  return Array.isArray(data.entries) ? data.entries : [];
}

export async function syncRoastPayloadToCloud(
  idToken: string,
  entry: RoastHistoryEntry,
  payload: Record<string, unknown>,
): Promise<void> {
  const res = await fetch("/api/user/roast-cloud-sync", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      clientRoastId: entry.id,
      savedAt: entry.savedAt,
      overallScore: entry.overallScore,
      auditedUrl: entry.auditedUrl,
      planAtSave: entry.planAtSave,
      payload,
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(typeof err.error === "string" ? err.error : `Sync failed (${res.status})`);
  }
}

export function mergeRoastHistoryEntries(
  local: RoastHistoryEntry[],
  cloud: RoastHistoryEntry[],
): RoastHistoryEntry[] {
  const byId = new Map<string, RoastHistoryEntry>();
  for (const e of cloud) {
    byId.set(e.id, e);
  }
  for (const e of local) {
    const prev = byId.get(e.id);
    if (!prev || e.savedAt >= prev.savedAt) {
      byId.set(e.id, e);
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.savedAt - a.savedAt);
}
