import { Timestamp } from "firebase-admin/firestore";

/** Paid cloud-backed roasts expire after this window from `savedAt` when `expiresAt` is absent (legacy docs). */
export const ROAST_CLOUD_RETENTION_MS = 60 * 24 * 60 * 60 * 1000;

export function roastCloudExpiresAtMs(savedAtRaw: unknown, expiresAtRaw: unknown): number {
  const savedAt = typeof savedAtRaw === "number" ? savedAtRaw : 0;
  if (expiresAtRaw instanceof Timestamp) {
    return expiresAtRaw.toMillis();
  }
  return savedAt + ROAST_CLOUD_RETENTION_MS;
}
