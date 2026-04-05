## 2026-04-02 - Razorpay payment failed / unknown error (checkout)
**Category:** Core Logic / Bugfix
**Instruction:**
> Razorpay showed payment failed with unknown error when purchasing. Address by defaulting Orders to **INR** + paise for typical India merchant keys (USD optional via `RAZORPAY_CURRENCY=USD`), documenting env overrides, clarifying billing page copy (USD display vs checkout currency), and improving verify failure messaging on the client when the API returns empty fields.

## 2026-04-02 - Pricing anchors $79 list + agency double discount copy
**Category:** Feature Request / UX
**Instruction:**
> Keep discount framing from $79 for 1 credit; for agency, double the discount / strikethrough messaging (stronger stacked savings vs list and vs checkout singles).

## 2026-04-02 - Roast credits per generation + SEO issue paywall
**Category:** Core Logic / Feature Request
**Instruction:**
> Fix credit logic: each report generation step should consume 1 credit (align charge with loader steps). Hide SEO issues `META_DESCRIPTION_LENGTH` and `IMAGE_ALT_COVERAGE_LOW` for free users behind the same paywall treatment as extra quick-fix rows (dashed skeleton).

## 2026-04-02 - USD pricing $19 / $59 + report section order
**Category:** Feature Request / Architecture
**Instruction:**
> Pricing: USD $19 for 1 credit and USD $59 for 5 credits with discount logic (bundle vs 5× single). On roast report: move Executive insight layers (revenue leak + three insight cards) above SEO health; place AI Insights directly under “Insights & actions”, with SEO below that.

## 2026-04-02 - Free credits 3, Scroll of Death copy simplification
**Category:** Feature Request / Core Logic
**Instruction:**
> Free users get 3 free credits (default). On Scroll of Death “How to read”: remove the “how we calculate” block; place the score meaning beside the big percentage; rewrite the situation summary in plain language (no pixel math / technical capture details).

## 2026-04-02 - Heatmap shapes less oval / more organic
**Category:** Feature Request / UX
**Instruction:**
> Heatmap overlay shapes read as ovals; adjust so the visualization feels closer to a real heatmap (irregular patches, not smooth ellipses).

## 2026-04-02 - Attention heatmap overlay visible again (reference style)
**Category:** Feature Request / UX
**Instruction:**
> Restore the gaze-style heatmap over the hero screenshot like the provided references (soft red/orange/yellow/green/blue blobs across the capture); previous overlay looked “lost” on the report—fix visibility and styling.

## 2026-04-02 - Site Score radar column width + Scroll of Death list visibility
**Category:** Feature Request / UX
**Instruction:**
> Tighten ChartPanel/radar spacing; narrow the radar column (fixed ~268px on lg) so the six-axis grid gets more width while the radar polygon stays similar size. Scroll-of-death issues/fixes list: adjust typography/spacing so full text is visible (not clipped).

## 2026-04-02 - Roast report: Site Score card, executive summary, scroll zones, heatmap band
**Category:** Feature Request / UX
**Instruction:**
> Keep radar on the right (~40%); put axis grid in the same card; remove standalone “Site Score” label above the row. Format scroll zone headers as “Title | Subtitle”. Scroll issue/fix lines: larger type, no clipped text. Attention heatmap: illustrative gaze-style overlay limited to top 25% of capture with clear copy (not real eye-tracking). Remove first executive/stopper block; merge remaining roast/verdict/closer summaries under one titled executive summary.

## 2026-04-02 - Scroll of Death copy: simplify flagged section
**Category:** Feature Request / Core Logic
**Instruction:**
> The Scroll of Death / “what we flagged” block has too much text—simplify the flagged section and findings; state issue and solution in precise words; implement in audit logic (not only UI trim).

## 2026-04-02 - PageSpeed + Gemini + traffic + report layout + Scroll of Death + heatmap
**Category:** Feature Request / Architecture
**Instruction:**
> Implement plan (no plan file edits): PageSpeed PERFORMANCE category + TBT; Gemini speed summary + two quick fixes; URL-aware monthly session estimate (Gemini JSON + industry fallback) for revenue leak assumptions; report page — site score radar + six-axis grid directly under verdict (sample style), hide Revenue Impact Calculator, move Insights & actions (Industry insider + Quick fixes) below radar, trim Performance row to two cards; Scroll of Death from audit findings + scroll metrics; fix attention heatmap overlay alignment (aspect box, smaller radials); plumb types through HTML/PDF appendix; .env.example for PSI + traffic disclaimers.

