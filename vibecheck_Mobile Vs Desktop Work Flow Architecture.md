## 2025-03-25 - # Mobile vs Desktop: Workflow Architecture

## 1. Current State
### 1.1 Route Structure
Shared Next.js App Router; `/roast/[id]` and dashboard shell use the same routes for mobile and desktop (responsive layout, sidebar sheet on small viewports).

### 1.2 Layout & Shell
`SidebarProvider` + `AppSidebar` + `SidebarInset`; dashboard rhythm uses `ml-[14.4rem]` + `p-6` / `gap-6` / `bg-background`. Theme is class-based (`next-themes`) with semantic tokens in `globals.css`.

### 1.3 What Is Shared
Roast flow, auth, billing, PDF/HTML export pipelines, API routes, design tokens, shadcn-style primitives.

### 1.4 What Is Duplicated / Divergent
None introduced by this pass; marketing landing vs in-app shell remain the main visual split (not separate route trees).

## 2. Workflow Differences (Current)
### 2.1 Roast / audit
Same page; layout adapts via grid and sheet; device choice only affects capture API payload.

### 2.2 Navigation
Sidebar collapses to mobile sheet behavior from shared `sidebar` UI component (unchanged behavior).

## 3. Target Architecture: Single Workflow, Two Layouts
### 3.1 Principles
One data path; token-driven styling; light/dark from theme class.

### 3.2 Suggested Structure
Keep single routes; use responsive utilities and sidebar primitives.

### 3.3 Layout Detection
Viewport / sidebar component breakpoints (existing).

### 3.4 Shared Workflow Modules
Auth context, roast API, `report-theme` for exports.

## 4. Implementation Checklist
- [x] ThemeProvider + semantic tokens
- [x] Shell spacing and sidebar token pass

## 5. Route Mapping (Unified)
`/`, `/login`, `/dashboard`, `/history`, `/settings`, `/billing`, `/roast/[id]` — shared across form factors.

## 6. Summary
Design-system work unified presentation tokens and theming without splitting mobile/desktop workflows.

---

## 2025-03-25 (PM) - Auth + exports + billing

### 1. Current state (delta)
- Sandbox no longer calls Firebase `signOut` on toggle; session persists until explicit logout.
- Same routes for mobile/desktop; `/home` redirects to `/dashboard`.

### 2. Workflow (delta)
- Landing roast overlay uses a centered card (“Roasting your site”) with rotating status lines.
- History and dashboard read the same local roast index keyed by `user.uid` when logged in.

### 3. Summary
Single workflow preserved; auth and export behavior aligned across viewports.

**Confirmed:** This architecture log was appended.

---

## 2026-03-25 - # Mobile vs Desktop: Workflow Architecture (UI pass)

### 1.4 Delta
- In-app pages: consistent `md:p-10 md:pt-10` + `gap-8` on `SidebarInset` content (dashboard, history, billing, settings, roast).
- Landing remains full-width marketing shell (no sidebar); navbar anchor targets updated only.

### 2.2 Delta
- Sidebar menu active/hover styling refined (`sidebar.tsx`); no route or workflow change.

**Confirmed:** This architecture log was appended.

---

## 2026-03-25 (PM) - Checkout from landing + auth redirect

### 2.1 Delta
- Pricing CTAs route through login with `next=/billing?plan=…` when logged out; same billing URL when logged in (mobile and desktop).

**Confirmed:** This architecture log was appended.

---

## 2026-03-26 - Legal routes

### 5. Route mapping (delta)
- Add `/privacy`, `/terms` — same responsive shell as other static pages; no mobile/desktop workflow split.

**Confirmed:** This architecture log was appended.

---

## 2026-03-28 - Loader chronology, sidebar nav, legal-last reporting

### 1.1 Route structure (delta)
Unchanged routes; landing roast modal widens on teaser step (`max-w-3xl`).

### 2.1 Roast / audit (delta)
- **Loader:** `RoastAnalysisLoader` lists completed analysis steps plus the active step (scrollable), not a single rotating line.
- **Teaser:** Post-audit preview mirrors landing sample report layout (chrome row, executive pulse + score, cost of inaction, insider bullets, radar grid + chart).

