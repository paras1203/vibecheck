# Vibecheck — Report page: visual hierarchy, layout, and audit flow

This document describes how the roast report page (`/roast/[id]`) orders information, where data comes from, and how element-level and category-level audits are derived and displayed. It tracks **`src/app/roast/[id]/page.tsx`** and related roast components.

## 1. Page flow (top → bottom)

1. **Chrome** — `SidebarProvider` → `AppSidebar` + `SidebarInset`; content area uses `ml-[14.4rem]` and a max width cap for the main column.
2. **Report header** — Title **Site Conversion Report**, monospace filename line (`formatReportDisplayName` + timestamp from route id), and export actions: **Download PDF**, **Download HTML**, **View in Browser** (each gated via `AuthRequiredDialog` when not signed in).
3. **Hero score band** (single bordered `grid` card, `md:grid-cols-12`):
   - **Column 1 (md: span 3):** “Overall score” caption → `RadialChart` → large `/100` display → `ScoreIntelFootnote` (ties score to audit breadth).
   - **Column 2 (md: span 9):** “Verdict” line using `verdictLabelFromSiteScore(overallScore, radarForVerdict)` → optional **above-the-fold narrative**: `briefSummary` = `hook` → `overview.executiveSummary` → `roastSummary`, stripped with `stripNarrativeSegmentLabels`, in a rounded inner card (`text-base` body).
   - **Full width (`col-span-full`):** `ReportQuickFixesBlock` — quick wins from `ensureQuickWinsUpToFour(quickWins, audit_items)` with paywall behavior for extra rows / detail.
   - **Full width:** **Site Score** card — six axis tiles (`RADAR_AXIS_LABELS` + `scoreForRadarAxis` + `RADAR_AXIS_EXPLANATIONS`) beside `RoastRadar` in a fixed **~268px** column on large screens.
4. **Insights & actions** — `SectionHeader` (description references SEO + AI signals). **AI Insights** card only: `getIndustryInsiderPoints(industry)` in a 1×3 grid on desktop (`text-xs` bullets). *SEO is not in this card.*
5. **Executive insight layers** — `SectionHeader` → `RevenueLeakEstimateCard` (editable traffic/price; copy uses `buildRevenueLeakEstimate` + traffic note) → three `InsightLayerCard` columns (first impression, trust gap, messaging); **subscores** show only when `hasFullReportAccess`.
6. **SEO health** — `RoastSeoHealthBlock` when `hasRoastSeoHealthContent` (SEO issues, page type, performance shell); paywalled issue types for free users per component rules.
7. **Admin-only** — `ShareYourScore`, then `SocialContentPackSection` (content pack tooling).
8. **Upgrade strip** — `FullReportUpgradePanel` when `!hasFullReportAccess` (teasers from categories, first quick win, benchmark line, impact line).
9. **Performance & economics** — `SectionHeader` → optional `RoastPageSpeedBlock` (Lighthouse-style metrics + `performanceGemini` copy when present) → two-column cards **Cost of Inaction** (illustrative annual leak from local traffic × lift × price) and **Competitor Gap** (industry multiplier vs traffic).
10. **Scroll of Death** — `ScrollOfDeathCard`: below-fold % vs `foldHeight` **800px**, `scrollDepthNarrative`, `scrollEffectiveness` or `buildScrollEffectiveness`, zone-grouped issue/fix lines where applicable.
11. **Attention heatmap** — `AttentionHeatmapPanel`: first-viewport capture (`heroScreenshot`); `heroScreenshotDataUrl` normalizes JPEG/PNG/data URLs. If storage lacks a hero, client may **`POST /api/roast/hero`** once to recapture chunk 1 only (`ensureHeroScreenshot` in page load effect).
12. **Executive summary** (conditional `hasDetailedRoastSection`) — Card repeating **Summary** (`briefSummary`), **Analysis** (`script` / `analysis` / `overview.roastAnalysis`), **Verdict**, **What to do next** (`closer`); sections use `text-sm` headings and body with word-break guards. *The hook often appears twice: once in the hero band and again here.*
13. **Category deep dive** — `SectionHeader` + tabbed `Card` (`CATEGORY_TAB_ORDER`: UX & Layout → … → Speed & Technical Health). Built from `detailedAudit` keys mapped via `categoryNames`. Free: `LOCKED_INSIGHT_BULLETS` + upgrade CTAs. Paid: what works / failed / fix steps from item statuses.
14. **Element-by-element audit** — `SectionHeader` + `Card`; `audit_items` via `partitionLegalComplianceAuditLast`. Free: **first six** rows, rationale **line-clamp-2** labeled “Context”, locked bullet list. Paid: full rationale, working / not working grids, fix, expected impact.
15. **Supplementary audit coverage** (conditional `roastSupplementHasContent`) — `SectionHeader` + `Card` with optional **Scroll effectiveness** block (`situation`, `action`, `evidenceBullets`) and/or **Traffic estimate note** from `trafficEstimate` — material that does not need to duplicate the Scroll card but is kept for pipeline transparency.

