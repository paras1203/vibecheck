import * as cheerio from "cheerio";

import type { CaptureDocumentHeaders } from "@/lib/capture";

export type OnPageSeoAuditResult = {
  titlePresent: boolean;
  title?: string;
  titleLength?: number;
  titleLengthOk?: boolean;
  titleTruncationLikely?: boolean;
  metaPresent: boolean;
  metaDescription?: string;
  metaLength?: number;
  metaLengthOk?: boolean;
  metaTruncationLikely?: boolean;
  canonicalHref?: string;
  canonicalPresent: boolean;
  canonicalValid: boolean;
  canonicalMatchesPageHost: boolean;
  robotsMetaContent?: string;
  robotsNoindex: boolean;
  robotsNofollow: boolean;
  xRobotsTag?: string;
  /** Response header-derived when capture exposes it */
  xRobotsNoindex: boolean;
  xRobotsNofollow: boolean;
  headingH1Count: number;
  headingH2Count: number;
  headingH3Count: number;
  headingStructureWarning?: string;
  imagesTotal: number;
  imagesWithMeaningfulAltPct: number;
  heroAltPresentLikely?: boolean;
  heroAltNote?: string;
  internalLinks: number;
  externalLinks: number;
  linkFlagNoNavigational: boolean;
  linkFlagOnlyExternal: boolean;
  messages: string[];
};

const TITLE_MIN = 30;
const TITLE_MAX = 65;
const META_MIN = 100;
const META_MAX = 160;

function normalizePageUrl(raw: string): string {
  let u = raw.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = u.replace(/^www\./, "");
    u = `https://${u}`;
  }
  return u;
}

function robotsFlags(content: string | undefined): { noindex: boolean; nofollow: boolean } {
  const c = (content || "").toLowerCase();
  return {
    noindex: /\bnoindex\b/.test(c),
    nofollow: /\bnofollow\b/.test(c),
  };
}

function pickHeroAlt($: cheerio.CheerioAPI): {
  present: boolean;
  note?: string;
} {
  const heroSelectors = [
    "main img:first",
    "header img:first",
    "[class*='hero'] img:first",
    "[id*='hero'] img:first",
  ];
  for (const sel of heroSelectors) {
    const el = $(sel);
    const first = el.first();
    if (first.length) {
      const alt = (first.attr("alt") || "").trim();
      const hasAltAttr = typeof first.attr("alt") === "string";
      if (hasAltAttr && alt.length > 0) return { present: true, note: `${sel} has non-empty alt` };
      if (hasAltAttr && alt === "")
        return { present: false, note: `${sel} uses decorative empty alt` };
      return {
        present: false,
        note: `${sel} missing alt`,
      };
    }
  }
  const anyFirst = $("body img:first");
  if (anyFirst.length) {
    const alt = (anyFirst.attr("alt") || "").trim();
    const hasAlt = alt.length > 0;
    return {
      present: hasAlt,
      note: `Fallback first document image${hasAlt ? "" : " has no descriptive alt"}`,
    };
  }
  return {
    present: false,
    note: "Could not infer a hero/first image (no <img> found)",
  };
}

