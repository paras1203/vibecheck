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

## 2. Workflow Differences (Current)
### 2.1 URL → report
Identical API, auth, and credits across `/` and all `/v/*`.

## 5. Route Mapping (Unified)
- `/v/c1` … `/v/c3` — new comparison candidates; **Landing visuals** dropdown lists C1–C3 under “New concepts” and A1–B2 under “Original four”.

**Confirmed:** This log was appended.
