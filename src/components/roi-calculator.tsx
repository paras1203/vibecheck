"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reportHex } from "@/lib/report-theme";
import { getIndustryInsiderPoints } from "@/lib/industry-insider-copy";

/**
 * ROI Calculator Component
 * Exact 1:1 migration from main.py render_roi_dashboard function (lines 2151-2336)
 * Replicates the exact math: lost_revenue = traffic * lift * price * 12
 * Where lift = 0.02 (2% conversion lift)
 */
interface ROICalculatorProps {
  pageHeight?: number;
  defaultPrice?: number;
  defaultIndustry?: string;
  defaultTraffic?: number;
}

export function ROICalculator({
  pageHeight = 3000,
  defaultPrice = 50.0,
  defaultIndustry = "SaaS",
  defaultTraffic = 1000,
}: ROICalculatorProps) {
  const [price, setPrice] = useState(defaultPrice);
  const [traffic, setTraffic] = useState(defaultTraffic);
  const [industry, setIndustry] = useState<"SaaS" | "Agency" | "E-commerce">(
    defaultIndustry as "SaaS" | "Agency" | "E-commerce"
  );

  // Exact math from Python: lift = 0.02, lost_revenue = (traffic * lift * price * 12)
  const lift = 0.02;
  const lostRevenue = traffic * lift * price * 12;
  const cost = 19;
  const roiPercent = cost > 0 ? (lostRevenue / cost) * 100 : 0;

  // Industry multipliers (exact from Python lines 2236-2241)
  const industryMultipliers: Record<string, number> = {
    SaaS: 2.5,
    Agency: 3.0,
    "E-commerce": 2.0,
  };
  const multiplier = industryMultipliers[industry] || 2.5;
  const competitorTraffic = Math.max(1000, Math.floor(traffic * multiplier));

  // Scroll of Death calculations (exact from Python lines 2211-2213)
  const foldHeight = 800;
  const belowFold = Math.max(0, pageHeight - foldHeight);
  const belowFoldPercent =
    pageHeight > 0 ? (belowFold / pageHeight) * 100 : 0;

  const insiderPoints = getIndustryInsiderPoints(industry);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Cost of Inaction */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💸 The Cost of Inaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 font-mono text-4xl font-semibold tabular-nums text-primary">
            $
            {lostRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <p className="text-sm text-muted-foreground">
            Revenue you leave on the table annually
          </p>
        </CardContent>
      </Card>

      {/* Scroll of Death */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📉 The Scroll of Death</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            <span className="font-mono text-4xl font-bold tabular-nums text-primary">
              {belowFoldPercent.toFixed(0)}%
            </span>{" "}
            of users never see your bottom CTA. Your page is{" "}
            <span className="font-semibold text-foreground">{pageHeight.toLocaleString()}px</span> deep.
          </p>
          <div className="relative h-48 w-full overflow-hidden rounded-lg border border-border">
            <div
              className="absolute left-0 top-0 flex w-full items-center justify-center bg-success/90 text-sm font-bold text-success-foreground"
              style={{
                height: `${Math.min(100, (foldHeight / pageHeight) * 100)}%`,
              }}
            >
              Above Fold ({foldHeight}px)
            </div>
            <div
              className="absolute bottom-0 left-0 flex w-full items-center justify-center text-sm font-bold text-foreground"
              style={{
                height: `${Math.max(0, (belowFold / pageHeight) * 100)}%`,
                background: `linear-gradient(to top, ${reportHex.destructive} 0%, ${reportHex.warning} 50%, ${reportHex.success} 100%)`,
              }}
            >
              Below Fold ({belowFoldPercent.toFixed(0)}%)
            </div>
            <div
              className="absolute left-0 z-10 h-0.5 w-full bg-warning"
              style={{
                top: `${Math.min(100, (foldHeight / pageHeight) * 100)}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Competitor Gap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🥊 The Competitor Gap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">You</span>
              <span className="font-mono font-semibold tabular-nums text-muted-foreground">
                {traffic.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Top Competitor</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-primary">
                {competitorTraffic.toLocaleString()}
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Competitors get{" "}
            <span className="font-mono font-bold tabular-nums text-primary">
              {multiplier.toFixed(1)}x
            </span>{" "}
            your traffic.
          </p>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧠 AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insiderPoints.map((line, i) => (
              <li
                key={`roi-insider-${i}`}
                className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground leading-snug"
              >
                💡 {line}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ROI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🚀 ROI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-center font-mono text-4xl font-semibold tabular-nums text-primary">
            {roiPercent.toLocaleString(undefined, { maximumFractionDigits: 0 })}%
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Spend{" "}
            <span className="font-mono font-semibold tabular-nums text-primary">${cost}</span> to recover{" "}
            <span className="font-mono font-semibold tabular-nums text-primary">
              ${lostRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Price Detector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⚙️ Price Detector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="price">Detected Price ($)</Label>
            <Input
              id="price"
              type="number"
              min={1}
              max={10000}
              step={1}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="traffic">Monthly Traffic</Label>
            <Input
              id="traffic"
              type="number"
              min={100}
              max={1000000}
              step={100}
              value={traffic}
              onChange={(e) => setTraffic(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <select
              id="industry"
              value={industry}
              onChange={(e) =>
                setIndustry(e.target.value as "SaaS" | "Agency" | "E-commerce")
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="SaaS">SaaS</option>
              <option value="Agency">Agency</option>
              <option value="E-commerce">E-commerce</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

