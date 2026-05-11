import { describe, expect, it } from "vitest";
import { detailedAuditToDisplayRows } from "./report-v2-pillar-audit";
import type { DetailedAuditRow } from "@/lib/report-category-score";

describe("detailedAuditToDisplayRows", () => {
  it("maps worker-shaped rows", () => {
    const rows = detailedAuditToDisplayRows([
      {
        elementName: "Hero",
        status: "Failed",
        workingWell: ["Clear logo"],
        notWorking: ["Weak headline"],
        fix: { quickFix: "Tighten headline" },
      } as DetailedAuditRow & { impact?: string; workingWell?: string[]; notWorking?: string[] },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      element: "Hero",
      status: "Failed",
      impact: "HI",
      working: "Clear logo",
      notWorking: "Weak headline",
      fix: "Tighten headline",
    });
  });

  it("returns empty for missing items", () => {
    expect(detailedAuditToDisplayRows(null)).toEqual([]);
  });
});