export function analyzeOnPageSeoWithCheerio(
  $: cheerio.CheerioAPI,
  pageUrl: string,
  documentHeaders?: CaptureDocumentHeaders
): OnPageSeoAuditResult {
  const base = normalizePageUrl(pageUrl);
  let pageHost = "";
  try {
    pageHost = new URL(base).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    pageHost = "";
  }

  const title = $("title").first().text().replace(/\s+/g, " ").trim();
  const titlePresent = Boolean(title.length);
  const titleLength = title.length || undefined;

  let titleLengthOk = true;
  let titleTruncationLikely = false;
  if (!titlePresent) {
    titleLengthOk = false;
  } else if (titleLength! < TITLE_MIN || titleLength! > TITLE_MAX) {
    titleLengthOk = false;
  }
  if (titlePresent && titleLength! > TITLE_MAX) titleTruncationLikely = true;

  let metaDesc = "";
  $('meta[name="description"]').each((_, el) => {
    const c = ($(el).attr("content") || "").trim();
    if (c && !metaDesc) metaDesc = c;
  });

  const metaPresent = metaDesc.length > 0;
  const metaLength = metaPresent ? metaDesc.length : undefined;
  let metaLengthOk = true;
  let metaTruncationLikely = false;
  if (!metaPresent) metaLengthOk = false;
  else if (metaLength! < META_MIN || metaLength! > META_MAX) metaLengthOk = false;
  if (metaPresent && metaLength! > META_MAX) metaTruncationLikely = true;

  const canonRaw = $('link[rel="canonical"]').attr("href")?.trim();
  let canonicalPresent = Boolean(canonRaw && canonRaw.length > 0);
  let canonicalValid = false;
  let canonicalMatchesPageHost = false;
  let canonResolved = "";

  if (canonRaw) {
    try {
      const u = new URL(canonRaw, base);
      canonResolved = u.href;
      canonicalValid = /^https?:/i.test(u.protocol);
      const h = u.hostname.replace(/^www\./, "").toLowerCase();
      if (pageHost) canonicalMatchesPageHost = h === pageHost || h.endsWith(`.${pageHost}`);
      else canonicalMatchesPageHost = true;
    } catch {
      canonicalValid = false;
    }
  } else {
    canonicalPresent = false;
  }

  const robotsRaw = $('meta[name="robots"]').attr("content")?.trim();
  const { noindex: robotsNoindex, nofollow: robotsNofollow } = robotsFlags(robotsRaw);

  const xRobotsRaw = documentHeaders?.xRobotsTag?.trim();
  const xFlags = robotsFlags(xRobotsRaw);

  const h1 = $("h1").length;
  const h2 = $("h2").length;
  const h3 = $("h3").length;

  let headingStructureWarning: string | undefined;
  if (h1 === 0) headingStructureWarning = "No visible <h1> found.";
  else if (h1 > 1) headingStructureWarning = `Multiple H1 tags (${h1}) — ideally use one visible H1.`;
  else if (h3 > 0 && h2 === 0)
    headingStructureWarning = "H3 headings appear without H2 — skipped heading levels may confuse structure.";

  const imgs = $("img");
  const imgCount = imgs.length;
  let withAlt = 0;
  imgs.each((_, el) => {
    const alt = ($(el).attr("alt") || "").trim();
    if (alt.length > 0) withAlt += 1;
  });
  const pct = imgCount > 0 ? withAlt / imgCount : 1;

  const hero = pickHeroAlt($);

  let internalLinks = 0;
  let externalLinks = 0;

  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") || "").trim().toLowerCase();
    if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:"))
      return;
    if (href === "#" || href.startsWith("#")) return;

    try {
      const resolved = new URL($(el).attr("href") || "", base);
      const host = resolved.hostname.replace(/^www\./, "").toLowerCase();
      if (!pageHost) {
        internalLinks += 1;
        return;
      }
      if (host === pageHost || host.endsWith(`.${pageHost}`)) internalLinks += 1;
      else externalLinks += 1;
    } catch {
      /* ignore */
    }
  });

  const totalNav = internalLinks + externalLinks;
  const linkFlagNoNavigational = totalNav === 0;
  const linkFlagOnlyExternal = totalNav > 0 && internalLinks === 0 && externalLinks > 0;

  const messages: string[] = [];
  if (!titlePresent) messages.push("Missing <title>.");
  else if (!titleLengthOk && titleLength != null)
    messages.push(`Title length ${titleLength} chars — target roughly ${TITLE_MIN}–${TITLE_MAX}.`);

  if (!metaPresent) messages.push("Missing meta description.");
  else if (!metaLengthOk && metaLength != null)
    messages.push(`Meta description length ${metaLength} chars — typical SERP snippet range ${META_MIN}–${META_MAX}.`);

  if (canonicalPresent && !canonicalValid) messages.push("Canonical link URL is malformed.");
  else if (canonicalPresent && pageHost && !canonicalMatchesPageHost)
    messages.push("Canonical hostname may not match audited page hostname.");

  if (robotsNoindex) messages.push('Meta robots signals "noindex" — URL may drop from SERPs.');
  if (robotsNofollow)
    messages.push('Meta robots signals "nofollow" — links may avoid passing crawl prioritization.');
  if (xRobotsRaw) {
    const parts: string[] = [];
    if (xFlags.noindex) parts.push("noindex");
    if (xFlags.nofollow) parts.push("nofollow");
    if (parts.length > 0)
      messages.push(
        `X-Robots-Tag header may constrain indexing or link following: ${parts.join(", ")}.`
      );
  }

  if (headingStructureWarning) messages.push(headingStructureWarning);
  if (imgCount > 0 && pct < 1)
    messages.push(
      `${Math.round(pct * 100)}% of images carry helpful alt text — aim for descriptive alts where content matters.`
    );
  messages.push(`Internal links ${internalLinks} · External links ${externalLinks}.`);
  if (linkFlagNoNavigational) messages.push("No navigational internal/external anchors detected.");
  if (linkFlagOnlyExternal)
    messages.push("All outbound links point off-site — make sure funnel paths remain clear.");

  messages.push(hero.present ? hero.note || "Hero image alt looks OK." : hero.note || "Inspect hero imagery for alt.");

  return {
    titlePresent,
    ...(titlePresent ? { title, titleLength, titleTruncationLikely } : {}),
    titleLengthOk: titlePresent ? titleLengthOk : false,
    metaPresent,
    ...(metaPresent
      ? { metaDescription: metaDesc, metaLength, metaTruncationLikely }
      : {}),
    metaLengthOk: metaPresent ? metaLengthOk : false,
    canonicalPresent,
    ...(canonResolved ? { canonicalHref: canonResolved } : canonRaw ? { canonicalHref: canonRaw } : {}),
    canonicalValid: canonicalPresent ? canonicalValid : false,
    canonicalMatchesPageHost:
      canonicalPresent && canonicalValid ? canonicalMatchesPageHost : false,
    robotsMetaContent: robotsRaw,
    robotsNoindex,
    robotsNofollow,
    xRobotsTag: xRobotsRaw,
    xRobotsNoindex: xFlags.noindex,
    xRobotsNofollow: xFlags.nofollow,
    headingH1Count: h1,
    headingH2Count: h2,
    headingH3Count: h3,
    ...(headingStructureWarning ? { headingStructureWarning } : {}),
    imagesTotal: imgCount,
    imagesWithMeaningfulAltPct: pct,
    heroAltPresentLikely: hero.present,
    heroAltNote: hero.note,
    internalLinks,
    externalLinks,
    linkFlagNoNavigational,
    linkFlagOnlyExternal,
    messages,
  };
}

export function runOnPageSeoAudit(
  html: string,
  url: string,
  documentHeaders?: CaptureDocumentHeaders
): OnPageSeoAuditResult {
  const $ = cheerio.load(html);
  return analyzeOnPageSeoWithCheerio($, url, documentHeaders);
}
