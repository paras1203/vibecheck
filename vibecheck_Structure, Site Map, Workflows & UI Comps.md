## 2025-03-25 - # Project Structure, Site Map, Workflows & UI Comps

## 1. Directory Structure (Source)
`src/app/` pages and API routes; `src/components/ui/` primitives (Alert, SectionHeader, ChartPanel, MetricCard, LockedSection, etc.); `src/components/roast/` presentational pieces (e.g. PaywallOverlay); `src/lib/report-theme.ts` shared palette for HTML/PDF; `src/hooks/use-chart-theme.ts` for Recharts.

## 2. Site Map (Pages & Linkage)
Landing `/` → roast progress → `/roast/[id]`; `/dashboard`, `/history`, `/settings`, `/billing`, `/login`; API under `/api/*`.

## 3. Workflows (Chronology)
### Main page → Linked page → Workflow steps
URL entry on `/` → optional auth → POST `/api/roast` → local storage + redirect to `/roast/[id]`.

### Desktop
Full sidebar + inset content.

### Mobile
Same routes; sidebar as sheet.

## 4. Free vs Pro Plan Features
Unchanged by UI pass (unlock/gating logic preserved).

## 5. Dead / Inactive / Empty Pages & Buttons
`/api/roast/[id]/pdf` still returns 501 placeholder (pre-existing).

## 6. Coming Soon
PDF route implementation (if product requires).

## 7. Page/Screen-Wise Component List
- **Landing**: Navbar (theme toggle), HeroHighlight, Bento/Solutions, Cards, Alerts for errors.
- **Roast**: AppSidebar, SectionHeader/ChartPanel/MetricCard patterns, RoastRadar (token-driven colors), PaywallOverlay, tabs/tooltips.
- **Billing**: Cards, Razorpay script load, sandbox simulate.

---

## 2025-03-25 (PM) - Structure & sitemap delta

### 2. Site map (delta)
- `/home` → redirects to `/dashboard`.
- `/history`: list + HTML/PDF download (uses current plan tier).
- New APIs: `/api/paypal/create-order`, `/api/paypal/capture`.

### 3. Workflows (delta)
- `audited_url` stored with roast payload from landing URL when available.
- Shared `report-html.ts`, `report-charts-svg.ts`, expanded `pdf-templates.ts` for free vs paid exports.

### 4. Free vs Pro (delta)
- Free HTML/PDF: score, executive summary, quick wins + impact, lost revenue, one industry line.
- Paid: radar/scroll/heatmap SVG in PDF, priority matrix, element audit before deep dive in layout.

### 7. Components (delta)
- `AuthRequiredDialog`: Google + email/password; `PayPalCheckout`; `paypal-server.ts`.

**Confirmed:** This structure log was appended.

---

## 2026-03-25 - # Project Structure, Site Map, Workflows & UI Comps (premium UI pass)

### 1. Directory (delta)
- `src/components/landing/`: `hero-section`, `problem-section`, `report-preview-section`, `how-it-works-section`, `features-bento-section`, `comparison-section`, `pricing-section`, `landing-footer`, `landing-scroll.ts`.
- `src/components/settings/appearance-settings.tsx` (Light/Dark/System).
- `src/components/navbar-theme-toggle.tsx` (hydration-safe theme flip).

### 2. Site map (delta)
- Landing anchors: `#problem`, `#preview`, `#how-it-works`, `#features`, `#comparison`, `#pricing`. Navbar links updated to match.

### 3. Workflows
- Unchanged (roast API, auth pause, redirects, billing).

### 7. Components (delta)
- Tokens: `globals.css` adds `--chart-grid`, `--chart-tooltip-*`; `ChartPanel` `variant="embedded"`; `RoastRadar` wrapped in ChartPanel; `useChartTheme` extended for grid/tooltip colors.
- Roast report: score hero band, `SectionHeader` group labels, quick-win lock without blur (opacity + footer CTA); `PaywallOverlay` panel style.

