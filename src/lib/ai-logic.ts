import { z } from "zod";
import { ai, googleGeminiModel } from "@/lib/genkit";
import { getWorkerGeminiModels, isRetryableGeminiModelError } from "@/lib/llm-models";

// Zod schema for SiteRoast output - Advanced v2 with punchline/realityCheck
export const RoastSchema = z.object({
  verdict: z.object({
    punchline: z.string().min(50).describe("The Punchline (3-4 Lines). A savage, witty summary hook. Example: 'This landing page has the personality of a damp cardboard box. It effectively convinces me to close the tab immediately.'"),
    realityCheck: z.string().min(100).describe("A 5-10 sentence paragraph diving deeper. Explain the core strategic failure. Example: 'You are trying to speak to everyone, so you speak to no one. The design signals 'amateur' because of the inconsistent spacing...'"),
  }).describe("The Verdict with punchline and reality check"),
  lens1: z.object({
    issue: z.string().min(50).describe("The Fail: Explain the specific issue. Use professional terms like 'Above the Fold' or 'Value Prop'. Critique the Value Proposition and navigation. Identify 3-5 critical fail aspects."),
    fix: z.string().min(50).describe("The Fix: Specific advice. 'Change H1 to: [Example Copy]'. Increase button padding by 20px. Include exact measurements, colors, and font specifications. Provide respective fixes for each critical fail aspect."),
  }).describe("Lens 1: The 3-Second Rule (First Impression)"),
  lens2: z.object({
    issue: z.string().min(50).describe("The Fail: Critique the layout/scanning pattern. Analyze Visual Hierarchy. Identify False Bottoms. Critique whitespace usage. Identify 3-5 critical fail aspects."),
    fix: z.string().min(50).describe("The Fix: Specific advice with exact measurements. Explain how to fix the cognitive flow and visual hierarchy. Provide respective fixes for each critical fail aspect."),
  }).describe("Lens 2: Structure & Cognitive Flow"),
  lens3: z.object({
    issue: z.string().min(50).describe("The Fail: Critique fonts/colors/images. Identify Trust Killers. Assess if it looks like a $100m company or student project. Identify 3-5 critical fail aspects."),
    fix: z.string().min(50).describe("The Fix: Give exact Hex Codes and Font Families. Specify typography pairings. Provide exact color values and font specifications. Provide respective fixes for each critical fail aspect."),
  }).describe("Lens 3: Brand Authority & Trust"),
  quickWins: z.array(z.string().min(20)).length(3).describe("3 specific, actionable steps the user can do today. Each must be specific (include exact values, colors, sizes, etc.)"),
});

export type Roast = z.infer<typeof RoastSchema>;

// Input schema for the flow
const InputSchema = z.object({
  images: z.array(z.string().url()).min(1).describe("Array of screenshot URLs representing the same webpage scrolled from top to bottom"),
  device: z.enum(["desktop", "mobile"]).describe("Device type the screenshots were captured on"),
});

/**
 * Genkit flow to generate a roast of a website screenshot
 * @param screenshotUrl - URL of the screenshot image
 * @returns Structured roast data
 */
