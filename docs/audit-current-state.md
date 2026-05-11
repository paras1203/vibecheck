<!--
## Existing audits (deterministic + orchestration)

- HTML/text capture: Puppeteer in `src/lib/capture.ts` loads the URL; returns `htmlContent`, `pageText`, screenshots, `pageHeight`.
- Secondary economics pass: `src/lib/quick-scan.ts` (industry/pricing guess), separate navigation.
- Local SEO (regex on HTML): `src/lib/seo-analyzer.ts` — title length band (30–60), meta description band (70–160), H1 tag count, canonical presence, robots meta presence, OG/Twitter presence booleans, image alt coverage %, internal vs external link counts, score + `issues[]`.
- Page type: `src/lib/page-type.ts` — landing/blog/product/unknown heuristics.
- PageSpeed Insights (optional): `src/lib/pagespeed.ts` when `PAGESPEED_API_KEY` — single strategy (`PAGESPEED_STRATEGY`), performance score, LCP, CLS, TBT.
- PSI narrative: `src/lib/pagespeed-gemini-summary.ts` when PSI data exists.
- Legal link signals: `src/lib/legal-html-signals.ts`; merged with Gemini tech worker in `compileRoast`.
- LLM audit rows: `src/app/api/roast/route.ts` `compileRoast` — visuals/copy/tech workers → `audit_items[]` (radar categories).
- Scroll narrative: `src/lib/scroll-effectiveness-from-audit.ts`.
- Traffic / revenue blocks: `traffic-estimate.ts`, `insight-layers.ts`.

## Missing vs target audits

- Dual-strategy PSI + full `PerformanceAuditResult` (mobile + desktop scores, INP, opportunities, diagnostics).
- Rich on-page SEO (`OnPageSeoAuditResult`): canonical validity, robots content, heading structure heuristics, hero alt, link pattern flags, X-Robots-Tag from response headers (after capture exposes headers).
- Tech stack / trackers (`TechStackAuditResult`) with pattern registry + optional `TECHSTACK_API_URL` merge.
- Meta / SERP preview object (`MetaPreviewAuditResult`) distinct from legacy `seo` score card.
- Behaviour-tool recommendation (Clarity etc.) from tech detection.
- Dedicated accessibility / broken-link HTTP checks (still not in scope unless added later).
-->

# Audit pipeline — current state (reference)

| Stage | File | Role |
|-------|------|------|
| POST handler | `src/app/api/roast/route.ts` | Validates URL, runs capture + quick scan, `analyzeSEO`, `getPageSpeed`, `compileRoast`, attaches payload fields. |
| Capture | `src/lib/capture.ts` | Puppeteer: HTML, text, hero screenshot, scroll height. |
| SEO | `src/lib/seo-analyzer.ts` | Regex-based checks; powers `seo` in API + `report-seo-appendix`. |
| PSI | `src/lib/pagespeed.ts` | Optional Google PageSpeed v5 run; `performance` on payload. |
| Report UI | `src/components/roast/roast-seo-performance-section.tsx` | SEO health + PSI cards. |
| Exports | `src/lib/report-html.ts`, `report-seo-appendix.ts`, `pdf-templates.ts` | HTML/PDF appendices for SEO + performance. |

See `docs/audit-design.md` for the expanded module layout and environment variables.
