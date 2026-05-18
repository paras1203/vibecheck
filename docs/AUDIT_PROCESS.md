# Vibecheck audit process (end-to-end)

This document describes how a URL becomes a roast report in the current stack: **Next.js** (`src/app/api/roast`) for orchestration, **Puppeteer** for capture and quick scan, **Google Gemini** for multi-worker analysis, plus **client-side** report viewing, HTML/PDF export, and **Dodo Payments** for paid unlock.

---

## 1. Entry points

| Surface | What happens |
|--------|----------------|
| Landing `/` or `/home` | User enters URL → `POST /api/roast` → JSON stored in `localStorage` under `roast_{id}` → optional navigation to `/roast/[id]`. |
| Authenticated history | Same payload shape; server may persist roasts by id (see `src/app/api/roast/[id]`). |

**Auth and plans:** Full report UI (all audit rows, exports) is gated by **Pro/Agency plan**, admin, or dev bypass (`NEXT_PUBLIC_SKIP_PAYMENT_UNLOCK`). New Firestore profiles get **baseline 0 credits** unless `NEXT_PUBLIC_DEFAULT_NEW_USER_CREDITS` is set; when `NEXT_PUBLIC_PROMO_ACTIVE=true`, **`NEXT_PUBLIC_PROMO_BONUS_ROAST_CREDITS`** is added to that baseline. Purchasing via **Dodo Payments** adds **plan credits** from `PLAN_PRO_AUDIT_CREDITS` / `PLAN_AGENCY_AUDIT_CREDITS`. Logged-in `POST /api/roast` sends `idToken` and debits `ROAST_CREDITS_PER_GENERATION` (default = loader step count unless overridden).

---

## 2. Request and validation

1. Client sends `{ url: string, device?: "desktop" \| "mobile" }`.
2. Route validates `url` and `device`.
3. **Capture** (`src/lib/capture.ts`): Puppeteer loads the page, returns **screenshots** (base64), **HTML**, **visible text**, and **scroll height**.
4. **Quick scan** (`src/lib/quick-scan.ts`, parallel): lightweight second pass for **industry guess**, **pricing economics**, and height. Pricing uses **currency + pricing-intent context** (e.g. “plan”, “/mo”, “subscribe”). If nothing confident is found, `price_from_page` is **false** and **`DEFAULT_REVENUE_MODEL_AOV_USD`** (default 50) feeds revenue copy.

---

## 3. Supplementary signals (non-LLM)

Before/around LLM work, the API may compute:

- **SEO** (`src/lib/seo-analyzer.ts`) from HTML + URL.
- **Page type** (`src/lib/page-type.ts`).
- **PageSpeed** (`src/lib/pagespeed.ts`) when `PAGESPEED_API_KEY` is set.

These attach to the response as `seo`, `page_type`, `performance` and can blend into the headline score.

---

## 4. Gemini workers (three parallel tracks)

Models come from `GEMINI_WORKER_MODEL_PRIMARY` / `FALLBACK` (`src/lib/llm-models.ts`). Each worker returns a unified **items[]** schema (elementName, status, impact, radarCategory, rationale, workingWell, notWorking, fix, …).

| Worker | Input | Role |
|--------|--------|------|
| **Visuals** | Screenshots | Layout, hierarchy, CTA, trust, mobile, etc. |
| **Copy** | Truncated visible text (~5k chars) | Headline, value prop, objections, CTAs, etc. |
| **Tech** | Truncated HTML (scripts/styles stripped, ~3k) | Speed hints, SEO tags, **legal compliance** (AI). |

### 4.1 Legal compliance correction (deterministic)

After the tech worker, **`analyzeLegalSignalsFromHtml`** (`src/lib/legal-html-signals.ts`) scans raw HTML for **href** patterns consistent with **privacy**, **terms**, and **cookie** pages (with basic URL resolution against the audited URL). Results are merged via **`mergeLegalComplianceWithSignals`**: if links are found, the **Legal Compliance** item is forced toward **Good** with explicit “working” bullets; otherwise missing links are listed. This reduces false “missing privacy/terms” when the LLM only saw a truncated fragment.

---

## 5. Scoring and aggregation

- Items are grouped by **radarCategory** (`ux`, `conversion`, `copy`, `visuals`, `trust`, `speed`).
- **Weighted category scores** and **overall score** use fixed status/impact weights (same philosophy as the legacy Python `main.py` port).
- **Quick wins**: top items by an internal badness score; **legal** items are de-prioritized for the top-3 quick list (`partitionLegalComplianceAuditLast`).

---

## 6. Narrative roast (four segments)

When there is at least one audit item, **`generateRoastWithFallback`** (`src/lib/gemini-client.ts`) runs the **roast** models (`GEMINI_ROAST_MODEL_*`) with a strict **`|||||`**-separated format: executive summary, diagnostic, assessment, next steps. Legal topics are filtered from the diagnostic segment in code. Failure throws (no silent fallback) so errors surface in logs.

---

## 7. Insight layers (JSON)

