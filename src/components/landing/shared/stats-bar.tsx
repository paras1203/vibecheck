"use client";

import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Elements analyzed", value: "20M+" },
  { label: "Audits generated", value: "10k+" },
  { label: "Avg. conversion lift", value: "22%" },
  { label: "Delivery", value: "<60s" },
] as const;

type StatsBarProps = {
  className?: string;
  divider?: boolean;
  palette?: "minimal" | "c3";
};

export function StatsBar({ className, divider = true, palette = "minimal" }: StatsBarProps) {
  const border = palette === "c3" ? "var(--lv-c3-border)" : "var(--lv-minimal-border)";
  const bg = palette === "c3" ? "var(--lv-c3-bg)" : "var(--lv-minimal-bg)";
  const valueColor = palette === "c3" ? "var(--lv-c3-text)" : "var(--lv-minimal-text)";
  const labelColor = palette === "c3" ? "var(--lv-c3-muted)" : undefined;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-6 border-y px-4 py-8 md:gap-10",
        className,
      )}
      style={{ borderColor: border, backgroundColor: bg }}
    >
      {ITEMS.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "flex min-w-[7rem] flex-col items-center gap-1 text-center",
            divider && i > 0 && "md:border-l md:pl-10",
          )}
          style={
            divider && i > 0 ? { borderLeftColor: border } : undefined
          }
        >
          <span
            className="font-mono text-xl font-semibold tabular-nums tracking-tight md:text-2xl"
            style={{ color: valueColor }}
          >
            {item.value}
          </span>
          <span
            className={cn(
              "text-xs font-medium",
              palette === "minimal" && "text-muted-foreground",
            )}
            style={labelColor ? { color: labelColor } : undefined}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
