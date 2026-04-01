# Prompt History

\# SiteRoast.ai - Prompt History Log



\## 1. Backend Logic Setup (Step 7)

"I need to update our backend logic to handle multiple images and use a specific '3-Lens' auditing framework.

Please update the `generate\_roast` function in `main.py` with the following requirements:

1\. Input Handling: Accept a list of image files (PIL Images).

2\. Model: Use `gemini-1.5-flash`.

3\. The Payload: Convert all images into a single list of content parts and send them alongside the System Prompt in one request.

4\. The Prompt: Use the exact 'Master System Prompt' provided.

5\. Safety: Wrap the API call in a try/except block to catch any 'Blocked by safety filters' or connection errors."



\## 2. Frontend UI Polish (Step 8)

"The backend is working. Now I want to improve the Frontend UI in `main.py`.

Please parse the Markdown response from Gemini and display it using Streamlit components:

1\. Score: Create a random 'Roast Score' (1-10) based on the sentiment of the text and display it using `st.metric`.

2\. The Verdict: Display the roast summary in a `st.warning` or `st.info` box at the top.

3\. Tabs: Use `st.tabs(\["First Impression", "Structure", "Aesthetics"])` to separate the 3 Lenses.

4\. Quick Wins: Put the checklist in an `st.expander` at the bottom called '🚀 Reveal Quick Wins'."



\## 3. The Automation / Scraper (Step 9)

"I want to remove the manual file uploader and replace it with a \*\*URL Input Field\*\*.

1\. Frontend: Change the UI. Instead of `st.file\_uploader`, give me `st.text\_input` where the user pastes their Website URL.

2\. Backend (The Scraper):

&nbsp;   \* Use the `playwright` library (sync API).

&nbsp;   \* Create a function `scrape\_website(url)` that launches a headless browser, navigates to the URL, takes a screenshot, scrolls down by one viewport height, and repeats (max 5-6 screens).

&nbsp;   \* Extract `document.body.innerText` (all visible text) and the HTML source."



\## 4. The "God Mode" Upgrade (JSON + PDF + Heatmap)

"I need a major overhaul of `main.py` to upgrade this from a prototype to a paid-product level.

1\. THE GOD-TIER SYSTEM PROMPT:

&nbsp;   \* Role: Brutally honest, witty Senior CRO Consultant.

&nbsp;   \* Output Schema (Strict JSON): `headline\_roast`, `summary\_bullets` (7-10 items), `categories` (UX, Conversion, Legal, Speed), `deep\_dive` (Score, Verdict, Impact, Fix).

2\. THE 'VIBE' PROGRESS BAR:

&nbsp;   \* Remove raw logs. Use a progress bar that cycles through user-friendly messages ('Simulating First Impression...', 'Reading copy...', 'Generating Heatmap...').

3\. PDF ENGINE OVERHAUL:

&nbsp;   \* Use `fpdf`. Create a custom `PDFReport` class with consistent branding/borders in the header.

&nbsp;   \* Use `multi\_cell(w=0)` to prevent text cut-off.

&nbsp;   \* Layout: Page 1 (Summary), Page 2 (Heatmap), Page 3+ (Deep Dives).

4\. THE HEATMAP:

&nbsp;   \* Implement a 'Predictive Focus Map' using PIL/OpenCV.

&nbsp;   \* Logic: Take screenshot -> find high-contrast edges -> overlay semi-transparent heatmap -> save as `heatmap.png`.

5\. SCRAPING:

&nbsp;   \* Extract Screenshot AND `document.body.innerText`."



\## 5. Precise Scrolling (The Heatmap Fix)

"Refining the Scraper Logic for the Heatmap:

To ensure the 'Stitched Image' is seamless and has no duplicate content:

1\. Dynamic Viewport: Determine `window.innerHeight`.

2\. Precise Scrolling: Scroll down by exactly that amount using `page.mouse.wheel(0, viewport\_height)`.

3\. Sticky Headers: Execute JS to `display: none` any elements with `position: fixed` before stitching.

4\. The Stitch: Concatenate images vertically using PIL. No pixel matching needed."



