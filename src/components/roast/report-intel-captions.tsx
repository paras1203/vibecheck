"use client";

import { cn } from "@/lib/utils";
import {
  formatConfidenceLine,
  INTEL_AUDIT_SCOPE,
  INTEL_BENCHMARK,
  INTEL_ESTIMATED_IMPROVEMENT,
} from "@/lib/report-intelligence";

export function ScoreIntelFootnote({
  overallScore,
  auditItemCount,
  className,
}: {
  overallScore: number;
  auditItemCount: number;
  className?: string;
}) {
  return (
    <div className={cn("mt-3 max-w-xs space-y-1 text-center md:max-w-none md:text-left", className)}>
      <p className="text-xs leading-snug text-muted-foreground/90">{INTEL_AUDIT_SCOPE}</p>
      <p className="text-xs leading-snug text-muted-foreground/75">
        {formatConfidenceLine(overallScore, auditItemCount)}
      </p>
    </div>
  );
}

export function MetricIntelFootnote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-1.5 text-xs leading-snug text-muted-foreground/75", className)}>{children}</p>
  );
}

export function BenchmarkHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-snug text-muted-foreground/70", className)}>{INTEL_BENCHMARK}</p>
  );
}

export { INTEL_ESTIMATED_IMPROVEMENT };