## 2. Visual hierarchy & layout principles

- **Section headers** — `SectionHeader` with `size="compact"` marks major bands (insights, executive layers, performance, category, element, supplement).
- **Hero band** — Single surface (`bg-surface-1`) groups score, verdict, hook, quick fixes, and radar so the “answer” reads before long-scroll diagnostics.
- **Cards** — `CardTitle` at `text-base` for module titles; economics and scores use `font-mono` + tabular nums.
- **Scroll zones** — `ScrollOfDeathCard` uses Problem-style band naming (**Top — Money zone**, **Middle — Engagement drop**, **Bottom — Graveyard**) with zone-tinted treatment and compact issue/fix typography.
- **Heatmap** — Viewport snapshot **object-contain** with max height; overlay stacking isolated so card clipping does not break the blend.

## 3. Data derivation

| UI block | Primary sources |
|----------|-----------------|
| Overall score | `meanRadarSiteScore(radar_scores)` when present, else stored overview / `overall_score`. |
| Verdict label | `verdictLabelFromSiteScore` from score + radar object. |
| Brief summary (hero) | Same chain as Executive summary “Summary”. |
| Quick wins | `quickWins` / `quick_wins`, filled to four via `ensureQuickWinsUpToFour` + `audit_items`. |
| Radar tiles + chart | `radar_scores` / `radarMetrics` (UX, Conversion, Copy, Visuals, Trust, Speed). |
| Industry insider lines | `industry_guess` → `getIndustryInsiderPoints`. |
| Revenue + insight layers | API payload or `buildRevenueLeakEstimate` + `fallbackInsightLayers`; editable traffic/price local state seeds from `trafficEstimate` / `price_guess`. |
| SEO block | `seo`, `page_type`, `performance`. |
| Page speed narrative | `performance` + optional `performanceGemini`. |
| Cost of Inaction | Local `traffic`, `price`, fixed `lift` 0.02, annualized. |
| Competitor gap | `traffic` × industry multiplier (SaaS / Agency / E-commerce). |
| Below-fold % | `pageHeight` vs `foldHeight` 800. |
| Scroll narrative & zones | `scrollEffectiveness` or `buildScrollEffectiveness`; zone copy from audit-derived bullets where implemented in `ScrollOfDeathCard`. |
| Hero / heatmap | `heroScreenshot`; merge from sessionStorage; optional `POST /api/roast/hero`. |
| Executive summary body | `hook`, `script`, `verdict`, `closer` (+ legacy/overview fields). |
| Category tabs | `detailedAudit` buckets; per-category avg score from status tier points (same mapping as API compile). |
| Element audit | `audit_items[]` (legal rows last). |
| Supplement | `scrollEffectiveness` text bullets + `trafficEstimate.note`. |

## 4. Element-by-element vs category deep dive

- **Category deep dive** appears **before** the element list. It is a **rollup** by theme (six tabs): averaged scores, concatenated highlights, synthesized fix steps from failing items — good for “what this axis means.”
- **Element-by-element** is a **flat list** (six visible when locked, full when unlocked) with per-element status, rationale, and optional structured working / not-working / fix — good for “what exactly failed.”

Together: themes first (category tabs), then line-item evidence (element audit), then optional supplement notes.

## 5. Access model (report depth)

- **`hasFullReportAccess`** — Pro/Agency plan, admin, or billing bypass + session unlock.
- Unlocked: insight subscores, full SEO rows, category internals, all audit items with full rationale and fixes.
- Locked: teaser copy, `LOCKED_INSIGHT_BULLETS`, upgrade panels linking to `#full-report-upgrade`.

---

*Last updated: 2026-04-08 — aligned with `src/app/roast/[id]/page.tsx` (hero band, SEO placement, category-before-element order, executive summary after scroll/heatmap, supplementary section).*
