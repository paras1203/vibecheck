/**
 * Deterministic legal-link detection from raw HTML (complements LLM tech worker).
 * Resolves relative hrefs against the audited page origin when possible.
 */

function safeOrigin(pageUrl: string): URL | null {
  try {
    const u = new URL(
      pageUrl.startsWith("http://") || pageUrl.startsWith("https://")
        ? pageUrl
        : `https://${pageUrl.replace(/^\/\//, "")}`
    );
    return u;
  } catch {
    return null;
  }
}

function resolveHref(raw: string, base: URL | null): string {
  const h = raw.trim();
  if (!h || h.startsWith("#") || h.toLowerCase().startsWith("javascript:")) {
    return "";
  }
  try {
    if (base) return new URL(h, base).pathname.toLowerCase();
    return h.toLowerCase();
  } catch {
    return h.toLowerCase();
  }
}

const PRIVACY_PATH =
  /\b(privacy|privacy-policy|privacypolicy|data-protection|gdpr)\b/;
const TERMS_PATH =
  /\b(terms|terms-of-service|terms_of_service|terms-and-conditions|termsconditions|tos|eula)\b/;
const COOKIE_PATH = /\b(cookie|cookies-policy|cookie-policy)\b/;

function hrefMatchesPrivacy(path: string): boolean {
  return PRIVACY_PATH.test(path);
}

function hrefMatchesTerms(path: string): boolean {
  if (TERMS_PATH.test(path)) return true;
  if (/\/terms\b/.test(path) && !/terminal/.test(path)) return true;
  return false;
}

function hrefMatchesCookie(path: string): boolean {
  return COOKIE_PATH.test(path);
}

export type LegalHtmlSignals = {
  privacyLink: boolean;
  termsLink: boolean;
  cookieLink: boolean;
};

export function analyzeLegalSignalsFromHtml(
  html: string,
  pageUrl: string
): LegalHtmlSignals {
  const base = safeOrigin(pageUrl);
  let privacyLink = false;
  let termsLink = false;
  let cookieLink = false;

  const re = /\bhref\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const path = resolveHref(m[1] || "", base);
    if (!path) continue;
    if (hrefMatchesPrivacy(path)) privacyLink = true;
    if (hrefMatchesTerms(path)) termsLink = true;
    if (hrefMatchesCookie(path)) cookieLink = true;
  }

  const lower = html.toLowerCase();
  if (!privacyLink && /(\/privacy\b|privacy-policy|href=["'][^"']*privacy)/i.test(html)) {
    privacyLink = true;
  }
  if (!termsLink && /(\/terms\b|terms-of-service|href=["'][^"']*\/terms)/i.test(html)) {
    termsLink = true;
  }
  if (!cookieLink && /(cookie-policy|\/cookies\b|href=["'][^"']*cookie)/i.test(lower)) {
    cookieLink = true;
  }

  return { privacyLink, termsLink, cookieLink };
}

export function mergeLegalComplianceWithSignals(
  items: Array<Record<string, unknown>>,
  signals: LegalHtmlSignals
): Array<Record<string, unknown>> {
  return items.map((item) => {
    const name = String(item.elementName || item.element || "").toLowerCase();
    if (!name.includes("legal")) return item;

    const missing: string[] = [];
    if (!signals.privacyLink) missing.push("Privacy policy link not found in HTML");
    if (!signals.termsLink) missing.push("Terms link not found in HTML");
    if (!signals.cookieLink) missing.push("Cookie policy link not clearly present");

    if (missing.length === 0) {
      return {
        ...item,
        status: "Good",
        impact: item.impact || "MI",
        rationale:
          "Footer or navigation includes links to privacy and terms (and likely cookie policy) detectable in the HTML href graph.",
        workingWell: [
          "Privacy policy URL present in page markup",
          "Terms / legal URL present in page markup",
          ...(signals.cookieLink ? ["Cookie-related legal link present"] : []),
        ],
        notWorking: [],
        conversionImpact:
          typeof item.conversionImpact === "string"
            ? item.conversionImpact
            : "Legal clarity supports trust for regulated or B2B buyers.",
        fix: {
          quickFix:
            "Keep legal links visible in the global footer; ensure targets load and match your actual policies.",
          example: "",
          expectedImpact: "Maintains baseline trust and compliance UX.",
        },
      };
    }

    return {
      ...item,
      notWorking: missing,
      rationale:
        "Automated HTML scan did not find confident hrefs to required legal destinations. Verify footer/nav links and SPA routes.",
    };
  });
}
