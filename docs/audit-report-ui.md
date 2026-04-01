# Audit comparison and roast report page documentation

Reference documentation derived from the Next.js implementation: `src/app/roast/[id]/page.tsx`, `src/lib/report-html.ts`, `src/lib/pdf-templates.ts`, API shaping in `src/app/api/roast/route.ts`.

---

## 1) Element-by-Element Audit vs Deep Dive Findings

### 1.1 Core objective of each

| Dimension | Element-by-Element Audit | Deep Dive Findings |
|-----------|--------------------------|---------------------|
| **Data source** | `roastData.audit_items[]` | `roastData.detailedAudit` — a **record keyed by category** (e.g. `ux`, `conversion`, `copy`, `visuals`, `trust`, `speed`), each value is an array of items |
| **Primary lens** | **Per UI element / artifact** on the page (hero, CTA, nav, etc.): status, rationale, working vs not, fix, impact | **Per strategic category**: aggregated score/verdict/impact for the whole category, plus synthesized “what works / what failed / fix steps” derived from the items in that category |
| **User job** | Answer: “For each named element, how good is it and what exactly should I change?” | Answer: “How strong is my UX vs conversion vs copy, etc., and what are the priority themes and steps in each area?” |

### 1.2 What each report shows (fields and semantics)

**Element-by-element (`audit_items`)** — each item can expose:

- `element` — label (e.g. “Hero headline”)
- `status` — maps to badge variant (Excellent / Good / Satisfactory / Needs Improvement / Failed)
- `rationale` — prose explanation
- `working[]`, `not_working[]` — bullet lists
- `fix` — recommended change
- `expected_impact` — impact line

**Deep dive (`detailedAudit`)** — raw items use shapes like `elementName`, `status`, `fix` (sometimes `{ quickFix }`). The **UI does not list every item** in tabs; it **aggregates** per category into:

- `score` (0–100-ish average from status weights)
- `verdict` (Excellent / Good / Needs Improvement from that average)
- `impact` (High if there are failed/needs-improvement items, else Medium)
- `what_works` — semicolon-joined names of up to 3 **good** items
- `what_failed` — semicolon-joined names of up to 3 **bad** items
- `fix_steps` — up to 3 strings combining element name + quick fix text

So: **element audit = granular cards**; **deep dive = category dashboard + synthesized summaries**, not a 1:1 repeat of every `detailedAudit` row in the main tab body.

### 1.3 How they differ (summary)

- **Granularity**: Element-level rows vs category-level tabs.
- **Structure**: Flat list (max 6 on screen) vs tabbed UX & Layout, Conversion & Funnel, Copy & Messaging, etc.
- **Detail model**: Full structured fields per element vs **rolled-up** narrative blocks (what works / failed / fix steps) per category.
- **Same paywall, different teaser**: Both sections use `hasFullReportAccess` (Pro, Agency, or admin); free users see **tabs/cards** but **locked** detail patterns (shared `LOCKED_INSIGHT_BULLETS` from `src/lib/report-ui.ts`).

### 1.4 On-screen UI structure (web app)

**Element-by-Element Audit** (`page.tsx` ~1147–1259):

- Renders only if `auditItems.length > 0`.
- **Card** with `ClipboardList` icon and title “Element-by-Element Audit”.
- Up to **6** items as stacked sub-cards (`rounded-lg border`, `bg-card/50`).
- Each row: title + **Badge** for status; optional rationale (free: **2-line clamp**, label “Context”; paid: full, label “Rationale”).
- **Free**: generic locked bullet list + bottom CTA strip (`PRO_UPGRADE_STRIP`, billing + `#full-report-upgrade`).
- **Paid**: two-column grid for Working / Not working (icons `CircleCheck` / `CircleX`), then Fix (`Wrench`), then Expected impact.

**Deep Dive Findings** (`page.tsx` ~1262–1376):

- **Card** always present; inner content depends on whether `categories` was built from `detailedAudit`.
- **Tabs**: `TabsList` is a responsive grid (2 cols mobile → 6 cols large); each trigger shows a **category icon** (`categoryTabIcon`) + truncated name.
- **Per tab**: Impact badge (High = destructive variant), line with **Score** (mono) and **Verdict**.
- **Free**: same locked bullets + upgrade box citing `FULL_DIAGNOSTIC_UPGRADE_HOOK`.
- **Paid**: three blocks — green-tinted “What Works”, red-tinted “What Failed”, numbered “Fix Steps” list; empty state message if no synthesized content.

### 1.5 Exported reports (HTML and PDF)

**Client HTML** (`generateAuditReportHTML` in `report-html.ts`):

- **Element audit**: Free = first **3** items, titles + status only + placeholder “Pro” lines; Paid = **all** items with rationale, working/not, fix, impact.
- **Deep dive**: Free = **“Deep dive preview”** with one muted line per category + upgrade copy; Paid = **“Deep dive findings”** with `<h3>` per category and per-item blocks (`elementName`, rationale, `Action` from `fix` / `quickFix`).

**PDF** (`src/app/api/generate-pdf/route.ts`):

