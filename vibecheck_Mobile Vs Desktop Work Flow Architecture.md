## [2026-05-14] - # Settings onboarding gate + profile displayName API

## 2. Workflow Differences (Current)
**`/settings`**: mirrors dashboard/home — if **`firestoreSynced`** and **`onboardingCompleted`** is false, redirect **`/onboarding`**. **Manage account** name save → **`PATCH /api/user/profile`** (Firestore `users/{uid}.displayName` + Admin Auth update).

## 6. Summary
Same routes on mobile and desktop; onboarding cannot be skipped via deep link to Settings.

---

## [2026-05-14] - # Login shell + onboarding 2-step to landing

## 1. Current State
### 1.2 Layout & Shell (public marketing)
**`/login`** uses the same top-level shell as **`/`** (`ThemedDefaultLanding`): **`min-h-screen` `w-full` `min-w-0` `bg-background` `text-foreground`**, **`Navbar`** (`landingVisualId="a1"`, **`navMode="concept"`**, **`tone="default"`**, no variation switcher), content in **`main`** — no **`HeroHighlight`**.

## 2. Workflow Differences (Current)
### 2.1 Onboarding
**`/onboarding`**: **Your details** → **Your goal** → **Submit** saves profile (**`completeProductOnboarding`**) then navigates to **`/`** (logged-in landing). **Page URL** step removed; no authenticated roast overlay / first-audit kickoff from the wizard (users run audits from the landing hero).

## 6. Summary
Public auth and onboarding pages share landing chrome; post-onboarding home is **`/`** instead of **`/dashboard`**.

---

## [2026-05-14] - # Production host: runway.app (Dodo live_mode)

## 1. Current State
### 1.4 What Is Duplicated / Divergent
**Deployment:** Production targets **runway.app** (Google Cloud Run cancelled). Dodo **`create-session`** error copy references generic production env + runway.app. **`.env.example`:** **`DODO_PAYMENTS_ENVIRONMENT=live_mode`** with live API key for prod; **`NEXT_PUBLIC_APP_URL`** should be the public runway URL for Dodo **`return_url`**.

## 6. Summary
Same mobile/desktop app routes; set env vars on runway service; **`GET /api/health/billing`** for smoke check.

---

## [2026-05-14] - # Onboarding funnel, guest checkout, cloud roasts

## 2. Workflow
**`/login`** redirect uses **`resolvePostLoginPath`**: unfinished onboarding routes to **`/onboarding`** unless **`next`** path is **`/checkout`** only. **`onboardingCompleted`** missing in Firestore now means incomplete; legacy users: admin **`POST /api/admin/grandfather-onboarding-missing`**.
**`/checkout`** starts **anonymous Firebase** session if signed out → guest email **`POST /api/user/guest-checkout-contact`** → Dodo **`create-session`** uses **`guestCheckoutEmail`** when Auth email absent.
Pro/Agency/admin: **`/api/user/roast-cloud-sync`** + **`/api/user/roast-cloud-list`** / **`roast-cloud-payload`**.

## 6. Summary
Buy-before-sign-in works via anonymous UID; paid report mirror to **`roasts`** collection.

---

## [2026-05-13] - # Authenticated main full-bleed + sidebar rail

### 1.2 Layout & Shell
**`AuthenticatedShell`** fills **`SidebarInset`** horizontally (**no default `mx-auto` / `88rem` cap**); narrow centered column only when **`constrainContentWidth`** (**`checkout`**). **`--sidebar-width`** **`18rem`**. **`Sidebar`** peer (**`sidebar.tsx`**) no longer uses **`md:min-w-0`**. **`SidebarHeader`**: **`shrink-0 overflow-visible`**.

## 6. Summary
Saas workspace width; spacer + rail unchanged; checkout keeps narrow layout.

---

## [2026-05-13] - # Mobile vs Desktop: Layout shell normalization

## 1. Current State
### 1.2 Layout & Shell
**`AuthenticatedShell`** uses **`min-h-0 flex-1`** with scroll on **`SidebarInset`**; shared **`CONTENT_PAD`**. **`--sidebar-width`** from **`src/lib/shell-layout.ts`** (**`18rem`**); main column is **full width** in the inset unless **`constrainContentWidth`**. **`/dashboard/admin`**, **`/dashboard/admin/analytics`**, **`/roast/[id]`** use **`AuthenticatedShell`**.

### 2.x Report vs admin
**`/roast/[id]`** stays titleless; **`AuthRequiredDialog`** inside report column **`AuthenticatedShell`**.

## 6. Summary
Unified shell primitive; **`SidebarHeader`** resists scroll clipping (**`shrink-0`**).



