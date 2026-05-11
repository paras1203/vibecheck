# Vibecheck — Complete audit parameters inventory

**Scope:** This list is derived from the production full-audit path (`POST /api/roast` in `src/app/api/roast/route.ts`) and the libraries it calls. Items are **what the product actually evaluates or derives**, not marketing copy.

**Companion docs:** See [`docs/audit-current-state.md`](docs/audit-current-state.md) and [`docs/audit-design.md`](docs/audit-design.md) for the expanded programmatic audit layer (PSI aggregate, Cheerio SEO, tech stack, meta preview).

**How to read “importance”**

- **Gemini worker items** each carry model-assigned **`impact`**: `HI` (high), `MI` (medium), `LI` (low). These feed **weighted radar scores** (status points × impact multiplier) in `compileRoast`.
- **Programmatic checks** are **deterministic**; importance is described from a CRO/SEO perspective.
- **Illustrative / model-estimated** signals are labeled so they are not mistaken for live analytics or guaranteed measurements.

**Scoring linkage (workers only)**

- Status weights: Excellent = 95, Good = 80, Satisfactory = 60, Needs Improvement = 35, Failed = 5.
- Impact multipliers: HI = 1.5, MI = 1.0, LI = 0.5.
- Results roll into six **radar pillars**: `ux`, `conversion`, `copy`, `visuals`, `trust`, `speed`, then **overall site score** = mean of those six.

---

## 1. Multimodal audit — Worker 1 (screenshots) — `analyzeVisuals`

**Source:** `src/app/api/roast/route.ts` (`analyzeVisuals` prompt).

**Radar mapping:** Each row lists the **`radarCategory`** stored on that item (used for grouping and scoring).

| Subcategory | What is evaluated (exact prompt scope) | Radar pillar | Importance | Typical business impact |
|-------------|----------------------------------------|--------------|------------|-------------------------|
| Visual hierarchy & layout | Overall layout and hierarchy as seen in stitched screenshots | `ux` | Model: HI / MI / LI | Scan path and comprehension; users find—or miss—the main story. |
| Navigation clarity | Menu intuitiveness; **structure**; **labeling clarity**; **user navigation flow** | `ux` | Model: HI / MI / LI | Findability and friction; wrong labels increase bounce and support load. |
| Readability | **Font sizes**; **line height**; **contrast**; **legibility**; **reading comfort** | `ux` | Model: HI / MI / LI | Legibility drives time-on-page and comprehension of offer and CTA. |
| Scroll experience | **Guided flow vs chaotic**; **visual breaks**; **section transitions**; **content organization** | `ux` | Model: HI / MI / LI | Long pages without structure lose momentum; CTAs and proof get skipped. |
| Aesthetics & image quality | **Logo visibility**; **stock image authenticity**; image **quality**; **relevance**; **brand consistency** | `visuals` | Model: HI / MI / LI | Visual trust and perceived quality of the offer. |
| CTA visibility | Prominence and clarity of calls to action (visual) | `conversion` | Model: HI / MI / LI | Direct effect on clicks and lead volume. |
| Trust signals | Logos, proof, credentials, social proof as visible in captures | `trust` | Model: HI / MI / LI | Reduces perceived risk; weak proof caps conversion. |
| Mobile layout | Layout appropriateness for mobile when captured in mobile mode | `ux` | Model: HI / MI / LI | Mobile sessions dominate many funnels; layout errors truncate revenue. |

**Mandatory cross-checks named in the worker prompt (same pass):** navigation clarity; readability (fonts, line height, contrast); scroll experience; **logo visibility and stock-image authenticity**.

---

## 2. Multimodal audit — Worker 2 (visible text) — `analyzeCopy`

**Source:** `src/app/api/roast/route.ts` (`analyzeCopy` prompt). Text sample is capped at **5,000** characters.

| Subcategory | What is evaluated | Radar pillar | Importance | Typical business impact |
|-------------|-------------------|--------------|------------|-------------------------|
| Headline impact | **Clarity** and **benefit-driven** nature of headlines | `copy` | Model: HI / MI / LI | First-line comprehension and bounce rate. |
| Value proposition | Clarity; **differentiation vs generic claims**; specificity vs industry boilerplate | `copy` | Model: HI / MI / LI | If the offer sounds interchangeable, conversion and willingness-to-pay suffer. |
| Persuasion & tone | **Persuasion techniques**; **tone appropriateness**; **authority** (expertise, credentials, social proof); **specificity** (concrete details, numbers, specific benefits) | `copy` | Model: HI / MI / LI | Weak authority/specificity reduces trust and action. |
| Objection handling | Proactive handling of **Price**, **Risk**, **Effort**, and **Time** objections in copy | `copy` | Model: HI / MI / LI | Unanswered objections stall decisions at checkout and signup. |
| Lead capture | **Clarity of what happens after submit** (expectations post-form) | `conversion` | Model: HI / MI / LI | Ambiguity suppresses form starts and completions. |
| One page one goal | **Competing CTAs** and **overall goal clarity** | `conversion` | Model: HI / MI / LI | Split intent dilutes primary conversion. |

