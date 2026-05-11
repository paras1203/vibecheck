"use client";

import type { ScoreTriple } from "@/types/insight-layers";
import { cn } from "@/lib/utils";
import { radarScoreValueClass } from "@/lib/radar-axis-scores";

function formatSubLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

type Props = { subscores: Record<string, ScoreTriple>; title?: string };

export function RoastReportV2SignalsTable({ subscores, title }: Props) {
  const rows = Object.entries(subscores);
  if (!rows.length) return null;
  return (
    <div className="rounded-lg border border-border-muted bg-surface-2/20 overflow-x-auto">
      {title ? (
        <p className="border-b border-border-muted px-3 py-2 text-caption font-medium text-muted-foreground">
          {title}
        </p>
      ) : null}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-muted text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Signal</th>
            <th className="px-3 py-2 font-medium">Now</th>
            <th className="px-3 py-2 font-medium">Target</th>
            <th className="px-3 py-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, t]) => (
            <tr key={key} className="border-b border-border-muted/80 last:border-0">
              <td className="px-3 py-2 font-medium text-foreground">{formatSubLabel(key)}</td>
              <td className={cn("px-3 py-2 font-mono tabular-nums", radarScoreValueClass(t.current))}>
                {t.current}
              </td>
              <td className="px-3 py-2 font-mono tabular-nums text-primary">{t.proposed}</td>
              <td className="px-3 py-2 text-muted-foreground">{t.impact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
