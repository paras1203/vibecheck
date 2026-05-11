/**
 * Parses EXECUTIVE_SUMMARY-shaped prose (hook / overview.executiveSummary) into
 * numbered bullets plus trailing impact / fix-first lines.
 */

export type ParsedExecutiveSummary = {
  bullets: string[];
  impactLine?: string;
  fixFirstLine?: string;
  /** Present when no numbered bullets were detected — render as one block */
  fallbackBody?: string;
};

const NUMBERED_LINE = /^\s*(\d+)[\.)]\s+(.*)$/;

function splitSentences(text: string): string[] {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return [];
  const parts = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [t];
}

function extractInlineNumberedParagraph(para: string): { bullets: string[]; rest: string } {
  const bullets: string[] = [];
  const re = /(\d+)[\.)]\s+/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  const matches: { start: number; num: string }[] = [];
  while ((m = re.exec(para)) !== null) {
    matches.push({ start: m.index, num: m[1] ?? "" });
  }
  if (matches.length === 0) return { bullets: [], rest: para };

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i]!.start;
    const nextStart = matches[i + 1]?.start ?? para.length;
    const chunk = para.slice(start, nextStart).replace(/^\d+[\.)]\s+/, "").trim();
    if (chunk) bullets.push(chunk);
  }
  const rest = para.slice(0, matches[0]!.start).trim();
  return { bullets, rest };
}

/**
 * @param text Already stripped of markdown / segment labels if desired.
 */
export function parseExecutiveSummaryText(text: string): ParsedExecutiveSummary {
  const raw = text.trim();
  if (!raw) return { bullets: [] };

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const preLines: string[] = [];
  const lineBullets: string[] = [];
  const postLines: string[] = [];

  for (const line of lines) {
    const m = line.match(NUMBERED_LINE);
    if (m) {
      if (lineBullets.length < 3) lineBullets.push((m[2] ?? "").trim());
      continue;
    }
    if (lineBullets.length === 0) preLines.push(line);
    else postLines.push(line);
  }

  let bullets = lineBullets.slice(0, 3);
  let remainder = postLines.join("\n").trim();

  if (bullets.length === 0 && raw.includes("1.")) {
    const inline = extractInlineNumberedParagraph(raw);
    bullets = inline.bullets.slice(0, 3);
    remainder = inline.rest.trim();
  }

  if (bullets.length === 0) {
    return { bullets: [], fallbackBody: raw };
  }

  const sentences = splitSentences(remainder.replace(/\n+/g, " "));
  let impactLine: string | undefined;
  let fixFirstLine: string | undefined;
  if (sentences.length >= 2) {
    fixFirstLine = sentences[sentences.length - 1];
    impactLine = sentences[sentences.length - 2];
  } else if (sentences.length === 1) {
    impactLine = sentences[0];
  }

  return { bullets, impactLine, fixFirstLine };
}