**Mandatory cross-checks named in the worker prompt:** lead capture (post-submit clarity); value prop (differentiation); objection handling (price, risk, effort, time); persuasion (**authority and specificity**).

---

## 3. Multimodal audit — Worker 3 (HTML snippet) — `analyzeTech`

**Source:** `src/app/api/roast/route.ts` (`analyzeTech` prompt). Scripts and styles are stripped; HTML is capped at **3,000** characters.

| Subcategory | What is evaluated | Radar pillar | Importance | Typical business impact |
|-------------|-------------------|--------------|------------|-------------------------|
| Page speed indicators | **Heavy scripts**; **image optimization**; **load time** signals from markup; **caching** and **CDN** references **if detectable** from HTML (e.g. headers hints, cache-control, CDN hostnames in tags) | `speed` | Model: HI / MI / LI | Latency and interactivity affect bounce, especially mobile. |
| SEO tags | **H1 structure**; **meta description quality** (from available HTML) | `copy` | Model: HI / MI / LI | Snippet and on-page relevance for search and click-through. |
| Legal compliance | Presence of links/paths toward **privacy**, **terms**, **cookie policy**, **disclaimers**; instruction: if such **hrefs exist** in nav/footer, do not claim pages are missing | `trust` | Model: HI / MI / LI | Trust and compliance UX for B2B/regulated buyers; merged with HTML scan (below). |
| Mobile form usability | **Mobile-friendly forms**; correct **`input` types** for **email**, **tel**, **number** where applicable | `ux` | Model: HI / MI / LI | Wrong types hurt mobile completion rates and accessibility. |

**Mandatory cross-checks named in the worker prompt:** caching/CDN when inferable from HTML; legal flags only when hrefs absent; mobile forms and **keyboard/input types**.

---

## 4. Programmatic legal link detection (HTML + URL)

**Source:** `src/lib/legal-html-signals.ts`, merged in `compileRoast` via `mergeLegalComplianceWithSignals`.

| Subcategory | Signal | Importance | Impact |
|-------------|--------|------------|--------|
| Privacy | **`privacyLink`**: href/path matches privacy-style patterns | High for trust-heavy segments | If missing in HTML, merged Legal Compliance item gets concrete `notWorking` lines. |
| Terms | **`termsLink`**: terms / ToS-style paths | High for trust-heavy segments | Same merge behavior as privacy. |
| Cookie policy | **`cookieLink`**: cookie-policy-style paths | Medium–high (jurisdiction-dependent) | If missing, “cookie policy link not clearly present” may be flagged in merge. |

**Note:** When all three are found, the Legal Compliance item is forced to **Good** with explanatory rationale (see `mergeLegalComplianceWithSignals`).

---

## 5. Programmatic SEO analysis (full HTML from capture)

**Source:** `src/lib/seo-analyzer.ts` (`analyzeSEO`), attached to the API result as `seo`.

| Subcategory | Signal / rule | Importance | Impact |
|-------------|---------------|------------|--------|
| Title tag | **Presence** of `<title>` | Critical for SERP | Missing title → issue `MISSING_TITLE`. |
| Title tag | **Length** between 30–60 characters (decoded text) | High | Outside range → `TITLE_LENGTH`. |
| Meta description | **Presence** of `meta name="description"` | High | Missing → `MISSING_META_DESCRIPTION`. |
| Meta description | **Length** between 70–160 characters | Medium–high | Outside range → `META_DESCRIPTION_LENGTH`. |
| H1 usage | **Count** of `<h1>` tags **equals 1** | High | Any other count → `H1_COUNT_INVALID`. |
| Canonical | **`rel="canonical"`** present in HTML | Medium | Stored as `hasCanonical` (no separate issue type). |
| Robots meta | **`name="robots"`** meta present | Medium | Stored as `hasRobotsMeta`. |
| Open Graph | **`property="og:…"`** present | Medium | Stored as `openGraph`. |
| Twitter cards | **`name="twitter:…"`** present | Low–medium | Stored as `twitterCards`. |
| Image alt text | **Coverage ratio** of `<img>` with non-empty `alt` | High for a11y/SEO | &lt; 100% when images exist → `IMAGE_ALT_COVERAGE_LOW`. |
| Internal links | **Count** of same-site links from `href` resolution | Diagnostic | `internalLinks`. |
| External links | **Count** of outbound links (excluding mailto/tel/js/hash) | Diagnostic | `externalLinks`. |
| Composite | **`score`** = 100 − 10 × issue count (clamped 0–100) | Summary | Single headline SEO score in payload. |

