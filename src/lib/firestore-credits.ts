/**
 * Normalizes `users/{uid}.credits` from Firestore (number, numeric string, or bad data).
 * Prevents string concatenation bugs (e.g. "20" + 5 → "205") in payment math.
 */
export function readCreditsFromFirestoreValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}
