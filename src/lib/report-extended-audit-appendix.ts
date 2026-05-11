import { pdfAxisScoreHex } from "@/lib/report-theme";
import type { PerformanceAuditResult } from "@/lib/audits/performance-pagespeed";
import type { OnPageSeoAuditResult } from "@/lib/audits/on-page-seo";
import type { MetaPreviewAuditResult } from "@/lib/audits/meta-preview-audit";
import type { TechStackAuditResult } from "@/lib/audits/tech-stack-audit";
import type { BehaviourToolsAdvice } from "@/lib/audits/behaviour-tools";

export type ExtendedAuditAppendixInput = {
  performance_audit?: PerformanceAuditResult | null;
  on_page_seo?: OnPageSeoAuditResult | null;
  meta_preview?: MetaPreviewAuditResult | null;
  tech_stack?: TechStackAuditResult | null;
  behaviour_tools?: BehaviourToolsAdvice | null;
};

function stratLine(
  label: string,
  s: NonNullable<PerformanceAuditResult["mobile"]>,
  esc: (s: string) => string
): string {
  const bits: string[] = [];
  if (typeof s.performanceScore === "number")
    bits.push(
      `score <span class="report-figure" style="color:${pdfAxisScoreHex(s.performanceScore)};font-weight:700;">${s.performanceScore}</span>`
    );
  if (s.lcp) bits.push(`LCP ${esc(s.lcp)}`);
  if (s.inp) bits.push(`INP ${esc(s.inp)}`);
  if (s.cls) bits.push(`CLS ${esc(s.cls)}`);
  if (s.tbt) bits.push(`TBT ${esc(s.tbt)}`);
  return `<p class="muted report-nojustify"><strong>${esc(label)}:</strong> ${bits.join(" · ") || esc("—")}</p>`;
}

export function hasExtendedAuditAppendixContent(data: ExtendedAuditAppendixInput): boolean {
  if (data.performance_audit != null) {
    const p = data.performance_audit;
    const m = p.mobile;
    const d = p.desktop;
    const hasM = !!(
      m &&
      (m.performanceScore != null ||
        (m.lcp != null && m.lcp !== "") ||
        (m.inp != null && m.inp !== "") ||
        (m.cls != null && m.cls !== "") ||
        (m.tbt != null && m.tbt !== ""))
    );
    const hasD = !!(
      d &&
      (d.performanceScore != null ||
        (d.lcp != null && d.lcp !== "") ||
        (d.inp != null && d.inp !== "") ||
        (d.cls != null && d.cls !== "") ||
        (d.tbt != null && d.tbt !== ""))
    );
    if (hasM || hasD || p.opportunities.length || p.diagnostics.length) return true;
  }
  if (data.on_page_seo != null) return true;
  if (data.meta_preview != null) return true;
  if (data.tech_stack != null && (data.tech_stack.detectedTools?.length ?? 0) > 0)
    return true;
  if (data.behaviour_tools?.recommendationMessage) return true;
  return false;
}

