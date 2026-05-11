import { BRAND_NAME } from "@/lib/brand";
import type { AuditReportPayload } from "@/lib/report-html";
import { DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD, DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS } from "@/lib/insight-layers";
import { buildReportV2InnerHtml, type ReportV2Calc } from "@/lib/report-v2-html-blocks";
import { reportFontsHref, getReportEmbedStyles } from "@/lib/report-theme";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateAuditReportHTMLV2(
  data: AuditReportPayload,
  options: {
    reportId: string;
    isPaid: boolean;
    calculator?: ReportV2Calc;
    generatedAt?: Date;
  }
): string {
  const { reportId, isPaid } = options;
  const calc =
    options.calculator || {
      traffic: DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
      price: data.price_guess || DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD,
      industry: data.industry_guess || "SaaS",
    };
  const at = options.generatedAt || new Date();
  const site =
    data.audited_url ||
    (typeof reportId === "string" ? `Report ${reportId}` : "Your site");

  const tierLabel = isPaid ? "Full report V2 (beta)" : "Free summary V2 (beta)";
  const inner = buildReportV2InnerHtml(data, {
    esc: escapeHtml,
    isPaid,
    calculator: calc,
    reportId,
    generatedAt: at,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME} — Audit report V2 (${escapeHtml(reportId)})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="${reportFontsHref}" />
  <style>${getReportEmbedStyles()}</style>
</head>
<body>
  <header class="report-head">
    <h1>${BRAND_NAME} — Report V2</h1>
    <p class="report-meta">${escapeHtml(site)} · ${tierLabel} · ${escapeHtml(at.toLocaleString())}</p>
  </header>
  <div class="report-body">
    ${inner}
  </div>
  <footer class="meta report-nojustify"><small>${BRAND_NAME} · ${escapeHtml(at.toISOString())}</small></footer>
</body>
</html>`;
}