**Confirmed:** This structure log was appended.

---

## 2026-03-25 (PM) - Payments, report naming, settings, landing preview

### 2. Site map (delta)
- Landing `#pricing` Pro/Agency CTAs → `/billing?plan=pro|agency` (signed-in) or `/login?next=…` (guest).
- `/billing` honors `?plan=` highlight + scroll; wrapped in `Suspense` for `useSearchParams`.

### 3. Workflows (delta)
- PayPal capture + Razorpay verify merge `plan` in Firestore; client `updateCreditsAndPlan` keeps UI in sync so paid sections unlock after purchase.
- History/roast exports use `siteSlug_mar26`-style basenames (`report-display-name.ts`).

### 7. Components (delta)
- `AccountSettings`: display name + password reset; login: forgot password + safe internal `next` redirect.
- `report-preview-section`: sample cost of inaction, two industry insights, six radar-axis scores.

**Confirmed:** This structure log was appended.

---

## 2026-03-26 - Legal pages (Privacy & Terms)

### 2. Site map (delta)
- Static marketing/legal routes: `/privacy`, `/terms` (linked from landing footer and Settings → Legal tab).
- Shared shell: `LegalDocShell`; copy split across `privacy-policy-content.tsx`, `privacy-policy-content-rest.tsx`, `terms-content.tsx`; contact constant `src/lib/legal-contact.ts`.

### 7. Components (delta)
- `src/components/legal/legal-doc-shell.tsx`

**Confirmed:** This structure log was appended.

---

## 2026-03-28 - Loader, teaser, sidebar, audit ordering

### 2. Site map (delta)
- Sidebar nav: no `Home` item; Dashboard, History, Billing, Settings unchanged.

### 3. Workflows (delta)
- Landing roast: analysis overlay shows **chronological step list**; teaser overlay uses **sample-style** report card (`RoastTeaserPanel` + expanded `buildRoastTeaser`).

### 7. Components (delta)
- `src/lib/legal-compliance-audit.ts` — `partitionLegalComplianceAuditLast`, `isDeprioritizedLegalAuditElement`.
- `src/components/landing/roast-analysis-loader.tsx` — stacked progress messages.
- `src/components/landing/roast-teaser-panel.tsx` — sample-parity layout, cost-of-inaction emphasis.
- `src/lib/roast-teaser.ts` — radar, leak USD, insider lines, report stub, legal-skipped critical pick.

**Confirmed:** This structure log was appended.

---

## 2026-03-28 (PM) - Dashboard merge, settings, billing, legal

### 2. Site map (delta)
- `/history` → redirect to `/dashboard`.
- Dashboard: stats row, quick actions, **Recent reports** (full list + exports), **Analytics** (MetricCards, radial avg, distribution + domain bars).

### 3. Workflows (delta)
- Authenticated user manages saved roasts from dashboard only (no dedicated history screen).

### 5. Dead / placeholder (delta)
- `AppearanceSettings` tab removed from settings UI (theme via icon toggle on settings header); component file may remain unused.

### 7. Components (delta)
- `src/lib/workspace-name.ts`, `src/components/dashboard/workspace-title.tsx`, `recent-reports-section.tsx`, `dashboard-analytics-section.tsx`.
- `src/components/settings/theme-icon-toggle.tsx`, `password-settings.tsx`, `delete-account-dialog.tsx`.
- Billing cards: shared “extra credits” highlighter; Pro $149→$19 + 87% OFF (landing parity); Agency $49 for 5 roasts + Save 50% copy (landing parity).

### Legal (delta)
- Privacy/Terms: PayPal USD, credits, local device storage; last updated 28 March 2026.

**Confirmed:** This structure log was appended.

---

## 2026-03-28 (eve) - Home workspace, loader depth, roast overlay, SiteRoast, login copy

### 2. Site map (delta)
- `/home` (auth): **Home** sidebar item above Dashboard — roast URL + **Roast my site** (button right on `sm+`), **Recent reports** (top 3) + link to dashboard; same roast modal flow as landing.
- Product name **SiteRoast** restored in `BRAND_NAME`, layout metadata, legal pages, share copy, AI persona.

