import chromium from "@sparticuz/chromium";
import type { Browser, Page } from "puppeteer-core";
import { resolveChromiumExecutablePath } from "@/lib/chromium-executable";

// Detect if we're in a local development environment
const isLocalDev = process.env.NODE_ENV === "development" || !process.env.VERCEL;

/**
 * Auto-scrolls the page to trigger lazy-loaded images and content
 * Simulates human-like scrolling behavior to ensure all content is loaded
 * @param page - Puppeteer page instance
 * @param maxScrollTime - Maximum time to spend scrolling (default: 5 seconds)
 * @param maxHeight - Maximum page height to scroll to (default: 50000px, ~500 screens)
 */
async function autoScroll(
  page: Page,
  maxScrollTime: number = 5000,
  maxHeight: number = 50000
): Promise<void> {
  const startTime = Date.now();
  let lastHeight = 0;
  let currentHeight = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 100; // Safety limit for scroll attempts

  console.log("Starting auto-scroll to trigger lazy-loaded content...");

  while (Date.now() - startTime < maxScrollTime && scrollAttempts < maxScrollAttempts) {
    // Get current page height
    currentHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
    });

    // Safety check: if page is too tall, stop scrolling
    if (currentHeight > maxHeight) {
      console.log(`Page height (${currentHeight}px) exceeds max (${maxHeight}px), stopping scroll`);
      break;
    }

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for content to load (lazy images, etc.)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if we've reached the bottom (height hasn't changed)
    const newHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
    });

    // If height hasn't changed, we've reached the bottom
    if (newHeight === currentHeight && currentHeight === lastHeight) {
      console.log("Reached bottom of page, all content loaded");
      break;
    }

    lastHeight = currentHeight;
    scrollAttempts++;
  }

  // Scroll back to top for consistent screenshot
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });

  // Wait a bit for any final animations or lazy loads
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`Auto-scroll complete. Final height: ${currentHeight}px, Attempts: ${scrollAttempts}`);
}

/**
 * Returns Puppeteer with `.launch` (puppeteer-core compatible).
 * On Vercel: plain puppeteer-core only — stealth plugins use dynamic requires under
 * `puppeteer-extra-plugin-stealth/evasions/*` that Next output tracing does not ship.
 */
export async function getPuppeteerWithStealth() {
  if (process.env.VERCEL) {
    const pc = await import("puppeteer-core");
    return pc.default;
  }

  const puppeteerExtraModule = await import("puppeteer-extra");
  const StealthPluginModule = await import("puppeteer-extra-plugin-stealth");
  const AnonymizeUAPluginModule = await import("puppeteer-extra-plugin-anonymize-ua");

  const puppeteerExtra = puppeteerExtraModule.default || puppeteerExtraModule;
  const StealthPlugin = StealthPluginModule.default || StealthPluginModule;
  const AnonymizeUAPlugin = AnonymizeUAPluginModule.default || AnonymizeUAPluginModule;

  if (!isLocalDev) {
    await import("puppeteer-core");
  }

  puppeteerExtra.use(StealthPlugin());
  puppeteerExtra.use(AnonymizeUAPlugin());

  return puppeteerExtra;
}

/**
 * Takes rolling screenshots of the given URL using Puppeteer with stealth mode
 * Captures overlapping viewport screenshots as we scroll down to preserve HD quality
 * Bypasses Cloudflare/WAF protections by mimicking a real browser
 * @param url - The URL to screenshot
 * @param device - Device type: 'desktop' or 'mobile' (default: 'desktop')
 * @returns Promise<string[]> - Array of base64-encoded JPEG strings (one per viewport chunk)
 */
