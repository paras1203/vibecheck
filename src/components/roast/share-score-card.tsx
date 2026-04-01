"use client";

import { cn } from "@/lib/utils";

type ShareScoreCardProps = {
  score: number;
  domainLabel: string;
  issues: string[];
  improvement: string;
  className?: string;
};

export function ShareScoreCard({
  score,
  domainLabel,
  issues,
  improvement,
  className,
}: ShareScoreCardProps) {
  const n = Math.round(score);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-gradient-to-b from-surface-2/80 to-surface-1 p-6 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-1 border-b border-border-muted pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          SiteRoast
        </p>
        <p className="text-sm text-muted-foreground">Landing page analysis</p>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-2">
        <span className="font-mono text-4xl font-semibold tabular-nums text-primary md:text-5xl">
          {n}
        </span>
        <span className="pb-1 font-mono text-lg text-muted-foreground">/100</span>
        <span className="pb-1 text-sm text-muted-foreground">Site score</span>
      </div>
      <p className="mt-3 text-sm text-foreground/90">
        <span className="text-muted-foreground">Analyzed: </span>
        {domainLabel}
      </p>
      {issues.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-foreground/85">
          {issues.map((issue, i) => (
            <li key={i} className="flex gap-2 leading-snug">
              <span className="mt-0.5 shrink-0 text-muted-foreground">—</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 border-t border-border-muted pt-4 text-sm font-medium leading-snug text-foreground">
        Next step: {improvement}
      </p>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Conversion audit snapshot · Not financial or performance advice
      </p>
    </div>
  );
}
