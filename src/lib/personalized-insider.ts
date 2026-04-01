import { getIndustryInsiderPoints, type IndustryInsiderKey } from "@/lib/industry-insider-copy";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function normalizeIndustryKey(raw?: string): IndustryInsiderKey {
  const s = (raw || "").toLowerCase();
  if (s.includes("ecommerce") || s.includes("e-commerce") || s.includes("shop") || s.includes("store")) {
    return "E-commerce";
  }
  if (s.includes("agency") || s.includes("consult")) {
    return "Agency";
  }
  return "SaaS";
}

function hostLabel(auditedUrl: string): string {
  const t = auditedUrl.trim();
  if (!t) return "This page";
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    return u.hostname.replace(/^www\./i, "") || "This page";
  } catch {
    return t.length > 48 ? `${t.slice(0, 45)}…` : t;
  }
}

function truncate(s: string, max: number): string {
  const x = s.replace(/\s+/g, " ").trim();
  if (x.length <= max) return x;
  return `${x.slice(0, max - 1).trim()}…`;
}

/**
 * Three bullets grounded in this audit (URL, scores, findings) plus sector voice.
 */
export function buildPersonalizedInsiderLines(payload: Record<string, unknown>): string[] {
  const audited =
    typeof payload.audited_url === "string" && payload.audited_url.trim()
      ? payload.audited_url.trim()
      : "";
  const label = hostLabel(audited);
  const industry = normalizeIndustryKey(
    typeof payload.industry_guess === "string" ? payload.industry_guess : undefined
  );
  const templates = getIndustryInsiderPoints(industry);

  const radar =
    (payload.radar_scores as Record<string, unknown> | undefined) ||
    (payload.radarMetrics as Record<string, unknown> | undefined) ||
    {};
  let weakestAxis = "";
  let weakestVal = 999;
  for (const [k, v] of Object.entries(radar)) {
    const n = Number(v);
    if (!Number.isNaN(n) && n < weakestVal) {
      weakestVal = n;
      weakestAxis = k;
    }
  }

  type Qw = { title?: string; elementName?: string; problem?: string; fix?: string };
  const qwRaw = (payload.quickWins || payload.quick_wins) as unknown;
  const qwList = Array.isArray(qwRaw) ? (qwRaw as Qw[]) : [];
  const qw = qwList[0];
  const qwTitle = (qw?.title || qw?.elementName || "").trim();
  const qwProblem = (qw?.problem || "").trim();

  let auditSnippet = "";
  const items = Array.isArray(payload.audit_items) ? payload.audit_items : [];
  for (const raw of items) {
    const item = asRecord(raw);
    if (!item) continue;
    const st = typeof item.status === "string" ? item.status : "";
    if (st === "Failed" || st === "Needs Improvement") {
      const el = typeof item.element === "string" ? item.element : "Finding";
      const rat = typeof item.rationale === "string" ? item.rationale.trim() : "";
      auditSnippet = rat ? `${el}: ${truncate(rat, 140)}` : `${el} flagged as ${st}`;
      break;
    }
  }

  const hook =
    typeof payload.hook === "string"
      ? payload.hook.trim()
      : typeof payload.overview === "object" && payload.overview !== null
        ? String((payload.overview as { executiveSummary?: string }).executiveSummary || "").trim()
        : "";

  const lines: string[] = [];

  if (qwTitle || qwProblem) {
    const bit = qwProblem || qwTitle;
    lines.push(
      truncate(
        `${label}: we’d pressure-test “${truncate(qwTitle || "your primary offer block", 60)}” first — ${truncate(bit, 120)}`,
        220
      )
    );
  } else if (auditSnippet) {
    lines.push(truncate(`${label} — ${auditSnippet}`, 220));
  } else if (hook) {
    lines.push(truncate(`First impression on ${label}: ${truncate(hook, 160)}`, 220));
  } else {
    lines.push(truncate(`${label} reads like a typical ${industry} funnel — worth tightening hero clarity before scaling spend.`, 220));
  }

  if (weakestAxis && weakestVal < 999) {
    lines.push(
      truncate(
        `Radar shows ${weakestAxis} at ${Math.round(weakestVal)}/100 — that’s usually where ${industry === "E-commerce" ? "cart hesitation" : industry === "Agency" ? "proposal friction" : "trial-to-paid drop-off"} shows up first.`,
        220
      )
    );
  } else {
    lines.push(truncate(templates[1] ?? templates[0], 220));
  }

  lines.push(truncate(`${templates[2] ?? templates[0]}`, 220));

  return lines.slice(0, 3);
}
