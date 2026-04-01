/** Puppeteer screenshots are JPEG; some paths may still emit PNG. Accepts raw base64 or full data URLs. */
export function heroScreenshotDataUrl(base64: string | undefined | null): string | null {
  if (base64 == null || !String(base64).trim()) return null;
  const trimmed = String(base64).trim();
  if (trimmed.startsWith("data:image/")) {
    return trimmed.replace(/\s/g, "");
  }
  const t = trimmed.replace(/\s/g, "");
  if (t.startsWith("iVBORw0KGgo")) return `data:image/png;base64,${t}`;
  return `data:image/jpeg;base64,${t}`;
}