**Note:** **`analyzeSEO`** remains the legacy scorecard consumed by SEO health UI and appendix. Richer Cheerio checks also populate **`on_page_seo`** (see **Expanded programmatic audits** immediately after §6); both may coexist without removing legacy issue types.

---

## 6. Google PageSpeed Insights (Lighthouse) — lab performance

**Source:** PSI v5 HTTP API (`src/lib/audits/performance-pagespeed.ts`): **`fetchPerformanceAuditResult`** (dual strategy) + **`getPageSpeedReport(url, strategy)`**. Legacy rollup: **`src/lib/pagespeed.ts`** (`pageSpeedSummaryFromPerformanceAuditMobile`, **`getPageSpeed`**).

**Requirements:** **`PAGESPEED_API_KEY`**. Runs **mobile + desktop** in parallel when aggregated fetch runs (request timeouts ~25s per leg). **`PAGESPEED_STRATEGY`** is not the sole driver dual vs single—the aggregate path favors both strategies when the API key exists; the stored legacy **`performance`** object reflects the **mobile** slice.

| Subcategory | Signal | Importance | Impact |
|-------------|--------|------------|--------|
| Lighthouse | **Performance category score** per strategy | High when present | Correlates with perceived speed and mobile conversion. |
| Lab metrics | **LCP**, **CLS**, **TBT**, **INP** (when Lighthouse exposes `interaction-to-next-paint`) | High–medium | Loading, stability, blocking, responsiveness. |
| Opportunities | Lighthouse audits with **`details.type === opportunity`** | High for fixes | Sorted by estimated savings (`overallSavingsMs` / wasted ms when present), capped (~8). |
| Diagnostics | Selected **informative / numeric** audits | Diagnostic | Highlights likely lab-only findings, capped (~8). |
| Full object | **`performance_audit`** on API JSON | — | Canonical store for desktop + lists. |
| Rollup UI / Gemini seed | **`performance`** | — | Backward-compatible field for dashboard + **`summarizePageSpeedWithGemini`**. |

**Optional narrative layer:** `src/lib/pagespeed-gemini-summary.ts` — Gemini receives **`performance`** JSON including **`strategy`**, **`inp`** when populated; **summary** + **two quick fixes**, no invented metrics.

---

## Expanded programmatic audits (additive payload + exports)

**Source:** `src/lib/audits/*`, orchestrated from `src/app/api/roast/route.ts`. These fields are **additive**; they supplement but do not replace **`seo`**, **`performance`** (rollup), or worker rows.

**Capture header:** `src/lib/capture.ts` may attach **`documentHeaders.xRobotsTag`** from the main document navigation response (feeds **`on_page_seo`** alongside meta robots parsing).

| Payload key | Module(s) | What is evaluated |
|-------------|-----------|-------------------|
| **`performance_audit`** | `performance-pagespeed.ts` | When `PAGESPEED_API_KEY` is set: **parallel** PSI v5 **mobile + desktop**; per-strategy Lighthouse **performance** score plus **LCP**, **INP**, **CLS**, **TBT** display strings where present; capped lists of Lighthouse **opportunities** and **diagnostics** (title, optional `displayValue`, id). |
| **`performance`** | `pagespeed.ts` | Legacy **`PageSpeedSummary`** built from the **mobile** slice of **`performance_audit`** (includes **`inp`** when available). Existing cards + **`summarizePageSpeedWithGemini`** use this shape. |
| **`on_page_seo`** | `on-page-seo.ts` | Cheerio: title / meta presence and length bands (**30–65** / **100–160**), truncation hints; **canonical** resolution + validity + host match vs audited URL; **robots** meta content (`noindex` / `nofollow`); **`X-Robots-Tag`** when capture exposed it; H1/H2/H3 counts and skipped-level heuristic; image alt percentage + **hero** alt heuristic (`main`/hero selectors); internal vs external links + flags (none / external-only); human **`messages[]`**. |
| **`meta_preview`** | `meta-preview-audit.ts` | Title, meta description, robots, canonical, **Open Graph** and **Twitter** tag reads; SERP-ish and OG **preview strings**; missing OG/Twitter booleans. |
| **`tech_stack`** | `tech-stack-audit.ts`, `tech-stack-registry.ts`, optional **`tech-stack-external.ts`** | Substring/pattern fingerprints (GA, GTM, Meta Pixel, Microsoft Clarity, Hotjar, Intercom, Crisp, HubSpot, LinkedIn Insight, etc.). If **`TECHSTACK_API_URL`** is set, optional HTTP merge (POST `{ url }`, optional **`TECHSTACK_API_KEY`** Bearer), dedupe by **`id`**. |
| **`behaviour_tools`** | `behaviour-tools.ts` | Flags / copy for behavioural analytics (notably Microsoft Clarity vs other heatmaps) derived from **`tech_stack`**. |

