export type RoastHistoryEntry = {
  id: string;
  savedAt: number;
  overallScore?: number;
  auditedUrl?: string;
  planAtSave?: "free" | "pro" | "agency";
};

const LEGACY_KEY = "siteroast_roast_history";
const keyForUser = (uid: string | undefined) =>
  uid ? `siteroast_roast_history_${uid}` : LEGACY_KEY;

function readRaw(uid: string | undefined): RoastHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyForUser(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is RoastHistoryEntry =>
        x &&
        typeof x === "object" &&
        typeof (x as RoastHistoryEntry).id === "string"
    );
  } catch {
    return [];
  }
}

function writeRaw(uid: string | undefined, entries: RoastHistoryEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyForUser(uid), JSON.stringify(entries));
}

export function listRoastHistory(uid: string | undefined): RoastHistoryEntry[] {
  const primary = readRaw(uid);
  if (!uid) {
    return primary.sort((a, b) => b.savedAt - a.savedAt);
  }
  const legacy = readRaw(undefined);
  if (!legacy.length) {
    return primary.sort((a, b) => b.savedAt - a.savedAt);
  }
  const byId = new Map<string, RoastHistoryEntry>();
  for (const e of legacy) {
    byId.set(e.id, e);
  }
  for (const e of primary) {
    const prev = byId.get(e.id);
    if (!prev || e.savedAt >= prev.savedAt) {
      byId.set(e.id, e);
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.savedAt - a.savedAt);
}

/** Move anonymous (legacy key) history into the signed-in user bucket once. */
export function mergeLegacyRoastHistoryIntoUser(uid: string): void {
  if (typeof window === "undefined" || !uid) return;
  const legacy = readRaw(undefined);
  if (!legacy.length) return;
  const merged = listRoastHistory(uid);
  writeRaw(uid, merged.slice(0, 50));
  localStorage.removeItem(LEGACY_KEY);
}

export function upsertRoastHistory(
  uid: string | undefined,
  entry: RoastHistoryEntry,
  maxEntries = 50
): void {
  const prev = readRaw(uid);
  const without = prev.filter((e) => e.id !== entry.id);
  const next = [entry, ...without].slice(0, maxEntries);
  writeRaw(uid, next);
}

export function removeRoastHistoryEntry(uid: string | undefined, id: string): void {
  const prev = readRaw(uid);
  const next = prev.filter((e) => e.id !== id);
  writeRaw(uid, next);
  if (typeof window !== "undefined") {
    localStorage.removeItem(`roast_${id}`);
  }
}
