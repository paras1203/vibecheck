# Vibecheck: URL submission → report — workflow and LLM prompts

This document describes the **server-side processes** from URL submission through the JSON payload used for the on-page teaser and the full `/roast/[id]` report UI. It reflects `src/app/api/roast/route.ts` and related libraries as of **2026-05-08** (expanded PSI/on-page audits, tech stack hooks, Puppeteer chromium resolution).

---

## Part 1 — Process workflow (no user-type branching)

High-level chain (single `POST /api/roast`):

1. **Request validation** — Require a string `url`; optional `device` is `desktop` or `mobile` (default `desktop`).
2. **Concurrent capture + quick scan** — `quickScan(url)` is **started immediately** on the requested URL while `captureScreenshotFromUrl(url, device)` loads the page (Puppeteer with `executablePath` from `resolvePuppeteerLaunchExecutablePath`; see `src/lib/chromium-executable.ts`). Capture returns base64 screenshots, full HTML, visible text (`pageText`), **`pageHeight`**, and optional **`documentHeaders`** (includes **`xRobotsTag`** from the navigation response when available). The route **awaits** capture and the quick-scan promise before Gemini work begins. Quick scan deterministically infers **`page_height`**, **`price_guess`**, **`industry_guess`**, pricing notes, etc. — **No LLM.**
3. **Screenshot packaging** — First screenshot becomes `ImageInput` (PNG/WebP/JPEG from magic bytes).
4. **`analyzeSEO`** + **`detectPageType`** — Run on full HTML (**no LLM**). Failures are swallowed independently.
5. **Extended programmatic bundle (single `try`; no LLM except optional tech POST)** —  
   `fetchPerformanceAuditResult(url)` (PSI v5 mobile + desktop when `PAGESPEED_API_KEY` is set); roll **`performance`** = `pageSpeedSummaryFromPerformanceAuditMobile` (legacy UI / Gemini rollup, includes **`inp`** when Lighthouse provides it); attach full **`performance_audit`**. **`runPatternTechStackAudit`** merged with **`fetchOptionalTechStackApi`** (`TECHSTACK_API_URL` / `TECHSTACK_API_KEY` optional); **`runOnPageSeoAudit(htmlContent, url, documentHeaders)`**; **`runMetaPreviewAudit`**; **`deriveBehaviourToolsAdvice`**. Stored on the response as **`on_page_seo`**, **`meta_preview`**, **`tech_stack`**, **`behaviour_tools`**.
6. **`compileRoast` — core audit** — Runs three Gemini “worker” passes **sequentially** (visuals → copy → tech), merges outputs, applies **deterministic** legal-link reconciliation, computes radar scores and overall score, then runs two more Gemini calls (narrative + insight JSON). Returns the main audit JSON structure.
7. **Post-`compileRoast` enrichment** — Merge SEO, **`page_type`**, **`performance`**, **`performance_audit`**, **`on_page_seo`**, **`meta_preview`**, **`tech_stack`**, **`behaviour_tools`** into the outward payload. Rebuild **`revenueLeakEstimate`** using quick-scan price + traffic estimate. **LLM:** optional illustrative monthly sessions (`estimateMonthlySessionsForUrl`). **LLM:** optional PageSpeed narrative (`summarizePageSpeedWithGemini` on **`performance`**). **Code:** `buildScrollEffectiveness`, `syncOverallScoreWithRadarPayload`, attach `heroScreenshot`, optional audit logging. HTML/PDF export appendices consume the same programmatic blocks via **`buildSeoPerformanceAppendixHtml`** (`report-seo-appendix.ts` + `report-extended-audit-appendix.ts`).

**Client note (out of scope for “processes” detail):** The browser stores the API JSON and navigates to `/roast/[id]` for the “full report” view. There is **no second backend job** that re-runs the three workers for “full” vs “preview”; the same response powers both teaser and report UI.

---

## Part 2 — LLM steps, prompts, and audit logic

