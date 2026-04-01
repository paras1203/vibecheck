"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import type { RevenueLeakEstimate } from "@/types/insight-layers";
import { annualLeakUsd } from "@/lib/insight-layers";
import { DollarSign } from "lucide-react";

type Props = {
  estimate: RevenueLeakEstimate;
  traffic: number;
  price: number;
};

export function RevenueLeakEstimateCard({ estimate, traffic, price }: Props) {
  const { scenarios, methodology, assumptions, disclaimer } = estimate;
  const cols = [
    { key: "low" as const, scenario: scenarios.low },
    { key: "base" as const, scenario: scenarios.base },
    { key: "high" as const, scenario: scenarios.high },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <DollarSign className="size-4 stroke-[1.5]" />
          </IconFrame>
          Revenue leak estimate
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Scenario model (not a forecast). Base uses the standard 2% incremental conversion benchmark.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cols.map(({ key, scenario }) => {
            const annual = annualLeakUsd(traffic, price, scenario.conversionUpliftRate);
            const pct = (scenario.conversionUpliftRate * 100).toFixed(1).replace(/\.0$/, "");
            return (
              <div
                key={key}
                className="rounded-lg border border-border-muted bg-surface-2/30 p-3"
              >
                <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
                  {key === "base" ? "Base" : key === "low" ? "Low" : "High"}
                </p>
                <p className="mt-1 text-sm text-foreground/90">{scenario.label}</p>
                <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-primary">
                  ${annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground">Assumed uplift: {pct}% conv.</p>
              </div>
            );
          })}
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Methodology: </span>
            {methodology}
          </p>
          <ul className="list-inside list-disc space-y-0.5">
            {assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <p className="border-t border-border-muted pt-2 text-[11px] italic">{disclaimer}</p>
        </div>
      </CardContent>
    </Card>
  );
}
