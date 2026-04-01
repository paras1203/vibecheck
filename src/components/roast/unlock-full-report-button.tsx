"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CTA_UNLOCK_FULL_REPORT,
  PRO_REPORT_PRICE_DISPLAY,
} from "@/lib/report-copy";
import { skipPaymentUnlockEnabled } from "@/lib/billing-flags";
import { cn } from "@/lib/utils";

type Props = {
  onUnlock: () => void;
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
  /** When false, billing link omits the price suffix (compact CTAs). */
  showPriceAnchor?: boolean;
};

export function UnlockFullReportButton({
  onUnlock,
  className,
  size = "default",
  variant = "default",
  showPriceAnchor = false,
}: Props) {
  const bypass = skipPaymentUnlockEnabled();
  if (bypass) {
    return (
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn("font-semibold", className)}
        onClick={onUnlock}
      >
        {CTA_UNLOCK_FULL_REPORT}
      </Button>
    );
  }
  return (
    <Button size={size} variant={variant} className={cn("font-semibold", className)} asChild>
      <Link href="/billing">
        {CTA_UNLOCK_FULL_REPORT}
        {showPriceAnchor ? (
          <span className="ml-1.5 text-primary-foreground/90">· {PRO_REPORT_PRICE_DISPLAY}</span>
        ) : null}
      </Link>
    </Button>
  );
}
