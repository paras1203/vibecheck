/**
 * Helpers for professional “share your score” copy (conversion audit framing, no “roast” language).
 */

export type RoastShareInput = {
  audited_url?: string;
  quickWins?: Array<{
    title?: string;
    problem?: string;
    fix?: string;
  }>;
  quick_wins?: Array<{
    title?: string;
    problem?: string;
    fix?: string;
  }>;
  audit_items?: Array<{
    element?: string;
    status?: string;
    not_working?: string[];
    rationale?: string;
  }>;
  summary_bullets?: string[];
};

const WEAK_STATUS = new Set([
  "Failed",
  "Needs Improvement",
  "Poor",
  "Critical",
  "Bad",
]);

function stripLeadingEmoji(s: string): string {
  return s.replace(/^[\s\uFE0F]*[\p{Emoji_Presentation}\p{Extended_Pictographic}]+[\s\uFE0F]*/u, "").trim();
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function hostnameFromAuditedUrl(url: string | undefined): string | null {
  if (!url || !url.trim()) return null;
  try {
    const u = url.includes("://") ? url : `https://${url}`;
    const h = new URL(u).hostname;
    return h || null;
  } catch {
    return null;
  }
}

export function displayDomain(
  auditedUrl: string | undefined,
  anonymized: boolean
): string {
  if (anonymized) return "Landing page (domain hidden)";
  const host = hostnameFromAuditedUrl(auditedUrl);
  return host || "Analyzed landing page";
}

export function pickShareIssues(data: RoastShareInput): string[] {
  const out: string[] = [];

  const items = data.audit_items || [];
  const weakFirst = [...items].sort((a, b) => {
    const wa = a.status && WEAK_STATUS.has(a.status) ? 0 : 1;
    const wb = b.status && WEAK_STATUS.has(b.status) ? 0 : 1;
    return wa - wb;
  });

  for (const it of weakFirst) {
    if (out.length >= 2) break;
    const nw = it.not_working?.filter(Boolean) || [];
    if (nw.length > 0) {
      const line = truncate(`${it.element ? `${it.element}: ` : ""}${nw[0]}`, 120);
      if (line) out.push(line);
      continue;
    }
    if (it.rationale && (WEAK_STATUS.has(it.status || "") || !it.status)) {
      const line = truncate(`${it.element ? `${it.element}: ` : ""}${it.rationale}`, 120);
      if (line) out.push(line);
    }
  }

  const qw = data.quickWins || data.quick_wins || [];
  for (const q of qw) {
    if (out.length >= 2) break;
    const p = (q.problem || q.title || "").trim();
    if (p && !out.some((x) => x.includes(p.slice(0, 20)))) {
      out.push(truncate(p, 120));
    }
  }

  const bullets = data.summary_bullets || [];
  for (const b of bullets) {
    if (out.length >= 2) break;
    const cleaned = stripLeadingEmoji(String(b));
    if (cleaned.length > 8 && !out.includes(cleaned)) {
      out.push(truncate(cleaned, 120));
    }
  }

  return out.slice(0, 2);
}

const DEFAULT_IMPROVEMENT =
  "Prioritize above-the-fold clarity and a single primary call to action.";

export function pickImprovementHeadline(data: RoastShareInput): string {
  const qw = data.quickWins || data.quick_wins || [];
  for (const q of qw) {
    const fix = (q.fix || "").trim();
    if (fix.length > 12) return truncate(fix, 140);
    const title = (q.title || "").trim();
    if (title.length > 8 && !/roast/i.test(title)) return truncate(title, 140);
  }
  return DEFAULT_IMPROVEMENT;
}

export type BuildSharePostParams = {
  score: number;
  domainLabel: string;
  issues: string[];
  improvement: string;
  shareUrl: string;
};

export function buildSharePostText(p: BuildSharePostParams): string {
  const score = Math.round(p.score);
  const lines: string[] = [
    `I ran a landing page analysis with SiteRoast and received a site score of ${score}/100.`,
    "",
    `Scope: ${p.domainLabel}.`,
    "",
  ];

  if (p.issues.length > 0) {
    lines.push("Key findings:");
    for (const issue of p.issues) {
      lines.push(`• ${issue}`);
    }
    lines.push("");
  }

  lines.push(`Focus next: ${p.improvement}`);
  lines.push("");
  lines.push("Compare your score against similar sites.");
  lines.push("");
  lines.push(
    `If you want a structured conversion audit for your own page, you can run one here: ${p.shareUrl}`
  );

  return lines.join("\n").replace(/\broast\b/gi, "audit");
}