### 2.2 Navigation (delta)
- **App sidebar:** `Home` entry removed; Dashboard remains first item (both mobile sheet and desktop).

### 2.3 Report ordering (delta)
- API and client reorder **legal/compliance-style** audit rows last (`partitionLegalComplianceAuditLast`); `summary_bullets` and `detailedAudit` category item lists follow that order; roast page sorts deep-dive tabs by fixed category order with Speed last; teaser critical issue skips legal-first picks.

**Confirmed:** This architecture log was appended.

---

## 2026-03-28 (PM) - Dashboard-only reports, history redirect

### 1.1 Route structure (delta)
- `/history` server-redirects to `/dashboard` (bookmarks still work).
- Dashboard is a single scroll view (no Overview/Reports/Analytics tabs).

### 2.2 Navigation (delta)
- Sidebar: Dashboard, Billing, Settings; History removed. Admin shortcuts to old dashboard tabs removed; Admin overview remains.

### 2.3 Reports workflow (delta)
- **Recent reports** (formerly “Saved on this device”) lives on the dashboard under Quick actions with HTML/PDF/Open actions.

**Confirmed:** This architecture log was appended.

---

## 2026-03-28 - Home route & roast overlay

### 1.1 Route structure (delta)
- `/home` (authenticated): quick roast + three recent report links; mirrors landing roast API + teaser modal (shared `RoastGenerationOverlay`).

### 2.2 Navigation (delta)
- Sidebar order: **Home** → Dashboard → Billing → Settings (then Admin if applicable).

### 2.1 Landing roast UI (delta)
- Analysis/teaser modal **z-index** above in-page scroll chevrons; outer/inner **scroll** so long teaser and 20-step list are usable on short viewports.

**Confirmed:** This architecture log was appended.

---

## 2026-03-31 - Billing: Razorpay only

### 1.1 Route Structure (delta)
- Dropped `/billing/paypal-return`. Billing checkout is in-page Razorpay modal (same `/billing` on mobile/desktop).

### 2.1 Billing (delta)
- **PayPal redirect/SDK removed.** Flow: `POST /api/razorpay/create-order` → Razorpay Checkout → `POST /api/razorpay/verify` (signature + **`payments.fetch`** for amount/status; idempotent if `paymentId` already stored).

**Confirmed:** This architecture log was appended.

---

## 2026-03-28 - Auth, PayPal mode, admin reset, branding

### 1.3 What Is Shared (delta)
- **Auth:** Google popup with **redirect** fallback when popup blocked; **email link** sign-in; `getRedirectResult` on load; optimistic Auth user while Firestore sync runs; Firestore failure still leaves a signed-in session with defaults.
- **PayPal:** `PAYPAL_MODE` values `live`, `production`, or `prod` select the live PayPal API host.

### 2.1 Landing (delta)
- Full-width nav row with centered section links; larger brand wordmark; no full-screen guest auth overlay on `/`.
- **Reset my data** only on `/dashboard/admin` (top right), not landing footer.

### 2.2 Login (delta)
- Email magic link + completion on `/login` with optional `next`.

**Confirmed:** This architecture log was appended.

---

## 2026-03-29 - Landing, loader, heatmap, auth, dashboard history, credits env

### 1.3 What Is Shared (delta)
- **Session:** Firebase Auth `setPersistence(browserLocalPersistence)` in `lib/firebase.ts`; `authResolved` gates protected routes so redirects do not run before the first auth tick.
- **History:** `listRoastHistory(uid)` merges legacy anonymous key with per-user key; `mergeLegacyRoastHistoryIntoUser` runs after Firestore sync so dashboard “Recent reports” includes roasts done before login.

### 2.1 Landing / Home workspace (delta)
- Conversion overlay: wider analyzing card, step list shows all steps (pending dimmed), active step scrolls to center; continue to full report uses trimmed `localStorage` payload + `router.push`.
- Preview title uses hostname + “audit preview”; optional credits line when signed in.

### 2.2 Roast report (delta)
- Attention heatmap image: `object-contain`, max width ~920px, capped height — first-viewport overlays, not full-page stretch.

**Confirmed:** This architecture log was appended.