## 2025-12-18 - Advanced v2 Prompt
> "I need to upgrade the System Prompt in main.py because the previous results were too shallow. Please replace the prompt_text variable with this Advanced v2 Prompt: Markdown ### ROLE & OBJECTIVE You are 'SiteRoast,' a Senior UX Director and Conversion Scientist with 20 years of experience. You are known for being brutally honest, technically precise, and slightly mean. You are auditing a website based on a sequence of screenshots. THE GOAL Roast: Do not hold back. Use analogies. If the site is boring, call it 'digital sleeping pills.' If it's cluttered, call it a 'hoarder's garage.' Consult: Your advice must go beyond 'change the color.' You must explain the psychology of why it fails (e.g., 'Cognitive Load,' 'F-Pattern violation,' 'Lack of Social Proof'). ANALYSIS FRAMEWORK (THE 3 LENSES) Lens 1: The 3-Second Rule (First Impression) Depth: Don't just check for a headline. Critique the Value Proposition. If the user has to read 3 sentences to understand the product, it is a failure. Tech: Check the navigation bar. Is it bloated? Are the CTAs low-contrast? Lens 2: Structure & Cognitive Flow Depth: Analyze the 'Visual Hierarchy.' Are the most important elements the biggest? Tech: Look for 'False Bottoms' (design flaws that make users think the page ends). Critique the use of whitespace—amateurs use too little; pros use it to guide the eye. Lens 3: Brand Authority & Trust Depth: Does this look like a $100m company or a student project? Critique the typography pairings. Tech: Identify specific 'Trust Killers' (e.g., stock photos that look fake, typos, alignment issues). OUTPUT FORMAT (STRICT MARKDOWN) 💀 The Verdict The Punchline (3-4 Lines) [A savage, witty summary hook.] The Reality Check [A 5-10 sentence paragraph diving deeper.] [Under each lens, identify 'critical fail' aspects. List out 3-5 pointers in each of them and suggest respective fixes] 🔍 Lens 1: First Impression The Fail: [Explain the specific issue.] The Fix: [Specific advice.] 📐 Lens 2: Structure & Flow The Fail: [Critique the layout/scanning pattern.] The Fix: [Specific advice.] 🎨 Lens 3: Aesthetics The Fail: [Critique fonts/colors/images.] The Fix: [Give Hex Codes and Font Families.] 🚀 Quick Wins [Actionable Step 1] [Actionable Step 2] [Actionable Step 3]"

## 2025-12-18 - Premium SaaS UI Overhaul
> "I want to completely overhaul the Frontend UI in main.py to make it look like a premium SaaS product. Please rewrite the Streamlit interface code in main.py with the following Design System: 1. Page Config & CSS (The Look) Set page layout to wide. Inject Custom CSS to: Hide the default Streamlit 'Deploy' button and Hamburger menu. Center the main titles. Increase the font size of the headers. 2. The Hero Section (The Hook) Title: '🔥 SiteRoast.ai' (Use a large font). Sub-header: 'The brutal, AI-powered conversion audit. Upload your screenshots, get roasted, get rich.' Input: Place the file uploader in a clear container. 3. The Loading State (Retention) When the user clicks 'Roast My Site', show a Progress Bar that updates with witty text steps (e.g., 'Analyzing pixels...', 'Spotting UX crimes...', 'Generating fix list...') so the user knows it's working. 4. The Results Dashboard (Organized Layout) Top Row (Columns): Col 1: Display a huge 'Roast Score' (parse this from the text or generate a random number 40-85 for the MVP). Col 2: Display the 'Punchline' (The verdict summary) in a styled st.warning box. Middle Section (Tabs): Use st.tabs with Emoji icons: ['👁️ First Impression', '🧱 Structure & Flow', '🎨 Aesthetics']. Parse the Markdown content to put the correct text into the correct tab. Bottom Section: An st.expander titled '🚀 specific Quick Wins (Open for Value)' containing the checklist."