### 7. Components (delta)
- `roast-analysis-loader.tsx`: **20** chronological steps (first five unchanged copy, +15 depth steps); step interval ~850ms; taller scroll list.
- `roast-generation-overlay.tsx`: shared modal for `/` and `/home` — **z-[100]** (above section scroll arrows at z-50), **page + card scroll** (`overflow-y-auto`, `max-h`, `overscroll-contain`) so free **teaser** and step list scroll correctly.
- `roast-teaser-panel.tsx`: `min-w-0` for flex overflow.

### Login (delta)
- Headline **Welcome** (signup) / **Welcome back** (sign-in); removed dashboard/billing subtitle; single **SiteRoast** line.

**Confirmed:** This structure log was appended.

---

## 2026-03-28 - Brand Sample Sample, auth, UI polish

### 2. Site map (delta)
- Product name **Sample Sample** in metadata, nav, sidebar, exports (HTML/PDF), legal titles/body, share copy, AI persona string.
- `/login`: Google, email/password, forgot password, **email sign-in link**.

### 5. Dead / placeholder (delta)
- Landing footer: **Reset My Data** removed (was localhost/admin only).

### 7. Components (delta)
- `src/lib/brand.ts` (`BRAND_NAME`), `src/hooks/use-reset-user-data.ts`.
- `ProblemSection`: styled **Money zone / engagement drop / graveyard** cards (icons, gradients).
- `AuthRequiredDialog`: optional magic link when `onSendEmailLink` provided (roast export flow).
- Admin header: **Reset my data** top-right.

**Confirmed:** This structure log was appended.

---

## 2026-03-29 - Structure & workflow delta

### 1. Directory / lib (delta)
- `src/lib/personalized-insider.ts` — audit-grounded Industry insider bullets.
- `src/lib/credits-config.ts` — `NEXT_PUBLIC_DEFAULT_NEW_USER_CREDITS`, promo bonus flags, preview credit toggle.

### 2. Landing copy
- Removed hero kicker “AI landing page audits” and default roast microcopy; metadata title no longer “AI landing page audits”.

### 3. Workflows
- `/` and `/home`: continue to full report → `roastDataForLocalStorage` + `router.push(/roast/:id)`; teaser refresh pulls Firestore profile for credits line.

**Confirmed:** This structure log was appended.

---

## 2026-03-31 - Razorpay replaces PayPal

### 2. Site map (delta)
- Removed `/billing/paypal-return`; removed `/api/paypal/create-order`, `/api/paypal/capture`.
- Added `/api/razorpay/create-order`, `/api/razorpay/verify`.
- Landing/billing checkout query: `checkout=razorpay` (was `paypal`).

### 3. Workflows (delta)
- Purchase: server creates Razorpay order (USD, amounts in cents via `PLAN_AMOUNT_PAISE`) → Checkout.js modal → verify signature + payment fetch (amount/currency) → Firestore credits/plan + `payments` doc (`provider: razorpay`).