## [2026-05-13] - # Mobile vs Desktop: Dodo billing auth hardening

## 2. Workflow
**Billing**: Firebase ID token on **`/api/dodo/create-session`** and **`/api/dodo/verify`**; misconfigured **Firebase Admin** returns **503** + `details` (not misleading **401**). Deploy **`GET /api/health/billing`**, local **`npm run verify:billing`**.

## 6. Summary
Same checkout UX; clearer errors for project/env mismatch.

---

## [2026-05-13] - # Mobile vs Desktop: GDPR/CCPA account deletion (settings)

## 2. Workflow
### 2.3 Delete account
**`/settings`** → **Delete account** dialog: typed confirmation + API **`POST /api/user/delete-account`** (Firebase bearer) → server erases Firestore personal data + anonymizes **`payments`** → **Admin `deleteUser`** → client clears **`localStorage`/`sessionStorage`** roast caches → **`logout`** → **`/`**. Same flow on mobile and desktop inside **`AuthenticatedShell`**.

## 6. Summary
Self-serve erasure replaces email-only copy; device-side report cache cleared on success.

---

## [2026-05-13] - # Mobile vs Desktop: Workspace shell + server profiles

## 1.2 Layout & Shell
**`AuthenticatedShell`** optional **`title`** adds **`SidebarTrigger`** + sticky **`border-b`** header; main scrolls below. **`home`**, **`dashboard`**, **`settings`**, **`billing`** use titled shell; **`checkout`** stays titleless (constrain width only).

## 2. Workflow
**`POST /api/roast`**: **`ensureUserProfileForUid`** (Admin) before credit debit. **`POST /api/user/complete-onboarding`**: Admin merge for onboarding fields.

## 6. Summary
Wizard onboarding; Firestore user doc guaranteed server-side; billing checkout waits **`authResolved`**.

---

## [2026-05-13] - # Mobile vs Desktop: Workflow Architecture

## 1. Current State
### 1.2 Layout & Shell
`SidebarProvider` wrapper uses explicit **`flex-row flex-nowrap items-stretch`**, **`max-w-full overflow-x-clip`** so sidebar spacer + **`SidebarInset`** stay within the viewport without horizontal bleed. **`SidebarInset`** defaults to **`min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto`**. Desktop **`Sidebar`** root adds **`shrink-0 md:min-w-0`**. Root **`body`** adds **`min-w-0 overflow-x-clip`**. **`AuthenticatedShell`** uses **`--sidebar-width: 16rem`** (app routes aligned to **16rem**). Marketing landing (**`ThemedDefaultLanding`**): outer shell **drops `overflow-x-hidden`** so **`Navbar`** **`sticky`** works; **`main`** carries **`overflow-x-clip`**. **`Navbar`**: wider inner **`max-w-[min(100%,96rem)]`**, **`md:px-8`**, concept mode links on one row (**`whitespace-nowrap`**) with horizontal scroll if needed.

### 1.3 Onboarding
**`/onboarding`**: **`ProductOnboardingScreen`** — two steps (details + role grid, then goal); **`Navbar`** matches marketing landing; submit calls **`completeProductOnboarding`** then **`/`**; no URL step or **`RoastGenerationOverlay`**.

## 6. Summary
Landing sticky nav, wider rails, onboarding form + resilient Firestore onboarding writes.

---

## [2026-05-12] - # Mobile vs Desktop: Workflow Architecture

## 1. Current State
### 1.2 Layout & Shell
Authenticated shells (`/billing`, `/checkout`, `/dashboard`, `/home`, `/settings`, `/roast/[id]`, `/dashboard/admin/*`) use `SidebarInset` with **`min-w-0 overflow-x-hidden`**; inner main columns use **`w-full min-w-0`** and padding only—**removed** **`md:ml-[14.4rem]`** and **`md:w-[calc(100%-14.4rem)]`** because the sidebar flex spacer already reserves width; duplicate margin caused horizontal overflow on desktop.

### 1.3 What Is Shared
`/home` and `/dashboard` both call **`useClaimPromoOnMount`** and render **`PendingHomeMessageBanner`** for Firestore **`pendingHomeMessage`**.

## 6. Summary
Desktop horizontal spill fixed; promo/bonus credit banners shared on home and dashboard.

---

## [2026-05-11 Apple/Dodo sweep] - # Mobile vs Desktop: Workflow Architecture

## 1.2 Layout & Shell
Marketing `Navbar` inner row uses **`max-w-[min(100%,88rem)] mx-auto`**, tighter horizontal padding/gaps, and **`min-w-0`** on the centered link rail—aligned with authenticated shells (`/billing`, `/roast/[id]`) to reduce perceived right-side whitespace and horizontal clutter on tablet widths.