## 2025-12-18 - God-Tier System Prompt & PDF Overhaul
> "I need a major overhaul of main.py to upgrade this from a prototype to a paid-product level. 1. THE GOD-TIER SYSTEM PROMPT: Use this exact Prompt logic for the AI: Role: Brutally honest, witty Senior CRO Consultant. Tone: 'Roasty' but incredibly helpful. Output Schema (Strict JSON): headline_roast, summary_bullets, categories: [UX, Conversion, Copy, Visuals, Legal, Speed]. deep_dive: For each category, provide: score: 0-100, verdict: 'Pass'/'Warn'/'Fail', impact: 'High'/'Medium'/'Low', what_works, what_failed, fix_steps. 2. THE 'VIBE' PROGRESS BAR: Remove all raw status logs. Instead, use a progress bar that cycles through user-friendly messages while working. 3. PDF ENGINE OVERHAUL: Use fpdf. Create a custom class PDFReport(FPDF). Add a border and branding ('SiteRoast.ai') to every page. Text Wrapping: NEVER use cell() for long text. Use multi_cell(w=0). Layout: Page 1: Title, Roast, Summary, Score. Page 2: Screenshot with simulated Heatmap. Page 3+: Deep Dives. Use colored text (Red/Green) for 'Fail'/'Pass'. 4. THE HEATMAP: Implement a simple 'Predictive Focus Map' function using PIL or OpenCV. Save this as heatmap.png and insert it into the PDF on Page 2. 5. SCRAPING: Ensure playwright extracts both the Screenshot AND the document.body.innerText + HTML source."

## 2025-12-18 - 20-Step Sequence & Scraper Refinement
> "1. THE 20-STEP 'VIBE' LOADER: Update the progress bar to cycle through this specific list of messages while the backend runs. The total time should be synchronized so the last message appears right before the result. 2. HEATMAP LOGIC (DASHBOARD VS PDF): The Stitching Function: Create a helper function stitch_images(image_list) that takes the first 3 screenshots and combines them vertically into one single image object. The Heatmap Algorithm: Apply the 'Visual Saliency' (or bright-spot detection) overlay to this Stitched Image. Save it as stitched_heatmap.png. Dashboard Display: On the Streamlit frontend, show ONLY the heatmap of the first screenshot (Hero Section). PDF Report: On 'Page 2' of the PDF, insert the stitched_heatmap.png. 3. IMAGE SIZING: Ensure the 'Stitched Heatmap' maintains its aspect ratio in the PDF. 4. Refining the Scraper Logic: Dynamic Viewport, Precise Scrolling, Sticky Headers (display: none any elements with position: fixed before stitching)."

## 2025-12-18 - Final Bug Fixes & Optimization
> "1) I got the following result for creatify.ai... Almost nil or negligible results. No radar data. UX (Score: 70/100) No specific findings for this category... 2. Can we start taking screenshots as soon as the user clicks the Roast My Site button, i.e., when our 20-step progress bar begins? 3. No chart in the PDF. 4. Only include the first-page screenshot in the PDF; no heatmap details. 5. On the deep dive pages, the “status” text is currently aligned to the right... 6. Yes, at this point, keep only the URL option while the upload file block should be kept disabled and hidden..."

## 2025-12-18 - Unicode PDF Fix
> "Error generating PDF: Character '✅' at index 2 in text is outside the range of characters supported by the font used: 'helvetica'. Please consider using a Unicode font."

## 2025-12-18 - Prompt Logging Rule
> "# PROMPT LOGGING RULE At the end of every significant code generation task and every instruction I submit related to changes, code creation, or error resolution, you MUST append a copy of the instructions I gave you to the file `prompt_history.md`. Rules for Logging: 1. Do not log error messages or debugging text I paste. 2. Only log the 'Instruction': The core logic, feature request, or architectural change I asked for. 3. Format: ## [Date] - [Short Feature Name] > '[The instruction I gave you]' 4. If the file `prompt_history.md` does not exist, create it."

## 2025-12-18 - UI Text Clean-up
> "remove - Enter a URL to auto-capture screenshots, OR upload your own screenshots below and Please provide a URL or upload screenshots to begin"

## 2025-12-18 - UI Text Redundancy Removal
> "delete both as its already there above the URL box"

