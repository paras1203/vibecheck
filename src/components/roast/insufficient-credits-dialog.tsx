"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type InsufficientCreditsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCredits?: number;
  balance?: number;
};

export function InsufficientCreditsDialog({
  open,
  onOpenChange,
  requiredCredits = 1,
  balance,
}: InsufficientCreditsDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insufficient-credits-title"
      aria-describedby="insufficient-credits-desc"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-transparent"
        aria-label="Dismiss"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-[1] w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-surface-md",
          "text-center sm:p-6",
        )}
      >
        <p
          id="insufficient-credits-title"
          className="font-mono text-sm font-semibold tracking-tight text-foreground sm:text-base"
        >
          More credits needed
        </p>
        <p id="insufficient-credits-desc" className="mt-2 text-pretty text-sm text-muted-foreground">
          Running this audit costs {requiredCredits} credit{requiredCredits === 1 ? "" : "s"}.
          {typeof balance === "number" ? ` Your balance is ${balance}. ` : " "}
          Buy credits on Billing to continue.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="w-full font-semibold sm:w-auto" asChild>
            <Link href="/billing" onClick={() => onOpenChange(false)}>
              Buy credits
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
