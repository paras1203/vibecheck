import chromium from "@sparticuz/chromium";
import { resolveChromiumExecutablePath } from "@/lib/chromium-executable";
import { DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD } from "./insight-layers";
import { getPuppeteerWithStealth } from "./screenshot";

/** Illustrative AOV when no confident on-page price is detected (revenue leak model). */
export function defaultRevenueModelAovUsd(): number {
  const raw = process.env.DEFAULT_REVENUE_MODEL_AOV_USD;
  const n =
    raw !== undefined && raw !== ""
      ? parseFloat(raw)
      : DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD;
  return Number.isFinite(n) && n > 0
    ? Math.min(250_000, n)
    : DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD;
}

function parseMoneyAmount(raw: string): number | null {
  const n = parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 1 || n > 500_000) return null;
  return n;
}

type BillingCadence = "monthly" | "yearly" | "weekly" | "quarterly" | "one_time" | "unknown";

function cadenceFromContext(ctx: string): BillingCadence {
  const s = ctx.toLowerCase();
  if (
    /(?:\/|\bper\b\s*)?(?:yr|year|years|annual|annually|yearly)\b/.test(s) ||
    /\b\/\s*yr\b/.test(s) ||
    /\bper\s+year\b/.test(s) ||
    /\b\/\s*year\b/.test(s)
  ) {
    return "yearly";
  }
  if (
    /(?:\/|\bper\b\s*)?(?:mo|month|months|monthly|mo\.)\b/.test(s) ||
    /\b\/\s*mo\b/.test(s) ||
    /\bper\s+month\b/.test(s) ||
    /\b\/\s*month\b/.test(s) ||
    /\$\d[^$]{0,24}\/mo\b/.test(s)
  ) {
    return "monthly";
  }
  if (/(?:\/|\bper\b\s*)?(?:wk|week|weeks|weekly)\b/.test(s)) {
    return "weekly";
  }
  if (/\bquarter|\/\s*qtr\b|\/\s*q\b/.test(s)) {
    return "quarterly";
  }
  if (
    /\bone[\s-]?time\b|\blifetime\b|\bsingle\s+payment\b|\bonce\b/.test(s) ||
    /\b(?:buy|purchase|pay)\s+now\b/.test(s)
  ) {
    return "one_time";
  }
  return "unknown";
}

/** Guess yearly when price looks like an annual SKU and copy never says “month”. */
function refineUnknownCadence(amount: number, ctx: string): BillingCadence {
  const s = ctx.toLowerCase();
  if (/month|\/mo|\bmo\b|monthly/.test(s)) return "monthly";
  if (/year|annual|yr\b|\/yr|yearly/.test(s)) return "yearly";
  if (amount >= 49 && amount <= 499 && !/month|\/mo/.test(s)) {
    return "yearly";
  }
  return "unknown";
}

function toMonthlyOrderValue(amount: number, cadence: BillingCadence): number {
  switch (cadence) {
    case "yearly":
      return amount / 12;
    case "weekly":
      return amount * 4.33;
    case "quarterly":
      return amount / 3;
    case "one_time":
    case "monthly":
    case "unknown":
    default:
      return amount;
  }
}

type OfferSample = { raw: number; cadence: BillingCadence; monthlyEq: number };

/** Above this, unknown/one-time amounts are treated as annual or dropped (avoids $12k/mo bugs). */
const SANITY_IMPLIED_MONTHLY_CAP_USD = 499;

export type OfferEconomics = {
  monthlyAov: number;
  price_from_page: boolean;
  price_billing_note: string;
};

const PRICING_INTENT =
  /\b(pricing|price|plan|plans|tier|tiers|subscribe|subscription|billing|checkout|seat|seats|\/mo\b|\/month\b|per\s+month|monthly|annual|yearly|₹|rs\.|inr|usd)\b/i;

function pricingIntentInContext(ctx: string): boolean {
  return PRICING_INTENT.test(ctx);
}

function lowerMedianSorted(sorted: number[]): number {
  if (sorted.length === 0) return 50;
  const idx = Math.floor((sorted.length - 1) / 2);
  return sorted[idx] ?? sorted[0];
}

