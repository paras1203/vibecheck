import chromium from "@sparticuz/chromium";
import type { Browser } from "puppeteer-core";
import { resolveChromiumExecutablePath } from "@/lib/chromium-executable";
import { getPuppeteerWithStealth } from "./screenshot";

/**
 * Exact 1:1 migration from main.py capture_screenshot_from_url function (lines 1575-2013)
 * Captures screenshots AND extracts HTML/text content in a single execution
 * Returns: { screenshots: base64[], htmlContent: string, pageText: string, pageHeight: number }
 */
export async function captureScreenshotFromUrl(
  url: string,
  device: "desktop" | "mobile" = "desktop"
): Promise<{
  screenshots: string[];
  htmlContent: string;
  pageText: string;
  pageHeight: number;
}> {
  let browser: Browser | null = null;
  const maxRetries = 3;
  const retryDelay = 2000;

  // Normalize device parameter
  const normalizedDevice = device.toLowerCase() as "desktop" | "mobile";
  const finalDevice = normalizedDevice === "mobile" ? "mobile" : "desktop";

  // Normalize URL (exact from Python lines 1596-1600)
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = normalizedUrl.replace(/^www\./, "");
    normalizedUrl = "https://" + normalizedUrl;
  }

  console.log(`[DEBUG] Normalized URL: ${normalizedUrl}`);
  console.log(`[DEBUG] Device mode: ${finalDevice}`);

  // Device-specific configuration (exact from Python lines 1606-1622)
  const viewportConfig =
    finalDevice === "mobile"
      ? { width: 390, height: 844 }
      : { width: 1920, height: 1080 };
  const screenConfig =
    finalDevice === "mobile"
      ? { width: 390, height: 844 }
      : { width: 1920, height: 1080 };
  const userAgent =
    finalDevice === "mobile"
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const isMobile = finalDevice === "mobile";
  const hasTouch = finalDevice === "mobile";
  const deviceScaleFactor = finalDevice === "mobile" ? 3 : 1;

  // Realistic browser headers (exact from Python lines 1624-1637)
  const realisticHeaders = {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    DNT: "1",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
  };

  // Enhanced stealth browser launch arguments (exact from Python lines 1639-1649)
  const stealthArgs = [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certificate-errors-spki-list",
    `--user-agent=${userAgent}`,
  ];

  let headlessMode = true;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const puppeteer = await getPuppeteerWithStealth();

      console.log(
        `[DEBUG] Launching Chromium browser (attempt ${attempt + 1}/${maxRetries}, headless=${headlessMode})...`
      );

      const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
        headless: headlessMode,
        args: stealthArgs,
      };

      if (process.env.NODE_ENV !== "development" || process.env.VERCEL) {
        launchOptions.args = [...chromium.args, ...stealthArgs];
        launchOptions.executablePath = await resolveChromiumExecutablePath();
      }

      browser = await puppeteer.launch(launchOptions);

      console.log("[DEBUG] Creating context with stealth configuration...");
      const page = await browser.newPage();
      
      await page.setViewport(viewportConfig);
      await page.setUserAgent(userAgent);
      await page.setExtraHTTPHeaders(realisticHeaders);

      // Enhanced stealth JavaScript injection (exact from Python lines 1694-1761)
      await page.evaluateOnNewDocument(() => {
        // Remove webdriver flag
        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
          configurable: true,
        });
        delete (navigator as any).__proto__.webdriver;

        // Mock plugins
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5],
          configurable: true,
        });

        // Mock languages
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
          configurable: true,
        });

        // Mock chrome object
        if (!(window as any).chrome) {
          (window as any).chrome = {};
        }
        if (!(window as any).chrome.runtime) {
          (window as any).chrome.runtime = {};
        }
        if (!(window as any).chrome.runtime.onConnect) {
          (window as any).chrome.runtime.onConnect = undefined;
        }
      });

      console.log(`[DEBUG] Navigating to ${normalizedUrl}...`);
      const waitStrategies = ["domcontentloaded", "load", "networkidle"];
      const waitStrategy = waitStrategies[Math.min(attempt, waitStrategies.length - 1)];

      try {
        await page.goto(normalizedUrl, {
          waitUntil: waitStrategy as any,
          timeout: 60000,
          referer: "https://www.google.com/",
        });
        console.log(`[DEBUG] Navigation complete (used ${waitStrategy} wait strategy)`);
      } catch (navError: any) {
        const errorMsg = String(navError).toLowerCase();
        const isNetworkError =
          errorMsg.includes("http2") ||
          errorMsg.includes("protocol_error") ||
          errorMsg.includes("err_http2") ||
          errorMsg.includes("net::") ||
          errorMsg.includes("timeout");

        if (isNetworkError && attempt < maxRetries - 1) {
          console.log(
            `[WARN] Network/protocol error detected (attempt ${attempt + 1}/${maxRetries})`
          );
          if (browser) await browser.close();
          if (headlessMode && attempt === maxRetries - 2) {
            console.log("[DEBUG] Attempting fallback with headless=False...");
            headlessMode = false;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1))
          );
          continue;
        }
        throw navError;
      }

      // CRITICAL: Wait 3 seconds for firewall/security analysis (exact from Python line 1833-1835)
      console.log("[DEBUG] Waiting 3 seconds for firewall analysis...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Human-like mouse movement (exact from Python lines 1837-1848)
      try {
        const randomX = Math.floor(Math.random() * (viewportConfig.width - 200) + 100);
        const randomY = Math.floor(Math.random() * (viewportConfig.height - 200) + 100);
        await page.mouse.move(randomX, randomY);
        console.log("[DEBUG] Performed human-like mouse movement");
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));
      } catch (mouseError) {
        console.log(`[WARN] Mouse movement failed (non-critical): ${mouseError}`);
      }

      // Hard sleep to let images settle (exact from Python line 1851)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Human-like scrolling (exact from Python lines 1853-1871)
      console.log("[DEBUG] Performing human-like scroll to trigger lazy loading...");
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= scrollHeight || totalHeight > 50000) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      // Scroll back to top (exact from Python lines 1873-1883)
      await page.evaluate("window.scrollTo(0, 0)");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const scrollPosition = Number(
        await page.evaluate("window.pageYOffset || window.scrollY")
      );
      if (scrollPosition > 0) {
        console.log(`[DEBUG] Still not at top (scroll=${scrollPosition}), forcing scroll to 0...`);
        await page.evaluate(
          "window.scrollTo({ top: 0, left: 0, behavior: 'instant' })"
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log("[DEBUG] Confirmed at top of page, starting screenshot capture");

      // Extract HTML content and visible text (exact from Python lines 1886-1890)
      console.log("[DEBUG] Extracting HTML and text content...");
      const htmlContent = await page.content();
      const pageText = String(
        await page.evaluate("document.body.innerText")
      );
      console.log(
        `[DEBUG] Extracted ${htmlContent.length} chars of HTML and ${pageText.length} chars of text`
      );

      // Get dynamic viewport height (exact from Python line 1893)
      const viewportHeight = Number(
        await page.evaluate("window.innerHeight")
      );
      console.log(`[DEBUG] Viewport height: ${viewportHeight}px`);

      // Hide sticky/fixed elements (exact from Python lines 1896-1909)
      await page.evaluate(() => {
        const fixedElements = document.querySelectorAll("*");
        fixedElements.forEach((el) => {
          const style = window.getComputedStyle(el);
          if (style.position === "fixed" || style.position === "sticky") {
            (el as HTMLElement).dataset.originalDisplay = style.display;
            (el as HTMLElement).style.display = "none";
          }
        });
      });
      console.log("[DEBUG] Hidden sticky/fixed elements for seamless stitching");

      // First viewport only (single chunk) — used as hero snapshot for audit + LLM visuals
      const screenshots: string[] = [];
      await page.evaluate("window.scrollTo(0, 0)");
      await new Promise((resolve) => setTimeout(resolve, 300));
      const screenshotBytes = (await page.screenshot({
        type: "jpeg",
        quality: 82,
        fullPage: false,
      })) as Buffer;
      screenshots.push(screenshotBytes.toString("base64"));
      console.log("[DEBUG] Captured first viewport only (1 chunk)");
      
      // Get page height before closing browser
      const pageHeight = Number(
        await page.evaluate(() => {
          return Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          );
        })
      );
      
      await browser.close();

      return {
        screenshots,
        htmlContent,
        pageText,
        pageHeight,
      };
    } catch (e: any) {
      const errorMsg = String(e).toLowerCase();
      const isNetworkError =
        errorMsg.includes("http2") ||
        errorMsg.includes("protocol_error") ||
        errorMsg.includes("err_http2") ||
        errorMsg.includes("net::") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("navigation");

      if (isNetworkError && attempt < maxRetries - 1) {
        console.log(
          `[WARN] Network error on attempt ${attempt + 1}, retrying in ${retryDelay * (attempt + 1)}ms...`
        );
        if (browser) {
          try {
            await browser.close();
          } catch {}
        }
        if (headlessMode && attempt === maxRetries - 2) {
          console.log("[DEBUG] Attempting fallback with headless=False...");
          headlessMode = false;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      } else {
        if (browser) {
          try {
            await browser.close();
          } catch {}
        }
        if (isNetworkError && headlessMode) {
          console.log("[DEBUG] Final attempt: trying with headless=False...");
          headlessMode = false;
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        throw e;
      }
    }
  }

  throw new Error(`Failed to capture screenshot from ${normalizedUrl} after ${maxRetries} attempts`);
}