## 6. Summary
Same routes; shell spacing refinement only.

---

## [2026-05-11 UX polish] - # Mobile vs Desktop: Workflow Architecture

## 2. Workflow Differences (Current)
### 2.2 Roast overlay (landing + home)
`RoastGenerationOverlay` analyzing phase: step/progress list remains inside the scroll-contained centered card. **Phase timing HUD** (`RoastStepTimingHud`) uses **`createPortal` → `document.body`** with **`z-[200]`** so it stays **viewport** top-right on both mobile and desktop (avoids `backdrop-blur` making `fixed` ancestors clip/re-anchor the HUD).

## 6. Summary
No route split; overlay interaction unchanged except HUD anchored to the viewport for readability.

---

## [2026-05-11 late] - # Mobile vs Desktop: Workflow Architecture

## 1. Current State
### 1.1 Route Structure
Landing `/`: one content tree (A1) for both themes.

### 1.2 Layout & Shell
Landing root retains `overflow-x-hidden`/`min-w-0`; navbar row uses wrapping links + shrink constraints on chrome actions.

### 1.4 What Is Duplicated / Divergent
None newly introduced vs prior split B1/light path (removed).

## 6. Summary
Light/dark parity on marketing home; horizontal spill guarded at shell + navbar.

---

## [2026-05-11 PM] - # Mobile vs Desktop: Workflow Architecture

## 1. Current State
### 1.1 Route Structure
Unchanged routes.

### 1.2 Layout & Shell
`SidebarProvider` outer flex wrapper includes `min-w-0`; `AppSidebar` root sidebar uses `shrink-0`; continues to mitigate horizontal scrollbar with `SidebarInset` `min-w-0 overflow-x-hidden` on app pages.

### 1.4 What Is Duplicated / Divergent
Roast `/roast/[id]` main column adds `min-w-0` on title strip and optional `overflow-x-hidden` on tab stack for narrow viewports.

## 2. Workflow Differences (Current)
### 2.2 Roast overlay (landing + home)
Full-viewport overlay uses `min-h-dvh` and scroll-contained inner card; step timing HUD is viewport-fixed (not sidebar-bound).

## 6. Summary
Cross-surface overflow and overlay polish only; no separate mobile-only routes.

---

## [2026-05-11] - # Mobile vs Desktop: Workflow Architecture

## 1. Current State
### 1.1 Route Structure
Unchanged routes; authenticated shell routes (`/billing`, `/checkout`, `/dashboard`, `/home`, `/settings`, `/roast/[id]` main column, admin routes) wrap main columns with responsive gutter: below `md` (768px) no left inset margin; `md`+ restores `md:ml-[14.4rem]` (and preserved `md:w-[calc(100%-14.4rem)]` where previously used).

### 1.2 Layout & Shell
Sidebar remains Sheet on `<768px` (`useIsMobile`), docked spacer + fixed rail at `md+`. Main-column `SidebarInset` children now use full width (`w-full`, `min-w-0`) until `md:` so Sheet overlay does not leave an empty lane.

### 1.3 What Is Shared
Same pages and JSX; gutter classes centralized only as Tailwind on each page shell `div`.

### 1.4 What Is Duplicated / Divergent
Per-page copies of shell class strings remain (could later extract a small `AuthenticatedShellMain` primitive).

## 2. Workflow Differences (Current)
### 2.1 Billing / checkout / dashboard shells
Mobile & tablet portrait (<768 logical px): edge-to-edge content in `SidebarInset`. Desktop & tablets ≥768px: prior offset + width constraint restored.

## 3. Target Architecture
Unchanged principles (single workflow, breakpoint-based layout).

## 4. Implementation Checklist
- [x] Responsive main-column margin/width across billing, checkout, roast, dashboard, settings, home, admin

## 5. Summary
Fixed mobile blank-left layout caused by `ml-[14.4rem]` while sidebar is overlay-only below `md`.

---

## [2026-04-07] - # Mobile vs Desktop: Workflow Architecture

## 1. Current State
### 1.1 Route Structure
Same App Router for mobile and desktop: `/roast/[id]` is the primary report surface.

### 1.2 Layout & Shell
`SidebarProvider` + `AppSidebar` + `SidebarInset`; mobile uses the sidebar as a sheet pattern (unchanged).

### 1.3 What Is Shared
Roast report content order and copy (category deep dive → element audit → supplementary block) are identical; responsive grids/tabs adapt column count only.

### 1.4 What Is Duplicated / Divergent
None for this change: export flows (PDF/HTML) and live roast page share section copy constants and supplement semantics.

