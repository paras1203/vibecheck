"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { effortDetailBody, impactDetailBody } from "@/lib/report-ui";

export type QuickFixDetailWin = {
  title?: string;
  elementName?: string;
  problem?: string;
  fix?: string;
  example?: string;
  effort?: string;
  lift?: string;
};

type Props = {
  win: QuickFixDetailWin;
  trigger: ReactNode;
};

export function QuickFixDetailDialog({ win, trigger }: Props) {
  const effortBody = effortDetailBody(win.effort);
  const impactBody = impactDetailBody(win.lift);

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[min(85vh,720px)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-lg">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 pb-4 pt-6 pr-14 text-left">
          <DialogTitle>{win.title || win.elementName || "Quick Win"}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-semibold">Effort</h4>
              <p className="text-sm text-muted-foreground">{effortBody}</p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">Impact</h4>
              <p className="text-sm text-muted-foreground">{impactBody}</p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">Problem</h4>
              <p className="text-sm text-muted-foreground">
                {win.problem || "No specific problem identified."}
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">How to Fix</h4>
              <p className="text-sm text-muted-foreground">
                {win.fix || "No fix details available."}
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">Technical Details</h4>
              <div className="rounded-lg border border-border bg-muted/60 p-3 dark:bg-muted/40">
                {win.example ? (
                  <code className="block break-all font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                    {win.example}
                  </code>
                ) : (
                  <p className="text-sm italic text-foreground/90">
                    {win.fix || "No technical details available."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const QuickFixViewDetailsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(function QuickFixViewDetailsTrigger({ className, type = "button", ...props }, ref) {
  return (
    <Button
      ref={ref}
      type={type}
      variant="outline"
      size="sm"
      className={className ?? "shrink-0 text-xs"}
      {...props}
    >
      View Details
    </Button>
  );
});
QuickFixViewDetailsTrigger.displayName = "QuickFixViewDetailsTrigger";
