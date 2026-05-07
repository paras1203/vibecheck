"use client";

import { cn } from "@/lib/utils";

export const LANDING_TESTIMONIALS = [
  {
    quote:
      "Cut our bounce rate by 34% in one sprint.",
    role: "Growth Lead",
    company: "TechStartup",
  },
  {
    quote: "The ROI calculation alone paid for itself 10x.",
    role: "CMO",
    company: "E-commerce Brand",
  },
  {
    quote: "Finally, an audit tool that doesn't waste my time.",
    role: "Founder",
    company: "SaaS Company",
  },
] as const;

type TestimonialsRowProps = {
  className?: string;
  cardClassName?: string;
  palette?: "minimal" | "c2";
};

export function TestimonialsRow({ className, cardClassName, palette = "minimal" }: TestimonialsRowProps) {
  const isC2 = palette === "c2";
  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-3 md:gap-6",
        isC2 && "md:gap-8",
        className,
      )}
    >
      {LANDING_TESTIMONIALS.map((t) => (
        <figure
          key={`${t.company}-${t.role}`}
          className={cn(
            isC2
              ? "rounded-3xl border border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)] p-7 shadow-[0_1px_0_rgba(28,25,23,0.04),0_12px_32px_rgba(28,25,23,0.08)] transition-shadow hover:shadow-[0_16px_40px_rgba(28,25,23,0.1)]"
              : "rounded-2xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] p-6 shadow-surface-xs transition-shadow hover:shadow-surface-sm",
            cardClassName,
          )}
        >
          <div
            className={cn(
              "mb-4 flex size-10 items-center justify-center rounded-full font-mono text-sm font-semibold",
              isC2
                ? "bg-[var(--lv-c2-bg)] ring-2 ring-[var(--lv-c2-accent)]/25 ring-offset-2 ring-offset-[var(--lv-c2-surface-1)] text-[var(--lv-c2-accent)]"
                : "bg-[var(--lv-minimal-surface-2)] text-[var(--lv-minimal-accent)]",
            )}
            aria-hidden
          >
            {t.company.slice(0, 1)}
          </div>
          <blockquote
            className={cn(
              "text-sm font-medium leading-relaxed",
              isC2 ? "text-[var(--lv-c2-text)]" : "text-[var(--lv-minimal-text)]",
            )}
          >
            “{t.quote}”
          </blockquote>
          <figcaption className="mt-4 text-xs text-muted-foreground">
            <span
              className={cn(
                "font-semibold",
                isC2 ? "text-[var(--lv-c2-text)]" : "text-[var(--lv-minimal-text)]",
              )}
            >
              {t.role}
            </span>
            {" · "}
            {t.company}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