Another Gemini call (same roast models) fills **first impression**, **trust gap**, and **messaging clarity** JSON (`INSIGHT_LAYERS_SYSTEM_PROMPT`). The system prompt instructs the model **not to invent dollar prices**. Output is merged with **`mergeInsightLayersFromAI`** and fallbacks.

---

## 8. Revenue leak block

**`buildRevenueLeakEstimate`** (`src/lib/insight-layers.ts`) builds illustrative USD scenarios using:

- **Traffic**: `defaultMonthlySessionsForRoast(industry)`.
- **Price**: from quick scan when `price_from_page`; otherwise **`DEFAULT_REVENUE_MODEL_AOV_USD`**.

Assumptions text reflects whether the price was detected or defaulted.

---

## 9. Token usage metadata

The API attaches **`_meta.auditTokenUsageTotal`** and **`_meta.auditTokenBreakdown`**:

- **Workers** (visuals, copy, tech): prompt + candidate tokens per successful model call.
- **Narrative roast** and **insight layers**: tokens from `generateRoastWithFallback` usage metadata.

This is the **total LLM token count** for the audit (sum of all stages). Legacy **`_meta.tokenUsage`** still reflects the narrative roast call when present.

---

## 10. Response payload (high level)

- `overall_score`, `radarMetrics`, `quickWins`, `detailedAudit`, `audit_items`
- Four-part narrative: `hook`, `script`, `verdict`, `closer`
- `heroScreenshot`, `pageHeight`, `price_guess`, `price_from_page`, `price_billing_note`, `industry_guess`
- `revenueLeakEstimate`, insight layer objects
- `seo`, `page_type`, `performance`
- `_meta` (tokens, cost estimate for narrative model, breakdown)

---

## 11. Client report (`/roast/[id]`)

1. Load JSON from **localStorage** (`roast_{id}`), merge optional **session hero** (`src/lib/roast-storage.ts`).
2. If hero missing, **`POST /api/roast/hero`** can fetch a first-viewport screenshot.
3. **Attention heatmap** panel overlays a **jet-style** warm/cool map on the hero image (`AttentionHeatmapPanel`).
4. **Paid gating**: `hasFullReportAccess` (plan, admin, or bypass).
5. **HTML export**: `generateAuditReportHTML` — heatmap uses shared **`buildAttentionHeatmapFigureHtml`** (same idea as PDF).
6. **PDF**: `POST /api/generate-pdf` → **`generatePaidAgencyReportHTML`** with the same heatmap helper and inline SVG fallback when there is no screenshot.

---

## 12. Billing (Dodo Payments)

1. **`POST /api/dodo/create-session`** builds a checkout session with **`product_cart`** (Pro unit, Agency 5-pack, or sandbox **$0.50** SKU) plus **metadata** (`firebase_uid`, `vc_plan`, `vc_unit_qty`). The customer is redirected to Dodo-hosted checkout (`checkout_url`).
2. After completion, **Dodo** redirects back to **`/billing`** with `payment_id` and `status`; the client **`POST /api/dodo/verify`** with a Firebase Bearer token.
3. The server retrieves **`payments.retrieve(payment_id)`**, checks **`status === succeeded`**, and validates **`metadata`** plus **line items** match the expected SKUs for that user (`assertPaymentMatchesCheckout`).
4. **Idempotency**: if `payments` collection already has this `paymentId`, the handler returns success without double-crediting.
5. Firestore **user** document: **`credits`** and **`plan`** updated when applicable (**`free_test`** adds **0 credits**); **`payments`** row stores metadata including `creditsAfter` / `planAfter`.

---

## 13. Environment variables (audit-related)

| Variable | Purpose |
|----------|---------|
| `GOOGLE_GENAI_API_KEY` | Gemini |
| `GEMINI_WORKER_MODEL_*`, `GEMINI_ROAST_MODEL_*` | Model selection |
| `DEFAULT_REVENUE_MODEL_AOV_USD` | Fallback AOV when no priced offer detected |
| `NEXT_PUBLIC_DEFAULT_NEW_USER_CREDITS` | Signup credits (default **0** in code; optional override) |
| `ROAST_CREDITS_PER_GENERATION` | Credits debited per authenticated roast (default = loader step count; use `1` for single credit) |
| `PLAN_PRO_AUDIT_CREDITS`, `PLAN_AGENCY_AUDIT_CREDITS` | Credits added on purchase |
| `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_ENVIRONMENT` (`test_mode` / `live_mode`), `DODO_PRODUCT_PRO_ID`, `DODO_PRODUCT_AGENCY_PACK_ID`, `DODO_PRODUCT_FREE_TEST_ID` | Billing |
| `NEXT_PUBLIC_PREVIEW_ROAST_USES_CREDITS` | Whether landing preview consumes credits |
| `PAGESPEED_API_KEY` | Optional performance block |

---

## 14. Operational notes

- **Truncation**: Tech and copy inputs are truncated to control tokens; deterministic **legal** pass uses **full** `htmlSource` passed into `compileRoast`.
- **Heatmap**: Illustrative only (not eye-tracking); aligned across **web**, **HTML report**, and **PDF** via shared embed markup.
- **Debugging**: Server logs include worker errors, roast generation steps, and full payload logs in development.
