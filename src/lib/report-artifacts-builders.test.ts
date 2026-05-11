import { describe, expect, it } from "vitest";

import {
  buildExperimentBacklog,
  buildImplementationChecklist,
} from "./report-artifacts-builders";

describe("buildExperimentBacklog", () => {
  it("returns up to 5 items with required shape", () => {
    const qw = [
      { elementName: "Hero CTA", problem: "Low contrast", fix: "Increase contrast" },
      { title: "Form", problem: "", fix: "" },
    ];
    const rows = buildExperimentBacklog(qw);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      testName: expect.stringContaining("Hero CTA"),
      hypothesis: expect.any(String),
      primaryMetric: expect.any(String),
      variantDescription: expect.any(String),
    });
  });
});

describe("buildImplementationChecklist", () => {
  it("merges quick wins and weak radar axes", () => {
    const checklist = buildImplementationChecklist(
      [{ elementName: "Headline", problem: "Vague", fix: "Be specific" }],
      { Copy: 48, UX: 70 }
    );
    expect(checklist.length).toBeGreaterThanOrEqual(2);
    expect(checklist.some((c) => /Headline/.test(c.task))).toBe(true);
    expect(checklist.some((c) => /Copy pillar/.test(c.task))).toBe(true);
  });

  it("caps at 10 items (quick wins contribute up to 6, then radar fills)", () => {
    const qw = Array.from({ length: 12 }, (_, i) => ({
      elementName: `Item ${i}`,
      problem: `p${i}`,
      fix: `f${i}`,
    }));
    const weakRadar = Object.fromEntries(
      ["UX", "Trust", "Copy", "Conversion", "Visuals", "Speed"].map((k) => [k, 40])
    );
    expect(buildImplementationChecklist(qw, weakRadar).length).toBe(10);
  });
});
