import { describe, expect, it } from "vitest";

import {
  countWords,
  normalizeImpactCode,
  stripPercentUpliftToQualitative,
  truncateCombinedQuickWinFields,
} from "./quick-wins-format";

describe("stripPercentUpliftToQualitative", () => {
  it("maps percent uplift phrases to buckets", () => {
    expect(stripPercentUpliftToQualitative("Expect 8% uplift")).toContain("small improvement");
    expect(stripPercentUpliftToQualitative("20% increase in conversion")).toContain(
      "moderate improvement"
    );
    expect(stripPercentUpliftToQualitative("40% boost")).toContain("material improvement");
  });

  it("handles % more pattern", () => {
    expect(stripPercentUpliftToQualitative("12% more signups")).toMatch(/small improvement/);
  });
});

describe("truncateCombinedQuickWinFields", () => {
  it("truncates problem first while respecting floor order", () => {
    const problem = "word ".repeat(100);
    const fix = "fx ".repeat(10);
    const lift = "impact ".repeat(5);
    const { problem: p, fix: f, lift: l } = truncateCombinedQuickWinFields(
      problem,
      fix,
      lift,
      50
    );
    expect(countWords(p) + countWords(f) + countWords(l)).toBeLessThanOrEqual(50);
    expect(countWords(p)).toBeGreaterThanOrEqual(8);
  });
});

describe("normalizeImpactCode", () => {
  it("accepts HI/MI/LI", () => {
    expect(normalizeImpactCode("hi")).toBe("HI");
    expect(normalizeImpactCode("LI")).toBe("LI");
    expect(normalizeImpactCode("bogus")).toBeUndefined();
  });
});