## 2025-12-22 - Professional SaaS UI Overhaul
> "I need to overhaul the UI to make it look like a professional SaaS product, not a basic script. 1. INJECT CUSTOM CSS (THE THEME): Use st.markdown(css, unsafe_allow_html=True) to apply these styles: Import Font: Google Fonts 'Inter'. Apply it to html, body, [class*='css']. Hide Defaults: Hide st.deploy_button, MainMenu, and footer. Input Field: Style the st.text_input to have a larger padding (height 50px) and a subtle border radius (12px), making it look like a search bar. Metric Cards: Create a CSS class div.css-card with background-color: #FFFFFF, border-radius: 10px, padding: 20px, box-shadow: 0 4px 6px rgba(0,0,0,0.1), border: 1px solid #F0F0F0. 2. RESTRUCTURE THE LAYOUT: Hero Section (Centered): Use col1, col2, col3 = st.columns([1, 2, 1]). Put the Title ('SiteRoast.ai'), Sub-header ('The Brutal Audit'), and URL Input inside the middle column (col2) so they are perfectly centered. The Dashboard Grid (After Analysis): Top Row: A full-width st.container styled as a card containing the Progress Bar (while loading) or the Verdict/Score (after loading). Middle Row (50/50 Split): Left Col: The Radar Chart (inside a card). Right Col: The Executive Summary & Roast (inside a card). Bottom Row: The Tabs for Deep Dives (UX, Copy, Visuals). 3. VISUAL POLISH: Use Emoji Icons for tabs (e.g., '🎨 Visuals', '⚡ Speed'). Ensure the 'Heatmap' image (when displayed) has rounded corners via CSS."

## 2025-12-22 - Playwright & Image Optimization
> "(1) In the Playwright scraper, change page.goto(url, wait_until='network_idle') to page.goto(url, wait_until='domcontentloaded'). Then add a hard time.sleep(2) to let images settle. This prevents hanging on background scripts. (2) Before sending images to Gemini, use PIL to: Convert them to JPEG (quality=80). Resize them so the max width is 1024px. This reduces payload size by 90% without affecting AI vision accuracy."

## 2025-12-22 - Screenshot Loop Limit
> "In the screenshot loop, add a break condition: if count >=7: break. Do not scrape infinite scroll pages forever."

## 2025-12-22 - Enhanced AI Prompt Structure (3 Prompts)
> "Prompt 1: Generate Roast Summary - Generate an extended roast summary for a landing page audit. Problems identified: [List 3-4 key findings from the HTML parse]. Use this structure: 1. Witty opening (2 sentences, funny + brutal), 2. Three specific callouts (1 sentence each, with revenue impact), 3. Closing hook (1-2 sentences, actionable + encouraging). Tone: Brutally honest, witty, use emojis. Never mean-spirited. Output: Plain text, 300-400 words, make them laugh AND care. Prompt 2: Generate Quick Wins - Generate 3 quick-win fixes. For each: Title: action-driven, Problem: 1 sentence, Fix: 2-3 sentences copy-paste ready, Example: HTML/CSS snippet OR copy example, Effort: '5min' / '15min' / '30min' / '1hour', Lift: 'Expected 8-12% conversion increase'. Format: JSON array of 3 QuickWin objects. Rank by impact. Prompt 3: Build Audit Item - For each element checked (Hero, CTA, Form, etc.): Status: [Excellent|Good|Satisfactory|Needs Improvement|Failed], Rationale: 1-2 professional sentences, Working: 2-3 bullets of what's good, Not Working: 2-3 bullets of problems, Fix: Code example + expected impact."

## 2025-12-22 - $19.99 Value Proposition Enhancement
> "Assume the product is a paid landing page roast/audit at $19.99. Conclusion: Users will pay $19.99 only if: The audit feels substantially more valuable than a free 'CRO checklist', They get concrete, implementable fixes (copy, layout, examples), not just scores, The roast is fun enough to share AND practical enough to use with their dev/designer. Therefore: The audit MUST be: Deep (20-40 specific findings, not 5-6 generic ones), Actionable (examples, snippets, rewrites), Visually rich (radar chart, scores, badges), Packaged as a shareable PDF (something they can show to their team/clients). The goal: Make the user feel: 'This saved me a CRO consultant call + gave me a meme-worthy roast' → worth $19.99."