Models are chosen via `initializeGeminiClient()` (`src/lib/gemini-client.ts` + `src/lib/llm-models.ts`): **worker** models for structured workers, traffic, and PageSpeed summary; **roast** models for narrative and insight layers. Calls use `generateWithTwoModelFallback` (workers) or `generateRoastWithFallback` (roast / shared helper) with primary → fallback on retryable errors. **Note:** Verbatim prompt blocks below omit small string fragments prepended in code (e.g. `AUDIT_WORKER_VISUAL_FOCUS`, `AUDIT_WORKER_GLOBAL_CRO_RULES`); the authoritative text is always `src/app/api/roast/route.ts`.

### Step A — Worker 1: Visuals (`analyzeVisuals`)

- **Inputs:** Screenshot images (inline base64) + text prompt (no separate system instruction).  
- **Config:** `temperature: 0.7`, `topP: 0.95`, `topK: 40`, `maxOutputTokens: 8192`, `responseMimeType: "application/json"`.

**User prompt (full template; matches `analyzeVisuals` in `src/app/api/roast/route.ts`):**

```
Act as a Senior UX Designer. Analyze these screenshots of a landing page.

Return ONLY valid JSON in this exact format (NO other keys, NO commentary):
{
  "items": [
    {
      "elementName": "Visual Hierarchy & Layout",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation",
      "workingWell": ["Specific thing that works", "Another positive"],
      "notWorking": ["Specific problem with exact details", "Another issue"],
      "conversionImpact": "How this affects conversions (1 sentence)",
      "fix": {
        "quickFix": "Actionable fix explanation with exact values",
        "example": "Code snippet or concrete example",
        "expectedImpact": "Expected conversion impact"
      }
    },
    {
      "elementName": "Navigation Clarity",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation. Is the menu intuitive? Check menu structure, labeling clarity, and user navigation flow.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with navigation structure"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Readability",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation. Check font sizes, line height, and contrast. Assess text legibility and reading comfort.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with font sizes, line height, or contrast"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix with exact font sizes, line heights, and contrast ratios",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Scroll Experience",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation. Assess if the scroll experience is guided flow vs chaotic. Check for visual breaks, section transitions, and content organization.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with scroll flow"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Aesthetics & Image Quality",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "visuals",
      "rationale": "1-2 sentence explanation. Check logo visibility and stock image authenticity. Assess image quality, relevance, and brand consistency.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with logo visibility or stock image authenticity"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "CTA Visibility",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "conversion",
      "rationale": "1-2 sentence explanation",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Trust Signals",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "trust",
      "rationale": "1-2 sentence explanation",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Mobile Layout",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    }
  ]
}

CRITICAL RULES:
- Use AT MOST 3 items per element analyzed (aim for 8 items total as shown above)
- radarCategory MUST be exactly: "ux", "conversion", "visuals", "trust", "speed" (lowercase)
- status MUST be exactly: "Excellent", "Good", "Satisfactory", "Needs Improvement", or "Failed"
- impact MUST be exactly: "HI", "MI", or "LI"
- Be specific: include exact measurements, colors (hex codes), sizes, positions
- Use professional UX terminology
- MANDATORY CHECKS: Navigation clarity (Is the menu intuitive?), Readability (Font sizes, line height, and contrast check), Scroll experience (Guided flow vs chaotic), Logo visibility & stock image authenticity check
```

---

### Step B — Worker 2: Copy (`analyzeCopy`)

- **Inputs:** After blank line, the scraped `pageText` truncated to **5000** characters is inserted between the opening line and `Return ONLY valid JSON`.  
- **Config:** Same as Worker 1.

**User prompt (full template):**

