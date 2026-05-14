"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";

const UNLOCK_LINES = [
  "Screenshot-led critique of hero, CTA, and trust layout",
  "Itemized issues with effort / impact and UX rationale",
  "Executive narrative + voice-of-customer style rewrites",
  "Scroll and funnel tension mapped to your exact page structure",
];

export function FreeReportProUpsell() {
  return (
    <Card className="border-primary/35 bg-gradient-to-br from-primary/10 via-background to-background shadow-md">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Full Site Roast
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Turn this scan into a prioritized conversion roadmap
            </h3>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              The free scan uses automated signals only. The paid audit adds visual diagnosis,
              narrative, and backlog items your team can ship—not generic best practices.
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2 font-semibold">
            <Link href="/home">
              <Sparkles className="size-4" />
              Roast my site
              <ArrowRight className="size-4 opacity-80" />
            </Link>
          </Button>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {UNLOCK_LINES.map((line) => (
            <li
              key={line}
              className="flex gap-2 rounded-lg border border-border/80 bg-card/60 px-3 py-2 text-sm text-foreground"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Need credits first?{" "}
          <Link href="/billing" className="font-medium text-primary underline-offset-4 hover:underline">
            Billing
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
