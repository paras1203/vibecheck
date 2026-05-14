import "server-only";

/** True outside pure local dev (container hosts, Vercel, etc.): use @sparticuz/chromium + traced binary. */
export function shouldUseBundledChromium(): boolean {
  return (
    process.env.NODE_ENV !== "development" ||
    Boolean(process.env.VERCEL?.trim())
  );
}
