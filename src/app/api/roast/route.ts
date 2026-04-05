import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { roastGenerationCreditCost } from "@/lib/roast-credit-cost";
import {
  debitRoastCreditsIfSufficient,
  refundRoastCredits,
} from "@/lib/roast-credits-server";
import type { GoogleGenerativeAI } from "@google/generative-ai";
import { repairJson, cleanJsonText, safeErrorMessage } from "@/lib/json-utils";
import {
  initializeGeminiClient,
  generateRoastWithFallback,
  generateWithTwoModelFallback,
  type GeminiUsageChunk,
} from "@/lib/gemini-client";
import { FULL_DIAGNOSTIC_UPGRADE_HOOK, stripNarrativeSegmentLabels } from "@/lib/report-copy";
import {
  buildRevenueLeakEstimate,
  DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD,
  fallbackInsightLayers,
  INSIGHT_LAYERS_SYSTEM_PROMPT,
  mergeInsightLayersFromAI,
} from "@/lib/insight-layers";
import { summarizePageSpeedWithGemini } from "@/lib/pagespeed-gemini-summary";
import { estimateMonthlySessionsForUrl } from "@/lib/traffic-estimate";
import { buildScrollEffectiveness } from "@/lib/scroll-effectiveness-from-audit";
import { partitionLegalComplianceAuditLast } from "@/lib/legal-compliance-audit";
import {
  analyzeLegalSignalsFromHtml,
  mergeLegalComplianceWithSignals,
} from "@/lib/legal-html-signals";

/**
 * 1:1 Logic Migration from main.py
 * This file replicates every backend process from main.py without simplification or summarization.
 * 
 * SOURCE FUNCTIONS MIGRATED:
 * - repair_json (main.py:703-765) -> repairJson
 * - clean_json_text (main.py:767-806) -> cleanJsonText
 * - analyze_visuals (main.py:808-994) -> analyzeVisuals
 * - analyze_copy (main.py:996-1142) -> analyzeCopy
 * - analyze_tech (main.py:1144-1265) -> analyzeTech
 * - compile_roast (main.py:1267-1563) -> compileRoast
 * - calculate_badness_score (main.py:1448-1472) -> calculateBadnessScore
 */

/**
 * Get API key from environment variables
 * Exact 1:1 migration from main.py get_api_key function (lines 85-104)
 */
function getApiKey(): string {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY not found. For Next.js, add it to .env.local file.");
  }
  return apiKey.trim().replace(/^["']|["']$/g, "");
}

/**
 * Optimize images before sending to Gemini
 * Exact 1:1 migration from main.py analyze_visuals image optimization (lines 814-827)
 * Note: In TypeScript, we'll receive images as base64 strings or Buffers
 * For now, we'll pass them through - optimization can be added if needed
 */
interface ImageInput {
  base64?: string;
  buffer?: Buffer;
  mimeType?: string;
}

/**
 * Worker 1: Analyze visual design elements from screenshots.
 * Returns unified JSON schema with items array containing: Visual Hierarchy, Aesthetics, CTA Visibility, Trust Signals, Mobile Layout.
 * Exact 1:1 migration from main.py analyze_visuals function (lines 808-994)
 */
async function analyzeVisuals(
  images: ImageInput[],
  genAI: GoogleGenerativeAI,
  workerPrimary: string,
  workerFallback: string
): Promise<{ items: any[]; usage: GeminiUsageChunk }> {
  try {
    // Convert images to format expected by Gemini API
    // In Python, images are PIL Images, here we have base64 strings or Buffers
    const imageParts = images.map((img) => {
      if (img.base64) {
        return {
          inlineData: {
            data: img.base64,
            mimeType: img.mimeType || "image/jpeg",
          },
        };
      } else if (img.buffer) {
        return {
          inlineData: {
            data: img.buffer.toString("base64"),
            mimeType: img.mimeType || "image/jpeg",
          },
        };
      }
      throw new Error("Image must have either base64 or buffer");
    });

    // EXACT PROMPT FROM PYTHON - WORD FOR WORD (lines 829-964)
    const prompt = `Act as a Senior UX Designer. Analyze these screenshots of a landing page.

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
- MANDATORY CHECKS: Navigation clarity (Is the menu intuitive?), Readability (Font sizes, line height, and contrast check), Scroll experience (Guided flow vs chaotic), Logo visibility & stock image authenticity check`;

    const { value, usage } = await generateWithTwoModelFallback(
      genAI,
      workerPrimary,
      workerFallback,
      async (model, modelId) => {
        const response = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });

        const text = response.response.text().trim();
        const cleanedText = cleanJsonText(text);
        const um = response.response.usageMetadata;

        let result: { items?: any[] };
        try {
          result = JSON.parse(cleanedText);
        } catch (e: unknown) {
          const posHint =
            e instanceof Error && e.message.includes("position")
              ? undefined
              : undefined;
          const fixedText = repairJson(cleanedText, posHint);
          result = JSON.parse(fixedText);
        }

        if (!result.items) {
          result.items = [];
        }

        return {
          value: { items: result.items },
          usage: {
            modelId,
            promptTokens: um?.promptTokenCount ?? 0,
            candidatesTokens: um?.candidatesTokenCount ?? 0,
          },
        };
      }
    );
    return { ...value, usage };
  } catch (e) {
    console.error(`[ERROR] analyze_visuals failed: ${safeErrorMessage(e)}`);
    return {
      items: [],
      usage: { modelId: workerPrimary, promptTokens: 0, candidatesTokens: 0 },
    };
  }
}

/**
 * Worker 2: Analyze copywriting and messaging from text content.
 * Returns unified JSON schema with items array containing: Headline Impact, Value Proposition, Persuasion/Tone, One Page One Goal.
 * Exact 1:1 migration from main.py analyze_copy function (lines 996-1142)
 */