```
Act as a Lead Copywriter. Analyze this landing page text content:

<SCRAPED_TEXT_MAX_5000_CHARS>

Return ONLY valid JSON in this exact format (NO other keys, NO commentary):
{
  "items": [
    {
      "elementName": "Headline Impact",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "copy",
      "rationale": "1-2 sentence explanation of headline clarity and benefit-driven nature",
      "workingWell": ["Specific thing that works", "Another positive"],
      "notWorking": ["Specific problem with exact copy examples", "Another issue"],
      "conversionImpact": "How this affects conversions (1 sentence)",
      "fix": {
        "quickFix": "Actionable fix with exact copy rewrite suggestions",
        "example": "BEFORE: [current copy] AFTER: [improved copy]",
        "expectedImpact": "Expected conversion impact"
      }
    },
    {
      "elementName": "Value Proposition",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "copy",
      "rationale": "1-2 sentence explanation of value prop clarity and differentiation. Check for differentiation vs generic claims. Assess if the value prop is unique and specific rather than generic industry language.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with differentiation vs generic claims"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix with specific differentiation suggestions",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Persuasion & Tone",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "copy",
      "rationale": "1-2 sentence explanation of persuasion techniques and tone appropriateness. Check for Authority (expertise, credentials, social proof) and Specificity (concrete details, numbers, specific benefits).",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with authority or specificity"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix with authority and specificity improvements",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Objection Handling",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "copy",
      "rationale": "1-2 sentence explanation. Specifically look for Price, Risk, Effort, and Time addresses. Check if objections are proactively addressed in the copy.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with Price, Risk, Effort, or Time objection handling"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix addressing Price, Risk, Effort, and Time objections",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Lead Capture",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "conversion",
      "rationale": "1-2 sentence explanation. Check clarity of what happens after submit. Assess if the post-submit process is clearly communicated.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with clarity of what happens after submit"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix clarifying post-submit process",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "One Page One Goal",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "conversion",
      "rationale": "1-2 sentence explanation of competing CTAs and goal clarity",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    }
  ]
}

CRITICAL RULES:
- Use AT MOST 3 items per element analyzed (aim for 6 items total as shown above)
- radarCategory MUST be exactly: "ux", "conversion", "copy", "visuals", "trust", "speed" (lowercase)
- status MUST be exactly: "Excellent", "Good", "Satisfactory", "Needs Improvement", or "Failed"
- impact MUST be exactly: "HI", "MI", or "LI"
- Be specific: include exact copy examples, suggest rewrites, identify jargon vs benefits
- Use professional copywriting terminology
- MANDATORY CHECKS: Lead Capture (Clarity of what happens after submit), Value Prop (Differentiation vs generic claims), Objection Handling (Price, Risk, Effort, and Time addresses), Persuasive Techniques (Authority and Specificity)
```

---

### Step C — Worker 3: Tech (`analyzeTech`)

- **Inputs:** After `Analyze this HTML source code:`, the pipeline inserts **script/style-stripped** HTML truncated to **3000** characters.  
- **Config:** Same as other workers.

**User prompt (full template):**

```
Act as a Technical SEO Expert. Analyze this HTML source code:

<SCRAPED_HTML_MAX_3000_CHARS>

Return ONLY valid JSON in this exact format (NO other keys, NO commentary):
{
  "items": [
    {
      "elementName": "Page Speed Indicators",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "speed",
      "rationale": "1-2 sentence explanation of heavy scripts, image optimization, load time. Check for Caching & CDN usage (if detectable from HTML headers, cache-control tags, or CDN references).",
      "workingWell": ["Specific thing that works", "Another positive"],
      "notWorking": ["Specific problem with exact technical details", "Caching or CDN issues if detectable"],
      "conversionImpact": "How this affects conversions (1 sentence)",
      "fix": {
        "quickFix": "Actionable fix with technical specifics including caching and CDN recommendations",
        "example": "Code snippet or configuration example",
        "expectedImpact": "Expected conversion impact"
      }
    },
    {
      "elementName": "SEO Tags",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "copy",
      "rationale": "1-2 sentence explanation of H1 structure, meta description quality",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with tag names and attributes"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example HTML tags",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Legal Compliance",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "trust",
      "rationale": "1-2 sentence explanation. Inspect the HTML for hrefs to /privacy, /terms, cookie policy, disclaimers. If those hrefs exist in nav/footer, status must be Good or better—do not claim missing legal pages when links are present.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with Privacy Policy, Terms & Conditions, Cookie Policy, or Disclaimers"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix ensuring Privacy Policy, Terms & Conditions, Cookie Policy, and Disclaimers are present",
        "example": "Example link structure for all legal pages",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Mobile Form Usability",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation. Check form usability for mobile devices. Verify keyboard types for email/number inputs (type='email', type='tel', type='number'). Assess if forms are mobile-friendly.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with keyboard types for email/number inputs or mobile form usability"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix with proper input types (email, tel, number) and mobile form optimization",
        "example": "Example HTML form with correct input types",
        "expectedImpact": "Impact"
      }
    }
  ]
}

CRITICAL RULES:
- Use AT MOST 3 items per element analyzed (aim for 4 items total as shown above)
- radarCategory MUST be exactly: "ux", "conversion", "copy", "visuals", "trust", "speed" (lowercase)
- status MUST be exactly: "Excellent", "Good", "Satisfactory", "Needs Improvement", or "Failed"
- impact MUST be exactly: "HI", "MI", or "LI"
- Be specific: include tag names, attribute values, link URLs
- Use professional SEO terminology
- MANDATORY CHECKS: Speed (Caching & CDN usage if detectable), Legal (only flag missing policies when hrefs are absent in the HTML snippet), Mobile (Form usability - keyboard types for email/number)
```

