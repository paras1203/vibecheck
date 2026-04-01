import * as React from "react";

import { cn } from "@/lib/utils";

interface ChartPanelProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Nested in Card: subtle frame, no heavy chrome */
  variant?: "default" | "embedded";
}

export function ChartPanel({
  className,
  title,
  description,
  children,
  variant = "default",
  ...props
}: ChartPanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg",
        variant === "embedded"
          ? "border border-border-muted bg-surface-2/50"
          : "border border-border bg-surface-1",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="space-y-0.5 border-b border-border-muted px-4 py-3">
          {title ? (
            <h3 className="text-label">{title}</h3>
          ) : null}
          {description ? <p className="text-caption">{description}</p> : null}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
