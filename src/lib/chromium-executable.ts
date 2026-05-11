import "server-only";

import fs from "node:fs";
import path from "node:path";

import chromium from "@sparticuz/chromium";

import { shouldUseBundledChromium } from "@/lib/should-use-bundled-chromium";

function bundledChromiumBinDir(): string | null {
  const fromEnv = process.env.CHROMIUM_BIN_DIR?.trim();
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const cwdBin = path.join(process.cwd(), "node_modules", "@sparticuz", "chromium", "bin");
  return fs.existsSync(cwdBin) ? cwdBin : null;
}

/** Resolves the decompressed Chromium binary for serverless (Vercel) or local puppeteer-core. */
export async function resolveChromiumExecutablePath(): Promise<string> {
  const override =
    process.env.CHROMIUM_EXECUTABLE_PATH?.trim() ||
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (override && fs.existsSync(override)) return override;
  const binDir = bundledChromiumBinDir();
  if (binDir) return chromium.executablePath(binDir);
  return chromium.executablePath();
}

/**
 * Installed Chrome / Edge (Windows, macOS, Linux) — used when not using @sparticuz/chromium
 * (local `next dev`): `puppeteer-core` otherwise expects a Puppeteer-managed download.
 */
export function tryResolveSystemChromiumExecutable(): string | undefined {
  const env =
    process.env.CHROMIUM_EXECUTABLE_PATH?.trim() ||
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (env && fs.existsSync(env)) return env;

  const { platform } = process;
  const candidates: string[] = [];

  if (platform === "win32") {
    const programFiles = process.env.PROGRAMFILES;
    const programFilesX86 = process.env["PROGRAMFILES(X86)"];
    const localAppData = process.env.LOCALAPPDATA;

    if (programFiles) {
      candidates.push(
        path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
        path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe")
      );
    }
    if (programFilesX86) {
      candidates.push(
        path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
        path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe")
      );
    }
    if (localAppData) {
      candidates.push(
        path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
        path.join(localAppData, "Microsoft", "Edge", "Application", "msedge.exe")
      );
    }
  } else if (platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    );
  } else {
    candidates.push(
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/snap/bin/chromium"
    );
  }

  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

/** Executable for `puppeteer.launch`: bundled chromium in prod / when configured; system browser in local dev. */
export async function resolvePuppeteerLaunchExecutablePath(): Promise<string | undefined> {
  const override =
    process.env.CHROMIUM_EXECUTABLE_PATH?.trim() ||
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (override && fs.existsSync(override)) return override;

  if (shouldUseBundledChromium()) {
    return resolveChromiumExecutablePath();
  }

  return tryResolveSystemChromiumExecutable();
}