export const generateRoast = ai.defineFlow(
  {
    name: "generateRoast",
    inputSchema: InputSchema as any, // Type assertion needed due to Zod v4 compatibility with Genkit
    // outputSchema removed - we validate manually with RoastSchema.parse() for better error handling
  },
  async (input) => {
    console.log("=== STARTING ROAST GENERATION ===");
    console.log("Number of screenshot chunks:", input.images.length);
    console.log("Device type:", input.device);
    console.log("Screenshot URLs:", input.images);
    
    // Check if API key is set
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      throw new Error("GOOGLE_GENAI_API_KEY environment variable is not set!");
    }
    
    try {
      // Fetch all images from URLs
      console.log("Fetching images from URLs...");
      const imagePromises = input.images.map(async (imageUrl: string, index: number) => {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image ${index + 1}: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString("base64");
        const imageMimeType = imageResponse.headers.get("content-type") || "image/jpeg";
        
        console.log(`Image ${index + 1} fetched successfully:`);
        console.log(`- Size: ${imageBuffer.byteLength} bytes`);
        console.log(`- MIME type: ${imageMimeType}`);
        
        return {
          base64: imageBase64,
          mimeType: imageMimeType,
        };
      });

      const images = await Promise.all(imagePromises);
      console.log(`All ${images.length} images fetched successfully`);

      // System prompt: SiteRoast persona - CRO expert with 3-lens analysis framework
      // Updated to handle multiple screenshot chunks and device context
    const deviceContext = input.device === 'mobile' 
      ? "**MOBILE DEVICE** (iPhone viewport - 390x844)"
      : "**DESKTOP DEVICE** (Standard desktop viewport - 1440x900)";
    
    const deviceSpecificGuidance = input.device === 'mobile'
      ? `- **Mobile-Specific Focus:**
        - Tap target sizes (minimum 44x44px)
        - Hamburger menu visibility
        - Stacked layout efficiency
        - Text readability on small screens
        - Thumb-friendly navigation`
      : `- **Desktop-Specific Focus:**
        - Whitespace usage
        - Grid alignment
        - Horizontal hierarchy
        - Hover states
        - Wide-screen optimization`;

    const systemPrompt = `### ROLE & OBJECTIVE
You are "SiteRoast," a Senior UX Director and Conversion Scientist with 20 years of experience. You are known for being brutally honest, technically precise, and slightly mean. You are auditing a website based on a sequence of screenshots. These images represent ONE continuous webpage from top to bottom, scrolled with 300px overlap for context.

**DEVICE CONTEXT:** The user is viewing this site on a ${deviceContext}.
${deviceSpecificGuidance}

### THE GOAL
**Roast:** Do not hold back. Use analogies. If the site is boring, call it "digital sleeping pills." If it's cluttered, call it a "hoarder's garage."

**Consult:** Your advice must go beyond "change the color." You must explain the psychology of why it fails (e.g., "Cognitive Load," "F-Pattern violation," "Lack of Social Proof").

### ANALYSIS FRAMEWORK (THE 3 LENSES)

**Lens 1: The 3-Second Rule (First Impression)**

**Depth:** Don't just check for a headline. Critique the Value Proposition. If the user has to read 3 sentences to understand the product, it is a failure.

**Tech:** Check the navigation bar. Is it bloated? Are the CTAs low-contrast?

**Lens 2: Structure & Cognitive Flow**

**Depth:** Analyze the "Visual Hierarchy." Are the most important elements the biggest?

**Tech:** Look for "False Bottoms" (design flaws that make users think the page ends). Critique the use of whitespace—amateurs use too little; pros use it to guide the eye.

**Lens 3: Brand Authority & Trust**

**Depth:** Does this look like a $100m company or a student project? Critique the typography pairings.

**Tech:** Identify specific "Trust Killers" (e.g., stock photos that look fake, typos, alignment issues).

### OUTPUT FORMAT (STRICT JSON)
Return your response in this exact JSON format (no markdown, no code blocks):

{
  "verdict": {
    "punchline": "The Punchline (3-4 Lines). A savage, witty summary hook. Example: 'This landing page has the personality of a damp cardboard box. It effectively convinces me to close the tab immediately.'",
    "realityCheck": "A 5-10 sentence paragraph diving deeper. Explain the core strategic failure. Example: 'You are trying to speak to everyone, so you speak to no one. The design signals 'amateur' because of the inconsistent spacing...'"
  },
  "lens1": {
    "issue": "The Fail: Explain the specific issue. Use professional terms like 'Above the Fold' or 'Value Prop'. Critique the Value Proposition and navigation. Identify 3-5 critical fail aspects.",
    "fix": "The Fix: Specific advice. 'Change H1 to: [Example Copy]'. Increase button padding by 20px. Include exact measurements, colors, and font specifications. Provide respective fixes for each critical fail aspect."
  },
  "lens2": {
    "issue": "The Fail: Critique the layout/scanning pattern. Analyze Visual Hierarchy. Identify False Bottoms. Critique whitespace usage. Identify 3-5 critical fail aspects.",
    "fix": "The Fix: Specific advice with exact measurements. Explain how to fix the cognitive flow and visual hierarchy. Provide respective fixes for each critical fail aspect."
  },
  "lens3": {
    "issue": "The Fail: Critique fonts/colors/images. Identify Trust Killers. Assess if it looks like a $100m company or student project. Identify 3-5 critical fail aspects.",
    "fix": "The Fix: Give exact Hex Codes and Font Families. Specify typography pairings. Provide exact color values and font specifications. Provide respective fixes for each critical fail aspect."
  },
  "quickWins": [
    "Actionable Step 1: Specific instruction with exact values",
    "Actionable Step 2: Specific instruction with exact values",
    "Actionable Step 3: Specific instruction with exact values"
  ]
}

**CRITICAL RULES:**
- Every fix must include exact values (hex codes, pixel sizes, font names, measurements)
- Never use generic advice like "improve contrast" or "fix spacing"
- Use professional UX/CRO terminology (Cognitive Load, F-Pattern, Visual Hierarchy, False Bottoms, Trust Killers, etc.)
- The punchline should be savage and memorable (3-4 lines)
- The reality check should be a deep strategic analysis (5-10 sentences)
- Under each lens, identify "critical fail" aspects. List out 3-5 pointers in each of them and suggest respective fixes
- Quick wins must be specific and actionable with exact values

### EDGE CASES
**IF THE SCREENSHOTS SHOW A CLOUDFLARE CAPTCHA, 403 FORBIDDEN, OR BLANK SCREEN:**
- Your roast should mock the site for being paranoid and blocking users.
- Example Punchline: "I'd love to roast your site, but it's hiding behind a Cloudflare bouncer like a VIP club with no members."
- Example Reality Check: "The paranoia is strong with this one. Sites that block legitimate users with captcha walls signal either extreme insecurity or a complete lack of trust in their own security infrastructure."
- Still provide fixes for the captcha/blocking issue.

Return ONLY the JSON object, nothing else. No markdown, no code blocks, no explanations.`;

    try {
      console.log("Sending request to Gemini API with", images.length, "images...");

      const promptMedia = images.map((img) => ({
        media: {
          url: `data:${img.mimeType};base64,${img.base64}`,
        },
      }));

      const { primary: workerPrimary, fallback: workerFallback } =
        getWorkerGeminiModels();
      const modelIds =
        workerPrimary === workerFallback
          ? [workerPrimary]
          : [workerPrimary, workerFallback];

      let result: Awaited<ReturnType<typeof ai.generate>> | undefined;
      let lastModelError: unknown;
      for (const modelId of modelIds) {
        try {
          console.log("Calling ai.generate with model:", modelId);
          result = await ai.generate({
            model: googleGeminiModel(modelId),
            system: systemPrompt,
            prompt: promptMedia,
            config: {
              temperature: 1.0,
              topP: 0.95,
              topK: 40,
            },
            output: {
              format: "json",
              schema: RoastSchema,
            },
          } as unknown as Parameters<typeof ai.generate>[0]);
          break;
        } catch (e) {
          const isLast = modelId === modelIds[modelIds.length - 1];
          if (!isLast && isRetryableGeminiModelError(e)) {
            console.warn(
              `[WARN] Genkit model ${modelId} failed; trying fallback ${modelIds[modelIds.indexOf(modelId) + 1]}...`,
              e instanceof Error ? e.message : e
            );
            lastModelError = e;
            continue;
          }
          throw e;
        }
      }

      if (!result) {
        throw lastModelError instanceof Error
          ? lastModelError
          : new Error(String(lastModelError ?? "All Genkit models failed"));
      }

      console.log("Generation complete, parsing output...");
      console.log("Result object:", {
        hasOutput: !!result.output,
        hasText: !!result.text,
        hasMessage: !!result.message,
        outputType: typeof result.output,
        textPreview: result.text?.substring(0, 200),
      });
      
      // Parse and validate the response
      // The result has 'output' as a property (getter) that returns the structured output
      // If output is null/undefined, try using text and parsing it
      let output = result.output;
      
      if (!output && result.text) {
        console.log("No output property, trying to parse text...");
        try {
          // Try to parse the text as JSON
          output = JSON.parse(result.text);
        } catch {
          // If text is not JSON, try to extract JSON from it
          const jsonMatch = result.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            output = JSON.parse(jsonMatch[0]);
          }
        }
      }
      
      if (!output) {
        console.error("No output received from model. Full result:", JSON.stringify({
          output: result.output,
          text: result.text,
          message: result.message,
        }, null, 2));
        throw new Error("No output received from model");
      }
      
      console.log("Output received, type:", typeof output);
      console.log("Output value:", JSON.stringify(output, null, 2));
      
      // The output might be a string that needs parsing, or already an object
      let parsedOutput: unknown = output;
      if (typeof output === "string") {
        try {
          parsedOutput = JSON.parse(output);
        } catch (parseError) {
          console.error("Failed to parse output as JSON:", output);
          // Try to extract JSON from the string
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedOutput = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error(`Failed to parse output: ${output.substring(0, 500)}`);
          }
        }
      }
      
      console.log("Parsed output:", JSON.stringify(parsedOutput, null, 2));
      
      // Try to repair common malformed responses for roast schema
      if (parsedOutput && typeof parsedOutput === "object" && !Array.isArray(parsedOutput)) {
        const output = parsedOutput as Record<string, unknown>;
        
        // Ensure verdict exists and has punchline/realityCheck structure
        if (!output.verdict || typeof output.verdict !== "object") {
          output.verdict = {
            punchline: "This site needs work. The design choices are questionable and the user experience is confusing. It's like a PowerPoint presentation that decided to become a startup.",
            realityCheck: "The core strategic failure here is a lack of clear value proposition and visual hierarchy. The design signals 'amateur' because of inconsistent spacing, unclear messaging, and poor use of whitespace. Users are left confused about what the product actually does and why they should care.",
          };
        } else {
          const verdict = output.verdict as Record<string, unknown>;
          if (typeof verdict.punchline !== "string" || verdict.punchline.length < 50) {
            verdict.punchline = "This site needs work. The design choices are questionable and the user experience is confusing. It's like a PowerPoint presentation that decided to become a startup.";
          }
          if (typeof verdict.realityCheck !== "string" || verdict.realityCheck.length < 100) {
            verdict.realityCheck = "The core strategic failure here is a lack of clear value proposition and visual hierarchy. The design signals 'amateur' because of inconsistent spacing, unclear messaging, and poor use of whitespace. Users are left confused about what the product actually does and why they should care.";
          }
        }
        
        // Ensure lens1 exists and has issue/fix
        if (!output.lens1 || typeof output.lens1 !== "object") {
          output.lens1 = {
            issue: "The hero section fails the 3-second rule - unclear value proposition",
            fix: "Rewrite H1 to clearly state the value proposition (e.g., 'Save 10 Hours Per Week') - make it 48px, bold, color #1F2937",
          };
        } else {
          const lens1 = output.lens1 as Record<string, unknown>;
          if (typeof lens1.issue !== "string" || lens1.issue.length < 50) {
            lens1.issue = "The Fail: The hero section fails the 3-second rule. The Value Proposition is unclear - users must read 3+ sentences to understand the product. The navigation bar is bloated with too many items. CTAs have low contrast and are not immediately visible.";
          }
          if (typeof lens1.fix !== "string" || lens1.fix.length < 50) {
            lens1.fix = "The Fix: Change H1 to a specific value proposition (e.g., 'Save 10 Hours Per Week with AI Automation') - make it 48px, bold, color #1F2937. Reduce navigation items to 5 maximum. Increase CTA button contrast: background #10B981, white text (#FFFFFF), 200px wide, 48px tall, positioned above the fold.";
          }
        }
        
        // Ensure lens2 exists and has issue/fix
        if (!output.lens2 || typeof output.lens2 !== "object") {
          output.lens2 = {
            issue: "Poor structure and user flow - text density too high, no clear hierarchy",
            fix: "Add 40px padding between sections. Make headers 24px, bold. Body text 16px, line-height 1.6",
          };
        } else {
          const lens2 = output.lens2 as Record<string, unknown>;
          if (typeof lens2.issue !== "string" || lens2.issue.length < 50) {
            lens2.issue = "The Fail: Poor Visual Hierarchy - the most important elements are not the biggest. False Bottoms make users think the page ends prematurely. Whitespace is used incorrectly - amateurs use too little, pros use it to guide the eye. Text density is too high, creating cognitive overload.";
          }
          if (typeof lens2.fix !== "string" || lens2.fix.length < 50) {
            lens2.fix = "The Fix: Establish clear Visual Hierarchy - make H1 48px, H2 32px, H3 24px. Add 40px padding between sections to create breathing room. Reduce body text to 16px, line-height 1.6, color #4B5563. Remove False Bottoms by adding clear continuation signals (arrows, 'scroll for more' indicators).";
          }
        }
        
        // Ensure lens3 exists and has issue/fix
        if (!output.lens3 || typeof output.lens3 !== "object") {
          output.lens3 = {
            issue: "Aesthetic issues - inconsistent fonts and clashing colors",
            fix: "Use Inter font throughout: 48px H1, 24px H2, 16px body. Primary color #10B981, text #1F2937 on white (#FFFFFF)",
          };
        } else {
          const lens3 = output.lens3 as Record<string, unknown>;
          if (typeof lens3.issue !== "string" || lens3.issue.length < 50) {
            lens3.issue = "The Fail: This looks like a student project, not a $100m company. Trust Killers include: stock photos that look fake, inconsistent typography pairings (mixing 4+ fonts), clashing color palette. Typography lacks professional polish - no clear font hierarchy.";
          }
          if (typeof lens3.fix !== "string" || lens3.fix.length < 50) {
            lens3.fix = "The Fix: Use Inter font throughout: 48px H1 (bold), 24px H2 (semibold), 16px body (regular), line-height 1.6. Primary color #10B981 (Emerald Green), secondary #3B82F6 (Blue), text #1F2937 on white (#FFFFFF) background. Replace stock photos with authentic imagery or illustrations. Establish consistent typography pairing (Inter for headings, Inter for body).";
          }
        }
        
        // Fix quickWins if it's undefined or not an array, or has wrong length
        if (!output.quickWins || !Array.isArray(output.quickWins)) {
          output.quickWins = [
            "Change the hero H1 to a specific value proposition - 48px, bold, #1F2937",
            "Increase button contrast: Change CTA to #10B981 background with white (#FFFFFF) text, 200px wide, 48px tall",
            "Add 40px vertical padding between all sections to create breathing room",
          ];
        } else {
          const wins = output.quickWins as unknown[];
          while (wins.length < 3) {
            wins.push("Review and improve visual hierarchy with specific measurements");
          }
          output.quickWins = wins
            .slice(0, 3)
            .map((win: unknown, index: number) => {
              if (typeof win === "string" && win.length >= 10) {
                return win;
              }
              const defaults = [
                "Change the hero H1 to a specific value proposition - 48px, bold, #1F2937",
                "Increase button contrast: Change CTA to #10B981 background with white (#FFFFFF) text, 200px wide, 48px tall",
                "Add 40px vertical padding between all sections to create breathing room",
              ];
              return defaults[index] || "Review and improve with specific measurements";
            });
        }
      }
      
      // Validate against schema with better error messages
      try {
        const roast = RoastSchema.parse(parsedOutput);
        console.log("Roast validated successfully");
        return roast;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error("Schema validation failed. Output structure:", JSON.stringify(parsedOutput, null, 2));
          console.error("Validation errors:", validationError.issues);
          throw new Error(`Schema validation failed: ${validationError.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
        }
        throw validationError;
      }
    } catch (error) {
      console.error("=== ERROR IN AI.GENERATE ===");
      console.error("Error type:", error?.constructor?.name || typeof error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else {
        console.error("Error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      console.error("===========================");
      throw error;
    }
  } catch (outerError) {
    // Catch any errors from the outer try block (image fetching, etc.)
    console.error("=== ERROR IN OUTER TRY BLOCK ===");
    if (outerError instanceof Error) {
      console.error("Error name:", outerError.name);
      console.error("Error message:", outerError.message);
      console.error("Error stack:", outerError.stack);
    }
    console.error("================================");
    throw outerError;
  }
  }
);

