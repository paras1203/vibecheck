# Expanded audit modules — design

## 1. Data flow

1. **Capture** returns `htmlContent`, response headers snippet (`responseHeaders`), plus existing fields.
2. **Local audits** consume `(htmlContent, auditedUrl)` and optionally `responseHeaders` for `X-Robots-Tag`.
3. **PSI** calls Google PageSpeed Insights v5 REST with `PAGESPEED_API_KEY` only (free tier quota applies). Optionally run **mobile** and **desktop** in parallel; cap lists for payload size.
4. **Optional tech API**: if `TECHSTACK_API_URL` is set, merge normalized tools into `TechStackAuditResult` (dedupe by `id`).

## 2. `PerformanceAuditResult`

- Produced by aggregation over `getPageSpeedReport(url, strategy)` results.
- Per strategy: `performanceScore`, display values for **LCP**, **INP**, **CLS**, optional **TBT**.
- **opportunities** / **diagnostics**: Lighthouse audits with numeric `numericValue` sorted for opportunities; capped (e.g. 8 entries) with `{ id, title, description?, displayValue?, scoreImpact? }`.

## 3. `OnPageSeoAuditResult`

- Title/description length bands **30–65** / **100–160** with `truncationLikely`, messages.
- Canonical: href resolved; `valid` + `matchesPageHost`.
- Indexability: `robotsMetaContent`, flags `noindex`/`nofollow`; `xRobotsTag` from headers when provided.
- Headings: H1/H2/H3 counts, `structureWarning` message if suspicious (e.g. multiple H1, no H2 with many H3).
- Images: alt % (same spirit as legacy), `heroImageAltPresent` heuristic (first `img` in `main`/`.hero`/`.homepage-hero`/header-ish region).
- Links: internal/external counts, flags `noNavigationalLinks`, `onlyExternalLinks`.
- **`messages[]`**: human-readable lines for UI/export.

## 4. `TechStackAuditResult`

- **`detectedTools`**: `{ id, name, category, confidence }` where confidence is `high` \| `medium` \| `low` from registry.
- **`registry`**: centralized patterns (substring/regex on raw HTML lowercased) for GA4, GTM, Meta Pixel, Clarity, Hotjar, Intercom, Crisp, etc.
- **External merge**: POST/GET helper normalizes `{ tools?: … }` loosely; duplicates removed by `id`.

## 5. `MetaPreviewAuditResult`

- Raw/tag fields: title, meta description, robots, canonical href, OG triple, Twitter card triple.
- **Lengths** + truncation warnings for SERP.
- **Booleans**: missing OG / Twitter subsets.
- **`serpPreviewText`**, **`ogPreviewText`** — plain-text mock lines for export.

## 6. Behaviour tools

- `BehaviourToolsAdvice`: `microsoftClarityPresent`, `hotjarOrSimilarPresent`, **`recommendBehaviourAnalytics`**, `recommendationMessage` (Clarity when none detected).

## 7. Backward compatibility / payload

- Preserve **`seo`**: `SeoAnalysisResult` from `analyzeSEO` unchanged for existing UI/copy.
- Add optional: `performance_audit`, `on_page_seo`, `meta_preview`, `tech_stack`, `behaviour_tools`.
- Legacy **`performance`**: remaining `PageSpeedSummary` populated from primary strategy (**mobile**) for existing components.

## 8. Report parity

- Extend `SeoAppendixInput` + `buildSeoPerformanceAppendixHtml` (additive sections) consumed by **`generateAuditReportHTML`** and **`pdf-templates`**.
- Roast page: new cards/sections beside existing SEO + PSI blocks; same **paywall** semantics where applicable.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PAGESPEED_API_KEY` | PSI (existing). |
| `PAGESPEED_STRATEGY` | Legacy single-strategy hint; dual fetch still runs when key present unless disabled (implementation: always dual when key set for `performance_audit`, legacy `performance` uses mobile default). |
| `TECHSTACK_API_URL` | Optional external tech fingerprint API base URL. |
| `TECHSTACK_API_KEY` | Optional Bearer for tech API. |
