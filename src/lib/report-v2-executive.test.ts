import { describe, expect, it } from "vitest";
import { parseExecutiveSummaryText } from "./report-v2-executive";

describe("parseExecutiveSummaryText", () => {
  it("extracts three line bullets and trailing sentences", () => {
    const text = `The page is underperforming on clarity and trust.
1. Hero headline is vague versus the offer
2. Primary CTA competes with secondary links
3. Trust proof sits below the fold
Lost conversions stem from hesitation before signup.
Fix hero copy and a single dominant CTA first.`;
    const r = parseExecutiveSummaryText(text);
    expect(r.bullets).toEqual([
      "Hero headline is vague versus the offer",
      "Primary CTA competes with secondary links",
      "Trust proof sits below the fold",
    ]);
    expect(r.impactLine).toContain("Lost conversions");
    expect(r.fixFirstLine).toContain("Fix hero copy");
    expect(r.fallbackBody).toBeUndefined();
  });

  it("returns fallbackBody when no numbered list", () => {
    const text = "Overall the site needs work on messaging and speed.";
    const r = parseExecutiveSummaryText(text);
    expect(r.bullets).toEqual([]);
    expect(r.fallbackBody).toBe(text);
  });

  it("parses inline numbered list in one paragraph", () => {
    const text =
      "Underperforming. 1. First failure here. 2. Second failure. 3. Third failure. Impact is qualitative friction. Start with the hero.";
    const r = parseExecutiveSummaryText(text);
    expect(r.bullets.length).toBeGreaterThanOrEqual(1);
    expect(r.bullets.length).toBeLessThanOrEqual(3);
    expect(r.fallbackBody).toBeUndefined();
  });
});