**Report parity:** Structured HTML for exports is appended via **`report-extended-audit-appendix.ts`** as part of **`buildSeoPerformanceAppendixHtml`** (`report-seo-appendix.ts`), so **download HTML**, **PDF** (`pdf-templates`), and **`/roast/[id]`** extended diagnostics stay aligned (`roast-expanded-diagnostics-section.tsx`).

---

## 7. Quick scan (second Puppeteer pass, no screenshots)

**Source:** `src/lib/quick-scan.ts` (`quickScan`).

| Subcategory | Signal | Importance | Impact |
|-------------|--------|------------|--------|
| Page dimensions | **`document.body.scrollHeight`** | Medium | Feeds scroll/revenue context; long pages need stronger sectional design. |
| Pricing economics | **USD** (`$…`) amounts with **pricing-intent** context | High for ROI model | Median-style pick of **monthly-equivalent order value**; drives `price_guess`. |
| Pricing economics | **INR** (`₹`, `Rs.`, `INR`) with pricing intent | High (INR sites) | Same pipeline as USD. |
| Billing cadence | Inferred **monthly / yearly / weekly / quarterly / one-time / unknown** | High | Normalizes to monthly AOV for modeling. |
| Price confidence | **`price_from_page`** boolean | High | When false, illustrative default AOV applies (`DEFAULT_REVENUE_MODEL_AOV_USD` / env override). |
| Transparency | **`price_billing_note`** human-readable explanation | Medium | Explains how the number was inferred. |
| Optional fetch | **`/pricing` or `/plans`** path when not already on pricing | Medium | Enriches price detection from a dedicated page when reachable. |
| Industry guess | Keyword buckets → **SaaS**, **Agency**, or **E-commerce** (default SaaS) | Medium | Drives traffic defaults and copy in revenue assumptions. |

---

## 8. Page type detection

**Source:** `src/lib/page-type.ts` (`detectPageType`).

| Subcategory | Rule | Importance | Impact |
|-------------|------|------------|--------|
| URL | Path contains **`/blog`** or **`/article`** | Medium | Classified as `blog`. |
| URL | Path contains **`/product`** | Medium | Classified as `product`. |
| Content | **`text.length > 2000`** and HTML contains **`<article`** | Medium | Classified as `blog`. |
| Content | HTML contains **“Add to Cart”** or **“Buy Now”** | Medium | Classified as `product`. |
| Default | Else | — | **`landing`**. |

---

## 9. Illustrative traffic estimate

**Source:** `src/lib/traffic-estimate.ts` (`estimateMonthlySessionsForUrl`).

| Subcategory | Signal | Importance | Impact |
|-------------|--------|------------|--------|
| Sessions | **`monthlySessions`** (clamped 500–15M) | High for revenue math | **Not** from your analytics; illustrative only. |
| Provenance | **`source`**: `gemini` vs `industry_default` | High (disclaimer) | Determines whether a model guess or default **5,000** visits/mo was used. |
| Explanation | **`note`** / rationale string | Medium | Short justification for the estimate. |

---

## 10. Executive insight layers (Gemini JSON, merged with fallbacks)

**Source:** `src/lib/insight-layers.ts` (`INSIGHT_LAYERS_SYSTEM_PROMPT`, `mergeInsightLayersFromAI`, `fallbackInsightLayers`).

Each layer has a **composite** score triple (`current`, `proposed`, `impact` text) plus **subscores** (same shape).

### 10.1 First impression score

| Sub-score key | What it represents | Importance | Impact |
|---------------|-------------------|------------|--------|
| `headlineClarity` | Hero/headline clarity vs conversion | High | First-screen comprehension. |
| `ctaVisibility` | Primary CTA salience | High | Direct tie to clicks. |
| `visualHierarchy` | Order of attention vs intent | High | Guides eye to revenue actions. |

### 10.2 Trust gap index

| Sub-score key | What it represents | Importance | Impact |
|---------------|-------------------|------------|--------|
| `testimonials` | Social proof via quotes/users | High | Reduces uncertainty. |
| `guarantees` | Risk reversal | Medium–high | Lifts conversion on paid offers. |
| `proof` | Logos, metrics, credentials | High | B2B and high-ticket trust. |
| `perceivedRisk` | Leftover risk after proof | High | Inverse of trust comfort. |

### 10.3 Messaging clarity score