## 2026-04-02 - Vercel Chromium, Firebase domain, INP, landing auth/copy, Razorpay verify
**Category:** Feature Request / Core Logic
**Instruction:**
> (1) Vercel: after Roast, error that @sparticuz/chromium bin / brotli path missing. (2) Firebase auth/auth-domain-config-required for Google login (Firestore note). (3) INP on element with text-destructive — event handlers blocking UI ~274ms. (4) Remove Google button on landing navbar; add Login / Register text links and wire flow. (5) Replace landing hero text with “AI-powered audit. Fix your conversion rate in minutes.” (6) Payment verification failed after payment flow — fix.

## 2026-03-31 - Razorpay verification, credits, tokens, audit accuracy, heatmap, audit doc
**Category:** Core Logic / Feature Request / Architecture
**Instruction:**
> Fix Razorpay demo checkout returning “Payment verification failed” and no credits. Give 5 free credits to registered users (basic scan; pro behind paywall); pro users get extra credits from env for pro audit. Calculate total LLM token usage per audit. Fix audit falsely flagging missing privacy/terms when present and wrong pricing (e.g. $5/mo when no landing pricing). Root-cause and fix heatmap image fit in web/HTML/PDF with a clear heatmap look. Add an MD file documenting the full audit process start-to-end.

## 2026-03-31 - Replace PayPal with Razorpay + Remote MCP
**Category:** Feature Request / Architecture
**Instruction:**
> Remove PayPal checkout; implement Razorpay so purchase starts the workflow; set up Razorpay MCP per https://razorpay.com/docs/mcp-server/remote/ ; test keys rzp_test_SXqjtae8WXWGtE / k7QRb0hCXjascSZQ3bgX0fkd.

## 2026-03-31 - PayPal single-payment alignment (Checkout / Orders v2)
**Category:** Architecture / Feature Request
**Instruction:**
> Check PayPal docs (catalog products, checkout, subscriptions) and ensure the code is set perfectly for single payments.

## 2026-03-30 - Conversion analysis loader timing (20 steps)
**Category:** Core Logic / UX
**Instruction:**
> In Running conversion analysis, 19 steps complete very fast while the 20th takes a long time. Target a ~1 minute audit: steps 1–19 should take ~40–45 seconds, and the 20th step should finish in ~15 seconds.

## 2026-03-29 - Landing copy, loader UX, heatmap, auth, dashboard, credits, preview, insider
**Category:** Feature Request / Core Logic / Architecture
**Instruction:**
> Remove “AI landing page audits” and “Get a full conversion audit in under 60 seconds…” from landing. Running conversion analysis: completed steps behavior, in-process step centered, chronological depth, fix popup size and step display. Attention heatmap: fix stretched image, px-friendly viewport, key area not full page. Logged-in user must stay logged in until logout; fix broken flows and repeated signup. Recent reports lost on dashboard — fix; show credit usage after successful scan; credit balance flow; env for free scan and bonus scans for promos. “Continue to full report” and other buttons — verify flows. Rename “Your audit preview” to “{URL} audit preview”. Industry insider on preview derived from audit, authentic/personal. Thorough flow and button checks.

## 2026-03-28 - Loader steps, /home, login copy, SiteRoast, overlay z-index & scroll, teaser
**Category:** Feature Request / UX
**Instruction:**
> Running conversion analysis: expand from ~4 visible steps to ~20 depth steps while keeping existing messages. Add Home above Dashboard with roast-my-site UI (button on right), recent 3 reports, guide to dashboard. Login: “Welcome” on signup, “Welcome back” on login; remove dashboard/billing/saved reports subtitle. Restore SiteRoast on key pages. Scroll-down arrows must not sit above active report generation modal; fix overlay. Free/paid roast popup: full-height issues, teaser snippet not visible, scroll broken — fix per prior teaser intent.

## 2026-03-28 - Performance, auth, email link, PayPal, UI, rebrand, admin reset
**Category:** Feature Request / Architecture / Core Logic
**Instruction:**
> Page loading slow — fix. Auth broken — Google and all channels; taking forever. Reference Firebase email link auth and implement in JS. Firebase production. Logo 20% bigger. Landing menu full width. Audit flows and test. Improve Top Money zone / Middle engagement drop / Bottom graveyard visually. Rename to Sample Sample. PayPal not loading when buying plans — fix. Move Reset my data to admin dashboard top right.

## 2026-03-28 - Dashboard order, settings, legal nav, scroll/heatmap, revenue leak, diagnostics
**Category:** Feature Request
**Instruction:**
> Remove quick action block; match credit block UI with dashboard tile then remove credits from dashboard; bring analytics on top; analytics show only Reports (this device), Latest score, Unique domains, Average score, Score distribution, Top domains; Recent reports below analytics; Settings Plan — remove billing/credits, buy more credits only; Manage account — name with edit icon, email, change password, plan details; Privacy/T&C Home → dashboard if logged in else landing; Scroll of Death — softer table colors; sample executive pulse more conversion-focused; revenue leak from scraped price + industry traffic benchmark; remove duplicate Diagnostic / DIAGNOSTIC_ANALYSIS text; scroll profile explanation + action; attention heatmap with screenshot + overlay.

