import * as cheerio from "cheerio";

export type MetaPreviewAuditResult = {
  title?: string;
  titleLen?: number;
  titleTruncateWarn?: boolean;
  metaDescription?: string;
  metaLen?: number;
  metaTruncateWarn?: boolean;
  metaRobots?: string;
  canonicalHref?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  missingOgTitle: boolean;
  missingOgDescription: boolean;
  missingOgImage: boolean;
  missingTwitterCard: boolean;
  missingTwitterTitle: boolean;
  missingTwitterDescription: boolean;
  missingTwitterImage: boolean;
  serpPreviewText: string;
  ogPreviewText: string;
};

function attrMeta($: cheerio.CheerioAPI, name: string): string | undefined {
  const v = $(`meta[name="${name}"]`).attr("content");
  const t = typeof v === "string" ? v.trim() : "";
  return t ? t : undefined;
}

function attrProp($: cheerio.CheerioAPI, prop: string): string | undefined {
  const v = $(`meta[property="${prop}"]`).attr("content");
  const t = typeof v === "string" ? v.trim() : "";
  return t ? t : undefined;
}

/** Twitter tags may use property or name depending on markup */
function twitterAttr($: cheerio.CheerioAPI, key: string): string | undefined {
  const prop = attrProp($, key);
  if (prop) return prop;
  const n = attrMeta($, key);
  return n;
}

function lenWarn(min: number, max: number, len: number): boolean {
  return len > max;
}

export function runMetaPreviewAudit(
  html: string,
  _auditedUrl: string
): MetaPreviewAuditResult {
  void _auditedUrl;
  const $ = cheerio.load(html);
  const title = $("title").first().text().replace(/\s+/g, " ").trim() || undefined;
  let metaDesc: string | undefined;
  $('meta[name="description"]').each((_, el) => {
    const c = ($(el).attr("content") || "").trim();
    if (c && !metaDesc) metaDesc = c;
  });
  const robots = $('meta[name="robots"]').attr("content")?.trim() || undefined;

  let canonicalHref: string | undefined;
  $('link[rel="canonical"]').each((_, el) => {
    const href = ($(el).attr("href") || "").trim();
    if (href && !canonicalHref) canonicalHref = href;
  });

  const ogTitle = attrProp($, "og:title");
  const ogDescription = attrProp($, "og:description");
  const ogImage = attrProp($, "og:image");
  const twitterCard = twitterAttr($, "twitter:card");
  const twitterTitle = twitterAttr($, "twitter:title");
  const twitterDescription = twitterAttr($, "twitter:description");
  const twitterImage = twitterAttr($, "twitter:image");

  const missingOgTitle = !ogTitle;
  const missingOgDescription = !ogDescription;
  const missingOgImage = !ogImage;

  const missingTwitterCard = !twitterCard;
  const missingTwitterTitle = !twitterTitle;
  const missingTwitterDescription = !twitterDescription;
  const missingTwitterImage = !twitterImage;

  const tLen = title?.length ?? 0;
  const mLen = metaDesc?.length ?? 0;

  const serpTitle = title || "(no title)";
  const serpDesc = metaDesc || "(no meta description)";
  const serpPreviewText = `${serpTitle}\n${serpDesc}${
    tLen > 60 || mLen > 160
      ? "\nNote: typical SERP widths may truncate a long title or description."
      : ""
  }`;

  const ogPreviewText = `[Open Graph preview]\n${ogTitle ?? "(missing og:title)"}\n${ogDescription ?? "(missing og:description)"}\n${ogImage ?? "(missing og:image)"}`;

  return {
    title,
    ...(title ? { titleLen: title.length } : {}),
    titleTruncateWarn: title ? lenWarn(30, 65, title.length) : false,
    ...(metaDesc ? { metaDescription: metaDesc } : {}),
    ...(metaDesc ? { metaLen: metaDesc.length } : {}),
    metaTruncateWarn: metaDesc ? lenWarn(100, 160, metaDesc.length) : false,
    metaRobots: robots,
    ...(canonicalHref ? { canonicalHref } : {}),
    ...(ogTitle ? { ogTitle } : {}),
    ...(ogDescription ? { ogDescription } : {}),
    ...(ogImage ? { ogImage } : {}),
    ...(twitterCard ? { twitterCard } : {}),
    ...(twitterTitle ? { twitterTitle } : {}),
    ...(twitterDescription ? { twitterDescription } : {}),
    ...(twitterImage ? { twitterImage } : {}),
    missingOgTitle,
    missingOgDescription,
    missingOgImage,
    missingTwitterCard,
    missingTwitterTitle,
    missingTwitterDescription,
    missingTwitterImage,
    serpPreviewText,
    ogPreviewText,
  };
}