function pushSampleFromMatch(samples: OfferSample[], amt: number, ctx: string): void {
  let cadence = cadenceFromContext(ctx);
  if (cadence === "unknown") {
    cadence = refineUnknownCadence(amt, ctx);
  }
  let monthlyEq = toMonthlyOrderValue(amt, cadence);
  if (cadence === "unknown" || cadence === "one_time") {
    if (amt > SANITY_IMPLIED_MONTHLY_CAP_USD) {
      const asAnnualMonthly = amt / 12;
      if (asAnnualMonthly <= SANITY_IMPLIED_MONTHLY_CAP_USD) {
        cadence = "yearly";
        monthlyEq = asAnnualMonthly;
      } else {
        return;
      }
    }
  }
  samples.push({ raw: amt, cadence, monthlyEq });
}

function extractOfferEconomics(pageText: string): OfferEconomics {
  const fallbackAov = defaultRevenueModelAovUsd();
  const samples: OfferSample[] = [];
  const ctxBefore = 72;
  const ctxAfter = 160;

  const usd = /\$\s*([\d,]+(?:\.\d{1,2})?)/gi;
  let m: RegExpExecArray | null;
  while ((m = usd.exec(pageText)) !== null) {
    const amt = parseMoneyAmount(m[1] || "");
    if (amt == null) continue;
    const ctx = pageText.slice(Math.max(0, m.index - ctxBefore), m.index + ctxAfter);
    if (!pricingIntentInContext(ctx)) continue;
    pushSampleFromMatch(samples, amt, ctx);
  }

  const inr = /(?:₹|rs\.?\s*|inr\s*)[\s]*([\d,]+(?:\.\d{1,2})?)/gi;
  while ((m = inr.exec(pageText)) !== null) {
    const amt = parseMoneyAmount(m[1] || "");
    if (amt == null) continue;
    const ctx = pageText.slice(Math.max(0, m.index - ctxBefore), m.index + ctxAfter);
    if (!pricingIntentInContext(ctx)) continue;
    pushSampleFromMatch(samples, amt, ctx);
  }

  if (samples.length === 0) {
    return {
      monthlyAov: fallbackAov,
      price_from_page: false,
      price_billing_note: `No clear pricing block detected; using illustrative order value ($${fallbackAov}) — override in the report ROI controls if needed.`,
    };
  }

  const clampEq = (n: number) => Math.min(25_000, Math.max(0.5, n));

  const monthlyLabeled = samples.filter((s) => s.cadence === "monthly");
  if (monthlyLabeled.length > 0) {
    const sorted = monthlyLabeled.map((s) => s.monthlyEq).sort((a, b) => a - b);
    const pick = lowerMedianSorted(sorted);
    const rounded = Math.round(pick * 100) / 100;
    return {
      monthlyAov: clampEq(rounded),
      price_from_page: true,
      price_billing_note:
        "Uses visible month-priced tiers when present (most buyers stay on monthly). Annual prices are ignored for this headline estimate when a monthly price is shown.",
    };
  }

  const yearlyLabeled = samples.filter((s) => s.cadence === "yearly");
  if (yearlyLabeled.length > 0) {
    const sorted = yearlyLabeled.map((s) => s.monthlyEq).sort((a, b) => a - b);
    const pick = lowerMedianSorted(sorted);
    let rounded = Math.round(pick * 100) / 100;
    if (rounded > SANITY_IMPLIED_MONTHLY_CAP_USD) {
      rounded = SANITY_IMPLIED_MONTHLY_CAP_USD;
    }
    return {
      monthlyAov: clampEq(rounded),
      price_from_page: true,
      price_billing_note:
        "Estimated from annual prices on the page, normalized to a monthly order value (÷12); very high results are capped for a plausible default.",
    };
  }

  const allEq = samples.map((s) => s.monthlyEq).sort((a, b) => a - b);
  const pick = lowerMedianSorted(allEq);
  let rounded = Math.round(pick * 100) / 100;
  if (rounded > SANITY_IMPLIED_MONTHLY_CAP_USD) {
    return {
      monthlyAov: fallbackAov,
      price_from_page: false,
      price_billing_note:
        "Detected pricing-like amounts were too large for a typical monthly order estimate; using the default illustrative AOV — adjust in the ROI section if your offer differs.",
    };
  }
  return {
    monthlyAov: clampEq(rounded),
    price_from_page: true,
    price_billing_note:
      "Offer value estimated from visible pricing (monthly / yearly / one-time normalized to a monthly order value for this model).",
  };
}