export async function takeScreenshot(url: string, device: 'desktop' | 'mobile' = 'desktop'): Promise<string[]> {
  let browser: Browser | null = null;

  try {
    const puppeteer = await getPuppeteerWithStealth();

    // Determine viewport dimensions based on device type
    const viewportWidth = device === 'mobile' ? 390 : 1440;
    const viewportHeight = device === 'mobile' ? 844 : 900;

    // Launch browser with stealth-friendly arguments
    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
      headless: true, // "new" headless mode is better for stealth
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled", // Critical: Hides the "robot" flag
        "--disable-features=IsolateOrigins,site-per-process",
      ],
      defaultViewport: { width: viewportWidth, height: viewportHeight },
    };

    if (!isLocalDev) {
      // Production/serverless: use @sparticuz/chromium
      launchOptions.args = [
        ...chromium.args,
        "--disable-blink-features=AutomationControlled", // Critical: Hides the "robot" flag
        "--disable-features=IsolateOrigins,site-per-process",
      ];
      launchOptions.executablePath = await resolveChromiumExecutablePath();
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    // 1. Set User Agent and Viewport based on device type
    let userAgent: string;

    if (device === 'mobile') {
      // Mobile: iPhone viewport and user agent
      userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    } else {
      // Desktop: Standard desktop viewport and user agent
      userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    }

    await page.setUserAgent(userAgent);
    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
      isMobile: device === 'mobile',
      deviceScaleFactor: device === 'mobile' ? 3 : 1, // Mobile devices have higher DPI
    });

    console.log(`Screenshot mode: ${device} (${viewportWidth}x${viewportHeight})`);

    // 3. Navigate with 'networkidle2' (waits for Cloudflare checks to finish)
    // networkidle2 is less strict than networkidle0, better for sites with background requests
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000, // Increased timeout for Cloudflare challenges
    });

    // 4. "Human" Wait - Give time for any client-side redirects or "checking browser" animations
    // This helps with Cloudflare's "Just a moment..." screens
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 5. Auto-scroll to trigger lazy-loaded images and content
    // This ensures all content is loaded before we start capturing
    await autoScroll(page, 5000, 50000); // 5 second max, 50000px max height

    // 6. Rolling Screenshot Strategy: Capture overlapping viewport chunks
    // Smart scrolling loop that captures until bottom is reached (up to sanity limit)
    const overlap = 300; // Increased to 300px for better context continuity
    const sanityLimit = 15; // Maximum chunks to prevent infinite loops
    const screenshots: string[] = [];
    
    // Scroll back to top to start capturing from the beginning
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for scroll to complete

    let scrollPosition = 0;
    let chunkIndex = 0;

    console.log(`Starting rolling screenshot capture (${device} mode, max ${sanityLimit} chunks)...`);

    while (chunkIndex < sanityLimit) {
      // Get current page height to check if we've reached the bottom
      const totalHeight = await page.evaluate(() => {
        return Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
      });

      // Check if we've scrolled past the bottom
      if (scrollPosition >= totalHeight - viewportHeight) {
        console.log(`Reached bottom of page at scroll position ${scrollPosition}px (total height: ${totalHeight}px)`);
        break;
      }

      // Scroll to current position
      await page.evaluate((y) => {
        window.scrollTo(0, y);
      }, scrollPosition);

      // Wait for scroll and any lazy-loaded content (especially important for mobile)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Capture screenshot of current viewport (not full page)
      const screenshotBuffer = await page.screenshot({
        type: "jpeg",
        quality: 80,
        fullPage: false, // Only capture viewport, not full page
        optimizeForSpeed: false, // Prioritize quality
      }) as Buffer;

      // Convert to base64 string
      const base64String = screenshotBuffer.toString("base64");
      screenshots.push(base64String);

      console.log(`Captured chunk ${chunkIndex + 1} at scroll position ${scrollPosition}px (${screenshotBuffer.length} bytes)`);

      // Calculate next scroll position (with overlap)
      scrollPosition += (viewportHeight - overlap);
      chunkIndex++;
    }

    console.log(`Rolling screenshot complete. Captured ${screenshots.length} chunks in ${device} mode.`);

    return screenshots;
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close();
    }
  }
}

