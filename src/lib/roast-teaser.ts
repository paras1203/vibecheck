import { annualLeakUsd, REVENUE_LIFT_BASE } from "@/lib/insight-layers";
import { stripNarrativeSegmentLabels } from "@/lib/report-copy";
import { buildPersonalizedInsiderLines } from "@/lib/personalized-insider";
import {
  auditElementLabel,
  isDeprioritizedLegalAuditElement,
} from "@/lib/legal-compliance-audit";

export type RoastTeaserContent = {
  score: number;
  reportStub: string;
  auditPreviewTitle: string;
  radarMetrics: Record<string, number>;
  annualLeakUsd: number;
  executivePulse: string;
  insiderLines: readonly string[];
  criticalIssue: string;
  surprisingInsight: string;
  underperformingLine: string;
};

const FALLBACK_INSIGHT =
  "Full breakdown includes category scores and prioritized fixes.";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function firstSentence(text: string, maxLen: number): string {
  const t = text.trim();
  if (!t) return "";
  const cut = t.split(/(?<=[.!?])\s+/)[0] ?? t;
  if (cut.length <= maxLen) return cut;
  return `${cut.slice(0, maxLen - 1).trim()}…`;
}

function truncateLine(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function auditPreviewTitleFromUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "Your site";
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    const h = u.hostname.replace(/^www\./i, "");
    return h || t;
  } catch {
    return t.length > 42 ? `${t.slice(0, 39)}…` : t;
  }
}

function teaserReportStub(payload: Record<string, unknown>): string {
  const audited = typeof payload.audited_url === "string" ? payload.audited_url.trim() : "";
  const mon = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const d = new Date();
  const tag = `${mon[d.getMonth()] ?? "jan"}${d.getDate()}`;
  try {
    if (audited) {
      const u = new URL(audited.startsWith("http") ? audited : `https://${audited}`);
      const h = u.hostname.replace(/^www\./i, "").replace(/\./g, "_");
      if (h) return `${h.slice(0, 28)}_${tag}`;
    }
  } catch {
    /* ignore */
  }
  return `siteroast_${tag}`;
}

function teaserAnnualLeakBaseUsd(payload: Record<string, unknown>): number {
  const rev = asRecord(payload.revenueLeakEstimate);
  const defs = rev?.annualLeakUsdDefaults as Record<string, unknown> | undefined;
  const base = defs?.base;
  if (typeof base === "number" && !Number.isNaN(base)) return Math.round(base);
  return Math.round(annualLeakUsd(1000, 50, REVENUE_LIFT_BASE));
}

function teaserRadarMetrics(payload: Record<string, unknown>): Record<string, number> {
  const rm = payload.radarMetrics;
  if (rm !== null && typeof rm === "object" && !Array.isArray(rm)) {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(rm as Record<string, unknown>)) {
      const n = Number(v);
      if (!Number.isNaN(n)) out[k] = n;
    }
    if (Object.keys(out).length > 0) return out;
  }
  const rs = payload.radar_scores;
  if (rs !== null && typeof rs === "object" && !Array.isArray(rs)) {
    const raw = rs as Record<string, unknown>;
    const pairs: [string, string][] = [
      ["UX", "UX"],
      ["Trust", "Trust"],
      ["Copy", "Copy"],
      ["Conversion", "Conversion"],
      ["Visuals", "Visuals"],
      ["Speed", "Speed"],
    ];
    const out: Record<string, number> = {};
    for (const [key] of pairs) {
      const n = Number(raw[key]);
      if (!Number.isNaN(n)) out[key] = n;
    }
    if (Object.keys(out).length > 0) return out;
  }
  return {
    UX: 50,
    Trust: 50,
    Copy: 50,
    Conversion: 50,
    Visuals: 50,
    Speed: 50,
  };
}

type QuickWin = {
  title?: string;
  elementName?: string;
  problem?: string;
};