## 2026-03-28 - Dashboard, analytics, billing parity, settings, legal, workspace name
**Category:** Feature Request / Architecture
**Instruction:**
> Remove recent reports block, move Saved on this device from history menu to dashboard below quick actions and name it recent reports, remove reports tab from top and delete history menu. Add analytics tiles, charts, statistics instead of basic analytics block. Show buy extra credits marketing highlighter on both packs (pro and agency), discounted amounts same as landing page. Single settings page (not tabs): manage account, password, theme icons top right, plan title only no description, logout, legals, delete account at bottom. Create legal screens privacy and T&C suitable to product. Make workplace name editable.

## 2026-03-28 - Post-audit loader, sidebar, legal deprioritization, teaser report style
**Category:** Feature Request
**Instruction:**
> In the running conversion analysis block, show multiple setup messages in chronological order until the process completes (build user trust). Remove the Home menu item from app navigation. When showing the report, never prioritize legal/compliance—place those in the middle or at the end. The brief report after audit should match the sample report style so free users feel the pull to pay for the full report; lean on money left on the table / anxiety.

## 2026-03-26 - Radar chart, Industry Insider copy, PayPal checkout
**Category:** Feature Request
**Instruction:**
> Site score radar shows a vertical bar and nothing else — fix it everywhere. Add 3 points in Industry Insider (text should appeal to the user, not generic or theoretical). Buy buttons on landing page and billing should open the PayPal payment page.

## 2026-03-25 - Executive insight layers (schema + generation + UI)
**Category:** Architecture / Feature Request
**Instruction:**
> Enhance audit engine and report schema: keep existing 2% uplift as base scenario; add revenueLeakEstimate (low/base/high scenarios, visible assumptions, methodology line, estimate disclaimer); add firstImpressionScore, trustGapIndex, messagingClarityScore with sub-scores, composite current/proposed/impact, highPrioritySignals; single JSON Gemini call for the three scored layers; consultant-grade tone (no theatrical copy); preserve radar and detailedAudit; standalone cards/sections in Next report, Streamlit, HTML/PDF exports; sub-score detail behind paid where specified.

## 2026-03-26 - SiteRoast Privacy Policy & Terms & Conditions
**Category:** Feature Request
**Instruction:**
> Create Privacy Policy and Terms & Conditions pages for SiteRoast. Context: based in India; serves global users; uses AI processing; processes website URLs and extracted data; uses Firebase and payment gateway (Razorpay). Privacy Policy must include: data collected (URL, usage data, auth data); purpose of processing (audit generation); third-party services; data retention policy; cookies usage; user rights (access, deletion); GDPR-style compliance language; contact email. Terms & Conditions must include: service description; limitation of liability; no guarantee of business results; acceptable use; payment/refund policy; intellectual property; termination clause. Keep language professional, simple, legally safe.

## 2026-03-25 - Landing payments, report names, credits/plan, settings, sample report
**Category:** Feature Request
**Instruction:**
> todo — connect payment flow to plans on landing page; reports name should cover site URL without prefix/suffix for identification (e.g. siteroast_mar26 for siteroast.com audit Mar 26); fix audit plan → payment → credit purchase → credit usage → quota update flow; settings — add edit name/email, forgot password; landing sample report block — one line cost of inaction, two industry insights, all six radar parameters.

## 2026-03-25 - SiteRoast premium SaaS UI (controlled execution)
**Category:** Architecture
**Instruction:**
> Implement the phased plan (globals tokens + chart vars, Settings Appearance Light/Dark/System, primitives, icons, shell, ChartPanel/RoastRadar, landing restructure with hero secondary CTA and `#preview` sample block, roast report score hero + SectionHeaders + premium quick-win lock without blur + PaywallOverlay polish, PDF/report-theme typography, cross-page spacing); do not change business logic, API contracts, routes, or payments; do not edit the plan file; complete all todos and verify with build.

## 2025-03-25 - Premium UI/UX and design-system cleanup (plan implementation)
**Category:** Architecture
**Instruction:**
> Implement the attached plan end-to-end: Inter + JetBrains Mono, semantic CSS tokens (surfaces, success/warning, chart palette), real light/dark via next-themes, replace ad-hoc colors with primitives, charts/tooltips, shell/sidebar, landing, roast dashboard, other routes/dialogs, align PDF + browser HTML report via shared report-theme; do not edit the plan file; complete all plan todos including verify (lint, build). No changes to roast scoring, payments, or business logic.

