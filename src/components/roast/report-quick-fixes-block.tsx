"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { MetricIntelFootnote } from "@/components/roast/report-intel-captions";
import { UnlockFullReportButton } from "@/components/roast/unlock-full-report-button";
import {
  QuickFixDetailDialog,
  QuickFixViewDetailsTrigger,
  type QuickFixDetailWin,
} from "@/components/roast/quick-fix-detail-dialog";
import { QuickWinCardBody } from "@/components/roast/quick-win-card-body";
import { INTEL_ESTIMATED_IMPROVEMENT } from "@/lib/report-intelligence";
import { ChevronDown, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReportQuickWin = QuickFixDetailWin;

type Props = {
  quickWins: ReportQuickWin[];
  hasFullReportAccess: boolean;
  onUnlockFullReport: () => void;
};

const MAX_FIXES = 6;

export function ReportQuickFixesBlock({
  quickWins,
  hasFullReportAccess,
  onUnlockFullReport,
}: Props) {
  const displayed = quickWins.slice(0, MAX_FIXES);
  const [openFreeIdx, setOpenFreeIdx] = useState(0);
  const hasLockedRows = !hasFullReportAccess && displayed.length > 1;

  return (
    <Card className="flex flex-col border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <Rocket className="size-4 stroke-[1.5]" />
          </IconFrame>
          Quick Fixes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        <MetricIntelFootnote className="mb-0.5 mt-0">
          {INTEL_ESTIMATED_IMPROVEMENT} when prioritized fixes ship.
        </MetricIntelFootnote>
        {displayed.length > 0 ? (
          <>
            {displayed.map((win, idx) => {
              const detailLocked = !hasFullReportAccess && idx >= 1;
              const expanded = openFreeIdx === idx;

              if (hasFullReportAccess) {
                return (
                  <div
                    key={idx}
                    className="relative rounded-lg border border-border bg-surface-2/35 p-4 transition-colors hover:bg-surface-2/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <QuickWinCardBody
                        win={{
                          ...win,
                          title: `${idx + 1}. ${win.title || win.elementName || "Quick win"}`,
                          elementName: undefined,
                        }}
                      />
                      <QuickFixDetailDialog win={win} trigger={<QuickFixViewDetailsTrigger />} />
                    </div>
                  </div>
                );
              }

              if (detailLocked) {
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-dashed border-border-muted bg-muted/10 px-4 py-3"
                    aria-label={`Additional quick fix ${idx + 1}, full report required`}
                  >
                    <div className="space-y-2" aria-hidden>
                      <div className="h-3.5 w-[min(12rem,55%)] rounded-md bg-muted" />
                      <div className="h-3 w-[min(16rem,75%)] rounded-md bg-muted/60" />
                      <div className="h-3 w-[min(11rem,45%)] rounded-md bg-muted/40" />
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="overflow-hidden rounded-lg border border-border">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 bg-surface-2/35 p-4 text-left transition-colors hover:bg-surface-2/50"
                    onClick={() => setOpenFreeIdx(idx)}
                    aria-expanded={expanded}
                  >
                    <span className="min-w-0 flex-1 pr-1">
                      <span className="block text-sm font-semibold leading-tight">
                        {idx + 1}. {win.title || win.elementName || "Quick win"}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
                        expanded && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </button>
                  {expanded ? (
                    <div className="border-t border-border-muted bg-surface-2/20 px-4 pb-4 pt-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <QuickWinCardBody
                          win={{
                            ...win,
                            title: `${idx + 1}. ${win.title || win.elementName || "Quick win"}`,
                            elementName: undefined,
                          }}
                        />
                        <QuickFixDetailDialog win={win} trigger={<QuickFixViewDetailsTrigger />} />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
            {hasLockedRows ? (
              <div className="mt-3 flex justify-center border-t border-border-muted pt-4">
                <UnlockFullReportButton size="sm" onUnlock={onUnlockFullReport} />
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No quick fixes available.</p>
        )}
      </CardContent>
    </Card>
  );
}
