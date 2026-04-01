import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