## 2025-12-22 - Design System JSON (Screenshot Replication)
**Category:** Feature Request
**Instruction:**
> "Deeply analyse the design in the attached screenshot to create a design.json for this project that describes the style and design of every UI component needed in a design system at a high level, as a creative director would. Capture high-level guidelines for structure, spacing, fonts, colours, design style and design principles so I can use this file as the design guidelines for my app. The goal of this file is to instruct AI to replicate this look easily in this project."

## 2025-12-24 - Fix malformed debug JSON output
**Category:** Feature Request
**Instruction:**
> "below is debug file text to correct error - (user provided a JSON-like debug blob using `{{` / `}}` object braces and mismatched closings). Fix it so the debug output is valid JSON."

## 2025-01-22 - JSONDecodeError fixes (Native JSON Mode + Janitor Cleaner + Safety Net)
**Category:** Core Logic
**Instruction:**
> "I am encountering JSONDecodeError because the output is too large or malformed. Please apply these 3 fixes to main.py immediately:
> 1. ENABLE NATIVE JSON MODE: Update the generation_config in the analyze_website function to use specific parameters that force valid JSON structure: generation_config = { 'temperature': 0.7, 'top_p': 0.95, 'top_k': 40, 'max_output_tokens': 8192, 'response_mime_type': 'application/json' }
> 2. ADD THE 'JANITOR' CLEANER: Before parsing, pass the raw text through this cleaning logic to strip Markdown formatting: def clean_json_text(text): text = text.replace('```json', '').replace('```', ''); start = text.find('{'); end = text.rfind('}') + 1; if start != -1 and end != 0: return text[start:end]; return text
> 3. DEBUGGING SAFETY NET: Wrap the json.loads() call in a try/except block. If it fails: Print st.error(f'JSON Parse Error. Raw Output: {text[:500]}...') to the UI so we can see exactly what broke. Fallback: Return a valid 'Error JSON' object so the dashboard shows a 'Analysis Failed' card instead of crashing the whole app."

## 2025-01-22 - Permanent JSON Parse Error Fix (Truncation Detection + Completion)
**Category:** Core Logic
**Instruction:**
> "I am getting a JSON parse error repeatedly, and it needs a permanent fix. Check what is not working as it suddenly started popping. Everything was working perfectly fine earlier. Is it because our LLM version isn't fit to give longer output or something else? There is no change in API and its within the limit of usage. Fix the JSON parsing to handle truncated responses by detecting truncation from finish_reason and completing incomplete JSON by adding missing closing braces/brackets."

## 2025-01-22 - Assembly Line Architecture Refactor
**Category:** Architecture
**Instruction:**
> "I need to refactor the analyze_website function in main.py to use a robust 'Assembly Line' architecture. This is to solve the Token Limit errors while maintaining the high quality of our report.
>
> CRITICAL RULE: DO NOT DELETE EXISTING FEATURES.
>
> Keep the PDFReport class and logic (Maiden page, borders, stitched heatmap). Keep the stitch_images and heatmap generation logic. Keep the 'Vibe' Progress Bar messages (just map them to the new steps). Keep the 'High-Converting Landing Page' constitution (the audit rules).
>
> 1. THE ASSEMBLY LINE (Split the Brain): Replace the single monolithic analyze_website call with 3 specialized functions. Each must use Native JSON Mode (response_mime_type: application/json) and max_output_tokens: 8192.
>
> Worker 1: analyze_visuals(images) - Input: The list of screenshots. Prompt: 'Act as a Senior UX Designer. Analyze these screenshots. Output JSON with specific scores and findings for: Visual Hierarchy, Trust Signals (Logos/Testimonials), CTA Visibility, and Mobile Layout.' Limit: Max 3 findings per category.
>
> Worker 2: analyze_copy(text_content) - Input: The cleaned text (from document.body.innerText). Prompt: 'Act as a Lead Copywriter. Analyze this text. Output JSON with scores/findings for: Headline Impact (Benefit-driven?), Value Proposition, Persuasion/Tone, and 'One Page One Goal' check.'
>
> Worker 3: analyze_tech(html_source) - Input: The cleaned HTML (stripped of scripts). Prompt: 'Act as a Technical SEO Expert. Analyze this source code. Output JSON with scores/findings for: Page Speed Indicators (heavy scripts?), SEO Tags (H1/Meta), and Legal Compliance (Privacy/Terms links).'
>
> 2. THE MANAGER FUNCTION (compile_roast): Create a master function that: Calls analyze_visuals, analyze_copy, and analyze_tech sequentially. Updates the 'Vibe' Progress Bar after each step. Merges the 3 JSON outputs into the single God Mode JSON schema we defined earlier (overall_score, radar_data, categories...). Fallback: If one worker fails (e.g., Tech audit errors), catch the error and fill that section with 'N/A' so the report still generates.
>
> 3. INTEGRATION: Ensure the scrape_website function still returns images, text, AND html. Pass this merged JSON to the existing display_dashboard and generate_pdf functions."

