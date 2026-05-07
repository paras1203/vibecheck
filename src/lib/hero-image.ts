/** Puppeteer screenshots may be JPEG or PNG (some paths WebP-capable via data URLs). */

const MIN_RAW_B64_CHARS = 64;

/** Heuristic: non-empty payload with plausible image base64 / data URL prefix. */
export function isValidHeroScreenshotPayload(
  raw: string | undefined | null
): raw is string {
  if (raw == null || !String(raw).trim()) return false;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith("data:image/")) {
    const payload = trimmed.replace(/\s/g, "");
    const comma = payload.indexOf(";base64,");
    return (
      comma > 12 &&
      payload.length - comma - 8 > MIN_RAW_B64_CHARS
    );
  }
  const t = trimmed.replace(/\s/g, "");
  if (t.length < MIN_RAW_B64_CHARS) return false;
  return (
    t.startsWith("iVBORw0KGgo") ||
    t.startsWith("/9j/") ||
    t.startsWith("UklGR")
  );
}

export function heroScreenshotDataUrl(base64: string | undefined | null): string | null {
  if (!isValidHeroScreenshotPayload(base64)) return null;
  const trimmed = String(base64).trim();
  if (trimmed.startsWith("data:image/")) {
    return trimmed.replace(/\s/g, "");
  }
  const t = trimmed.replace(/\s/g, "");
  if (t.startsWith("iVBORw0KGgo")) return `data:image/png;base64,${t}`;
  if (t.startsWith("UklGR")) return `data:image/webp;base64,${t}`;
  if (t.startsWith("/9j/")) return `data:image/jpeg;base64,${t}`;
  return `data:image/jpeg;base64,${t}`;
}