## 2025-12-22 - Comprehensive Landing Page Audit Framework
> "Create a landing page audit that checks at least the following items. STRUCTURE (TOP-LEVEL SECTIONS): Overview & Roast Summary, Radar Overview (UX, Conversion, Copy, Visuals, Trust, Speed), Quick Wins (Top 3), UX & Layout, Conversion & Funnel, Copy & Messaging, Visuals & Brand, Trust & Credibility, Speed & Technical Health, Mobile Experience, Next Steps / Action Plan. FOR EACH SECTION, EVALUATE THESE ITEMS: 1) UX & LAYOUT (8 items: Hero section, Visual hierarchy, Content flow, Navigation, Whitespace, Alignment, Readability, Scroll experience), 2) CONVERSION & FUNNEL (7 items: Primary CTA, Secondary CTAs, Lead capture, Offer clarity, Friction points, Urgency/scarcity), 3) COPY & MESSAGING (9 items: Main headline, Subheadline, Value proposition, Customer-centric language, Objection handling, Persuasive techniques, CTA copy, Tone & voice), 4) VISUALS & BRAND (6 items: Logo, Brand colours, Imagery, Icons, Video, Visual clutter), 5) TRUST & CREDIBILITY (7 items: Testimonials, Client logos, Certifications, Contact info, Legal links, Transparency, Footer), 6) SPEED & TECHNICAL HEALTH (7 items: Load speed, Core metrics, Image optimisation, JS/CSS bloat, Caching, HTTPS, Console errors), 7) MOBILE EXPERIENCE (6 items: Layout responsiveness, Text legibility, CTA visibility, Tap target sizes, Form usability, Spacing). FOR EACH ITEM: Output: Status (Excellent/Good/Satisfactory/Needs Improvement/Failed), 1-2 sentence serious rationale, 2-3 bullets what's working, 2-3 bullets what's not working, 1 'why this matters for conversion', 1 'fix' block (quick fix + concrete example). Tone: Blend straight explanation + humour. Never only roast; always pair roast with a clear fix."

## 2025-12-22 - Standardized Radar Chart Metrics
> "Radar chart MUST always use the same 6 metrics for every audit: 1. UX (User Experience) - Aggregates: layout, hierarchy, readability, navigation, spacing, interaction ease. 2. Conversion - Aggregates: primary/secondary CTAs, forms, offer clarity, friction, urgency, funnel logic. 3. Copy - Aggregates: headline, subheadline, value proposition, objections, persuasion, tone. 4. Visuals - Aggregates: imagery, icons, colour usage, branding, video, visual clutter. 5. Trust - Aggregates: testimonials, reviews, logos, badges, contact details, legal links, transparency. 6. Speed - Aggregates: page load, LCP/FCP/CLS, image weight, JS/CSS bloat, HTTPS and basic technical health. Do NOT add or remove radar metrics. Instead: Map all detailed checks into these 6 buckets. Use simple averaging or weighted scoring by impact to compute each radar value (0-100). Justification: These 6 cover the full story of 'will this page convert?': UX = can I use this?, Conversion = can I act easily?, Copy = does this convince me?, Visuals = does this feel modern & aligned?, Trust = do I believe them?, Speed = can I even see it in time? Any other checks (e.g. legal, mobile) roll up into these categories (Legal → Trust, Mobile → UX/Speed)."

## 2025-12-22 - TypeScript Scoring Module
> "Create a scoring module `src/utils/scoring.ts` that: 1. Takes an array of `AuditItem` objects. 2. Groups them into 6 radar categories: `ux`, `conversion`, `copy`, `visuals`, `trust`, `speed`. 3. Converts each item's `status` + `impact` into numeric points. 4. Computes 0–100 scores per category and an overall average. STATUS → POINTS: Excellent = 95, Good = 80, Satisfactory = 60, Needs Improvement = 35, Failed = 5. IMPACT MULTIPLIER: HI (high impact) = 1.5, MI (medium) = 1.0, LI (low) = 0.5. For each category: weightedPoints = sum( statusPoints * impactMultiplier ), maxPossible = sum( 95 * impactMultiplier ), score = round( (weightedPoints / maxPossible) * 100 ). Overall score = average of the 6 metrics."

## 2025-01-27 - Screenshot Loop Break Condition Update
> "In the screenshot loop, add a break condition: if count >= 5: break. Do not scrape infinite scroll pages forever."