export function buildRoastTeaser(payload: Record<string, unknown>): RoastTeaserContent {
  const overview = asRecord(payload.overview);
  const overallScore =
    typeof payload.overall_score === "number"
      ? payload.overall_score
      : typeof overview?.overallScore === "number"
        ? overview.overallScore
        : 50;

  let criticalIssue = "";
  const auditItems = Array.isArray(payload.audit_items) ? payload.audit_items : [];
  for (const raw of auditItems) {
    const item = asRecord(raw);
    if (!item) continue;
    const el = auditElementLabel({ element: typeof item.element === "string" ? item.element : "" });
    if (isDeprioritizedLegalAuditElement(el)) continue;
    const st = typeof item.status === "string" ? item.status : "";
    if (st === "Failed" || st === "Needs Improvement") {
      const elLabel = el || "Issue";
      const rat =
        typeof item.rationale === "string" ? item.rationale.trim() : "";
      criticalIssue = rat ? `${elLabel}: ${truncateLine(rat, 200)}` : `${elLabel} (${st})`;
      break;
    }
  }

  if (!criticalIssue) {
    const qwRaw = (payload.quickWins || payload.quick_wins) as unknown;
    const qwList = Array.isArray(qwRaw) ? qwRaw : [];
    const first = qwList[0] as QuickWin | undefined;
    if (first) {
      const title = first.title || first.elementName || "Quick win";
      const prob = first.problem?.trim();
      criticalIssue = prob ? `${title}: ${truncateLine(prob, 200)}` : title;
    }
  }

  if (!criticalIssue) {
    const bullets = Array.isArray(payload.summary_bullets) ? payload.summary_bullets : [];
    for (const b of bullets) {
      if (typeof b === "string" && b.includes("❌")) {
        const stripped = b.replace(/^\s*❌\s*/, "").trim();
        if (isDeprioritizedLegalAuditElement(stripped)) continue;
        criticalIssue = stripped;
        break;
      }
    }
    if (!criticalIssue) {
      for (const b of bullets) {
        if (typeof b === "string" && b.trim()) {
          criticalIssue = b.replace(/^\s*[❌✅]\s*/, "").trim();
          break;
        }
      }
    }
  }

  if (!criticalIssue) {
    criticalIssue = "See the full report for prioritized findings.";
  }

  let surprisingInsight = "";
  const verdict = typeof payload.verdict === "string" ? payload.verdict.trim() : "";
  const closer = typeof payload.closer === "string" ? payload.closer.trim() : "";
  if (verdict) surprisingInsight = truncateLine(verdict, 220);
  else if (closer) surprisingInsight = truncateLine(closer, 220);
  else {
    const bullets = Array.isArray(payload.summary_bullets) ? payload.summary_bullets : [];
    for (const b of bullets) {
      if (typeof b === "string" && b.includes("✅")) {
        surprisingInsight = truncateLine(b.replace(/^\s*✅\s*/, "").trim(), 220);
        break;
      }
    }
  }
  if (!surprisingInsight) surprisingInsight = FALLBACK_INSIGHT;

  const exec = stripNarrativeSegmentLabels(
    (overview?.executiveSummary as string | undefined)?.trim() ||
      (typeof payload.hook === "string" ? payload.hook.trim() : "") ||
      (typeof payload.roastSummary === "string" ? payload.roastSummary.trim() : "")
  );
  const underperformingLine = exec
    ? truncateLine(firstSentence(exec, 200), 160)
    : "Patterns in clarity, trust, and funnel structure are limiting conversion.";

  const punchyFallback =
    "Visitors decide in seconds—if your hero still makes them work to understand the offer, you're paying for traffic that never converts. The gap between attention and action is where revenue quietly walks away; tightening one headline, one proof point, and one primary CTA usually pays back faster than another ad test.";

  const executivePulse = exec
    ? truncateLine(exec.replace(/\s+/g, " ").trim(), 300)
    : truncateLine(
        `${punchyFallback} ${criticalIssue}`.replace(/\s+/g, " ").trim(),
        320
      );

  const audited =
    typeof payload.audited_url === "string" && payload.audited_url.trim()
      ? payload.audited_url.trim()
      : "";

  return {
    score: Math.round(Number(overallScore)) || 50,
    reportStub: teaserReportStub(payload),
    auditPreviewTitle: auditPreviewTitleFromUrl(audited),
    radarMetrics: teaserRadarMetrics(payload),
    annualLeakUsd: teaserAnnualLeakBaseUsd(payload),
    executivePulse,
    insiderLines: buildPersonalizedInsiderLines(payload),
    criticalIssue,
    surprisingInsight,
    underperformingLine,
  };
}