export function buildExtendedAuditAppendixHtml(
  data: ExtendedAuditAppendixInput,
  esc: (s: string) => string
): string {
  if (!hasExtendedAuditAppendixContent(data)) return "";
  const chunks: string[] = [];

  chunks.push(
    `<div class="section report-major"><h2>Technical signals (expanded audit)</h2><p class="muted report-nojustify"><strong>Powered by programmatic checks:</strong> Google PageSpeed Insights API (when configured), local DOM scans, optional <code style="font-size:0.9em;">TECHSTACK_API_URL</code>.</p></div>`
  );

  const pa = data.performance_audit;
  if (pa && (pa.mobile || pa.desktop || pa.opportunities.length || pa.diagnostics.length)) {
    const stratBits: string[] = [];
    if (pa.mobile) stratBits.push(stratLine("Mobile lab", pa.mobile, esc));
    if (pa.desktop && pa.desktop !== pa.mobile)
      stratBits.push(stratLine("Desktop lab", pa.desktop, esc));

    const opList =
      pa.opportunities.length > 0
        ? `<p class="report-label" style="margin-top:10px;">Top opportunities</p><ul style="margin:6px 0 0;padding-left:1.1rem;">${pa.opportunities
            .map(
              (o) =>
                `<li class="report-nojustify">${esc(o.title ?? o.id)}${o.displayValue ? ` — ${esc(o.displayValue)}` : ""}</li>`
            )
            .join("")}</ul>`
        : "";
    const diList =
      pa.diagnostics.length > 0
        ? `<p class="report-label" style="margin-top:10px;">Diagnostics highlights</p><ul style="margin:6px 0 0;padding-left:1.1rem;">${pa.diagnostics
            .map(
              (o) =>
                `<li class="report-nojustify">${esc(o.title ?? o.id)}${o.displayValue ? ` — ${esc(o.displayValue)}` : ""}</li>`
            )
            .join("")}</ul>`
        : "";

    chunks.push(
      `<div class="section report-major"><h3>Performance (dual strategy)</h3>${stratBits.join("")}${opList}${diList}</div>`
    );
  }

  const seo = data.on_page_seo;
  if (seo != null) {
    const msgUl =
      seo.messages?.length > 0
        ? `<ul style="margin:8px 0 0;padding-left:1.1rem;">${seo.messages.map((m) => `<li class="report-nojustify">${esc(m)}</li>`).join("")}</ul>`
        : "";
    chunks.push(
      `<div class="section report-major"><h3>On-page SEO & hygiene</h3><p class="muted report-nojustify">H1/H2/H3: ${seo.headingH1Count} · ${seo.headingH2Count} · ${seo.headingH3Count}; internal links ${seo.internalLinks} · external ${seo.externalLinks}.</p><p class="muted report-nojustify">Canonical present: ${seo.canonicalPresent ? "Yes" : "No"} (${seo.canonicalValid ? "valid URL" : "invalid/missing"}, host match ${seo.canonicalMatchesPageHost ? "yes" : "no"}). Images with alt coverage: ${Math.round(seo.imagesWithMeaningfulAltPct * 100)}% (${seo.imagesTotal} images).</p>${msgUl}</div>`
    );
  }

  const mp = data.meta_preview;
  if (mp != null) {
    chunks.push(
      `<div class="section report-major"><h3>Meta & snippet preview</h3><pre class="report-nojustify" style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:0.9rem;border:1px solid var(--rs-border,#e5e7eb);padding:12px;border-radius:8px;">${esc(mp.serpPreviewText)}</pre><p class="report-label" style="margin-top:10px;">Open Graph summary</p><pre class="report-nojustify" style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:0.9rem;border:1px solid var(--rs-border,#e5e7eb);padding:12px;border-radius:8px;">${esc(mp.ogPreviewText)}</pre><p class="muted report-nojustify">Missing OG tags: ${[mp.missingOgTitle ? "title" : null, mp.missingOgDescription ? "description" : null, mp.missingOgImage ? "image" : null].filter(Boolean).join(", ") || "none noted"}.</p></div>`
    );
  }

  const tt = data.tech_stack;
  if (tt != null && tt.detectedTools.length > 0) {
    chunks.push(
      `<div class="section report-major"><h3>Tech stack & trackers (pattern detection)</h3><ul style="margin:6px 0 0;padding-left:1.1rem;">${tt.detectedTools.map((t) => `<li class="report-nojustify">${esc(t.name)} <span class="muted">(${esc(t.category)} · ${esc(t.confidence)})</span></li>`).join("")}</ul></div>`
    );
  }

  const b = data.behaviour_tools;
  if (b?.recommendationMessage) {
    chunks.push(
      `<div class="section report-major"><h3>Behaviour analytics</h3><p class="report-nojustify">${esc(b.recommendationMessage)}</p><p class="muted report-nojustify">${b.recommendBehaviourAnalytics ? "Recommendation: evaluate Microsoft Clarity (free)." : "Recording/heatmap tooling likely present."}</p></div>`
    );
  }

  return chunks.join("\n");
}
