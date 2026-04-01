import * as React from "react";

import { cn } from "@/lib/utils";

export function PageSection({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("space-y-6", className)}
      {...props}
    >
      {children}
    </section>
  );
}

interface SectionHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  size?: "default" | "compact";
}

export function SectionHeader({
  className,
  title,
  description,
  actions,
  size = "default",
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border-muted sm:flex-row sm:items-end sm:justify-between sm:gap-4",
        size === "compact" ? "pb-3" : "pb-4",
        className
      )}
      {...props}
    >
      <div className={cn("min-w-0", size === "compact" ? "space-y-1" : "space-y-1.5")}>
        <h2
          className={cn(
            "font-sans font-semibold tracking-tight text-foreground",
            size === "compact" ? "text-lg" : "text-xl"
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "text-muted-foreground max-w-2xl",
              size === "compact" ? "text-xs" : "text-sm"
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