## 2025-01-22 - Unified JSON Schema Refinement (Assembly Line v2)
**Category:** Architecture
**Instruction:**
> "I need to refine the existing 'Assembly Line' architecture in main.py. We are moving from generic JSON to a Strict Unified Schema for all workers.
>
> CRITICAL CONSTRAINTS (DO NOT DELETE):
> - Preserve the PDFReport class, stitch_images, heatmap logic, and scrape_website functions.
> - Preserve the 'High-Converting Landing Page' audit rules.
> - Preserve the 'Vibe' progress bar (just update the step names).
>
> GOAL: Refactor the 3 workers (analyze_visuals, analyze_copy, analyze_tech) to output a Unified JSON Shape and update the manager (compile_roast) to score and aggregate this data.
>
> 1. COMMON JSON SCHEMA FOR ALL WORKERS: Every worker MUST return JSON with 'items' array containing objects with: elementName, status (Excellent/Good/Satisfactory/Needs Improvement/Failed), impact (HI/MI/LI), radarCategory (ux/conversion/copy/visuals/trust/speed), rationale, workingWell, notWorking, conversionImpact, fix {quickFix, example, expectedImpact}. Use AT MOST 3 items per sub-area.
>
> 2. MAPPING FOR EACH WORKER: Worker 1 (analyze_visuals): Visual Hierarchy & Layout → ux, Aesthetics & Image Quality → visuals, CTA Visibility → conversion, Trust Signals → trust, Mobile Layout → ux. Worker 2 (analyze_copy): Headline Impact → copy, Value Proposition → copy, Persuasion & Tone → copy, One Page One Goal → conversion. Worker 3 (analyze_tech): Page Speed Indicators → speed, SEO Tags → copy, Legal Compliance → trust.
>
> 3. MANAGER FUNCTION (compile_roast): Call all 3 workers, merge items, generate roast summary using AI, calculate scores (Status Points: Excellent=95, Good=80, Satisfactory=60, Needs Improvement=35, Failed=5; Multipliers: HI=1.5, MI=1.0, LI=0.5), compute overallScore and radarMetrics, build final JSON with overview, roastSummary, radarMetrics, quickWins, detailedAudit. Handle errors gracefully.
>
> 4. UPDATE PROGRESS BAR: Update messages to 'Scanning visuals…', 'Roasting your copy…', 'Checking speed & legal stuff…'."

## 2025-01-22 - Free ROI Simulator Feature (Lead Magnet)
**Category:** Feature Request
**Instruction:**
> "I need to build a new, separate feature called 'Free ROI Simulator' to act as a lead magnet.
>
> 1. ARCHITECTURE (New Page) - add a button on landing page to go to this page:
> Create a sidebar navigation in main.py:
> Option 1: 'Full Deep Audit ($19)' (The current tool).
> Option 2: 'Free Revenue Check' (The new tool).
> Constraint: The new tool must be isolated. Do not break the existing analyze_website logic.
>
> 2. BACKEND: THE 'LIGHT' SCRAPER: Create a function quick_scan(url) using Playwright that does NOT take screenshots (for speed). It should extract:
> Page Height: document.body.scrollHeight.
> Pricing Guess: Regex search the visible text for dollar signs (e.g., $19, $49, $99/mo). Return the most likely 'Product Price' (median of found values). Default to $50 if none found.
> Industry Guess: Check meta tags/title for keywords (SaaS, Agency, E-com). Default to 'SaaS'.
>
> 3. FRONTEND: THE 'JERK' DASHBOARD (Visuals): Layout the page to be shocking and visual.
> Section A: The 'Bleeding' Header (Auto-Calculated)
> Logic: Lost Revenue = (Traffic [default 1000] * 0.015 [lift] * Price * 12).
> Visual: Display a massive Red Metric: '⚠️ Estimated Yearly Loss: $[Amount]'.
> Subtext: 'Based on your detected price of $[Price] and avg industry traffic.'
> Inputs: Allow user to edit Price, Traffic, and Industry after the auto-guess to refine the shock.
> Section B: The 'Underworld' Scroll Visualizer
> Logic: Use the fetched Page Height.
> Visual: Draw a vertical progress bar (using HTML/CSS or Streamlit progress).
> Top 1500px: Green Zone ('Money Zone').
> Everything below: Red Gradient Zone ('The Underworld').
> Marker: Show where their page ends.
> Text: 'Your page is [Height]px long. 60% of your content is in the Underworld where <5% of users go.'
> Section C: The 'Jealousy' Graph (Competitors)
> Logic: Since we can't fetch real competitor traffic for free, use 'Industry Benchmarks'.
> Visual: A Bar Chart (Altair/Streamlit):
> Bar 1 (You): 1,000 visits (Grey).
> Bar 2 (Top Competitor): 8,500 visits (Red - 'The Standard').
> Text: 'Top [Industry] players get 8.5x your traffic. A better landing page captures this demand.'
> Section D: The 'No-Brainer' CTA
> Card: 'Recover this revenue for $19.'
> Math: 'Cost: $20. Potential Gain: $[Lost Revenue]. ROI: 5000%.'
> Button: 'Unlock Full Audit Now' (Redirects/Switches to the Main Audit Page).
>
> 4. EXECUTION: Implement this render_roi_page() function and integrate it into the main.py sidebar structure."