## 2. Workflow Differences (Current)
### 2.1 Report reading
Desktop: wider tab grid for category deep dive. Mobile: fewer columns on `TabsList`; same section order.

## 3. Target Architecture: Single Workflow, Two Layouts
### 3.1 Principles
One narrative order; layout tokens only differ by breakpoint.

### 3.2 Suggested Structure
Already aligned for roast report body after unified refactor.

### 3.3 Layout Detection
Tailwind breakpoints on tabs/grid; no separate mobile route.

### 3.4 Shared Workflow Modules
`report-html.ts` (constants), `report-export-supplement.ts` (supplement HTML), roast page mirrors supplement UI.

## 4. Implementation Checklist
- [x] Category before element on `/roast/[id]`
- [x] Shared subtext exports
- [x] Supplementary block on roast when data exists

## 5. Route Mapping (Unified)
`/roast/[id]` — full report UI; exports via same payload shape.

## 6. Summary
Roast live UI workflow matches paid/free export section order and supplementary coverage for scroll/traffic notes; mobile/desktop differ only in responsive chrome.

---

## [2026-05-07] - # Mobile vs Desktop: Workflow Architecture

## 1. Current State
### 1.1 Route Structure
Unchanged App Router; `/api/roast` persists optional `device` on result (`desktop` | `mobile`). `/roast/[id]` is the canonical report surface.

### 1.2 Layout & Shell
`SidebarProvider` + sidebar sheet on narrow viewports.

### 1.3 What Is Shared
- ROI calculator `{ traffic, price, industry }` POST from `/roast/[id]` and Recent Reports PDF with stored `roastData`.
- Roast hydrate: **`GET /api/roast/:id` first**, merge cache (preserve local hero when server omits it); `persistRoastForClientNavigation` after hero ensure.

### 1.4 What Is Duplicated / Divergent
Exports remain audit HTML vs PDF-specific template where applicable; first-viewport snapshot uses horizontal scroll when capture is wider than the card.

## 2. Workflow Differences (Current)
Same narrative on mobile/desktop; breakpoints only adjust grid/tab density.

## 3. Target Architecture (unchanged)
Single workflow; follow-up PDF/HTML convergence where noted in prior logs.

## 4. Implementation Checklist
- [x] Thread `device` through roast payload for hero/API consistency
- [x] Calculator parity on `/api/generate-pdf`
- [x] Server-first roast fetch for full Pro payloads on reload

## 5. Route Mapping (Unified)
`/api/roast`, `/api/roast/[id]`, `/api/generate-pdf`, `/roast/[id]` — hydrate, calculator, exports.

## 6. Summary
Report UX parity: radar/tiles aligned with live app; hero snapshot framing scrolls horizontally instead of clipping narrow viewports.

**Confirmed:** This log was appended.

---

## [2026-05-07] - # Mobile vs Desktop: Workflow Architecture (landing concepts)

## 1. Current State
### 1.1 Route Structure
`/`, `/v/a1`, `/v/a2`, `/v/b1`, `/v/b2` are separate static marketing surfaces; all share the same client roast pipeline (`POST /api/roast` → overlay → `/roast/[id]`).

### 1.2 Layout & Shell
Concept landings use `Navbar` with `navMode="concept"`: desktop shows anchor links (`#preview`, `#features`, etc.); **mobile adds a `Sheet` menu** for the same anchors (full landing `/` keeps prior nav behavior without sheet).

### 1.4 What Is Duplicated / Divergent
Visual-only: four `v/*` pages differ in section chrome and tokens (`--lv-*` CSS variables in `globals.css`); logic is shared via `useLandingRoast`.

## 2. Workflow Differences (Current)
### 2.1 URL → report
No difference: identical API/auth/credits behavior across `/` and `/v/*`.

## 5. Route Mapping (Unified)
- `/` — default landing + optional “Landing visuals” switcher.
- `/v/a1` … `/v/b2` — alternate layouts; Navbar shows current concept in dropdown.

**Confirmed:** This log was appended.

---

## [2026-05-07] - # Mobile vs Desktop: Workflow Architecture (C1–C3 landings)

## 1. Current State
### 1.1 Route Structure
`/v/c1`, `/v/c2`, `/v/c3` added as static marketing surfaces alongside `/v/a1`–`/v/b2`; all seven share `useLandingRoast` → `POST /api/roast` → overlay → `/roast/[id]`.

### 1.2 Layout & Shell
Same as other concept landings: `Navbar` `navMode="concept"` with desktop anchors and **mobile `Sheet`** for section jumps. C2/C3 use `tone="c2"` / `tone="c3"` for nav chrome tokens.