- **Free** uses `generateFreeRoastCertificateHTML` in `pdf-templates.ts`: **no** full element-by-element or deep-dive body — ends with an **upgrade locked-section** mentioning radar, deep dive, and full element audit.
- **Paid** uses `generatePaidAgencyReportHTML` in `pdf-templates.ts`: includes dedicated **“Element-by-element audit”** and **“Deep dive findings”** sections (HTML structure mirrors the paid branch in `report-html` / template).

---

## 2) Audit report page: `/roast/[id]` (e.g. `/roast/1774465651927`)

### 2.1 Shell and layout

- **`SidebarProvider`** + `AppSidebar` + `SidebarInset` with main content **`ml-[14.4rem]`** (fixed sidebar width), **`max-w-[min(100%,88rem)]`**, vertical **`gap-10` / `md:gap-12`**, padding **`p-6 pt-8` / `md:p-10`**, background **`bg-background`**.
- **Look**: Dense dashboard, **shadcn-style** cards and borders (`border-border`, `bg-surface-1` / `bg-card`), **mono** for scores and filenames, **primary** accents on charts and CTAs.

### 2.2 Top bar

- **Title**: “Site Conversion Report” (`text-2xl` / `md:text-3xl`).
- **Subtitle**: Monospace **`reportFileBase`** (from audited URL + timestamp via `src/lib/report-display-name.ts`), plus one-line description.
- **Actions**: Three **outline** small buttons — Download PDF, Download HTML, View in Browser. Each runs through **`requireUserForExport`**: if not signed in, opens `AuthRequiredDialog`. PDF/HTML use `hasFullReportAccess` for tiered content.

### 2.3 Hero score band

- **Grid** `md:grid-cols-12` inside `rounded-lg border bg-surface-1 p-6 md:p-8`.
- **Left (~5 cols)**: “OVERALL SCORE” caption, `RadialChart` (168px), big **mono score /100**, `ScoreIntelFootnote` (ties score to audit item count).
- **Right (~7 cols)**: “Verdict” label + **`getVerdictText`** (CRITICAL CONDITION / NEEDS OPTIMIZATION / EXCELLENT); optional **Executive summary** in nested `rounded-lg border bg-surface-2/40` panel.

### 2.4 Executive insight layers

- `SectionHeader` “Executive insight layers”.
- `RevenueLeakEstimateCard` (full width).
- **3-column grid** (`md:grid-cols-3`) of `InsightLayerCard` — First impression, Trust gap, Messaging clarity; **subscores** only if `hasFullReportAccess`.

### 2.5 Share and upgrade (free path)

- `ShareYourScore` — social/copy controls and generated post text.
- **Admin-only**: `SocialContentPackSection`.
- If **not** full access: `FullReportUpgradePanel` (`id="full-report-upgrade"`) — gradient border section, before/after teaser copy, category names, pricing-oriented copy from `src/lib/report-copy.ts`.

### 2.6 Performance & economics

- **SectionHeader** “Performance & economics”.
- **4-column grid** (`md:grid-cols-4`):
  1. **Site Score Radar** — `RoastRadar`; free users also see a tiny **key/value grid** of raw scores above chart.
  2. **Cost of Inaction** — dollar estimate, `MetricIntelFootnote`.
  3. **Scroll of Death** — below-fold **%**, horizontal **strip** with tooltips (`scroll-heat-gradient`, fold marker).
  4. **Competitor Gap** — You vs competitor traffic, multiplier callout.

### 2.7 Insights & actions

- **SectionHeader** “Insights & actions”.
- **4-column grid** (`md:grid-cols-4`): **Industry Insider** (bullets in bordered mini-cards + `BenchmarkHint`), **Revenue Impact Calculator** (inputs: price, traffic, industry), **Quick Fixes** (`md:col-span-2`) — list of wins; first win fully interactive for free, **wins 2+** get locked bullets and disabled “View Details”; each unlocked row opens a **bottom Sheet** with Effort, Impact, Problem, How to Fix, Technical Details (`code` block).

### 2.8 Strategic audit narrative

- Optional **large Card** “Strategic audit narrative” if hook/script/verdict/closer (or legacy `analysis` / `overview`) exist.
- Four visual **subsections** with decorative horizontal rules: Executive summary, Diagnostic analysis, Assessment, Recommended next steps — each in `rounded-lg border bg-muted/30` with generous typography (`text-lg` / `text-base`, `whitespace-pre-line` or `pre-wrap`).

### 2.9 Element-by-Element Audit and Deep Dive

- As in **section 1.4** — sequential **full-width cards** below the narrative; primary visual differentiator is **list + badges** vs **tabs + category synthesis**.

### 2.10 Global feel

- **Information hierarchy**: Score → money/risk layers → share → upgrade (free) → radar/economics → calculator/quick wins → long narrative → granular audit → category deep dive.
- **Interaction**: Tooltips on scroll bar, Sheets for quick wins, Tabs for deep dive, consistent **billing** CTAs when locked.
- **Tokens**: Relies on app theme (`src/app/globals.css` / CSS variables) for surface, border, primary, success/destructive/chart colors.
