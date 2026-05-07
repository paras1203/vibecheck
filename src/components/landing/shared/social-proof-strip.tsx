"use client";

import { cn } from "@/lib/utils";

const PLACEHOLDER_LOGOS = ["Δ", "◆", "◈", "◇", "▣", "◎"];

type SocialProofStripProps = {
  variant: "marquee" | "stats-only";
  className?: string;
  labelClassName?: string;
  /** C1 uses amber/signal accent instead of default violet mesh palette */
  marqueePalette?: "default" | "c1";
};

export function SocialProofStrip({
  variant,
  className,
  labelClassName,
  marqueePalette = "default",
}: SocialProofStripProps) {
  if (variant === "stats-only") {
    return (
      <div
        className={cn(
          "border-y border-[var(--lv-bold-border)] bg-black px-4 py-6 text-center",
          className,
        )}
      >
        <p
          className={cn(
            "font-mono text-sm font-semibold tabular-nums tracking-tight text-white md:text-base",
            labelClassName,
          )}
        >
          10,000+ sites audited · $2.1B revenue influenced · 60-second delivery
        </p>
      </div>
    );
  }

  const isC1 = marqueePalette === "c1";

  const row = (
    <>
      {PLACEHOLDER_LOGOS.map((ch, i) => (
        <div
          key={i}
          className={cn(
            "flex size-12 shrink-0 items-center justify-center border font-mono text-sm font-semibold transition-colors md:size-14 md:text-base",
            isC1
              ? "rounded-lg border-[var(--lv-c1-border-muted)] bg-[#0c0c0e] text-white/50 hover:border-[var(--lv-c1-accent)] hover:text-[var(--lv-c1-accent)]"
              : "rounded-lg border-[var(--lv-bold-border)] bg-[var(--lv-bold-surface-1)] text-[var(--lv-bold-muted)] hover:border-[var(--lv-bold-primary)] hover:text-[var(--lv-bold-primary)]",
          )}
          aria-hidden
        >
          {ch}
        </div>
      ))}
    </>
  );

  return (
    <div className={cn("overflow-hidden py-10", className)}>
      <p
        className={cn(
          "mb-6 text-center text-sm font-medium",
          isC1 ? "text-white/55" : "text-[var(--lv-bold-muted)]",
          labelClassName,
        )}
      >
        Trusted by growth teams everywhere
      </p>
      <div className="flex w-max gap-4 pl-4 animate-marquee">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 gap-4">
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}
