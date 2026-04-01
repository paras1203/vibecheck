import * as React from "react";

import { cn } from "@/lib/utils";

interface LockedSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function LockedSection({
  className,
  children,
  ...props
}: LockedSectionProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border-muted bg-surface-2/50 px-6 py-10 text-center text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
