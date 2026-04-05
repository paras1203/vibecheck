"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RevenueLeakEstimate } from "@/types/insight-layers";
import { annualLeakUsd } from "@/lib/insight-layers";
import { DollarSign } from "lucide-react";

type Props = {
  estimate: RevenueLeakEstimate;
  traffic: number;
  price: number;
  onTrafficChange: (value: number) => void;
  onPriceChange: (value: number) => void;
};

function parsePositiveInt(raw: string, fallback: number): number {
  const n = Math.round(Number.parseFloat(raw.replace(/,/g, "")));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function parsePrice(raw: string, fallback: number): number {
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n * 100) / 100;
}

export function RevenueLeakEstimateCard({
  estimate,
  traffic,
  price,
  onTrafficChange,
  onPriceChange,
}: Props) {
  const { scenarios, methodology, assumptions, disclaimer } = estimate;
  const cols = [
    { key: "low" as const, scenario: scenarios.low },
    { key: "base" as const, scenario: scenarios.base },
    { key: "high" as const, scenario: scenarios.high },
  ];

  const inputsBlock = (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">
        Plug in your real traffic and deal size—the defaults are placeholders only.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="revenue-leak-traffic" className="text-xs text-muted-foreground">
            Monthly sessions
          </Label>
          <Input
            id="revenue-leak-traffic"
            type="text"
            inputMode="numeric"
            className="h-9 font-mono text-sm tabular-nums"
            placeholder="e.g. 5,000"
            value={traffic === 0 ? "" : traffic.toLocaleString()}
            onChange={(e) => onTrafficChange(parsePositiveInt(e.target.value, traffic))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="revenue-leak-price" className="text-xs text-muted-foreground">
            Avg. deal value (USD)
          </Label>
          <Input
            id="revenue-leak-price"
            type="text"
            inputMode="decimal"
            className="h-9 font-mono text-sm tabular-nums"
            placeholder="e.g. 29"
            value={price === 0 ? "" : String(price)}
            onChange={(e) => onPriceChange(parsePrice(e.target.value, price))}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <DollarSign className="size-4 stroke-[1.5]" />
          </IconFrame>
          Revenue leak estimate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {cols.map(({ key, scenario }) => {
            const annual = annualLeakUsd(traffic, price, scenario.conversionUpliftRate);
            const pct = (scenario.conversionUpliftRate * 100).toFixed(1).replace(/\.0$/, "");
            return (
              <div
                key={key}
                className="rounded-lg border border-border-muted bg-surface-2/30 px-3 py-2.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
                    {key === "base" ? "Base" : key === "low" ? "Low" : "High"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">+{pct}%</span>
                </div>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-primary">
                  ${annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            );
          })}
        </div>

        <details className="group rounded-lg border border-border-muted bg-muted/15 text-xs text-muted-foreground">
          <summary className="cursor-pointer list-none px-3 py-2 font-medium text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1">
              How this is calculated
              <span className="text-muted-foreground transition-transform group-open:rotate-90">›</span>
            </span>
          </summary>
          <div className="space-y-3 border-t border-border-muted px-3 py-2.5">
            <p className="text-[10px] leading-relaxed">{methodology}</p>
            <div className="text-[11px] leading-relaxed">{inputsBlock}</div>
            <ul className="list-inside list-disc space-y-1 text-[11px] leading-relaxed">
              {assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <p className="text-[10px] italic leading-relaxed text-muted-foreground/90">{disclaimer}</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
