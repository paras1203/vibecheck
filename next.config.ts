import type { NextConfig } from "next";

/** Ship Brotli-packed Chromium into each function; App Router keys need `/route` on Vercel. */
const chromiumTraceGlobs = [
  "./node_modules/@sparticuz/chromium/bin/**/*",
  "./node_modules/@sparticuz/chromium/build/**/*",
];

const chromiumApiRoutes = [
  "/api/roast/route",
  "/api/roast",
  "/api/roast/hero/route",
  "/api/roast/hero",
  "/api/generate-pdf/route",
  "/api/generate-pdf",
  "/api/screenshot/route",
  "/api/screenshot",
] as const;

const outputFileTracingIncludes = Object.fromEntries(
  chromiumApiRoutes.map((route) => [route, [...chromiumTraceGlobs]])
);

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes,
  // Exclude puppeteer and related packages from bundling
  // These are server-side only and use CommonJS, which causes issues with Turbopack
  // This tells Next.js to load these packages at runtime instead of bundling them
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-core",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin-anonymize-ua",
    "@sparticuz/chromium",
    "clone-deep",
    "merge-deep",
    "shallow-clone",
    "kind-of",
    "is-plain-object",
  ],
  // Add empty turbopack config to silence the warning
  // The serverExternalPackages above handles the externalization for Turbopack
  turbopack: {},
};

export default nextConfig;
