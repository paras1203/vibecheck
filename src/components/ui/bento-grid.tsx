"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

import { IconFrame } from "@/components/ui/icon-frame";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-4 md:grid-cols-4",
        className
      )}
      style={{
        gridAutoRows: 'minmax(300px, 1fr)',
      }}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  className,
  name,
  description,
  header,
  icon,
}: {
  className?: string;
  name?: string;
  description?: string;
  header?: ReactNode;
  icon?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group relative col-span-1 flex aspect-square flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-surface-xs transition-colors duration-200 hover:border-primary/20 hover:bg-surface-2",
        className
      )}
    >
      {header}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        {icon && (
          <IconFrame
            size="lg"
            className="mb-1 border-primary/25 bg-primary/8 text-primary"
          >
            {icon}
          </IconFrame>
        )}
        {name && (
          <div className="text-lg font-semibold tracking-tight text-card-foreground md:text-xl">
            {name}
          </div>
        )}
        {description && (
          <div className="text-sm text-muted-foreground leading-relaxed">{description}</div>
        )}
      </div>
    </div>
  );
};
