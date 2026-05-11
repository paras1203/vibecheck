/** Normalize and length-cap quick-win text for reports (server + reusable for tests). */

const PERCENT_CHUNK =
  /\b(\d{1,3}(?:\.\d+)?)\s*%\s*(?:uplift|increase|boost|gain|lift|improvement|conversion(?:\s+rate)?(?:\s+gain)?)/gi;

export function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function upliftBucketForPercent(n: number): string {
  if (n < 15) return "small improvement";
  if (n <= 30) return "moderate improvement";
  return "material improvement";
}

export function stripPercentUpliftToQualitative(text: string): string {
  let out = text;
  PERCENT_CHUNK.lastIndex = 0;
  out = out.replace(PERCENT_CHUNK, (_, num: string) => upliftBucketForPercent(parseFloat(num)));
  out = out.replace(
    /\b(\d{1,3}(?:\.\d+)?)\s*%\s+more\b/gi,
    (_, num: string) => upliftBucketForPercent(parseFloat(num))
  );
  return out;
}

function truncateToWords(text: string, maxWords: number): string {
  const w = text.trim().split(/\s+/).filter(Boolean);
  if (w.length <= maxWords) return w.join(" ");
  return `${w.slice(0, maxWords).join(" ")}…`;
}

/**
 * Keeps Problem + Fix + Impact combined ≤ maxTotalWords by trimming Problem, then Fix, then Lift.
 */
export function truncateCombinedQuickWinFields(
  problem: string,
  fix: string,
  lift: string,
  maxTotalWords = 150
): { problem: string; fix: string; lift: string } {
  let p = problem.trim();
  let f = fix.trim();
  let l = lift.trim();

  const total = () => countWords(p) + countWords(f) + countWords(l);
  if (total() <= maxTotalWords) return { problem: p, fix: f, lift: l };

  const minProblem = 8;
  const minFix = 10;
  const minLift = 6;

  while (total() > maxTotalWords) {
    const wp = countWords(p);
    const wf = countWords(f);
    const wl = countWords(l);
    if (wp > minProblem) {
      p = truncateToWords(p, wp - 1);
    } else if (wf > minFix) {
      f = truncateToWords(f, wf - 1);
    } else if (wl > minLift) {
      l = truncateToWords(l, wl - 1);
    } else {
      break;
    }
  }
  return { problem: p, fix: f, lift: l };
}

export type ImpactCode = "HI" | "MI" | "LI";

export function normalizeImpactCode(raw: unknown): ImpactCode | undefined {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (s === "HI" || s === "MI" || s === "LI") return s;
  return undefined;
}

/** One line for card bullets: prepend fix snippet with example headline when BEFORE/AFTER. */
export function quickWinFixBulletText(fixText: string, example: string): string {
  const ex = example.trim();
  if (/BEFORE\s*:/i.test(ex)) {
    const firstLine = ex.split(/\n/).map((l) => l.trim()).find(Boolean) || ex;
    return `${fixText.trim()} ${firstLine}`.trim();
  }
  return fixText.trim();
}