| Sub-score key | What it represents | Importance | Impact |
|---------------|-------------------|------------|--------|
| `valueProposition` | One-line offer clarity | High | Core conversion narrative. |
| `readability` | Ease of reading copy | Medium–high | Affects comprehension and scroll depth. |
| `specificity` | Concrete vs vague claims | High | Specificity correlates with trust and conversion. |

**Also:** each layer may include **`highPrioritySignals`** (2–4 short strings) — prioritized themes, not separate numeric checks.

---

## 11. Revenue leak estimate (scenario model)

**Source:** `src/lib/insight-layers.ts` (`buildRevenueLeakEstimate`), parameterized in `route.ts` with traffic and price.

| Subcategory | Parameter | Importance | Impact |
|-------------|-----------|------------|--------|
| Scenarios | **Low / base / high** uplift rates (**1%**, **2%**, **3.5%** incremental conversion) | High (illustrative) | Brackets uncertainty; **not a guarantee**. |
| Formula inputs | Monthly sessions × uplift × AOV × 12 | High (illustrative) | Drives “revenue at risk” storytelling. |
| Assumptions | Traffic line, price line, uplift interpretation | High | Must match disclaimers in UI. |

---

## 12. Aggregate radar pillars & overall score

**Source:** `compileRoast` in `src/app/api/roast/route.ts`; headline sync `src/lib/site-score.ts`.

| Pillar | Derived from | Importance | Impact |
|--------|--------------|------------|--------|
| `ux` | All items with `radarCategory: "ux"` | High | Experience quality index for the report. |
| `conversion` | `radarCategory: "conversion"` | Critical | Direct conversion-design strength. |
| `copy` | `radarCategory: "copy"` | High | Messaging strength. |
| `visuals` | `radarCategory: "visuals"` | Medium–high | Visual trust and polish. |
| `trust` | `radarCategory: "trust"` | High | Risk and credibility. |
| `speed` | `radarCategory: "speed"` | Medium–high | Performance pillar. |
| **Overall** | **Mean of six pillars** | Critical | **Site Score** headline; verdict also uses **minimum pillar** (`verdictLabelFromSiteScore`). |

---

## 13. Quick wins (prioritization)

**Source:** `calculateBadnessScore` + sort in `compileRoast`.

| Subcategory | Logic | Importance | Impact |
|-------------|-------|------------|--------|
| Badness ranking | Combines **status** + **impact** into priority score | High | Surfaces top 4 fixes in **Quick Wins** (Legal Compliance excluded from this list). |

---

## 14. Scroll effectiveness (derived from audit + geometry)

**Source:** `src/lib/scroll-effectiveness-from-audit.ts` (`buildScrollEffectiveness`).

| Subcategory | Signal | Importance | Impact |
|-------------|--------|------------|--------|
| Geometry | **Page height**, **fold height** (default 800px in route), **below-fold percent** | Medium | Context for long-page friction. |
| Evidence | Audit lines matched against **scroll-related keywords** | Medium | Connects qualitative audit to scroll bands (top / mid / deep). |

---

## 15. Narrative roast support (content extraction, not separate pillars)

**Source:** `extractRawContent` in `src/app/api/roast/route.ts`.

| Subcategory | Extraction | Importance | Impact |
|-------------|------------|------------|--------|
| Headline | First **`<h1>`** text | High | Grounds executive/diagnostic copy in real copy. |
| CTAs | Up to **5** button-like texts from HTML heuristics | Medium | Same. |
| Hero | First **~300** chars of visible text | Medium | Same. |
| Body | First **`<p>`** ~50–300 chars when regex matches | Low–medium | Same. |

---

## 16. Report UI — illustrative visualization (not a separate crawl metric)

**Source:** `src/components/roast/attention-heatmap-panel.tsx`.

| Item | Nature | Note |
|------|--------|------|
| Attention heatmap | **Illustrative** gaze-style overlay on first screenshot | Described in UI as typical scan patterns—not a separate quantitative audit pipeline. |

---

## 17. Count summary (honest inventory)

*For a flat glossary of **short names and terms** (headings + bullets only), see **§19**.*

| Bucket | Approx. distinct criteria / signals |
|--------|-------------------------------------|
| Worker 1 explicit sub-criteria (table + mandatory checks) | 30+ |
| Worker 2 explicit sub-criteria | 20+ |
| Worker 3 explicit sub-criteria | 15+ |
| Legal HTML booleans + merge behavior | 3 (+ merge rules) |
| SEO analyzer fields + issue types | 14 + 6 issue types |
| PageSpeed / PSI (dual strategy + rollup) | mobile + desktop aggregates + opportunities/diagnostics lists; legacy `performance` rollup (incl. optional `inp`) |
| Expanded audits (`src/lib/audits`) | `on_page_seo`, `meta_preview`, `tech_stack`, `behaviour_tools` (many sub-signals each) |
| Quick scan outputs & major inference steps | 10+ |
| Page-type rules | 4 + default |
| Traffic estimate outputs | 3 |
| Insight layer composites + subscores | 3 + 10 |
| Radar pillars + overall + badness + scroll metrics | 6 + 1 + 1 + 3 |
| Revenue scenarios | 3 |
| Raw content extractions | 4 |