## 2025-01-22 - Database Management (Firebase Firestore Integration)
**Category:** Architecture
**Instruction:**
> "I want to stick to the Google Ecosystem. We will use Google Firestore (Firebase) instead of Supabase to save our scan history.
>
> 1. ADD DEPENDENCY: Add firebase-admin to requirements.txt.
>
> 2. CREATE db_firebase.py: Create a new file to handle Google connections. Initialize Firebase App (Singleton check). Load credentials from Streamlit secrets key_dict = json.loads(st.secrets['FIREBASE_KEY']). Create save_scan function that saves to Firestore 'scans' collection with fields: url, audit_json, overall_score, created_at (SERVER_TIMESTAMP), is_paid (False).
>
> 3. UPDATE main.py: Import save_scan from db_firebase. Call save_scan inside the analyze_website function just like we planned before (after roast_data is generated, with url, audit_data, and score).
>
> 4. INSTRUCTION FOR ME: Tell me exactly how to format the 'FIREBASE_KEY' inside the .streamlit/secrets.toml file."

## 2025-01-22 - 1:1 Logic Migration from Python to TypeScript
**Category:** Core Logic / Architecture
**Instruction:**
> "I need to perform a 1:1 Logic Migration of the backend processes from main.py (Python) to app/api/roast/route.ts (Next.js/TypeScript). You need to go line by line and process by process without losing code logic or process flow.
>
> CRITICAL INSTRUCTION: Do not summarize. Do not simplify. Your goal is 100% Logic Parity. Treat main.py as the absolute source of truth.
>
> SOURCE ANALYSIS: Read main.py and identify every backend process:
> - Scraping Logic: Locate capture_screenshot_from_url. Note the specific 'Stealth' args, window sizes, scrolling behavior, and user-agents.
> - AI Workers: Locate analyze_visuals, analyze_copy, and analyze_tech. Note the exact System Prompts and JSON structures.
> - Math & Scoring: Locate compile_roast and calculate_badness_score. Note the exact weights, multipliers, and logic for 'Quick Wins'.
> - Utilities: Locate clean_json_text, repair_json, and any helper functions.
>
> EXECUTION TASK: Create/Write app/api/roast/route.ts.
> - Transcribe the Logic: Convert the Python logic above into TypeScript.
> - Scraping: Use puppeteer (instead of Playwright) but replicate the exact scrolling/stealth behavior found in the Python source.
> - AI: Use @google/generative-ai. COPY THE PROMPTS WORD-FOR-WORD. Do not shorten them.
> - Scoring: Replicate the status_points and impact_multipliers dictionaries exactly.
> - Output: The API must return the exact same JSON structure that compile_roast returns in Python.
>
> VERIFICATION: As you write the code, verify that every try/except block in Python has a matching try/catch in TypeScript."

## 2025-01-22 - 1:1 Frontend/UI Logic Migration from Python to Next.js
**Category:** Core Logic / Architecture
**Instruction:**
> "We have successfully migrated the backend. Now I need to perform a 1:1 Logic Migration of the Frontend/UI Logic from main.py to Next.js. You need to go line by line and process by process without losing code logic or process flow.
>
> CRITICAL INSTRUCTION: Do not summarize. Do not simplify. Your goal is 100% Logic Parity. Treat main.py as the absolute source of truth.
>
> SOURCE ANALYSIS (Read main.py):
> - Loading Logic: Locate update_vibe_progress. Note the specific list of 20 funny loading messages ('Judging your fonts...', 'Hunting for CTA...').
> - Dashboard Logic: Locate render_main_audit_dashboard. Note how it displays: The Overall Score (Traffic Light colors: Red/Orange/Green), The 'Quick Wins' list, The 'Deep Dive' tabs (UX, Copy, Tech, etc.).
> - Shock Logic: Locate render_roi_dashboard. Note the exact math for lost_revenue and the comparison graphs.
> - Paywall Logic: Note how the 'Deep Dive' is hidden/locked if is_paid is False.
>
> EXECUTION TASK:
> 1. UPDATE app/page.tsx (Landing & Loading): Implement the URL Input. Critical: Replicate the update_vibe_progress logic. When the user clicks 'Roast', show a progress bar that cycles through those exact 20 messages while waiting for the API response. On success, redirect to /roast/[id].
> 2. CREATE app/roast/[id]/page.tsx (The Report): Fetch the report data from the API (or pass via context). ROI Calculator: Create a React Component for the 'Revenue Loss' section. It must use useState to let the user edit Traffic/Price and update the 'Annual Loss' number in real-time (just like the Python version). Score Display: Use a large circular indicator or badge with the correct color coding from Python (<50 Red, <80 Orange, 80+ Green). The Paywall: If !isPaid, blur the 'Deep Dive' section and show the 'Unlock' button. Components: Use the BentoGrid and Shadcn components we set up.
>
> VERIFICATION:
> - Ensure the math in the React ROI calculator matches the Python formula exactly: traffic * 0.02 * price * 12.
> - Ensure the 'Quick Wins' always show the top 3 items."

