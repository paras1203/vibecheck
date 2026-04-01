import * as React from "react";

import { cn } from "@/lib/utils";

/** Icon glyph sizes: 16px / 18px / 20px only (per design system). */
const sizeClasses = {
  sm: "h-8 w-8 rounded-md [&_svg]:size-4",
  md: "h-9 w-9 rounded-lg [&_svg]:size-[18px]",
  lg: "h-10 w-10 rounded-lg [&_svg]:size-5",
};

export interface IconFrameProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  size?: keyof typeof sizeClasses;
}

export function IconFrame({
  children,
  className,
  size = "md",
  ...props
}: IconFrameProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-border bg-surface-2/60 text-foreground [&_svg]:stroke-[1.5]",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