**Total:** **Well over 100** named signals, sub-criteria, and derived fields when the fine-grained prompt bullets and programmatic checks above are counted together. The **canonical structured audit rows** the API always expects from the three workers are the **18 `elementName` dimensions** in sections 1–3; everything else is either **programmatic**, **merged**, **aggregated**, or **illustrative**.

---

## 18. Code references (main entry points)

- Orchestration & workers: `src/app/api/roast/route.ts`
- Capture (incl. optional `documentHeaders` / `xRobotsTag`): `src/lib/capture.ts`
- Chromium path resolution (Puppeteer): `src/lib/chromium-executable.ts`, `src/lib/should-use-bundled-chromium.ts`
- SEO (legacy scorecard): `src/lib/seo-analyzer.ts`
- Legal href scan: `src/lib/legal-html-signals.ts`
- PSI aggregate + rollup: `src/lib/audits/performance-pagespeed.ts`, `src/lib/pagespeed.ts`, `src/lib/pagespeed-gemini-summary.ts`
- Expanded audits (barrel): `src/lib/audits/index.ts` — modules under `src/lib/audits/*`
- Report HTML parity: `src/lib/report-seo-appendix.ts`, `src/lib/report-extended-audit-appendix.ts`
- Quick scan: `src/lib/quick-scan.ts`
- Insight layers: `src/lib/insight-layers.ts`, `src/lib/insight-layers-report.ts`
- Site score semantics: `src/lib/site-score.ts`
- Scroll effectiveness: `src/lib/scroll-effectiveness-from-audit.ts`
- Page type: `src/lib/page-type.ts`
- Traffic estimate: `src/lib/traffic-estimate.ts`

---

## 19. Short names / terms glossary (all criteria & signals)

Flat index: **###** = source bucket, **####** = sub-bucket, bullets = short names / field names / issue codes.

### 19.1 Worker 1 — screenshots (`analyzeVisuals`)

#### Element dimensions (`elementName` → `radarCategory`)

- `Visual Hierarchy & Layout` → `ux`
- `Navigation Clarity` → `ux`
- `Readability` → `ux`
- `Scroll Experience` → `ux`
- `Aesthetics & Image Quality` → `visuals`
- `CTA Visibility` → `conversion`
- `Trust Signals` → `trust`
- `Mobile Layout` → `ux`

#### Sub-terms (prompt scope)

- Menu intuitiveness, nav structure, labeling clarity, user navigation flow
- Font sizes, line height, contrast, legibility, reading comfort
- Guided flow vs chaotic, visual breaks, section transitions, content organization
- Logo visibility, stock image authenticity, image quality, relevance, brand consistency

#### Mandatory cross-checks (same worker pass)

- Navigation clarity
- Readability (fonts, line height, contrast)
- Scroll experience
- Logo visibility, stock-image authenticity

---

### 19.2 Worker 2 — visible text (`analyzeCopy`)

#### Element dimensions

- `Headline Impact` → `copy`
- `Value Proposition` → `copy`
- `Persuasion & Tone` → `copy`
- `Objection Handling` → `copy`
- `Lead Capture` → `conversion`
- `One Page One Goal` → `conversion`

#### Sub-terms

- Headline clarity, benefit-driven copy
- Value prop clarity, differentiation vs generic claims
- Persuasion techniques, tone appropriateness, authority (expertise, credentials, social proof), specificity (concrete details, numbers, specific benefits)
- Objections: Price, Risk, Effort, Time
- Post-submit clarity (what happens after submit)
- Competing CTAs, goal clarity

#### Mandatory cross-checks

- Lead capture / post-submit clarity
- Value prop differentiation
- Objection handling (price, risk, effort, time)
- Authority, specificity (persuasion)

---

### 19.3 Worker 3 — HTML snippet (`analyzeTech`)

#### Element dimensions

- `Page Speed Indicators` → `speed`
- `SEO Tags` → `copy`
- `Legal Compliance` → `trust`
- `Mobile Form Usability` → `ux`

#### Sub-terms

- Heavy scripts, image optimization, load time (markup signals)
- Caching, CDN (if detectable from HTML)
- H1 structure, meta description quality
- Privacy, terms, cookie policy, disclaimers, legal href presence rules
- Mobile-friendly forms, `input type="email"`, `type="tel"`, `type="number"`

#### Mandatory cross-checks

- Caching & CDN (when inferable)
- Legal: flag missing only when hrefs absent
- Mobile forms, keyboard / input types