async function analyzeCopy(
  textContent: string,
  genAI: GoogleGenerativeAI,
  workerPrimary: string,
  workerFallback: string
): Promise<{ items: any[]; usage: GeminiUsageChunk }> {
  try {
    // Clean and truncate text content if too long
    const cleanText = textContent.length > 5000 ? textContent.substring(0, 5000) : textContent;

    // EXACT PROMPT FROM PYTHON - WORD FOR WORD (lines 1005-1112)
    const prompt = `Act as a Lead Copywriter. Analyze this landing page text content:

${cleanText}

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
- MANDATORY CHECKS: Lead Capture (Clarity of what happens after submit), Value Prop (Differentiation vs generic claims), Objection Handling (Price, Risk, Effort, and Time addresses), Persuasive Techniques (Authority and Specificity)`;

    const { value, usage } = await generateWithTwoModelFallback(
      genAI,
      workerPrimary,
      workerFallback,
      async (model, modelId) => {
        const response = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });

        const text = response.response.text().trim();
        const cleanedText = cleanJsonText(text);
        const um = response.response.usageMetadata;

        let result: { items?: any[] };
        try {
          result = JSON.parse(cleanedText);
        } catch {
          const fixedText = repairJson(cleanedText, undefined);
          result = JSON.parse(fixedText);
        }

        if (!result.items) {
          result.items = [];
        }

        return {
          value: { items: result.items },
          usage: {
            modelId,
            promptTokens: um?.promptTokenCount ?? 0,
            candidatesTokens: um?.candidatesTokenCount ?? 0,
          },
        };
      }
    );
    return { ...value, usage };
  } catch (e) {
    console.error(`[ERROR] analyze_copy failed: ${safeErrorMessage(e)}`);
    return {
      items: [],
      usage: { modelId: workerPrimary, promptTokens: 0, candidatesTokens: 0 },
    };
  }
}

/**
 * Worker 3: Analyze technical SEO and compliance from HTML source.
 * Returns unified JSON schema with items array containing: Page Speed Indicators, SEO Tags, Legal Compliance.
 * Exact 1:1 migration from main.py analyze_tech function (lines 1144-1265)
 */
async function analyzeTech(
  htmlSource: string,
  genAI: GoogleGenerativeAI,
  workerPrimary: string,
  workerFallback: string
): Promise<{ items: any[]; usage: GeminiUsageChunk }> {
  try {
    // Clean HTML - remove scripts to reduce token usage
    let cleanHtml = htmlSource.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

    // Truncate if too long
    cleanHtml = cleanHtml.length > 3000 ? cleanHtml.substring(0, 3000) : cleanHtml;

    // EXACT PROMPT FROM PYTHON - WORD FOR WORD (lines 1158-1235)
    const prompt = `Act as a Technical SEO Expert. Analyze this HTML source code:

${cleanHtml}

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
- MANDATORY CHECKS: Speed (Caching & CDN usage if detectable), Legal (only flag missing policies when hrefs are absent in the HTML snippet), Mobile (Form usability - keyboard types for email/number)`;

    const { value, usage } = await generateWithTwoModelFallback(
      genAI,
      workerPrimary,
      workerFallback,
      async (model, modelId) => {
        const response = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });

        const text = response.response.text().trim();
        const cleanedText = cleanJsonText(text);
        const um = response.response.usageMetadata;

        let result: { items?: any[] };
        try {
          result = JSON.parse(cleanedText);
        } catch {
          const fixedText = repairJson(cleanedText, undefined);
          result = JSON.parse(fixedText);
        }

        if (!result.items) {
          result.items = [];
        }

        return {
          value: { items: result.items },
          usage: {
            modelId,
            promptTokens: um?.promptTokenCount ?? 0,
            candidatesTokens: um?.candidatesTokenCount ?? 0,
          },
        };
      }
    );
    return { ...value, usage };
  } catch (e) {
    console.error(`[ERROR] analyze_tech failed: ${safeErrorMessage(e)}`);
    return {
      items: [],
      usage: { modelId: workerPrimary, promptTokens: 0, candidatesTokens: 0 },
    };
  }
}

/**
 * Calculate badness score for an item. Higher score = higher priority.
 * Exact 1:1 migration from main.py calculate_badness_score function (lines 1448-1472)
 */
function calculateBadnessScore(item: any): number {
  const status = item.status || "Satisfactory";
  const impact = item.impact || "MI";

  // Badness Score calculation
  if (status === "Failed" && impact === "HI") {
    return 100;
  } else if (status === "Failed" && impact === "MI") {
    return 80;
  } else if (status === "Needs Improvement" && impact === "HI") {
    return 60;
  } else if (status === "Needs Improvement" && impact === "MI") {
    return 40;
  } else if (status === "Satisfactory") {
    return 10;
  } else if (status === "Good") {
    return 5;
  } else if (status === "Excellent") {
    return 0;
  } else {
    // Default for unknown status/impact combinations
    if (status === "Failed" || status === "Needs Improvement") {
      return 50;
    }
    return 10;
  }
}

/**
 * Helper function to extract raw content from HTML for more specific roasts
 * Extracts H1 text, button text, hero section text, and key visual elements
 */