## 2025-01-22 - Refactor User Flow to Match main.py Exactly
**Category:** Core Logic / Architecture
**Instruction:**
> "Refactor the Next.js application to strictly replicate the exact user flow and behavior of main.py.
>
> CURRENT ISSUE: The current Next.js app splits the process (Frontend scrapes -> User reviews images -> User clicks Roast -> Backend analyzes). This is WRONG.
>
> REQUIRED BEHAVIOR (Matches main.py 1:1):
> - User Action: User enters URL and clicks 'Roast' ONCE.
> - System Action: The Frontend immediately shows the ProgressBar cycling through the 20 vibe messages (from main.py).
> - Backend Action: The API (route.ts) receives the URL and performs BOTH the Puppeteer Scraping AND the Gemini Analysis in a single execution chain.
> - Result: The user is automatically redirected to the Report page when the API finishes. No intermediate steps.
>
> EXECUTION TASKS:
> - REWRITE app/api/roast/route.ts: Move the puppeteer scraping logic inside this route. The API must accept { url: string } as input (not images). It must execute: Launch Browser -> Capture Screenshot/HTML -> Run Gemini Analysis -> Return JSON.
> - REWRITE app/page.tsx: Remove all screenshot preview logic. Remove the second 'Roast' button. Ensure handleRoast sends the URL to the API and triggers the loading state immediately.
>
> GOAL: The user experience must be identical to the Streamlit app: One Click -> Wait -> Results.

## 2025-01-22 - Simulation Mode Feature (Sandbox/Live Toggle)
**Category:** Feature Request / Architecture
**Instruction:**
> "I need to implement a 'Simulation Mode' feature to toggle between testing and production logic safely.
>
> 1. CREATE CONTEXT: context/SimulationContext.tsx
> State: mode (type: 'sandbox' | 'live'). Default to 'sandbox'.
> Export a hook useSimulation() that returns { mode, toggleMode, isLive }.
> Wrap the application in layout.tsx with this provider.
>
> 2. CREATE THE TOGGLE UI:
> In the Navbar (app/page.tsx or component), add a prominent Switch or Badge.
> Visuals:
> Sandbox Mode: Show a '🧪 Sandbox Mode' badge (Green).
> Live Mode: Show a '🔴 Live Mode' badge (Red).
> Clicking it toggles the state.
>
> 3. LOGIC RULES (For future reference):
> Sandbox: The app should behave exactly as it does now (no login required, infinite credits, no DB writes).
> Live: The app will enforce Auth, check Credits, and write to Firebase."

## 2025-01-22 - Google Authentication with Simulation Gate
**Category:** Feature Request / Architecture
**Instruction:**
> "Implement Google Authentication with a Simulation Gate.
>
> 1. SETUP AUTH CONTEXT (context/AuthContext.tsx):
> Import useSimulation.
> The 'User' Object:
> If isLive is FALSE (Sandbox): Hardcode a 'Mock VIP User' ({ uid: 'test-123', email: 'test@siteroast.ai', credits: 999, plan: 'pro' }).
> If isLive is TRUE (Live): Use real Firebase onAuthStateChanged.
>
> 2. DATABASE LOGIC:
> When a real user logs in (Live Mode), check/create their document in Firestore users.
> If in Sandbox Mode, DO NOT attempt to read/write to Firestore on init.
>
> 3. UI UPDATE:
> In the Navbar:
> Sandbox: Show the Mock User's Avatar (always logged in).
> Live: Show 'Login' button or Real User Avatar.
>
> 4. PROTECTED ROUTES:
> Update useRequireAuth. If isLive is false, always return true (allow access). If isLive is true, enforce login."