---

### Step D — Deterministic merge (not LLM)

- **`analyzeLegalSignalsFromHtml(htmlSource, pageUrl)`** — Regex/href scan for privacy, terms, cookie paths (`src/lib/legal-html-signals.ts`).  
- **`mergeLegalComplianceWithSignals`** — Adjusts the Legal Compliance row from Worker 3 when signals conflict with the model.

---

### Step E — Scoring and aggregation (not LLM)

- **Radar metrics** — For each of `ux`, `conversion`, `copy`, `visuals`, `trust`, `speed`, weighted average from worker items using:  
  - `statusPoints`: Excellent 95, Good 80, Satisfactory 60, Needs Improvement 35, Failed 5.  
  - `impactMultipliers`: HI 1.5, MI 1.0, LI 0.5.  
- **Overall score** — Integer mean of the six radar scores.  
- **Quick wins** — Top 4 items by `calculateBadnessScore(status, impact)` among **non–Legal Compliance** items; maps `notWorking` and `fix.quickFix` into the quick-fix list.  
- **`detailedAudit`** — Groups all items by `radarCategory`; legal rows ordered last via `partitionLegalComplianceAuditLast`.

---

### Step F — Narrative roast (`generateRoastWithFallback` — roast models)

- **When:** Only if `allItems.length > 0`.  
- **Inputs built in code:**  
  - Up to **15** failed / needs-improvement lines: `- elementName: status`.  
  - **Raw content** from `extractRawContent`: H1, button texts, hero snippet, first paragraph.  
- **Config:** `temperature: 0.65`, `topP: 0.95`, `topK: 40`, `maxOutputTokens: 8192`.

**System instruction (verbatim):**

```
You are a senior conversion strategist and CRO lead auditing a commercial page. Your tone is sharp, analytical, confident, and business-focused. No sarcasm, no mockery, no rant voice.

Return exactly four segments of plain text separated by "|||||" (five pipe characters) in this order:
1) EXECUTIVE_SUMMARY — For decision-makers. Start with a direct line on how the page is performing vs. the audit (e.g. underperforming on clarity, trust, or conversion). Then list 2–3 numbered critical failures tied to the failed audit items (use their themes). Add one sentence on business impact (conversion leakage, trust, decision friction—qualitative only; do not invent dollar figures). End with one sentence giving clear direction on what to fix first and why. Minimum ~55 words.
2) DIAGNOSTIC_ANALYSIS — Layered analysis: observations grounded in the raw page content (quote or paraphrase H1, buttons, hero copy where relevant), implications for conversion, then prioritized actions. Minimum ~120 words. Professional prose.
3) ASSESSMENT — 2–3 lines: concise strategic verdict.
4) NEXT_STEPS — 1–3 lines: professional CTA to upgrade for full detail. You MUST include this exact sentence verbatim: "Full diagnostic includes exact rewrite, layout fixes, and conversion strategy."

Do NOT mention legal compliance, GDPR, privacy policies, cookie policy, or similar legal topics in segments 1–2.

Never start any segment with the literal labels EXECUTIVE_SUMMARY, DIAGNOSTIC_ANALYSIS, ASSESSMENT, or NEXT_STEPS (no headers—start directly with the prose).

FORMATTING: Return ONLY the four segments separated by ||||| with no other wrapper. Example shape: [executive] ||||| [diagnostic] ||||| [assessment] ||||| [next steps]
```

**User prompt template (verbatim):**

