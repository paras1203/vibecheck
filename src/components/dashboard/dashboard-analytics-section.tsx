"use client";

import React, { useMemo } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { ChartPanel } from "@/components/ui/chart-panel";
import type { RoastHistoryEntry } from "@/lib/roast-history";

type Props = {
  history: RoastHistoryEntry[];
  avgScore: number | null;
};

export function DashboardAnalyticsSection({ history, avgScore }: Props) {
  const scoreDistribution = useMemo(() => {
    const buckets = [0, 0, 0, 0];
    for (const h of history) {
      if (typeof h.overallScore !== "number") continue;
      const s = h.overallScore;
      if (s < 25) buckets[0]++;
      else if (s < 50) buckets[1]++;
      else if (s < 75) buckets[2]++;
      else buckets[3]++;
    }
    const max = Math.max(1, ...buckets);
    const labels = ["0–24", "25–49", "50–74", "75–100"];
    return labels.map((label, i) => ({ label, count: buckets[i], pct: (buckets[i] / max) * 100 }));
  }, [history]);

  const hostBreakdown = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of history) {
      if (!h.auditedUrl) continue;
      try {
        const raw = h.auditedUrl.trim();
        const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
        m.set(u.hostname, (m.get(u.hostname) || 0) + 1);
      } catch {
        /* skip */
      }
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [history]);

  const scoredCount = history.filter((h) => typeof h.overallScore === "number").length;
  const latest = history[0];
  const latestLabel = latest
    ? typeof latest.overallScore === "number"
      ? `${latest.overallScore}`
      : "—"
    : "—";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Analytics</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Reports (this device)"
          value={<span className="font-mono tabular-nums">{history.length}</span>}
        />
        <MetricCard
          label="Latest score"
          value={
            <span className="font-mono tabular-nums">
              {latestLabel}
              {latestLabel !== "—" ? <span className="text-muted-foreground">/100</span> : null}
            </span>
          }
        />
        <MetricCard
          label="Unique domains"
          value={<span className="font-mono tabular-nums">{hostBreakdown.length}</span>}
        />
        <MetricCard
          label="Average score"
          value={
            <span className="font-mono tabular-nums">
              {avgScore ?? "—"}
              {avgScore != null ? <span className="text-muted-foreground">/100</span> : null}
            </span>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ChartPanel title="Score distribution" variant="embedded">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports to chart yet.</p>
          ) : scoredCount === 0 ? (
            <p className="text-sm text-muted-foreground">No scored reports in this history.</p>
          ) : (
            <ul className="space-y-3">
              {scoreDistribution.map((row) => (
                <li key={row.label} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{row.label}</span>
                    <span className="font-mono tabular-nums text-foreground">{row.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartPanel>

        <ChartPanel title="Top domains" variant="embedded">
          {hostBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No URLs with recognisable hostnames yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface-1/30">
              {hostBreakdown.map(([host, count]) => (
                <li
                  key={host}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 font-mono text-sm tabular-nums"
                >
                  <span className="min-w-0 truncate text-foreground">{host}</span>
                  <span className="shrink-0 text-muted-foreground">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </ChartPanel>
      </div>
    </div>
  );
}