---

### 19.4 Programmatic legal HTML (`legal-html-signals`)

- `privacyLink`
- `termsLink`
- `cookieLink`
- `LegalHtmlSignals` (group)
- `mergeLegalComplianceWithSignals` (merge into Legal Compliance item)

---

### 19.5 Programmatic SEO (`analyzeSEO` → `seo`)

#### Fields

- `title`
- `metaDescription`
- `h1Count`
- `hasCanonical`
- `hasRobotsMeta`
- `openGraph`
- `twitterCards`
- `imageAltCoverage`
- `internalLinks`
- `externalLinks`
- `score`
- `issues[]` / `SeoIssue`

#### Issue type codes (`type`)

- `MISSING_TITLE`
- `TITLE_LENGTH`
- `MISSING_META_DESCRIPTION`
- `META_DESCRIPTION_LENGTH`
- `H1_COUNT_INVALID`
- `IMAGE_ALT_COVERAGE_LOW`

---

### 19.6 PageSpeed Insights (PSI v5 → `performance_audit` + `performance`)

- **`performance_audit`** — `fetchPerformanceAuditResult` (`src/lib/audits/performance-pagespeed.ts`): parallel **mobile + desktop** when `PAGESPEED_API_KEY` is set; per-strategy Lighthouse **performance** score; **LCP**, **CLS**, **TBT**, **INP** (when Lighthouse exposes interaction-to-next-paint); capped **opportunities** and **diagnostics** lists.
- **`performance`** — `pageSpeedSummaryFromPerformanceAuditMobile` / `getPageSpeed` (`src/lib/pagespeed.ts`): **mobile-only** rollup for UI + Gemini; same metric keys as below.
- `performanceScore` (Lighthouse performance category 0–100)
- `lcp`, `cls`, `tbt`, `inp` (lab strings when present)
- `strategy` on rollup: **`mobile`** (derived from mobile slice)
- Env: **`PAGESPEED_API_KEY`** (required for PSI); **`PAGESPEED_STRATEGY`** (legacy single-strategy helper paths; roast aggregate prefers dual strategy when key exists)

#### Optional Gemini layer (`performanceGemini`)

- `summary`
- `quickFixes[0]`, `quickFixes[1]` (exactly two when valid; prompt receives `performance` JSON, including **`inp`** when populated)

---

### 19.7 Quick scan (`quickScan`)

- `page_height` / `scrollHeight`
- `price_guess` / monthly-equivalent AOV
- `price_from_page`
- `price_billing_note`
- `industry_guess` (`SaaS` | `Agency` | `E-commerce`)
- Pricing-intent context (regex / keyword gate)
- USD extraction (`$…`)
- INR extraction (`₹`, `Rs.`, `INR`)
- Billing cadence: `monthly`, `yearly`, `weekly`, `quarterly`, `one_time`, `unknown`
- Optional secondary fetch: `/pricing`, `/plans`
- `DEFAULT_REVENUE_MODEL_AOV_USD` / `defaultRevenueModelAovUsd()`

---

### 19.8 Page type (`detectPageType` → `page_type`)

- `landing`
- `blog`
- `product`
- `unknown`
- Heuristics: URL `/blog`, `/article`, `/product`; `text.length > 2000` + `<article`; `Add to Cart`, `Buy Now`

---

### 19.9 Traffic estimate (`estimateMonthlySessionsForUrl` → `trafficEstimate`)

- `monthlySessions`
- `source` (`gemini` | `industry_default`)
- `note`
- Clamp band: `MIN_SESSIONS`, `MAX_SESSIONS` (500–15M)
- `DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS` (fallback 5000)

---

### 19.10 Executive insight layers (`insight-layers`)

#### `firstImpressionScore`

- `layerSummary`, `composite` (`current`, `proposed`, `impact`), `priority` (derived client-side)
- `subscores.headlineClarity`
- `subscores.ctaVisibility`
- `subscores.visualHierarchy`
- `highPrioritySignals[]`

#### `trustGapIndex`

- `subscores.testimonials`
- `subscores.guarantees`
- `subscores.proof`
- `subscores.perceivedRisk`
- `highPrioritySignals[]`

#### `messagingClarityScore`

- `subscores.valueProposition`
- `subscores.readability`
- `subscores.specificity`
- `highPrioritySignals[]`

#### Revenue card (`buildRevenueLeakEstimate` / `revenueLeakEstimate`)

- `scenarios.low`, `scenarios.base`, `scenarios.high`
- `conversionUpliftRate` (per scenario)
- `REVENUE_LIFT_LOW` (1%), `REVENUE_LIFT_BASE` (2%), `REVENUE_LIFT_HIGH` (3.5%)
- `methodology`, `disclaimer`, `assumptions[]`
- `annualLeakUsd` (helper)

