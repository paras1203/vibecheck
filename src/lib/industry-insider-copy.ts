export type IndustryInsiderKey = "SaaS" | "Agency" | "E-commerce";

const POINTS: Record<IndustryInsiderKey, readonly [string, string, string]> = {
  SaaS: [
    "Visitors decide in seconds—if your hero names a category instead of an outcome, you’re asking them to do homework before they care.",
    "“Start trial” works when the very next screen is obvious; vague CTAs burn people who were already warm enough to click once.",
    "Logo strips only help when each mark whispers a result—pair logos with a tight proof line or people assume filler.",
  ],
  Agency: [
    "Buyers aren’t hunting for “strategy”—they want receipts. Lead with a named win and a number before you show process diagrams.",
    "Case studies that open on the messy before (leads stalling, scope creep, wasted spend) make your process feel inevitable, not decorative.",
    "When deliverables read like a black box, quotes stall—spell week-one outputs so hiring you feels like buying clarity, not a gamble.",
  ],
  "E-commerce": [
    "Shipping, returns, and final price near the buy zone beat another hero carousel—people bounce when the math feels like a scavenger hunt.",
    "UGC in a real room closes the imagination gap faster than studio-only shots because shoppers can picture the thing on their shelf.",
    "Trust badges next to the pay button outperform the same badges buried in the footer—last-click anxiety is where carts die.",
  ],
};

export function getIndustryInsiderPoints(industry: string): string[] {
  const k = industry as IndustryInsiderKey;
  if (k in POINTS) return [...POINTS[k]];
  return [...POINTS.SaaS];
}

export function industryInsiderBenchmarkLine(industry: string): string {
  return getIndustryInsiderPoints(industry)[0] ?? POINTS.SaaS[0];
}
