"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InsightLayerBlock, InsightPriority, ScoreTriple } from "@/types/insight-layers";

function priorityBadgeVariant(
  p: InsightPriority
): "destructive" | "secondary" | "outline" {
  switch (p) {
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    default:
      return "outline";
  }
}

function formatSubLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function TripleRow({ label, t }: { label: string; t: ScoreTriple }) {
  return (
    <div className="grid grid-cols-[minmax(0,1.2fr)_auto_auto] gap-x-2 gap-y-1 border-b border-border-muted py-2 text-xs last:border-0 sm:grid-cols-[minmax(0,1.4fr)_auto_auto_minmax(0,1fr)]">
      <span className="font-medium text-foreground">{label}</span>
      <span className="font-mono tabular-nums text-muted-foreground">
        {t.current}
      </span>
      <span className="font-mono tabular-nums text-primary">→ {t.proposed}</span>
      <span className="col-span-full text-muted-foreground sm:col-span-1 sm:col-start-4 sm:row-start-1">
        {t.impact}
      </span>
    </div>
  );
}

type Props = {
  title: string;
  layer: InsightLayerBlock;
  /** Full sub-score table for Pro; free tier shows composite + signals only */
  showSubscores: boolean;
};

export function InsightLayerCard({ title, layer, showSubscores }: Props) {
  const { composite, subscores, layerSummary, highPrioritySignals, priority } =
    layer;
  const subEntries = Object.entries(subscores);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-caption text-muted-foreground">Priority</span>
            <Badge variant={priorityBadgeVariant(priority)} className="text-xs uppercase">
              {priority}
            </Badge>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{layerSummary}</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="rounded-lg border border-border-muted bg-surface-2/20 p-3">
          <p className="text-caption mb-2 text-muted-foreground">Layer summary score</p>
          <div className="flex flex-wrap items-baseline gap-3 text-sm">
            <span>
              <span className="text-muted-foreground">Current </span>
              <span className="font-mono font-semibold tabular-nums">{composite.current}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Proposed </span>
              <span className="font-mono font-semibold tabular-nums text-primary">
                {composite.proposed}
              </span>
            </span>
          </div>
          <p className="mt-2 text-xs text-foreground/90">{composite.impact}</p>
        </div>

        {highPrioritySignals.length > 0 ? (
          <div>
            <p className="text-caption mb-1.5 text-muted-foreground">High-priority signals</p>
            <ul className="space-y-1 text-xs text-foreground">
              {highPrioritySignals.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="text-primary" aria-hidden>
                    ·
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showSubscores && subEntries.length > 0 ? (
          <div>
            <p className="text-caption mb-1 text-muted-foreground">
              Sub-scores (current → proposed)
            </p>
            <div className="rounded-lg border border-border-muted">
              {subEntries.map(([key, triple]) => (
                <TripleRow key={key} label={formatSubLabel(key)} t={triple} />
              ))}
            </div>
          </div>
        ) : !showSubscores ? (
          <p className="text-xs text-muted-foreground">
            Upgrade for the full sub-score breakdown and evidence mapping.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