---

### 19.11 Radar, site score, verdict (`compileRoast`, `site-score`)

- `radarMetrics.ux`
- `radarMetrics.conversion`
- `radarMetrics.copy`
- `radarMetrics.visuals`
- `radarMetrics.trust`
- `radarMetrics.speed`
- `radar_scores` (legacy keys: `UX`, `Conversion`, `Copy`, `Visuals`, `Trust`, `Speed`)
- `overall_score`, `overview.overallScore`
- `headline_roast` (`Site Score: N/100`)
- `SITE_SCORE_RADAR_KEYS`
- `coerceRadarScoresToLowercase`, `meanRadarSiteScore`, `syncOverallScoreWithRadarPayload`
- `verdictLabelFromSiteScore` → `CRITICAL CONDITION` | `NEEDS OPTIMIZATION` | `EXCELLENT` (uses min pillar)

---

### 19.12 Worker item schema (per audit row)

- `elementName`
- `status` (`Excellent` | `Good` | `Satisfactory` | `Needs Improvement` | `Failed`)
- `impact` (`HI` | `MI` | `LI`)
- `radarCategory` (`ux` | `conversion` | `copy` | `visuals` | `trust` | `speed`)
- `rationale`
- `workingWell[]`
- `notWorking[]`
- `conversionImpact`
- `fix.quickFix`, `fix.example`, `fix.expectedImpact`

#### Scoring constants

- Status points: 95 / 80 / 60 / 35 / 5
- Impact multipliers: 1.5 / 1.0 / 0.5
- `calculateBadnessScore`

---

### 19.13 Quick wins & ordering

- `quickWins` (top 4)
- Non-legal filter (`Legal Compliance` excluded)
- `partitionLegalComplianceAuditLast`, `isDeprioritizedLegalAuditElement`

---

### 19.14 Scroll effectiveness (`buildScrollEffectiveness`)

- `pageHeight`
- `foldHeight` (e.g. 800px from route)
- `belowFoldPercent`
- Scroll bands: `top`, `mid`, `deep`
- `scrollEvidenceZoneForLine`, `partitionScrollEvidenceByZone`
- Keyword router: `SCROLL_RE` / scroll-relevant audit text match

---

### 19.15 Narrative support (`extractRawContent`)

- `h1Text`
- `buttonTexts` (up to 5)
- `heroText` (~300 chars visible text)
- `firstParagraph` (first matching `<p>` snippet)

#### Roast narrative segments (`generateRoastWithFallback` — four-part script)

- `hook` / executive block
- `script` / diagnostic block
- `verdict`
- `closer`
- Separator `|||||`; legacy `executiveSummary`, `roastAnalysis`, `analysis`

---

### 19.16 Report payload misc

- `audit_items[]` (`element`, `status`, `rationale`, `working`, `not_working`, `fix`, `expected_impact`)
- `detailedAudit` (grouped by radar key)
- `summary_bullets`
- `heroScreenshot`
- `seo`, `page_type`, `performance`, `performance_audit`, `performanceGemini`, `on_page_seo`, `meta_preview`, `tech_stack`, `behaviour_tools`
- `revenueLeakEstimate`, `pageHeight`, `price_guess`, `industry_guess`, `price_from_page`, `price_billing_note`
- `_meta` (tokens, models, costs)

---

### 19.17 UI — illustrative only

- Attention heatmap (`AttentionHeatmapPanel`, gaze-style overlay; not a separate numeric crawl)

---

### 19.18 Environment & defaults (referenced by audit math)

- `GOOGLE_GENAI_API_KEY`
- `PAGESPEED_API_KEY`, `PAGESPEED_STRATEGY`
- `TECHSTACK_API_URL`, `TECHSTACK_API_KEY` (optional external tech detection)
- `CHROMIUM_EXECUTABLE_PATH` / `PUPPETEER_EXECUTABLE_PATH` / `CHROMIUM_BIN_DIR` (local Puppeteer executable; see `src/lib/chromium-executable.ts`)
- `DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD` (29)
- `DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS` (5000)

---

### 19.19 Expanded programmatic audits (`src/lib/audits` → API JSON)

- `on_page_seo` — Cheerio + optional `documentHeaders.xRobotsTag` from capture
- `meta_preview` — SERP-like + social preview strings
- `tech_stack` — pattern scan + optional `TECHSTACK_API_URL` / `TECHSTACK_API_KEY` merge
- `behaviour_tools` — derived UX copy from detected stack (e.g. Clarity vs other heatmaps)

---

*Last aligned to repository implementation: **2026-05-08** — `src/app/api/roast/route.ts` and associated `src/lib` modules (`src/lib/audits/*`, `capture.ts`, `chromium-executable.ts`).*
