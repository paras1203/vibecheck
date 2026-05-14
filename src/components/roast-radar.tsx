"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { ChartPanel } from "@/components/ui/chart-panel";
import { cn } from "@/lib/utils";

interface RoastRadarProps {
  radarMetrics: Record<string, number>;
  /** Skip ChartPanel chrome (no extra border/padding); parent should set height. */
  frameless?: boolean;
}

export function RoastRadar({ radarMetrics, frameless = false }: RoastRadarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const chartTheme = useChartTheme();
  const order = ["UX", "Trust", "Copy", "Conversion", "Visuals", "Speed"];

  const getOrderIndex = (key: string): number => {
    const lowerKey = key.toLowerCase();
    for (let i = 0; i < order.length; i++) {
      if (lowerKey.includes(order[i].toLowerCase())) {
        return i;
      }
    }
    return 999;
  };

  const entries = Object.entries(radarMetrics);
  entries.sort(([keyA], [keyB]) => {
    return getOrderIndex(keyA) - getOrderIndex(keyB);
  });

  const data = entries.map(([key, value]) => ({
    category: key,
    score: value,
    fullMark: 100,
  }));

  const gridStroke = chartTheme.chartGrid;
  const tickFill = chartTheme.mutedForeground;
  const radarStroke = chartTheme.chart1;
  const radarFill = chartTheme.chart1;

  const chartInner = (
    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={120}>
      <RadarChart
        responsive
        data={data}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        outerRadius="78%"
      >
        <PolarGrid stroke={gridStroke} strokeOpacity={1} />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: tickFill, fontSize: 11, fontWeight: 500 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tickCount={4}
          tick={{ fill: tickFill, fontSize: 9 }}
          stroke={gridStroke}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke={radarStroke}
          fill={radarFill}
          fillOpacity={0.22}
          strokeWidth={1.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );

  if (data.length === 0) {
    if (frameless) {
      return (
        <div className="flex h-full min-h-[140px] w-full items-center justify-center text-sm text-muted-foreground">
          No radar data available
        </div>
      );
    }
    return (
      <ChartPanel variant="embedded" className="min-h-[246px]">
        <div className="flex h-[246px] items-center justify-center text-sm text-muted-foreground">
          No radar data available
        </div>
      </ChartPanel>
    );
  }

  if (!mounted) {
    if (frameless) {
      return (
        <div
          className="h-full min-h-[140px] w-full min-w-[200px] rounded-md bg-muted/25"
          aria-hidden
        />
      );
    }
    return (
      <ChartPanel variant="embedded" className="min-h-[264px]">
        <div
          className="h-[264px] w-full min-w-[200px] rounded-md bg-muted/25"
          aria-hidden
        />
      </ChartPanel>
    );
  }

  if (frameless) {
    return (
      <div className={cn("h-full w-full min-h-0 min-w-0 max-w-full")}>{chartInner}</div>
    );
  }

  return (
    <ChartPanel variant="embedded" className="min-h-[264px]">
      <div className="h-[264px] w-full min-w-0 max-w-full">{chartInner}</div>
    </ChartPanel>
  );
}