```
Failed / needs-improvement audit items:
${auditDumpStr}

${rawContentStr}

OUTPUT: Four segments separated by ||||| exactly:
EXECUTIVE_SUMMARY ||||| DIAGNOSTIC_ANALYSIS ||||| ASSESSMENT ||||| NEXT_STEPS

Rules:
- EXECUTIVE_SUMMARY: Numbered 2–3 critical failures aligned with the audit list; impact sentence; direction sentence.
- DIAGNOSTIC_ANALYSIS: Substance over volume; cite page copy where it helps; no snark.
- ASSESSMENT: Sharp and short.
- NEXT_STEPS: Include the exact required upgrade sentence and invite full report access.

FORBIDDEN in segments 1–2: legal compliance, GDPR, privacy policy language.
```

**Post-processing:** Split on `|||||` (fallback separators `---`, `***`, `\n\n\n`). Enforce diagnostic length (throws if word count under threshold ~80 words). **Strip lines** from the diagnostic segment that contain legal keywords. Ensure `closer` includes `FULL_DIAGNOSTIC_UPGRADE_HOOK` from `src/lib/report-copy.ts` (`"The full layer adds evidence, sequencing, and implementation detail for every issue."`). Hardcoded fallbacks exist if generation fails or fields are empty.

---

### Step G — Insight layers JSON (`INSIGHT_LAYERS_SYSTEM_PROMPT` + user prompt)

- **Module:** `src/lib/insight-layers.ts`  
- **Config:** `temperature: 0.45`, `topP: 0.95`, `topK: 40`, `maxOutputTokens: 4096`, `responseMimeType: "application/json"`.

**System prompt (verbatim):**

```
You are a senior conversion consultant. Output concise, precise JSON only. Tone: professional, neutral, actionable—no hype, jokes, or dramatic language.

Scoring: integers 0–100 only for current and proposed. proposed must be >= current unless the impact text explicitly explains a staged rollback (rare); prefer proposed >= current.

Return ONLY valid JSON matching this shape (no markdown):
{
  "firstImpressionScore": {
    "layerSummary": "1-2 sentences",
    "composite": { "current": 0, "proposed": 0, "impact": "one sentence" },
    "subscores": {
      "headlineClarity": { "current": 0, "proposed": 0, "impact": "short" },
      "ctaVisibility": { "current": 0, "proposed": 0, "impact": "short" },
      "visualHierarchy": { "current": 0, "proposed": 0, "impact": "short" }
    },
    "highPrioritySignals": ["2-4 short items"]
  },
  "trustGapIndex": {
    "layerSummary": "1-2 sentences",
    "composite": { "current": 0, "proposed": 0, "impact": "one sentence" },
    "subscores": {
      "testimonials": { "current": 0, "proposed": 0, "impact": "short" },
      "guarantees": { "current": 0, "proposed": 0, "impact": "short" },
      "proof": { "current": 0, "proposed": 0, "impact": "short" },
      "perceivedRisk": { "current": 0, "proposed": 0, "impact": "short" }
    },
    "highPrioritySignals": ["2-4 short items"]
  },
  "messagingClarityScore": {
    "layerSummary": "1-2 sentences",
    "composite": { "current": 0, "proposed": 0, "impact": "one sentence" },
    "subscores": {
      "valueProposition": { "current": 0, "proposed": 0, "impact": "short" },
      "readability": { "current": 0, "proposed": 0, "impact": "short" },
      "specificity": { "current": 0, "proposed": 0, "impact": "short" }
    },
    "highPrioritySignals": ["2-4 short items"]
  }
}

Do not include priority fields; the client derives priority from composite.current.

Do not invent dollar prices, subscription tiers, or "$X/mo" figures in summaries; rely on audit signals and radar only.
```

**User prompt template (verbatim):**

```
Radar scores (0-100): ${radarSummary}

Audit items needing attention:
${auditDumpStr}

${rawContentStr}

Return JSON only per the schema.
```

`mergeInsightLayersFromAI` normalizes and fills gaps from radar-derived fallbacks if parsing fails.

---

### Step H — Traffic estimate (after main compile, `estimateMonthlySessionsForUrl`)

- **File:** `src/lib/traffic-estimate.ts`  
- **Config:** `temperature: 0.25`, `maxOutputTokens: 256`, `responseMimeType: "application/json"`.  
- **System instruction:** none (single user prompt).