function extractRawContent(htmlSource: string, textContent: string): {
  h1Text: string;
  buttonTexts: string[];
  heroText: string;
  firstParagraph: string;
} {
  try {
    // Extract H1 tags
    const h1Match = htmlSource.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const h1Text = h1Match ? h1Match[1].trim().replace(/\s+/g, " ") : "";

    // Extract button text (button tags and elements with button-like classes)
    const buttonMatches = htmlSource.matchAll(/<(?:button|a)[^>]*(?:class|role)=["'][^"']*button[^"']*["'][^>]*>([^<]+)<\/(?:button|a)>/gi);
    const buttonTexts: string[] = [];
    for (const match of buttonMatches) {
      const text = match[1].trim().replace(/\s+/g, " ");
      if (text && text.length < 100) {
        buttonTexts.push(text);
      }
      if (buttonTexts.length >= 5) break; // Limit to first 5 buttons
    }
    // Also try simpler button tag match
    if (buttonTexts.length === 0) {
      const simpleButtonMatches = htmlSource.matchAll(/<button[^>]*>([^<]+)<\/button>/gi);
      for (const match of simpleButtonMatches) {
        const text = match[1].trim().replace(/\s+/g, " ");
        if (text && text.length < 100) {
          buttonTexts.push(text);
        }
        if (buttonTexts.length >= 5) break;
      }
    }

    // Extract hero section text (first 500 chars of visible text, or text before first major section break)
    const firstParagraphMatch = htmlSource.match(/<p[^>]*>([^<]{50,300})<\/p>/i);
    const firstParagraph = firstParagraphMatch ? firstParagraphMatch[1].trim().replace(/\s+/g, " ") : "";

    // Hero text: first 300 chars of visible text content
    const heroText = textContent.substring(0, 300).trim().replace(/\n+/g, " ").replace(/\s+/g, " ");

    return {
      h1Text: h1Text || "",
      buttonTexts: buttonTexts.slice(0, 5),
      heroText: heroText || "",
      firstParagraph: firstParagraph || "",
    };
  } catch (e) {
    console.warn(`[WARN] Failed to extract raw content: ${safeErrorMessage(e)}`);
    return {
      h1Text: "",
      buttonTexts: [],
      heroText: textContent.substring(0, 200).trim(),
      firstParagraph: "",
    };
  }
}

/**
 * Manager function: Orchestrates the 3 workers and merges their unified JSON outputs
 * into the final God Mode JSON schema with scoring, roast summary, and aggregation.
 * Exact 1:1 migration from main.py compile_roast function (lines 1267-1563)
 */
async function compileRoast(
  images: ImageInput[],
  textContent: string,
  htmlSource: string,
  pageUrl: string
): Promise<any> {
  console.log("[DEBUG] ========== STARTING COMPILE_ROAST ==========");
  console.log("[DEBUG] Using NEW gemini-client utility with smart fallback");
  
  let genAI: GoogleGenerativeAI;
  let workerPrimary: string;
  let workerFallback: string;
  let roastPrimary: string;
  let roastFallback: string;

  try {
    const clientResult = initializeGeminiClient();
    genAI = clientResult.genAI;
    workerPrimary = clientResult.workerPrimary;
    workerFallback = clientResult.workerFallback;
    roastPrimary = clientResult.roastPrimary;
    roastFallback = clientResult.roastFallback;
    console.log(
      `[DEBUG] ✅ Gemini client initialized. Worker: ${workerPrimary} → ${workerFallback}; roast: ${roastPrimary} → ${roastFallback}`
    );
  } catch (initError: any) {
    console.error("[ERROR] Failed to initialize Gemini client:", initError);
    throw new Error(`Gemini client initialization failed: ${safeErrorMessage(initError)}`);
  }

  const workerUsages: GeminiUsageChunk[] = [];

  // Worker 1: Analyze Visuals
  let visualsItems: any[] = [];
  try {
    const visualsData = await analyzeVisuals(
      images,
      genAI,
      workerPrimary,
      workerFallback
    );
    visualsItems = visualsData.items || [];
    workerUsages.push(visualsData.usage);
  } catch (e) {
    console.error(`[ERROR] Visuals worker failed: ${safeErrorMessage(e)}`);
    visualsItems = [];
  }

  // Worker 2: Analyze Copy
  let copyItems: any[] = [];
  try {
    const copyData = await analyzeCopy(
      textContent,
      genAI,
      workerPrimary,
      workerFallback
    );
    copyItems = copyData.items || [];
    workerUsages.push(copyData.usage);
  } catch (e) {
    console.error(`[ERROR] Copy worker failed: ${safeErrorMessage(e)}`);
    copyItems = [];
  }

  // Worker 3: Analyze Tech
  let techItems: any[] = [];
  try {
    const techData = await analyzeTech(
      htmlSource,
      genAI,
      workerPrimary,
      workerFallback
    );
    techItems = techData.items || [];
    workerUsages.push(techData.usage);
  } catch (e) {
    console.error(`[ERROR] Tech worker failed: ${safeErrorMessage(e)}`);
    techItems = [];
  }

  try {
    const legalSignals = analyzeLegalSignalsFromHtml(htmlSource, pageUrl);
    techItems = mergeLegalComplianceWithSignals(
      techItems as Record<string, unknown>[],
      legalSignals
    ) as any[];
  } catch (e) {
    console.warn(`[WARN] Legal HTML merge skipped: ${safeErrorMessage(e)}`);
  }

  // Merge all items
  const allItems = [...visualsItems, ...copyItems, ...techItems];

  // Scoring logic: Status points and impact multipliers
  // EXACT VALUES FROM PYTHON (lines 1316-1327)
  const statusPoints: Record<string, number> = {
    Excellent: 95,
    Good: 80,
    Satisfactory: 60,
    "Needs Improvement": 35,
    Failed: 5,
  };
  const impactMultipliers: Record<string, number> = {
    HI: 1.5,
    MI: 1.0,
    LI: 0.5,
  };

  // Group items by radarCategory and calculate scores
  const radarCategories = ["ux", "conversion", "copy", "visuals", "trust", "speed"];
  const radarMetrics: Record<string, number> = {};

  for (const category of radarCategories) {
    const categoryItems = allItems.filter(
      (item) => (item.radarCategory || "").toLowerCase() === category.toLowerCase()
    );
    if (categoryItems.length > 0) {
      let weightedSum = 0;
      let weightSum = 0;
      for (const item of categoryItems) {
        const status = item.status || "Satisfactory";
        const impact = item.impact || "MI";
        const points = statusPoints[status] || 60;
        const multiplier = impactMultipliers[impact] || 1.0;
        weightedSum += points * multiplier;
        weightSum += 95 * multiplier;
      }
      radarMetrics[category] =
        weightSum > 0 ? Math.round((weightedSum / weightSum) * 100) : 50;
    } else {
      radarMetrics[category] = 50;
    }
  }

  // Calculate overall score (average of radar scores)
  const overallScore = Math.round(
    Object.values(radarMetrics).reduce((a, b) => a + b, 0) / radarCategories.length
  );

  // Generate roast summary using AI
  let roastSummaryJson: any = {
    executiveSummary: "Overall analysis complete. Review detailed findings below.",
    roastAnalysis: "Comprehensive audit completed across all key areas.",
  };
  
  // Store cost and model info for final response
  let roastCostInfo: {
    modelUsed: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  } | null = null;
  let insightTokenTotals = { inputTokens: 0, outputTokens: 0, modelUsed: "" };

  // Always generate roast summary - explicitly call API if missing or empty
  // Build audit_dump with failed/needs improvement items
  const failedItems = allItems.filter(
    (item) => item.status === "Failed" || item.status === "Needs Improvement"
  );

  if (allItems.length > 0) {
    try {

      const auditDump: string[] = [];
      for (const item of failedItems.slice(0, 15)) {
        const elementName = item.elementName || "Unknown Element";
        const status = item.status || "Unknown";
        auditDump.push(`- ${elementName}: ${status}`);
      }

      const auditDumpStr = auditDump.length > 0 ? auditDump.join("\n") : "No critical issues found.";

      // Extract raw content for more specific roasts
      const rawContent = extractRawContent(htmlSource, textContent);
      const rawContentStr = `
RAW CONTENT FROM THE WEBSITE:
- H1 Headline: "${rawContent.h1Text || "(Not found)"}"
- Button Text: ${rawContent.buttonTexts.length > 0 ? rawContent.buttonTexts.map(t => `"${t}"`).join(", ") : "(No buttons found)"}
- Hero Text (first 300 chars): "${rawContent.heroText.substring(0, 300)}"
- First Paragraph: "${rawContent.firstParagraph.substring(0, 200)}"
`.trim();

      const systemInstruction = `You are a senior conversion strategist and CRO lead auditing a commercial page. Your tone is sharp, analytical, confident, and business-focused. No sarcasm, no mockery, no rant voice.

Return exactly four segments of plain text separated by "|||||" (five pipe characters) in this order:
1) EXECUTIVE_SUMMARY — For decision-makers. Start with a direct line on how the page is performing vs. the audit (e.g. underperforming on clarity, trust, or conversion). Then list 2–3 numbered critical failures tied to the failed audit items (use their themes). Add one sentence on business impact (conversion leakage, trust, decision friction—qualitative only; do not invent dollar figures). End with one sentence giving clear direction on what to fix first and why. Minimum ~55 words.
2) DIAGNOSTIC_ANALYSIS — Layered analysis: observations grounded in the raw page content (quote or paraphrase H1, buttons, hero copy where relevant), implications for conversion, then prioritized actions. Minimum ~120 words. Professional prose.
3) ASSESSMENT — 2–3 lines: concise strategic verdict.
4) NEXT_STEPS — 1–3 lines: professional CTA to upgrade for full detail. You MUST include this exact sentence verbatim: "Full diagnostic includes exact rewrite, layout fixes, and conversion strategy."

Do NOT mention legal compliance, GDPR, privacy policies, cookie policy, or similar legal topics in segments 1–2.

Never start any segment with the literal labels EXECUTIVE_SUMMARY, DIAGNOSTIC_ANALYSIS, ASSESSMENT, or NEXT_STEPS (no headers—start directly with the prose).

FORMATTING: Return ONLY the four segments separated by ||||| with no other wrapper. Example shape: [executive] ||||| [diagnostic] ||||| [assessment] ||||| [next steps]`;

      const userPrompt = `Failed / needs-improvement audit items:
${auditDumpStr}

${rawContentStr}

OUTPUT: Four segments separated by ||||| exactly:
EXECUTIVE_SUMMARY ||||| DIAGNOSTIC_ANALYSIS ||||| ASSESSMENT ||||| NEXT_STEPS

Rules:
- EXECUTIVE_SUMMARY: Numbered 2–3 critical failures aligned with the audit list; impact sentence; direction sentence.
- DIAGNOSTIC_ANALYSIS: Substance over volume; cite page copy where it helps; no snark.
- ASSESSMENT: Sharp and short.
- NEXT_STEPS: Include the exact required upgrade sentence and invite full report access.

FORBIDDEN in segments 1–2: legal compliance, GDPR, privacy policy language.`;

      console.log("[DEBUG] Generating roast summary with roast models...");
      console.log("[DEBUG] Failed items count:", failedItems.length);
      console.log("[DEBUG] Audit dump preview:", auditDumpStr.substring(0, 200));
      console.log("[DEBUG] Raw content preview:", rawContentStr.substring(0, 300));
      
      // Combine system instruction and user prompt for @google/generative-ai
      // The SDK may not support systemInstruction parameter, so include it in the prompt
      const fullPrompt = `${systemInstruction}

${userPrompt}`;
      
      console.log("[DEBUG] Full prompt length:", fullPrompt.length);
      console.log("[DEBUG] Full prompt preview (first 500 chars):", fullPrompt.substring(0, 500));
      
      // Use the new utility function with automatic fallback and cost tracking
      console.log("[DEBUG] ========== CALLING GENERATE_ROAST_WITH_FALLBACK ==========");
      console.log(`[DEBUG] Models: ${roastPrimary} → ${roastFallback}`);
      console.log(`[DEBUG] Prompt length: ${userPrompt.length} chars`);
      console.log(`[DEBUG] System instruction length: ${systemInstruction.length} chars`);
      
      let roastResult: {
        text: string;
        modelUsed: string;
        inputTokens: number;
        outputTokens: number;
        estimatedCost: number;
      };
      
      try {
        roastResult = await generateRoastWithFallback(
          genAI,
          roastPrimary,
          roastFallback,
          userPrompt,
          systemInstruction,
          {
            temperature: 0.65,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
          }
        );
        console.log("[DEBUG] ✅ generateRoastWithFallback succeeded");
      } catch (roastError: any) {
        console.error("[ERROR] ========== GENERATE_ROAST_WITH_FALLBACK FAILED ==========");
        console.error("[ERROR] Error type:", typeof roastError);
        console.error("[ERROR] Error message:", roastError?.message || "Unknown error");
        console.error("[ERROR] Error stack:", roastError?.stack || "No stack trace");
        console.error("[ERROR] Full error:", JSON.stringify(roastError, Object.getOwnPropertyNames(roastError), 2));
        console.error("[ERROR] =========================================================");
        throw roastError;
      }
      
      const roastText = roastResult.text;
      
      // Store cost info for final response
      roastCostInfo = {
        modelUsed: roastResult.modelUsed,
        inputTokens: roastResult.inputTokens,
        outputTokens: roastResult.outputTokens,
        estimatedCost: roastResult.estimatedCost,
      };
      
      console.log(`[DEBUG] ✅ Roast generated successfully using model: ${roastResult.modelUsed}`);
      console.log(`[DEBUG] 💰 Estimated cost: $${roastResult.estimatedCost.toFixed(4)}`);
      console.log(`[DEBUG] 📊 Token usage: ${roastResult.inputTokens} input + ${roastResult.outputTokens} output = ${roastResult.inputTokens + roastResult.outputTokens} total`);
      
      if (!roastText || roastText.length < 50) {
        throw new Error(`AI response too short: ${roastText.length} characters. Response: ${roastText.substring(0, 200)}`);
      }
      
      // Parse the 4-part script format separated by "|||||"
      let hook = "";
      let script = "";
      let verdict = "";
      let closer = "";
      
      // Check for different separator formats
      let separator = "|||||";
      if (!roastText.includes(separator)) {
        // Try alternative separators
        if (roastText.includes("---")) separator = "---";
        else if (roastText.includes("***")) separator = "***";
        else if (roastText.includes("\n\n\n")) separator = "\n\n\n";
        else {
          console.warn("[WARN] No separator found. Response format:", roastText.substring(0, 500));
        }
      }
      
      if (roastText.includes(separator)) {
        const parts = roastText.split(separator);
        hook = stripNarrativeSegmentLabels(parts[0]?.trim() || "");
        script = stripNarrativeSegmentLabels(parts[1]?.trim() || "");
        verdict = stripNarrativeSegmentLabels(parts[2]?.trim() || "");
        closer = stripNarrativeSegmentLabels(parts[3]?.trim() || "");
        
        console.log("[DEBUG] Successfully parsed 4-part narrative format using separator:", separator);
        console.log("[DEBUG] Parts count:", parts.length);
        console.log("[DEBUG] Hook length:", hook.length, "words:", hook.split(/\s+/).length);
        console.log("[DEBUG] Script length:", script.length, "words:", script.split(/\s+/).length, "lines:", script.split('\n').length);
        console.log("[DEBUG] Verdict length:", verdict.length, "words:", verdict.split(/\s+/).length);
        console.log("[DEBUG] Closer length:", closer.length, "words:", closer.split(/\s+/).length);
        
        const scriptWordCount = script.split(/\s+/).filter(Boolean).length;
        if (scriptWordCount < 80) {
          console.error("[ERROR] Diagnostic segment too short; expected ~120+ words, got:", scriptWordCount);
          console.error("[ERROR] Script content:", script);
          throw new Error(`AI response too short: Diagnostic analysis has only ${scriptWordCount} words (required: 80+).`);
        }
        
        // Filter legal topics from diagnostic body (product positioning)
        const legalTerms = ['legal compliance', 'GDPR', 'privacy policy', 'privacy policies', 'terms and conditions', 'cookie policy', 'disclaimer', 'legal', 'compliance'];
        script = script.split('\n').filter(line => {
          const lowerLine = line.toLowerCase();
          return !legalTerms.some(term => lowerLine.includes(term));
        }).join('\n').trim();
        
        // Build roastSummaryJson with new format
        roastSummaryJson = {
          hook: hook,
          script: script,
          verdict: verdict,
          closer: closer,
          // Legacy format for backward compatibility
          executiveSummary: hook || "",
          roastAnalysis: script || "",
          analysis: script || "",
        };
      } else {
        // Fallback: If format is wrong, try to extract parts manually
        console.warn("[WARN] Script format missing '|||||' separators, attempting fallback parsing");
        const lines = roastText.split("\n").filter((line) => line.trim().length > 0);
        hook = stripNarrativeSegmentLabels(lines[0] || "");
        script = stripNarrativeSegmentLabels(lines.slice(1, -2).join("\n") || "");
        verdict = stripNarrativeSegmentLabels(lines[lines.length - 2] || "");
        closer = stripNarrativeSegmentLabels(lines[lines.length - 1] || "");
        
        const legalTerms = ['legal compliance', 'GDPR', 'privacy policy', 'privacy policies', 'terms and conditions', 'cookie policy', 'disclaimer', 'legal', 'compliance'];
        script = script.split('\n').filter(line => {
          const lowerLine = line.toLowerCase();
          return !legalTerms.some(term => lowerLine.includes(term));
        }).join('\n').trim();
        
        roastSummaryJson = {
          hook: hook,
          script: script,
          verdict: verdict,
          closer: closer,
          executiveSummary: hook || "",
          roastAnalysis: script || "",
          analysis: script || "",
        };
      }
    } catch (e) {
      console.error("[ERROR] ========== ROAST GENERATION FAILED ==========");
      console.error("[ERROR] Error object:", e);
      console.error("[ERROR] Error type:", typeof e);
      console.error("[ERROR] Error message:", safeErrorMessage(e));
      console.error("[ERROR] Error stack:", e instanceof Error ? e.stack : "No stack trace");
      console.error("[ERROR] Full error details:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
      console.error("[ERROR] ==============================================");
      
      // CRITICAL: DO NOT USE FALLBACK - Throw error so we can debug
      // The fallback was masking the real issue. We need to see the actual error.
      throw new Error(
        `Roast generation failed: ${safeErrorMessage(e)}. ` +
        `This error was previously hidden by fallback code. ` +
        `Check server logs above for full error details. ` +
        `Error type: ${typeof e}, Message: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  // Ensure roastSummary is always set with both new and legacy formats
  if (!roastSummaryJson.hook && !roastSummaryJson.executiveSummary) {
      roastSummaryJson = {
        hook: `Overall score: ${overallScore}/100. The page is underperforming on key conversion signals.\n1. Clarity and hierarchy need tightening against audit findings.\n2. Trust and proof are not yet carrying the offer.\n3. Primary actions compete with secondary noise.\nImpact: Friction and ambiguity reduce conversion confidence and slow decisions.\nDirection: Prioritize hero clarity and a single dominant CTA, then layer trust.`,
        script: "Observations: The audit flags multiple elements below best practice; above-the-fold messaging and action design likely under-communicate value. Implications: Users expend cognitive budget decoding the page instead of moving forward, which shows up as drop-off before scroll depth and weaker CTA follow-through. Priorities: Sharpen the value proposition in plain language, align visual hierarchy with the revenue path, and remove competing actions until intent is clear.",
        verdict: "The site has workable bones but the conversion story is not yet decisive. Tightening narrative, proof, and action design will move outcomes faster than cosmetic tweaks.",
        closer: `Upgrade for the full element-level audit, exports, and implementation detail. ${FULL_DIAGNOSTIC_UPGRADE_HOOK}`,
        executiveSummary: `Overall score: ${overallScore}/100. The page is underperforming on key conversion signals.\n1. Clarity and hierarchy need tightening against audit findings.\n2. Trust and proof are not yet carrying the offer.\n3. Primary actions compete with secondary noise.\nImpact: Friction and ambiguity reduce conversion confidence and slow decisions.\nDirection: Prioritize hero clarity and a single dominant CTA, then layer trust.`,
        roastAnalysis: "Observations: The audit flags multiple elements below best practice; above-the-fold messaging and action design likely under-communicate value. Implications: Users expend cognitive budget decoding the page instead of moving forward, which shows up as drop-off before scroll depth and weaker CTA follow-through. Priorities: Sharpen the value proposition in plain language, align visual hierarchy with the revenue path, and remove competing actions until intent is clear.",
        analysis: "Observations: The audit flags multiple elements below best practice; above-the-fold messaging and action design likely under-communicate value. Implications: Users expend cognitive budget decoding the page instead of moving forward, which shows up as drop-off before scroll depth and weaker CTA follow-through. Priorities: Sharpen the value proposition in plain language, align visual hierarchy with the revenue path, and remove competing actions until intent is clear.",
      };
  } else if (roastSummaryJson.hook && !roastSummaryJson.executiveSummary) {
    roastSummaryJson.executiveSummary = roastSummaryJson.hook || "";
    roastSummaryJson.roastAnalysis = roastSummaryJson.script || roastSummaryJson.analysis || "";
  }
  
  // Ensure all script parts are present
  if (!roastSummaryJson.script && roastSummaryJson.analysis) {
    roastSummaryJson.script = roastSummaryJson.analysis;
  }
  if (!roastSummaryJson.verdict) {
    roastSummaryJson.verdict =
      "Assessment: Conversion fundamentals need tightening; the audit indicates measurable gaps versus best-in-class clarity and trust.";
  }
  if (!roastSummaryJson.closer) {
    roastSummaryJson.closer = `Upgrade for the full report and prioritized fix paths. ${FULL_DIAGNOSTIC_UPGRADE_HOOK}`;
  }
  if (
    typeof roastSummaryJson.closer === "string" &&
    !roastSummaryJson.closer.includes(FULL_DIAGNOSTIC_UPGRADE_HOOK)
  ) {
    roastSummaryJson.closer = `${roastSummaryJson.closer.trim()} ${FULL_DIAGNOSTIC_UPGRADE_HOOK}`;
  }

  const revenueLeakEstimate = buildRevenueLeakEstimate();
  const fbInsightLayers = fallbackInsightLayers(radarMetrics);
  let firstImpressionScore = fbInsightLayers.firstImpressionScore;
  let trustGapIndex = fbInsightLayers.trustGapIndex;
  let messagingClarityScore = fbInsightLayers.messagingClarityScore;

  if (allItems.length > 0) {
    try {
      const rawContent = extractRawContent(htmlSource, textContent);
      const radarSummary = radarCategories
        .map((c) => `${c}: ${radarMetrics[c] ?? 50}`)
        .join(", ");
      const failedInsightItems = allItems.filter(
        (item) => item.status === "Failed" || item.status === "Needs Improvement"
      );
      const auditLines = failedInsightItems.slice(0, 15).map((item) => {
        const name = item.elementName || "Item";
        const st = item.status || "";
        return `- ${name}: ${st}`;
      });
      const auditDumpStr =
        auditLines.length > 0 ? auditLines.join("\n") : "No failed items; infer from radar and raw content.";
      const rawContentStr = `
RAW PAGE SIGNALS:
- H1: "${rawContent.h1Text || "(not found)"}"
- Button labels: ${rawContent.buttonTexts.length ? rawContent.buttonTexts.map((t) => `"${t}"`).join(", ") : "(none parsed)"}
- Hero text (truncated): "${rawContent.heroText.substring(0, 280)}"
- First paragraph (truncated): "${rawContent.firstParagraph.substring(0, 200)}"
`.trim();

      const insightUserPrompt = `Radar scores (0-100): ${radarSummary}

Audit items needing attention:
${auditDumpStr}

${rawContentStr}

Return JSON only per the schema.`;

      const insightResult = await generateRoastWithFallback(
        genAI,
        roastPrimary,
        roastFallback,
        insightUserPrompt,
        INSIGHT_LAYERS_SYSTEM_PROMPT,
        {
          temperature: 0.45,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        }
      );
      insightTokenTotals = {
        inputTokens: insightResult.inputTokens,
        outputTokens: insightResult.outputTokens,
        modelUsed: insightResult.modelUsed,
      };

      let parsed: unknown;
      try {
        const t = cleanJsonText(insightResult.text.trim());
        parsed = JSON.parse(t);
      } catch {
        const fixed = repairJson(cleanJsonText(insightResult.text.trim()), undefined);
        parsed = JSON.parse(fixed);
      }

      const merged = mergeInsightLayersFromAI(parsed, radarMetrics);
      firstImpressionScore = merged.firstImpressionScore;
      trustGapIndex = merged.trustGapIndex;
      messagingClarityScore = merged.messagingClarityScore;
    } catch (e) {
      console.warn(
        `[WARN] Insight layers generation failed: ${safeErrorMessage(e)}`
      );
      const fb = fallbackInsightLayers(radarMetrics);
      firstImpressionScore = fb.firstImpressionScore;
      trustGapIndex = fb.trustGapIndex;
      messagingClarityScore = fb.messagingClarityScore;
    }
  }

  // Build quick wins: Badness Score — top 4 priorities for the report Quick Fixes block
  // Filter out Legal Compliance items from Quick Fixes (they should only appear in detailed report)
  const nonLegalItems = allItems.filter((item) => (item.elementName || "").toLowerCase() !== "legal compliance");
  const itemsWithScores = nonLegalItems.map((item) => [item, calculateBadnessScore(item)] as const);
  const sortedItems = itemsWithScores.sort((a, b) => b[1] - a[1]);

  const quickWins: any[] = [];
  for (const [item, score] of sortedItems.slice(0, 4)) {
    const notWorking = item.notWorking || [];
    const fix = item.fix || {};
    quickWins.push({
      title: item.elementName || "Fix Required",
      elementName: item.elementName || "Fix Required",
      problem: notWorking.length > 0 ? notWorking.slice(0, 2).join("; ") : "Review and improve",
      fix:
        typeof fix === "object" && fix !== null
          ? fix.quickFix || "Review and improve"
          : String(fix || "Review and improve"),
      example:
        typeof fix === "object" && fix !== null ? fix.example || "" : "",
      effort: "15min",
      lift:
        typeof fix === "object" && fix !== null
          ? fix.expectedImpact || "Expected conversion improvement"
          : "Expected conversion improvement",
    });
  }

  // Build detailedAudit: Group items by radarCategory (case-insensitive matching)
  const detailedAudit: Record<string, any[]> = {};
  for (const category of radarCategories) {
    const catLower = category.toLowerCase();
    const categoryItems = allItems.filter(
      (item) => (item.radarCategory || "").toLowerCase() === catLower
    );

    // Data validity check: If Visuals category is empty, add placeholder
    if (category.toLowerCase() === "visuals" && categoryItems.length === 0) {
      categoryItems.push({
        elementName: "Visual Analysis",
        status: "Satisfactory",
        impact: "MI",
        radarCategory: "visuals",
        rationale:
          "Visual analysis data was not available. This may indicate the visuals worker did not return structured findings.",
        workingWell: ["Visual elements present on page"],
        notWorking: ["Unable to perform detailed visual analysis"],
        fix: {
          quickFix:
            "Review visual elements manually. Ensure images, colors, and layout align with brand guidelines.",
          expectedImpact: "Maintains visual consistency",
        },
      });
    }

    detailedAudit[category] = partitionLegalComplianceAuditLast(categoryItems);
  }

  const orderedAllItems = partitionLegalComplianceAuditLast(allItems);

  const workersPromptSum = workerUsages.reduce((a, u) => a + u.promptTokens, 0);
  const workersCandSum = workerUsages.reduce(
    (a, u) => a + u.candidatesTokens,
    0
  );
  const roastIn = roastCostInfo?.inputTokens ?? 0;
  const roastOut = roastCostInfo?.outputTokens ?? 0;
  const insightIn = insightTokenTotals.inputTokens;
  const insightOut = insightTokenTotals.outputTokens;
  const auditTotalTokens =
    workersPromptSum + workersCandSum + roastIn + roastOut + insightIn + insightOut;

  // Build final JSON structure (backward compatible with existing display_dashboard and generate_pdf)
  const finalJson = {
    overview: {
      overallScore: overallScore,
      executiveSummary: roastSummaryJson.executiveSummary || roastSummaryJson.hook || "Analysis complete.",
      roastAnalysis: roastSummaryJson.roastAnalysis || roastSummaryJson.script || roastSummaryJson.analysis || "Review findings below.",
    },
    // Cost and model information (for monitoring and debugging)
    _meta: roastCostInfo
      ? {
          modelUsed: roastCostInfo.modelUsed,
          tokenUsage: {
            input: roastCostInfo.inputTokens,
            output: roastCostInfo.outputTokens,
            total: roastCostInfo.inputTokens + roastCostInfo.outputTokens,
          },
          estimatedCost: roastCostInfo.estimatedCost,
          costCurrency: "USD",
          auditTokenUsageTotal: {
            promptTokens: workersPromptSum + roastIn + insightIn,
            candidatesTokens: workersCandSum + roastOut + insightOut,
            totalTokens: auditTotalTokens,
          },
          auditTokenBreakdown: {
            workers: workerUsages.map((u) => ({
              model: u.modelId,
              promptTokens: u.promptTokens,
              candidatesTokens: u.candidatesTokens,
            })),
            narrativeRoast: {
              model: roastCostInfo.modelUsed,
              promptTokens: roastIn,
              candidatesTokens: roastOut,
            },
            insightLayers: {
              model: insightTokenTotals.modelUsed || roastCostInfo.modelUsed,
              promptTokens: insightIn,
              candidatesTokens: insightOut,
            },
          },
        }
      : {
          auditTokenUsageTotal: {
            promptTokens: workersPromptSum + insightIn,
            candidatesTokens: workersCandSum + insightOut,
            totalTokens: workersPromptSum + workersCandSum + insightIn + insightOut,
          },
          auditTokenBreakdown: {
            workers: workerUsages.map((u) => ({
              model: u.modelId,
              promptTokens: u.promptTokens,
              candidatesTokens: u.candidatesTokens,
            })),
            narrativeRoast: null,
            insightLayers: {
              model: insightTokenTotals.modelUsed,
              promptTokens: insightIn,
              candidatesTokens: insightOut,
            },
          },
        },
    roastSummary: roastSummaryJson.executiveSummary || roastSummaryJson.hook || "Analysis complete.",
    // Include new viral script format fields at top level for easier access
    hook: roastSummaryJson.hook || roastSummaryJson.executiveSummary || "",
    script: roastSummaryJson.script || roastSummaryJson.analysis || roastSummaryJson.roastAnalysis || "",
    verdict: roastSummaryJson.verdict || "",
    closer: roastSummaryJson.closer || "",
    // Legacy fields for backward compatibility
    analysis: roastSummaryJson.analysis || roastSummaryJson.script || roastSummaryJson.roastAnalysis || "",
    headline_roast: `Site Score: ${overallScore}/100`,
    radarMetrics: radarMetrics,
    quickWins: quickWins,
    detailedAudit: detailedAudit,
    // Backward compatibility fields
    overall_score: overallScore,
    quick_wins: quickWins,
    summary_bullets: [
      ...orderedAllItems
        .filter((item) => item.status === "Excellent" || item.status === "Good")
        .slice(0, 10)
        .map((item) => `✅ ${item.elementName}`),
      ...orderedAllItems
        .filter(
          (item) => item.status === "Needs Improvement" || item.status === "Failed"
        )
        .slice(0, 10)
        .map((item) => `❌ ${item.elementName}`),
    ],
    sections: [],
    radar_scores: {
      UX: radarMetrics.ux || 50,
      Conversion: radarMetrics.conversion || 50,
      Copy: radarMetrics.copy || 50,
      Visuals: radarMetrics.visuals || 50,
      Trust: radarMetrics.trust || 50,
      Speed: radarMetrics.speed || 50,
    },
    categories: [],
    audit_items: orderedAllItems.map((item) => ({
      element: item.elementName || "",
      status: item.status || "Satisfactory",
      rationale: item.rationale || "",
      working: item.workingWell || [],
      not_working: item.notWorking || [],
      fix:
        typeof item.fix === "object" && item.fix !== null
          ? item.fix.quickFix || ""
          : "",
      expected_impact: item.conversionImpact || "",
    })),
    revenueLeakEstimate,
    firstImpressionScore,
    trustGapIndex,
    messagingClarityScore,
  };

  // Debug log: Log the full API response before returning
  console.log('[DEBUG] FULL_AI_RESPONSE (finalJson):', JSON.stringify(finalJson, null, 2));
  console.log('[DEBUG] roastSummaryJson.script value:', roastSummaryJson.script);
  console.log('[DEBUG] finalJson.script value:', finalJson.script);
  console.log('[DEBUG] finalJson.script length:', finalJson.script?.length || 0);
  console.log('[DEBUG] finalJson.script word count:', finalJson.script?.split(/\s+/).length || 0);
  console.log('[DEBUG] finalJson.script line count:', finalJson.script?.split('\n').length || 0);
  console.log('[DEBUG] finalJson.hook word count:', finalJson.hook?.split(/\s+/).length || 0);
  console.log('[DEBUG] finalJson.verdict word count:', finalJson.verdict?.split(/\s+/).length || 0);
  console.log('[DEBUG] finalJson.closer word count:', finalJson.closer?.split(/\s+/).length || 0);

  return finalJson;
}

/**
 * POST /api/roast
 * Main route handler - orchestrates the entire roast generation process
 * Exact 1:1 migration from main.py flow: User clicks once -> Scraping + Analysis -> Results
 * Accepts { url: string, device?: 'desktop' | 'mobile' }
 * Performs BOTH Puppeteer Scraping AND Gemini Analysis in a single execution chain
 */
export async function POST(request: NextRequest) {
  let chargeUid: string | null = null;
  let chargeCost = 0;

  try {
    const body = await request.json();
    const { url, device = "desktop" } = body;

    // Validate required fields
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "url string is required" },
        { status: 400 }
      );
    }

    // Validate device
    if (device !== "desktop" && device !== "mobile") {
      return NextResponse.json(
        { error: "device must be 'desktop' or 'mobile'" },
        { status: 400 }
      );
    }

    const idToken =
      typeof body.idToken === "string" && body.idToken.trim() ? body.idToken.trim() : "";
    let creditsRemaining: number | undefined;

    if (idToken) {
      try {
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        chargeUid = decoded.uid;
      } catch {
        return NextResponse.json(
          { error: "Unauthorized", details: "Invalid or expired session token" },
          { status: 401 }
        );
      }
      chargeCost = roastGenerationCreditCost();
      if (chargeCost > 0) {
        const debit = await debitRoastCreditsIfSufficient(chargeUid, chargeCost);
        if (!debit.ok) {
          if (debit.reason === "no_profile") {
            return NextResponse.json(
              {
                error: "Profile not found",
                details:
                  "Cloud Firestore has no user document for this account. In Firebase Console enable Firestore (not Realtime Database), publish rules that allow signed-in users to read/write users/{userId}, then sign out and back in.",
              },
              { status: 403 }
            );
          }
          if (debit.reason === "persistence_error") {
            return NextResponse.json(
              {
                error: "Could not verify credits",
                details: "Database error while checking your balance. Try again in a moment.",
              },
              { status: 503 }
            );
          }
          return NextResponse.json(
            {
              error: "Insufficient credits",
              details: `This roast requires ${chargeCost} credits. Add credits from Billing.`,
            },
            { status: 402 }
          );
        }
        creditsRemaining = debit.creditsAfter;
      }
    }

    console.log(`[DEBUG] Starting roast generation for URL: ${url} (${device} mode)`);

    // STEP 1: Capture screenshots AND extract HTML/text (exact from main.py capture_screenshot_from_url)
    console.log("[DEBUG] Step 1: Capturing screenshots and extracting content...");
    const { captureScreenshotFromUrl } = await import("@/lib/capture");
    const { screenshots, htmlContent, pageText, pageHeight } =
      await captureScreenshotFromUrl(url, device);

    console.log(
      `[DEBUG] Captured ${screenshots.length} screenshots, ${htmlContent.length} chars HTML, ${pageText.length} chars text`
    );

    // STEP 1.5: Run quick_scan in parallel (exact from main.py lines 4525-4535)
    let scanData: {
      page_height: number;
      price_guess: number;
      industry_guess: string;
      price_from_page: boolean;
      price_billing_note: string;
    };
    try {
      const { quickScan } = await import("@/lib/quick-scan");
      scanData = await quickScan(url);
      console.log(
        `[DEBUG] Quick scan complete: price=${scanData.price_guess}, industry=${scanData.industry_guess}`
      );
    } catch (scanError) {
      console.warn(`[WARNING] Quick scan failed: ${safeErrorMessage(scanError)}`);
      scanData = {
        page_height: pageHeight,
        price_guess: DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD,
        industry_guess: "SaaS",
        price_from_page: false,
        price_billing_note: "",
      };
    }

    // STEP 2: Convert screenshots to ImageInput format
    const imageInputs: ImageInput[] = screenshots.map((base64) => ({
      base64,
      mimeType: base64.replace(/\s/g, "").startsWith("iVBORw0KGgo") ? "image/png" : "image/jpeg",
    }));

    let seoData: import("@/lib/seo-analyzer").SeoAnalysisResult | null = null;
    let pageType = "unknown";
    let pageSpeed: import("@/lib/pagespeed").PageSpeedSummary | null = null;

    try {
      const { analyzeSEO } = await import("@/lib/seo-analyzer");
      seoData = analyzeSEO(htmlContent, url);
    } catch {
      /* fail silent */
    }

    try {
      const { detectPageType } = await import("@/lib/page-type");
      pageType = detectPageType(url, htmlContent, pageText);
    } catch {
      /* fail silent */
    }

    try {
      const { getPageSpeed } = await import("@/lib/pagespeed");
      pageSpeed = await getPageSpeed(url);
    } catch {
      /* fail silent */
    }

    // STEP 3: Execute compile_roast (exact from main.py compile_roast)
    console.log("[DEBUG] Step 2: Running Gemini analysis...");
    const result = await compileRoast(imageInputs, pageText, htmlContent, url);

    (result as { seo?: unknown; page_type?: string; performance?: unknown }).seo =
      seoData ?? null;
    (result as { seo?: unknown; page_type?: string; performance?: unknown }).page_type =
      pageType ?? "unknown";
    (result as { seo?: unknown; page_type?: string; performance?: unknown }).performance =
      pageSpeed ?? null;

    if (
      seoData != null &&
      typeof seoData.score === "number" &&
      Number.isFinite(seoData.score) &&
      typeof result.overall_score === "number" &&
      Number.isFinite(result.overall_score)
    ) {
      const blended = Math.round((result.overall_score + seoData.score) / 2);
      result.overall_score = blended;
      if (result.overview && typeof result.overview === "object") {
        (result.overview as { overallScore?: number }).overallScore = blended;
      }
      result.headline_roast = `Site Score: ${blended}/100`;
    }

    // Add ROI data to result (exact from main.py lines 4527-4535)
    result.pageHeight = scanData.page_height;
    result.price_guess = scanData.price_guess;
    result.industry_guess = scanData.industry_guess;
    (result as { price_from_page?: boolean }).price_from_page = scanData.price_from_page;
    if (scanData.price_billing_note) {
      (result as { price_billing_note?: string }).price_billing_note = scanData.price_billing_note;
    }

    const trafficEst = await estimateMonthlySessionsForUrl(
      url,
      scanData.industry_guess,
      pageType,
      pageText
    );
    (result as { trafficEstimate?: typeof trafficEst }).trafficEstimate = trafficEst;

    const trafficAssumptionLine =
      trafficEst.source === "gemini"
        ? `Monthly sessions are an illustrative estimate (${trafficEst.monthlySessions.toLocaleString()} visits/mo) from domain context—not your analytics. ${trafficEst.note ?? ""}`.trim()
        : `Monthly sessions (${trafficEst.monthlySessions.toLocaleString()} visits/mo) use a default illustrative benchmark when no model estimate is available. ${trafficEst.note ?? ""}`.trim();

    result.revenueLeakEstimate = buildRevenueLeakEstimate(
      trafficEst.monthlySessions,
      scanData.price_guess,
      {
        industryLabel: scanData.industry_guess,
        priceFromScrape: scanData.price_from_page,
        trafficAssumptionLine,
      }
    );

    let performanceGemini: Awaited<ReturnType<typeof summarizePageSpeedWithGemini>> = null;
    if (pageSpeed) {
      try {
        performanceGemini = await summarizePageSpeedWithGemini(url, pageSpeed);
      } catch {
        performanceGemini = null;
      }
    }
    (result as { performanceGemini?: typeof performanceGemini }).performanceGemini =
      performanceGemini;

    const scrollEffectiveness = buildScrollEffectiveness(
      result as Parameters<typeof buildScrollEffectiveness>[0],
      url,
      scanData.page_height,
      800
    );
    (result as { scrollEffectiveness?: typeof scrollEffectiveness }).scrollEffectiveness =
      scrollEffectiveness;

    if (screenshots[0]) {
      result.heroScreenshot = screenshots[0];
    }

    console.log("[DEBUG] Roast generation complete");
    return NextResponse.json(
      {
        ...result,
        ...(creditsRemaining !== undefined ? { creditsRemaining } : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    if (chargeUid && chargeCost > 0) {
      await refundRoastCredits(chargeUid, chargeCost).catch(() => {
        /* best-effort refund */
      });
    }
    console.error(`[ERROR] Roast API failed: ${safeErrorMessage(error)}`);
    return NextResponse.json(
      {
        error: "Failed to generate roast",
        details: safeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