### 7. Components (delta)
- `razorpay-open-checkout.ts` (client); `razorpay-server.ts`; `billing-plans.ts` uses `PLAN_AMOUNT_PAISE` / `PLAN_CURRENCY`.
- `.cursor/mcp.json`: Razorpay Remote MCP template (`https://mcp.razorpay.com/mcp` per [Remote MCP docs](https://razorpay.com/docs/mcp-server/remote/)); set `AUTH_HEADER` to `Basic` + base64(`KEY_ID:KEY_SECRET`).

**Confirmed:** This structure log was appended.

---

## 2026-03-31 - Audit pipeline, billing verification, heatmap embed

### 1. Directory / libs (delta)
- `src/lib/legal-html-signals.ts` — deterministic privacy/terms/cookie href detection merged into Legal Compliance item.
- `src/lib/report-heatmap-embed.ts` — shared jet-style heatmap HTML for report + PDF.
- `docs/AUDIT_PROCESS.md` — end-to-end audit documentation.

### 2. API (delta)
- `POST /api/roast` — `compileRoast` takes audited URL; `_meta.auditTokenUsageTotal` + `auditTokenBreakdown` (workers + narrative + insight).
- `POST /api/razorpay/verify` — verifies via `payments.fetch`; idempotent on `paymentId`.

### 4. Free vs Pro (delta)
- Default signup credits **20** via `NEXT_PUBLIC_DEFAULT_NEW_USER_CREDITS` (one roast when charge = loader step count); authenticated `POST /api/roast` sends `idToken` and debits `ROAST_CREDITS_PER_GENERATION` (default = `ROAST_LOADER_STEP_COUNT`, override e.g. `1`). Pack credits via `PLAN_PRO_AUDIT_CREDITS` / `PLAN_AGENCY_AUDIT_CREDITS`. Full report still plan-gated (Pro/Agency) unless admin/bypass.

### 7. Components (delta)
- `AttentionHeatmapPanel` — jet-style overlay + legend (hot/warm/cool).

**Confirmed:** This structure log was appended.

---

## 2026-04-02 - PageSpeed, Gemini performance, traffic estimate, report layout, scroll narrative, heatmap

### 1. Directory / libs (delta)
- `src/lib/pagespeed.ts` — PERFORMANCE category, TBT, optional `PAGESPEED_STRATEGY`.
- `src/lib/pagespeed-gemini-summary.ts` — short summary + two quick fixes from Gemini.
- `src/lib/traffic-estimate.ts` — bounded monthly sessions (Gemini + industry fallback).
- `src/lib/scroll-effectiveness-from-audit.ts` — `scrollEffectiveness` from audit text + fold metrics.
- `src/types/roast-extras.ts` — shared extras types.
- `src/lib/radar-axis-scores.ts` — axis labels + score helper for report grid.

### 2. API (delta)
- `POST /api/roast` — attaches `trafficEstimate`, `revenueLeakEstimate` (traffic assumption line), `performanceGemini`, `scrollEffectiveness` when data available.

### 7. Components / pages (delta)
- `/roast/[id]` — site score radar + six-axis grid under verdict; Insights & actions (insider + quick fixes) below radar; Revenue Impact Calculator removed from UI; Performance row two cards; `ScrollOfDeathCard` uses server `scrollEffectiveness`; `RoastPageSpeedBlock` shows TBT + Gemini copy.
- `AttentionHeatmapPanel` — wrapper aspect from image load; overlay aligned to image box; smaller radial zones.

**Confirmed:** This structure log was appended.

---

## 2026-04-02 - Report verdict + revenue UI, auth close controls

### 7. Components / pages (delta)
- `/roast/[id]` — site score radar (six axes + chart) moved inside the verdict/score card at the bottom; overall score donut ~30% smaller (`RadialChart` 112px); revenue leak card wires `onTrafficChange` / `onPriceChange` and rebuilds `buildRevenueLeakEstimate` with dynamic traffic assumption text (no industry field in calculator UI).
- `RevenueLeakEstimateCard` — clearer model-inputs copy and spacing.
- `AuthRequiredDialog` — default dialog close (X) visible again.
- `/login` — top-right close (X) linking home on the auth card.

**Confirmed:** This structure log was appended.

---

## 2026-04-02 - Site Score card, executive summary merge, scroll + heatmap UX

### 7. Components / pages (delta)
- `/roast/[id]` — one `Card` for site score: header + 60/40 row (axis grid + `RoastRadar`); executive summary combines analysis / verdict / next steps without a separate hook/stopper block.
- `ScrollOfDeathCard` — zone title rendered as `Title | Subtitle` on one line.
- `ScrollIssueFixLine` (`scroll-of-death-zones.tsx`) — `text-sm`, relaxed leading, word wrap for long issue/fix text.
- `AttentionHeatmapPanel` — `TOP_SECTION_FRACTION` 0.25; copy states illustrative top-quarter “gaze-style” overlay (not measured eye-tracking).

**Confirmed:** This structure log was appended.

---

## 2026-04-02 - Site Score radar column + scroll zone overflow

### 7. Components / pages (delta)
- `/roast/[id]` — Site Score row: axis grid `flex-1`, radar column fixed `268px` on `lg`; `ChartPanel` embedded content uses tighter padding.
- `RoastRadar` — chart margins 10px, `outerRadius` 78% in the narrower frame.
- `ScrollOfDeathCard` — zone stack `overflow-y-visible`, bands `flex-none`; issue list `space-y-3` and `min-w-0` on `ul`/`li`.

**Confirmed:** This structure log was appended.

---

## 2026-04-02 - Attention heatmap full-frame overlay

### 7. Components / pages (delta)
- `AttentionHeatmapPanel` — full-screenshot `GazeHeatOverlay` (`absolute inset-0`): stacked `screen` + `normal` radial blobs so hotspots stay visible on dark heroes; copy updated (illustrative, not eye-tracking).

**Confirmed:** This structure log was appended.

---

## 2026-04-02 - Razorpay USD $19 / $59 + roast insights section order

### 2. Billing (delta)
- `PLAN_CURRENCY` USD; `PLAN_AMOUNT_PAISE` = 1900 / 5900 (cents). Landing + `/billing` show USD with bundle anchor $95 strikethrough on 5-pack.

### 7. `/roast/[id]` (delta)
- After “Insights & actions”: **AI Insights** → **Executive insight layers** (revenue leak + three cards) → **SEO health** (when shown).

**Confirmed:** This structure log was appended.

---

## 2026-04-02 - Razorpay INR default + verify error message

### 2. Billing (delta)
- `billing-plans.ts`: **`PLAN_CURRENCY`** resolves from `RAZORPAY_CURRENCY` (default **INR**); USD uses 1900/5900 cents; INR uses `PLAN_PRO_AMOUNT_PAISE` / `PLAN_AGENCY_AMOUNT_PAISE` (defaults 159900 / 409900). `.env.example` documents vars.
- `razorpay-open-checkout.ts`: failed verify responses fall back to `HTTP <status>` when JSON has no `error`/`details`.
- `/billing` subtitle: USD prices are reference; checkout often shows INR for India merchants.

**Confirmed:** This structure log was appended.

---

## 2026-04-02 - Authenticated roast debit + SEO paywalled issues

### 2. API / auth (delta)
- `POST /api/roast` accepts optional `idToken`; verifies Firebase Admin token, debits credits in a transaction before capture (refund on pipeline failure). Response may include `creditsRemaining` (stripped before localStorage).

### 7. Components (delta)
- `RoastSeoHealthBlock` — `META_DESCRIPTION_LENGTH` & `IMAGE_ALT_COVERAGE_LOW` rows show dashed skeletons when `hasFullReportAccess` is false.

**Confirmed:** This structure log was appended.

---

## 2026-04-05 - Credits default, Chromium bundle, Razorpay config API

### 1. Directory Structure (delta)
- `src/lib/chromium-executable.ts` — server-only Chromium path for Puppeteer on Vercel.
- `src/app/api/razorpay/config/route.ts` — `GET` returns Razorpay test vs live hint (no secrets).

### 2. Site Map (delta)
- New API: `/api/razorpay/config` (used by `/billing` for sandbox banner).

### 3. Workflows (delta)
- Default roast debit: **1** credit per authenticated `POST /api/roast` (env override unchanged). Firestore refund on roast pipeline failure unchanged.

### 7. Pages (delta)
- `/billing` — optional “Razorpay sandbox” callout when server keys are `rzp_test_*`; post-payment `refreshProfile`.
- `/login` — single redirect after `!isSyncing`.
- Landing `/`, `/home` — `idToken` from `firebaseUser`.

**Confirmed:** This structure log was appended.
