"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

function readCssColorVar(name: string): string {
  if (typeof document === "undefined") return "";
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!raw) return "";
  if (
    raw.startsWith("#") ||
    raw.startsWith("rgb") ||
    raw.startsWith("hsl")
  ) {
    return raw;
  }
  return `hsl(${raw})`;
}

export interface ChartThemeColors {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  foreground: string;
  mutedForeground: string;
  border: string;
  chartGrid: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipForeground: string;
}

const FALLBACK_DARK: ChartThemeColors = {
  chart1: "#6366F1",
  chart2: "#22D3EE",
  chart3: "#22C55E",
  chart4: "#F59E0B",
  chart5: "#EF4444",
  foreground: "#E6EAF2",
  mutedForeground: "#64748B",
  border: "rgba(255, 255, 255, 0.08)",
  chartGrid: "rgba(255, 255, 255, 0.12)",
  tooltipBg: "#151d2b",
  tooltipBorder: "rgba(255, 255, 255, 0.08)",
  tooltipForeground: "#E6EAF2",
};

const FALLBACK_LIGHT: ChartThemeColors = {
  chart1: "#4F46E5",
  chart2: "#06B6D4",
  chart3: "#16A34A",
  chart4: "#D97706",
  chart5: "#DC2626",
  foreground: "#0F172A",
  mutedForeground: "#94A3B8",
  border: "rgba(15, 23, 42, 0.08)",
  chartGrid: "rgba(15, 23, 42, 0.12)",
  tooltipBg: "#f1f5f9",
  tooltipBorder: "rgba(15, 23, 42, 0.08)",
  tooltipForeground: "#0F172A",
};

export function useChartTheme(): ChartThemeColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ChartThemeColors>(FALLBACK_DARK);

  useEffect(() => {
    const fb = resolvedTheme === "light" ? FALLBACK_LIGHT : FALLBACK_DARK;
    const read = () => {
      setColors({
        chart1: readCssColorVar("--chart-1") || fb.chart1,
        chart2: readCssColorVar("--chart-2") || fb.chart2,
        chart3: readCssColorVar("--chart-3") || fb.chart3,
        chart4: readCssColorVar("--chart-4") || fb.chart4,
        chart5: readCssColorVar("--chart-5") || fb.chart5,
        foreground: readCssColorVar("--foreground") || fb.foreground,
        mutedForeground:
          readCssColorVar("--muted-foreground") || fb.mutedForeground,
        border: readCssColorVar("--border") || fb.border,
        chartGrid: readCssColorVar("--chart-grid") || fb.chartGrid,
        tooltipBg: readCssColorVar("--chart-tooltip-bg") || fb.tooltipBg,
        tooltipBorder:
          readCssColorVar("--chart-tooltip-border") || fb.tooltipBorder,
        tooltipForeground:
          readCssColorVar("--chart-tooltip-foreground") || fb.tooltipForeground,
      });
    };

    read();
    const id = requestAnimationFrame(read);
    return () => cancelAnimationFrame(id);
  }, [resolvedTheme]);

  return colors;
}