function mergeOfferEconomics(landing: OfferEconomics, pricing: OfferEconomics | null): OfferEconomics {
  if (!pricing) return landing;
  if (pricing.price_from_page && !landing.price_from_page) {
    return {
      ...pricing,
      price_billing_note: `${pricing.price_billing_note} (dedicated pricing page)`,
    };
  }
  if (pricing.price_from_page && landing.price_from_page) {
    return {
      monthlyAov: pricing.monthlyAov,
      price_from_page: true,
      price_billing_note: `${pricing.price_billing_note} Preferred dedicated pricing page over landing copy.`,
    };
  }
  return landing;
}

/**
 * Light scraper: Fast scan without screenshots.
 * Returns page height, inferred monthly order value, industry.
 */
export async function quickScan(url: string): Promise<{
  page_height: number;
  price_guess: number;
  industry_guess: string;
  price_from_page: boolean;
  price_billing_note: string;
}> {
  try {
    // Normalize URL (exact from Python lines 2083-2085)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = normalizedUrl.replace(/^www\./, "");
      normalizedUrl = "https://" + normalizedUrl;
    }

    const puppeteer = await getPuppeteerWithStealth();

    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (process.env.NODE_ENV !== "development" || process.env.VERCEL) {
      launchOptions.args = [...chromium.args];
      launchOptions.executablePath = await resolveChromiumExecutablePath();
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );

    await page.goto(normalizedUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Extract data (exact from Python lines 2098-2106)
    const pageHeight = Number(
      await page.evaluate("document.body.scrollHeight")
    );
    const pageText = String(await page.evaluate("document.body.innerText"));
    const title = String(await page.evaluate("document.title"));

    let metaDesc = "";
    try {
      metaDesc = String(
        await page.evaluate(
          'document.querySelector(\'meta[name="description"]\')?.content || ""'
        )
      );
    } catch {
      // Ignore errors
    }

    let pricingPageText = "";
    try {
      const parsed = new URL(normalizedUrl);
      const pathNorm = parsed.pathname.replace(/\/$/, "").toLowerCase();
      const onPricingPath = pathNorm === "/pricing" || pathNorm.endsWith("/pricing");
      if (!onPricingPath) {
        for (const extraPath of ["/pricing", "/plans"]) {
          try {
            const extraUrl = new URL(extraPath, parsed.origin).href;
            await page.goto(extraUrl, {
              waitUntil: "domcontentloaded",
              timeout: 15000,
            });
            await new Promise((resolve) => setTimeout(resolve, 1200));
            pricingPageText = String(await page.evaluate("document.body.innerText"));
            break;
          } catch {
            /* try next path */
          }
        }
      }
    } catch {
      /* optional secondary fetch */
    }

    await browser.close();

    const offerLanding = extractOfferEconomics(pageText);
    const offerPricing = pricingPageText.trim()
      ? extractOfferEconomics(pricingPageText)
      : null;
    const offer = mergeOfferEconomics(offerLanding, offerPricing);
    const priceGuess = offer.monthlyAov;
    const priceFromPage = offer.price_from_page;
    const priceBillingNote = offer.price_billing_note;

    // Detect industry (exact from Python lines 2128-2136)
    let industryGuess = "SaaS";
    const textLower = (
      pageText +
      " " +
      pricingPageText +
      " " +
      title +
      " " +
      metaDesc
    ).toLowerCase();

    if (
      textLower.includes("agency") ||
      textLower.includes("marketing agency") ||
      textLower.includes("digital agency")
    ) {
      industryGuess = "Agency";
    } else if (
      textLower.includes("e-commerce") ||
      textLower.includes("ecommerce") ||
      textLower.includes("shop") ||
      textLower.includes("store") ||
      textLower.includes("cart") ||
      textLower.includes("checkout")
    ) {
      industryGuess = "E-commerce";
    } else if (
      textLower.includes("saas") ||
      textLower.includes("software") ||
      textLower.includes("subscription") ||
      textLower.includes("platform")
    ) {
      industryGuess = "SaaS";
    }

    return {
      page_height: pageHeight,
      price_guess: priceGuess,
      industry_guess: industryGuess,
      price_from_page: priceFromPage,
      price_billing_note: priceBillingNote,
    };
  } catch (e) {
    console.error(`[ERROR] quick_scan failed: ${e}`);
    // Fallback (exact from Python lines 2145-2149)
    return {
      page_height: 3000,
      price_guess: defaultRevenueModelAovUsd(),
      industry_guess: "SaaS",
      price_from_page: false,
      price_billing_note: "",
    };
  }
}