### 1.4 What Is Duplicated / Divergent
Visual-only deltas (`--lv-c1-*`, `--lv-c2-*`, `--lv-c3-*`); roast data flow unchanged.

### 1.5 Deployment (shared mobile/desktop)
Optional **Google Cloud Run** via root `Dockerfile` (Next.js `standalone`); same routes and responsive behavior; configure service env vars for APIs that use Puppeteer/Chromium.

## 2. Workflow Differences (Current)
### 2.1 URL → report
Identical API, auth, and credits across `/` and all `/v/*`.

## 5. Route Mapping (Unified)
- `/v/c1` … `/v/c3` — new comparison candidates; **Landing visuals** dropdown lists C1–C3 under “New concepts” and A1–B2 under “Original four”.

**Confirmed:** This log was appended.

---

## [2026-05-08] - # Mobile vs Desktop: Workflow Architecture (Dodo inline checkout)

### 1.1 Route Structure
- `/checkout` uses the same `SidebarProvider` + `AppSidebar` + `SidebarInset` shell as `/billing` (mobile sheet sidebar unchanged).

### 1.3 What Is Shared
- Buy URLs are identical on mobile and desktop; optional `qty` query for Pro/Agency.

### 5. Route Mapping (Unified)
- `/checkout?plan=pro|agency|free_test[&qty=n]` → inline iframe; payment completion still lands on `/billing` via Dodo session `return_url`.

**Confirmed:** This log was appended.

---

## [2026-05-08] - # Mobile vs Desktop: Workflow Architecture (report Phases 3–6)

### 1.1 Route Structure
- `/roast/[id]` only; report sections added (how-to-read blurb, scan context, analytics readiness, experiment backlog, implementation checklist).

### 1.3 What Is Shared
- Same narrative order mobile/desktop; stacks use shared components.

### 1.4 What Is Duplicated / Divergent
- None; PDF/HTML include the same blocks as the live report.

**Confirmed:** This log was appended.

---

## [2026-05-12] - # Mobile vs Desktop: Workflow Architecture

### 3.4 Shared Workflow Modules
- Dodo: `POST /api/dodo/create-session` returns `sdkMode` (`test`|`live`) derived from `DODO_PAYMENTS_ENVIRONMENT` so the browser checkout SDK matches the server API environment (avoids test/live iframe mismatch). `/billing` payment verify retries briefly while Dodo reports `processing`.

### 6. Summary
Same routes on mobile and desktop; checkout reliability fix is shared.

**Confirmed:** This log was appended.

---

## [2026-05-12 onboarding gate] - # Mobile vs Desktop: Workflow Architecture

## 2. Workflow Differences (Current)
### 2.x First audit funnel
`/onboarding` uses one responsive layout on mobile and desktop (form only; no in-flow roast). Pending hero URL still uses `sessionStorage` on **`/`** for pre-fill when the user runs an audit from the landing hero (onboarding no longer collects URL).

## 5. Route Mapping (Unified)
`/onboarding` for profiles with `onboardingCompleted: false`; legacy documents without the field skip onboarding (grandfathered).

**Confirmed:** This log was appended.

---

## [2026-05-14] - # Mobile vs Desktop: Workflow Architecture

### 1.1 Route Structure
- New authenticated route `/free-report`: programmatic conversion scan (capture + SEO/PageSpeed/meta/trust tooling only). Does not call `POST /api/roast` or debit credits.

### 2. Workflow Differences (Current)
### 2.x Free scan (test funnel)
- `/home` adds **Free conversion scan** next to **Roast my site**; stores payload in `sessionStorage` and opens `/free-report`. Shared responsive shell (`AuthenticatedShell`).

### 2.y Global roast sessions (persist across navigation)
- **`RoastSessionProvider`** wraps app content (see `RoastSessionRoot` + `src/context/RoastSessionContext.tsx`) so **`POST /api/roast`** teaser flow and **`POST /api/free-report`** free scan keep the **same overlays** whether the URL is landing (`/`, `/v/*`) or workspace (`/home`); audits are not restarted on route change mid-flight.

**Confirmed:** This log was appended.

---

## [2026-05-14 roast-session] - # Mobile vs Desktop: Workflow Architecture

### 1.2 Layout & Shell
`RoastSessionRoot` (`src/components/providers/roast-session-root.tsx`) → `RoastSessionProvider`; global overlays + centered credit tile (`InsufficientCreditsDialog` restyle).

### 6. Summary
Single-session roast + free scan UX across layouts; insufficient credits tile H+V centered.

**Confirmed:** This log was appended.
