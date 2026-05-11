"use client";

import { formatQuickWinSubheadLine } from "@/lib/report-ui";
import { quickWinFixBulletText } from "@/lib/quick-wins-format";

export type QuickWinCardBodyWin = {
  title?: string;
  elementName?: string;
  effort?: string;
  impactCode?: string;
  problem?: string;
  fix?: string;
  example?: string;
  lift?: string;
};

export function QuickWinCardBody({ win }: { win: QuickWinCardBodyWin }) {
  const title = win.title || win.elementName || "Quick win";
  const subhead = formatQuickWinSubheadLine(win.effort, win.impactCode, win.lift);
  const fixBullet = quickWinFixBulletText(win.fix || "", win.example || "");
  return (
    <div className="min-w-0 flex-1 space-y-2">
      <h4 className="text-sm font-semibold leading-tight text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{subhead}</p>
      <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
        {win.problem ? (
          <li>
            <span className="font-medium text-foreground">Problem:</span> {win.problem}
          </li>
        ) : null}
        <li>
          <span className="font-medium text-foreground">Fix:</span>{" "}
          {fixBullet || "Review detailed audit for steps."}
        </li>
        {win.lift ? (
          <li>
            <span className="font-medium text-foreground">Impact:</span> {win.lift}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
