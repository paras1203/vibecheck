export type SeoIssue = { type: string };

export type SeoAnalysisResult = {
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  openGraph: boolean;
  twitterCards: boolean;
  imageAltCoverage: number;
  internalLinks: number;
  externalLinks: number;
  score: number;
  issues: SeoIssue[];
};

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, " ");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeBaseUrl(url: string): string {
  let u = url.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = u.replace(/^www\./, "");
    u = `https://${u}`;
  }
  return u;
}

export function analyzeSEO(html: string, url: string): SeoAnalysisResult | null {
  try {
    const result: SeoAnalysisResult = {
      title: null,
      metaDescription: null,
      h1Count: 0,
      hasCanonical: false,
      hasRobotsMeta: false,
      openGraph: false,
      twitterCards: false,
      imageAltCoverage: 1,
      internalLinks: 0,
      externalLinks: 0,
      score: 0,
      issues: [],
    };

    const base = normalizeBaseUrl(url);
    let pageHost: string;
    try {
      pageHost = new URL(base).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      pageHost = "";
    }

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      const rawTitle = decodeBasicEntities(stripTags(titleMatch[1] || ""));
      result.title = rawTitle || null;
      if (result.title) {
        const len = result.title.length;
        if (len < 30 || len > 60) {
          result.issues.push({ type: "TITLE_LENGTH" });
        }
      }
    } else {
      result.issues.push({ type: "MISSING_TITLE" });
    }

    let metaDesc: string | null = null;
    const metaPatterns = [
      /<meta\s+[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["']/i,
      /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']description["']/i,
    ];
    for (const re of metaPatterns) {
      const m = html.match(re);
      if (m?.[1] != null) {
        metaDesc = decodeBasicEntities(m[1].trim()) || null;
        break;
      }
    }
    if (metaDesc) {
      result.metaDescription = metaDesc;
      const len = metaDesc.length;
      if (len < 70 || len > 160) {
        result.issues.push({ type: "META_DESCRIPTION_LENGTH" });
      }
    } else {
      result.issues.push({ type: "MISSING_META_DESCRIPTION" });
    }

    const h1Matches = html.match(/<h1\b/gi) || [];
    result.h1Count = h1Matches.length;
    if (result.h1Count !== 1) {
      result.issues.push({ type: "H1_COUNT_INVALID" });
    }

    result.hasCanonical = /\brel\s*=\s*["']canonical["']/i.test(html);
    result.hasRobotsMeta = /\bname\s*=\s*["']robots["']/i.test(html);
    result.openGraph = /\bproperty\s*=\s*["']og:[^"']+["']/i.test(html);
    result.twitterCards = /\bname\s*=\s*["']twitter:[^"']+["']/i.test(html);

    const imgTags = html.match(/<img\b[^>]*>/gi) || [];
    let withMeaningfulAlt = 0;
    for (const tag of imgTags) {
      const altM = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
      const alt = altM ? decodeBasicEntities(altM[1].trim()) : "";
      if (alt.length > 0) {
        withMeaningfulAlt += 1;
      }
    }
    const imgCount = imgTags.length;
    result.imageAltCoverage = imgCount > 0 ? withMeaningfulAlt / imgCount : 1;
    if (imgCount > 0 && result.imageAltCoverage < 1) {
      result.issues.push({ type: "IMAGE_ALT_COVERAGE_LOW" });
    }

    const hrefRe = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    let internal = 0;
    let external = 0;
    while ((m = hrefRe.exec(html)) !== null) {
      const href = (m[1] || "").trim();
      if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        continue;
      }
      if (href === "#" || href.startsWith("#")) {
        continue;
      }
      try {
        const resolved = new URL(href, base);
        const host = resolved.hostname.replace(/^www\./, "").toLowerCase();
        if (!pageHost) {
          internal += 1;
          continue;
        }
        if (host === pageHost || host.endsWith(`.${pageHost}`)) {
          internal += 1;
        } else {
          external += 1;
        }
      } catch {
        continue;
      }
    }
    result.internalLinks = internal;
    result.externalLinks = external;

    let rawScore = 100 - result.issues.length * 10;
    if (rawScore < 0) rawScore = 0;
    if (rawScore > 100) rawScore = 100;
    result.score = rawScore;

    return result;
  } catch {
    return null;
  }
}
