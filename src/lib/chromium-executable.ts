import "server-only";

import fs from "node:fs";
import path from "node:path";
import chromium from "@sparticuz/chromium";

function bundledChromiumBinDir(): string | null {
  const fromEnv = process.env.CHROMIUM_BIN_DIR?.trim();
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const cwdBin = path.join(process.cwd(), "node_modules", "@sparticuz", "chromium", "bin");
  return fs.existsSync(cwdBin) ? cwdBin : null;
}

/** Resolves the decompressed Chromium binary for serverless (Vercel) or local puppeteer-core. */
export async function resolveChromiumExecutablePath(): Promise<string> {
  const override = process.env.CHROMIUM_EXECUTABLE_PATH?.trim();
  if (override && fs.existsSync(override)) return override;
  const binDir = bundledChromiumBinDir();
  if (binDir) return chromium.executablePath(binDir);
  return chromium.executablePath();
}