**Prompt (verbatim template):**

```
Estimate ILLUSTRATIVE monthly website sessions (not exact analytics) for this domain.

Return JSON ONLY:
{
  "monthlySessions": <integer between 500 and 15000000>,
  "confidence": "low" | "medium",
  "rationale": "<= 120 chars, no line breaks>"
}

Context:
- hostname: ${host}
- full URL: ${auditedUrl}
- guessed industry: ${industryGuess}
- page type: ${pageType}
- page text sample (truncated): ${sample || "(none)"}

Use public knowledge of brand scale when the domain is well-known (e.g. major SaaS, retailers). For unknown sites, prefer conservative mid-range values. Never claim you have analytics data.
```

---

### Step I — PageSpeed Gemini summary (`summarizePageSpeedWithGemini`)

- **File:** `src/lib/pagespeed-gemini-summary.ts`  
- **Runs:** Only if PageSpeed returned usable metrics.  
- **Config:** `temperature: 0.35`, `maxOutputTokens: 1024`, `responseMimeType: "application/json"`, no separate system instruction.

**Prompt (verbatim template):**

```
You are a web performance expert. Given lab metrics from Google PageSpeed Insights (Lighthouse) for the URL below, respond with JSON ONLY (no markdown):
{
  "summary": "2-4 sentences explaining what these numbers mean for real users and conversion risk",
  "quickFixes": ["first concrete speed fix tied to the metrics", "second concrete speed fix"]
}

Rules:
- quickFixes must be exactly two strings, each actionable in one line.
- Do not invent metrics; only interpret those provided (rollup may include **`inp`** when PSI/Lighthouse exposes it).
- If a metric is missing, do not claim you measured it.

Metrics (JSON): ${JSON.stringify(payload)}
```

---

## Summary table

| Order | Name | LLM? | Purpose |
|------:|------|------|---------|
| 1 | Capture ∥ quick scan | No | Screenshots/HTML/text + heuristic pricing/industry (**two** Puppeteer passes; chromium path resolver) |
| 2 | SEO + page type + extended PSI / Cheerio / tech | No\* | Legacy `seo`, `page_type`, `performance_audit` + `performance` rollup, `on_page_seo`, `meta_preview`, `tech_stack`, `behaviour_tools` |
| 3 | Visuals worker | Yes | Structured UX/visual audit items |
| 4 | Copy worker | Yes | Structured copy/conversion items |
| 5 | Tech worker | Yes | Structured tech/SEO/legal/form items |
| 6 | Legal href merge | No | Reconcile Legal Compliance row |
| 7 | Radar + overall + quick wins | No | Scores and prioritization |
| 8 | Narrative roast | Yes | Four-part executive/diagnostic copy |
| 9 | Insight layers | Yes | firstImpression / trustGap / messaging JSON |
| 10 | Traffic estimate | Yes | Illustrative monthly sessions |
| 11 | PageSpeed Gemini summary | Yes | Human-readable performance blurb + 2 fixes (from `performance`) |
| 12 | Scroll / hero / score sync | No | Report extras |

\*Optional HTTP POST to **`TECHSTACK_API_URL`** merges third-party signals; no Gemini.

---

## Source of truth in code

- Orchestration: `src/app/api/roast/route.ts` (`POST`, capture/scan parallelism, **`fetchPerformanceAuditResult`** + rollup, **`src/lib/audits`**, `compileRoast`, worker prompts).
- Expanded audits & types: `src/lib/audits/*`, `src/lib/pagespeed.ts`.
- Capture headers: `src/lib/capture.ts`.
- Puppeteer binary: `src/lib/chromium-executable.ts`.
- Insight prompt: `src/lib/insight-layers.ts` (`INSIGHT_LAYERS_SYSTEM_PROMPT`).
- Traffic: `src/lib/traffic-estimate.ts`.
- Performance copy: `src/lib/pagespeed-gemini-summary.ts`.
- Legal signals: `src/lib/legal-html-signals.ts`.
- Report HTML appendix wiring: `src/lib/report-seo-appendix.ts`, `src/lib/report-extended-audit-appendix.ts`.
- Model routing: `src/lib/gemini-client.ts`, `src/lib/llm-models.ts`.