## 2025-01-22 - Sidebar Navigation Refactor for Report Page
**Category:** Feature Request / Architecture
**Instruction:**
> "Refactor the Sidebar Navigation for the Report Page.
>
> 1. VISUAL OVERHAUL:
> Increase sidebar width to w-96 (24rem). Update main content margin to ml-96.
> Add branding: '🔥 SiteRoast' at the top.
>
> 2. MENU LOGIC (Simulation Aware):
> Create placeholder pages (/dashboard, /settings, /billing).
> Sidebar Data:
> Use the user object from AuthContext.
> Display the credit count. (In Sandbox, this will show 999. In Live, it shows real credits).
>
> 3. ACTIVE STATES:
> Highlight the current active menu item.
> Ensure clicking links works in both Sandbox (mock data) and Live modes."

## 2025-01-22 - Real PDF Generation Logic
**Category:** Feature Request / Core Logic
**Instruction:**
> "Implement the Real PDF Generation logic.
>
> 1. CREATE API ROUTE: app/api/generate-pdf/route.ts
> Use puppeteer-core and @sparticuz/chromium.
> Logic: Accept { html }, launch headless browser, page.setContent(html), page.pdf(), return Buffer.
>
> 2. CONNECT UI:
> In app/roast/[id]/page.tsx, update the 'Download PDF' button to call this API and trigger the file download.
>
> Ensure Tailwind styles are captured correctly in the print output."

## 2025-01-22 - Razorpay Integration with Sandbox Bypass
**Category:** Feature Request / Core Logic
**Instruction:**
> "Integrate Razorpay with a Sandbox Bypass.
>
> 1. API ROUTES:
> app/api/create-order: Initialize Razorpay order.
> app/api/verify-payment: Verify signature and update Firestore credits.
>
> 2. FRONTEND PAYMENT LOGIC (app/billing/page.tsx):
> Import useSimulation.
> On 'Buy' Click:
> IF SANDBOX (!isLive):
> Show a toast: '💰 Sandbox Mode: Payment Simulated!'.
> Manually update the local user.credits state (add 5 credits) to show it works.
> Do NOT call Razorpay.
> IF LIVE (isLive):
> Call create-order API.
> Open Razorpay Modal.
> On success, call verify-payment API.
>
> 3. SAFETY:
> Ensure real money logic only triggers when the red 'Live Mode' badge is active."

## 2025-01-23 - Fix Roast Quality & Length
**Category:** Core Logic
**Instruction:**
> "The current roast output is too robotic and short (e.g., 'Your Mobile Layout is bad'). It looks like a template. We need a fluid, creative, 'ruthless comedian' flow, especially in Part 2.
>
> Update the Prompt Logic in the backend (where we call the OpenAI/LLM API) to ensure 'Part 2: The Roast' is a single, continuous, rapid-fire paragraph (approx 50-70 words), not just 3 disjointed sentences.
>
> 1. Update the System Prompt: Change 'Pick the 3 worst things. Short sentences.' to 'PART 2: THE ROAST (The Rant). Write a cohesive, rapid-fire paragraph (4-6 sentences). Do not just list categories like 'Mobile Layout'. Instead, roast the specific visual details provided in the input context (e.g., 'This neon green background is burning my retinas,' 'This headline implies you don't know what you sell'). Connect the insults flowingly. Make it sound like a breathlessly angry comedian.'
>
> 2. Pass 'Raw' Data to the AI (Critical): The AI cannot roast specific things if it doesn't 'see' them. Ensure you are passing the scraped content to the prompt context, not just the scores. Pass: H1 Text, Button Colors, Font Names, Main Hero Text. Do Not Just Pass: 'UX Score: 40/100'.
>
> 3. Adjust Token Limits: Ensure max_tokens for the API call is set high enough (e.g., 500 or 1000) to allow for a longer, funnier response."

## 2025-03-25 - Auth, reports, history, billing, dashboard (batch)
**Category:** Feature Request / Architecture
**Instruction:**
> Fix login/logout so users are not logged out unless they click logout; add Google and email+password flows; fix history with historic reports, save audit HTML free/paid with one-click download and PDF, proper headers; default settings page with free/paid profiles, T&C, privacy, manage account, subscription; PayPal in billing; dynamic popup during roasting; radar/heatmap/priority matrix visible in PDF; free vs paid report content for HTML/PDF with element-by-element audit above deep dive; user dashboard and home page.

**Constraint:** Confirmed this log entry was appended when completing the implementation batch.

## 2026-04-05 - Credits, Vercel Chromium, auth, Razorpay sandbox
**Category:** Core Logic / Feature Request / Bugfix
**Instruction:**
> Fix “Insufficient credits: This roast requires 20 credits” so each roast consumes 1 credit; fix credits workflow (addition, consumption, balance). Fix Vercel error: Chromium brotli bin missing on roast. Fix auth flow thoroughly. Confirm Razorpay sandbox for adding credits until live keys are used.

**Constraint:** Confirmed this log entry was appended when completing this batch.

