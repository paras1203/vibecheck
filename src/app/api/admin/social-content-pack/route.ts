import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { isServerAdminEmail } from "@/lib/admin";
import {
  generateRoastWithFallback,
  initializeGeminiClient,
} from "@/lib/gemini-client";

const SOCIAL_KEYS = [
  "linkedinPostSummary",
  "linkedinFounderStory",
  "xShortHook",
  "xThreadOpener",
  "ctaLinkedIn",
  "ctaX",
] as const;

type SocialPack = Record<(typeof SOCIAL_KEYS)[number], string>;

function parseJsonObject(text: string): unknown {
  let t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t);
  if (fence) t = fence[1].trim();
  return JSON.parse(t) as unknown;
}

function isSocialPack(obj: unknown): obj is SocialPack {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  return SOCIAL_KEYS.every((k) => typeof r[k] === "string" && (r[k] as string).trim().length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const match = /^Bearer\s+(.+)$/i.exec(authHeader);
    if (!match?.[1]) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await getAdminAuth().verifyIdToken(match[1]);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const email = decoded.email;
    if (!isServerAdminEmail(email ?? null)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      anonymize?: boolean;
      auditedUrl?: string;
      overallScore?: number;
      executiveSummary?: string;
      roastAnalysis?: string;
      quickWins?: Array<{
        title?: string;
        elementName?: string;
        problem?: string;
        fix?: string;
        lift?: string;
      }>;
      radarScores?: Record<string, number>;
      industryGuess?: string;
    };

    const anonymize = Boolean(body.anonymize);
    const auditedUrl = typeof body.auditedUrl === "string" ? body.auditedUrl : "";
    const siteLabel = anonymize
      ? "an audited B2B-style website (specific domain withheld for client confidentiality)"
      : auditedUrl || "the audited URL";

    const wins = Array.isArray(body.quickWins) ? body.quickWins.slice(0, 5) : [];
    const winsText = wins
      .map(
        (w, i) =>
          `${i + 1}. ${w.title || w.elementName || "Finding"} — Problem: ${w.problem || "n/a"}. Fix: ${w.fix || "n/a"}. Impact note: ${w.lift || "n/a"}.`
      )
      .join("\n");

    const radar =
      body.radarScores && typeof body.radarScores === "object"
        ? JSON.stringify(body.radarScores)
        : "{}";

    const systemInstruction = `You are a senior conversion strategist writing public social posts for a founder or consultant.
Rules:
- Tone: professional, sharp, credible, educational. Expert insight, not hype.
- Do NOT use roast comedy, sarcasm, insults, or "roast" framing.
- Do NOT sound like spam or heavy self-promotion; a light, natural CTA is fine.
- Base every line on the audit facts provided; do not invent metrics not implied by the input.
- If the domain is anonymized, never guess or reveal a real brand or URL; keep wording generic.
- Output MUST be a single JSON object with exactly these string keys and no others:
  "linkedinPostSummary", "linkedinFounderStory", "xShortHook", "xThreadOpener", "ctaLinkedIn", "ctaX"
- linkedinPostSummary: 2–4 short paragraphs, suitable for LinkedIn (plain text).
- linkedinFounderStory: first-person founder angle, reflective story opening that leads into the lesson from the audit (not fictional tragedy; grounded in the audit).
- xShortHook: under 260 characters, one punchy line.
- xThreadOpener: 1–2 sentences to start a thread; invites curiosity without clickbait lies.
- ctaLinkedIn and ctaX: single lines; soft CTA inviting DMs or a conversion audit (no hard sell).`;

    const userPrompt = `Audited site context: ${siteLabel}
Overall score (0–100): ${typeof body.overallScore === "number" ? body.overallScore : "unknown"}
Industry hint: ${body.industryGuess || "unknown"}

Executive / summary:
${body.executiveSummary || "n/a"}

Diagnostic / analysis excerpt:
${(body.roastAnalysis || "").slice(0, 8000)}

Radar dimension scores (JSON): ${radar}

Top quick wins:
${winsText || "n/a"}

Return only the JSON object.`;

    const { genAI, roastPrimary, roastFallback } = initializeGeminiClient();
    const { text, modelUsed } = await generateRoastWithFallback(
      genAI,
      roastPrimary,
      roastFallback,
      userPrompt,
      systemInstruction,
      { temperature: 0.65, maxOutputTokens: 4096 }
    );

    let parsed: unknown;
    try {
      parsed = parseJsonObject(text);
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON", raw: text.slice(0, 500) },
        { status: 502 }
      );
    }

    if (!isSocialPack(parsed)) {
      return NextResponse.json(
        { error: "Model JSON missing required fields", raw: text.slice(0, 500) },
        { status: 502 }
      );
    }

    return NextResponse.json({ pack: parsed, modelUsed });
  } catch (e) {
    console.error("[social-content-pack]", e);
    return NextResponse.json(
      {
        error: "Failed to generate social pack",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
