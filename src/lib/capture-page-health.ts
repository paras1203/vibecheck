import type { HTTPResponse, Page } from "puppeteer-core";

export type CaptureBlockedCode =
  | "UNSAFE_OR_BLOCKED"
  | "UNREACHABLE"
  | "SERVER_ERROR"
  | "CERT_OR_SSL_BLOCKED";

/** Thrown before LLM roast when navigation shows a blocker / fatal error surface. Credits are refunded. */
export class CaptureBlockedError extends Error {
  readonly code: CaptureBlockedCode;

  constructor(message: string, code: CaptureBlockedCode) {
    super(message);
    this.name = "CaptureBlockedError";
    this.code = code;
  }
}

/** HTTP status bands that imply we should not pretend the page is a normal marketing site */
function statusImpliesBlocked(status: number | null): CaptureBlockedCode | null {
  if (status === null || status < 400) return null;
  if (status === 404 || status === 410) return "UNREACHABLE";
  if (status === 408) return "UNREACHABLE";
  if (status >= 500 || status === 429) return "SERVER_ERROR";
  if (status === 403 || status === 401 || status === 402 || status === 451) return "UNREACHABLE";
  if (status >= 400 && status < 500) return "UNREACHABLE";
  return null;
}

function scoreBlockedSignals(combinedLower: string, pageUrl: string): CaptureBlockedCode | null {
  const urlLower = pageUrl.toLowerCase();

  if (/^chrome-error:/.test(pageUrl) || /^about:/.test(pageUrl) || /^edge:/i.test(pageUrl)) {
    return "UNREACHABLE";
  }
  if (urlLower.includes("chromewebdata")) {
    return "UNREACHABLE";
  }

  const fatalPatterns: { code: CaptureBlockedCode; re: RegExp }[] = [
    {
      code: "UNSAFE_OR_BLOCKED",
      re: /(\bsuspicious\s+site\b|\bsuspicious\s+page\b|\bdangerous site|deceptive site ahead|site ahead contains malware|attackers might trick|might be hacked|social engineering|attempting to steal|phishing|malware|wanted for malware|wanted for deceptive|firefox blocked this page|firefox has blocked|google safe browsing|listed as deceptive|this site.*harm your device)/i,
    },
    {
      code: "CERT_OR_SSL_BLOCKED",
      re: /(your connection is not private|potential security risk ahead|certificate error|certificate has expired|invalid certificate|net::err_cert|ssl error|certificate authority that is not trusted)/i,
    },
    {
      code: "UNREACHABLE",
      re: /(err_name_not_resolved|dns[_\s]?probe_finished_nxdomain|name[-\s]?not[-\s]?resolved|cannot be reached|can't be reached|site can\x27t be reached|unable to reach|connection refused|err_connection_refused|err_connection_reset|err_connection_closed|err_empty_response|err_address_unreachable|err_internet_disconnected|err_tunnel_connection_failed)/i,
    },
    {
      code: "UNREACHABLE",
      re: /(webpage .*not available|this page isn\x27t working|unable to reach the site|the webpage may be unavailable|might be permanently moved|might be temporarily down)/i,
    },
    {
      code: "UNREACHABLE",
      re: /(404 not found|\b404\b.*\berror\b|page not found|page cannot be found|page couldn\x27t be found|\b504\b gateway|\b504\b.*timeout)/i,
    },
    {
      code: "SERVER_ERROR",
      re: /(\b500\b|\b502\b|\b503\b).*(\berror\b|\bunavailable\b|gateway|\bproblem\b)|internal server error|bad gateway|service unavailable|gateway timeout/i,
    },
    {
      code: "UNREACHABLE",
      re: /(domain parked|\bparked domain\b|this domain .*parked)/i,
    },
    {
      code: "UNREACHABLE",
      re: /(bandwidth limit exceeded|\bquota exceeded\b|\btraffic exceeded\b)/i,
    },
  ];

  for (const { code, re } of fatalPatterns) {
    if (re.test(combinedLower)) return code;
  }

  /* Very sparse body + strong error vibes (connection / snap) */
  if (combinedLower.length < 400) {
    if (
      /(aw,? snap\b|oops.*went wrong|\boffline\b|\btimeout\b\s*\(.*\).*chrome)/i.test(
        combinedLower
      )
    ) {
      return "UNREACHABLE";
    }
  }

  return null;
}

const USER_MESSAGES: Record<CaptureBlockedCode, string> = {
  UNSAFE_OR_BLOCKED:
    "The browser flagged this URL as risky, deceptive, or dangerous. We cancelled the audit and did not deduct credits.",
  CERT_OR_SSL_BLOCKED:
    "The site could not be loaded securely (certificate or TLS error). We cancelled the audit and did not deduct credits.",
  UNREACHABLE:
    "The URL could not be reached (inactive domain, blocking, DNS, or unavailable page). We cancelled the audit and did not deduct credits.",
  SERVER_ERROR:
    "The server returned an error or overloaded response. We cancelled the audit and did not deduct credits.",
};

/** Call after DOM has stabilized (short wait after navigation). */
export async function assertCapturedPageLoadsRealSite(
  page: Page,
  navResponse: HTTPResponse | null,
  navigatedUrl: string
): Promise<void> {
  const rawUrl = page.url();

  if (/^chrome-error:/i.test(rawUrl) || /^about:/i.test(rawUrl)) {
    throw new CaptureBlockedError(USER_MESSAGES.UNREACHABLE, "UNREACHABLE");
  }

  const status =
    navResponse && typeof navResponse.status === "function" ? navResponse.status() : null;
  const fromStatus = statusImpliesBlocked(typeof status === "number" ? status : null);
  if (fromStatus) {
    throw new CaptureBlockedError(USER_MESSAGES[fromStatus], fromStatus);
  }

  let title = "";
  let snippet = "";
  try {
    title = await page.title();
    snippet =
      ((await page.evaluate(() => document.body?.innerText?.slice(0, 12_000) ?? "")) as string).trim();
  } catch {
    /* continue with empty */
  }
  const combined = `${title}\n${snippet}\n`.toLowerCase();

  const keywordBlock =
    scoreBlockedSignals(combined, rawUrl || navigatedUrl) ??
    scoreBlockedSignals(combined, navigatedUrl);

  if (keywordBlock) {
    throw new CaptureBlockedError(USER_MESSAGES[keywordBlock], keywordBlock);
  }
}
