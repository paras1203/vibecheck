import * as React from "react";

import { cn } from "@/lib/utils";

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

export function MetricCard({
  className,
  label,
  value,
  hint,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface-1 px-5 py-4 space-y-1.5",
        className
      )}
      {...props}
    >
      <p className="text-caption font-medium uppercase tracking-wide">
        {label}
      </p>
      <div className="text-metric-lg text-foreground">{value}</div>
      {hint ? <p className="text-caption">{hint}</p> : null}
    </div>
  );
}

interface MetricStatProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/** Inline numeric emphasis (JetBrains Mono + tabular nums). */
export function MetricStat({ className, children, ...props }: MetricStatProps) {
  return (
    <span
      className={cn(
        "font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
