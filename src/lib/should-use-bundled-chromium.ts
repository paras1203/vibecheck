import "server-only";

/** True outside pure local dev (e.g. Cloud Run, Vercel): use @sparticuz/chromium + traced binary. */
export function shouldUseBundledChromium(): boolean {
  return (
    process.env.NODE_ENV !== "development" ||
    Boolean(process.env.VERCEL?.trim())
  );
}
