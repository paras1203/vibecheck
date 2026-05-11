import { describe, expect, it } from "vitest";

import {
  canonicalItemsPreservingOrder,
  groupAuditItemsByTheme,
  mergeThemeGroupToCanonicalItem,
  pickCanonicalItemForTheme,
  themeKeyFromItem,
  type WorkerAuditItem,
} from "@/lib/audit-grouping";

describe("themeKeyFromItem", () => {
  it("normalizes empty element to unknown", () => {
    expect(
      themeKeyFromItem({
        elementName: "",
        radarCategory: "ux",
      })
    ).toBe("ux\0unknown");
  });

  it("lowercases category and element", () => {
    expect(
      themeKeyFromItem({
        elementName: "Trust Signals",
        radarCategory: "Trust",
      })
    ).toBe("trust\0trust signals");
  });
});

describe("groupAuditItemsByTheme", () => {
  it("groups duplicate theme keys", () => {
    const items: WorkerAuditItem[] = [
      {
        elementName: "Readability",
        radarCategory: "ux",
        status: "Needs Improvement",
        impact: "MI",
        notWorking: ["a"],
        fix: { quickFix: "fix1" },
      },
      {
        elementName: "Readability",
        radarCategory: "ux",
        status: "Failed",
        impact: "HI",
        notWorking: ["b"],
        fix: { quickFix: "longer substantive quick fix text" },
      },
    ];
    const m = groupAuditItemsByTheme(items);
    expect(m.size).toBe(1);
    expect([...m.values()][0]!.items.length).toBe(2);
  });
});

describe("mergeThemeGroupToCanonicalItem", () => {
  it("uses worst status and highest impact", () => {
    const items: WorkerAuditItem[] = [
      {
        elementName: "SEO Tags",
        radarCategory: "copy",
        status: "Good",
        impact: "LI",
        workingWell: ["ok"],
        notWorking: [],
        fix: { quickFix: "short", expectedImpact: "low" },
      },
      {
        elementName: "SEO Tags",
        radarCategory: "copy",
        status: "Failed",
        impact: "HI",
        workingWell: ["x"],
        notWorking: ["missing meta"],
        fix: {
          quickFix: "Add meta",
          expectedImpact: "Higher CTR from search snippets",
          example: "BEFORE: x AFTER: y",
        },
      },
    ];
    const g = [...groupAuditItemsByTheme(items).values()][0]!;
    const merged = mergeThemeGroupToCanonicalItem(g);
    expect(merged.status).toBe("Failed");
    expect(merged.impact).toBe("HI");
    expect(merged.fix).toMatchObject({
      quickFix: expect.stringContaining("Add meta"),
      example: expect.stringMatching(/BEFORE/i),
      expectedImpact: expect.stringContaining("Higher CTR"),
    });
    expect(Array.isArray(merged.workingWell)).toBe(true);
    expect(merged.workingWell).toEqual(expect.arrayContaining(["ok", "x"]));
    expect(Array.isArray(merged.notWorking)).toBe(true);
    expect(merged.notWorking).toContain("missing meta");
  });

  it("preserves deterministic order via canonicalItemsPreservingOrder", () => {
    const items: WorkerAuditItem[] = [
      {
        elementName: "A",
        radarCategory: "ux",
        status: "Failed",
        impact: "HI",
      },
      {
        elementName: "B",
        radarCategory: "ux",
        status: "Failed",
        impact: "HI",
      },
      {
        elementName: "A",
        radarCategory: "ux",
        status: "Good",
        impact: "LI",
      },
    ];
    const canon = canonicalItemsPreservingOrder(items);
    expect(canon.map((x) => x.elementName)).toEqual(["A", "B"]);
    expect(canon[0]!.status).toBe("Failed");
  });
});

describe("pickCanonicalItemForTheme", () => {
  it("prefers worst status then higher impact", () => {
    const items: WorkerAuditItem[] = [
      { elementName: "X", radarCategory: "ux", status: "Good", impact: "HI" },
      {
        elementName: "X",
        radarCategory: "ux",
        status: "Needs Improvement",
        impact: "MI",
      },
    ];
    const g = [...groupAuditItemsByTheme(items).values()][0]!;
    const p = pickCanonicalItemForTheme(g);
    expect(p.status).toBe("Needs Improvement");
  });
});
