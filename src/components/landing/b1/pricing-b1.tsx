"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/context/AuthContext";
import {
  checkoutHref,
  freeTestCheckoutHref,
  LANDING_BUNDLE_LIST_USD,
  LANDING_BUNDLE_SAVE_PCT,
  LANDING_BUNDLE_SAVE_USD,
  LANDING_BUNDLE_USD,
  LANDING_CHECKOUT_SINGLE_USD,
  LANDING_FREE_TEST_USD,
  LANDING_LIST_SINGLE_USD,
  LANDING_PRO_SAVE_PCT,
  LANDING_PRO_SAVE_USD,
  perCreditAgencyApprox,
  usdLanding,
} from "@/lib/landing-pricing-utils";

type PricingB1Props = {
  loading: boolean;
  onRoast: () => void;
  user: User | null;
};

export function PricingB1({ loading, onRoast, user }: PricingB1Props) {
  return (
    <section id="pricing" className="border-t border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-[var(--lv-minimal-text)] md:text-4xl">
          Choose your plan
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
          Start free, upgrade when you need full radar, audits, and exports.
        </p>
        <div className="mb-8 grid min-h-[420px] gap-6 md:grid-cols-3 md:gap-6">
          <Card className="flex h-full flex-col rounded-xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-2)] shadow-none">
            <CardHeader className="pb-2 pt-6">
              <CardTitle className="text-lg text-[var(--lv-minimal-text)]">The Tease</CardTitle>
              <CardDescription className="text-sm">Free Tier</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-3 py-4">
              <div className="mb-1 font-mono text-3xl font-semibold tabular-nums text-[var(--lv-minimal-text)]">
                {usdLanding(LANDING_FREE_TEST_USD)}
              </div>
              <p className="text-xs leading-snug text-muted-foreground">
                Temporary headline for a live $0.10 test checkout (no extra credits).
              </p>
              <div className="h-6" />
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Basic Roasts (Audit)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Site Score</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Short Summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>3 Quick fixes</span>
                </li>
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <Button
                  onClick={onRoast}
                  disabled={loading}
                  variant="outline"
                  className="w-full rounded-xl border-[var(--lv-minimal-border)]"
                >
                  Get Free Audit
                </Button>
                <Button asChild variant="outline" className="w-full rounded-xl border-[var(--lv-minimal-border)]">
                  <Link href={freeTestCheckoutHref(user)}>Test checkout</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="relative flex h-full flex-col overflow-hidden rounded-xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] shadow-none ring-2 ring-[var(--lv-minimal-accent)]/20">
            <div className="absolute right-3 top-3">
              <Badge className="rounded-full bg-[var(--lv-minimal-accent)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-[var(--lv-minimal-accent)]">
                Single roast
              </Badge>
            </div>
            <CardHeader className="pb-2 pt-8">
              <CardTitle className="text-lg text-[var(--lv-minimal-text)]">Pro Plan</CardTitle>
              <CardDescription className="text-sm">Paid Tier</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4 py-4">
              <div className="mb-1 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-xl tabular-nums text-muted-foreground line-through">
                  {usdLanding(LANDING_LIST_SINGLE_USD)}
                </span>
                <span className="font-mono text-3xl font-semibold tabular-nums text-[var(--lv-minimal-text)]">
                  {usdLanding(LANDING_CHECKOUT_SINGLE_USD)}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--lv-minimal-accent)]">
                Save {usdLanding(LANDING_PRO_SAVE_USD)} ({LANDING_PRO_SAVE_PCT}% off)
              </p>
              <p className="text-xs text-muted-foreground">
                {usdLanding(LANDING_CHECKOUT_SINGLE_USD)} per credit
              </p>
              <ul className="flex-1 list-none space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>1 Roast Credit</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Detailed Roast Summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Site Performance Radar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Element Wise Audit Report</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Step by Step Action Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>First viewport snapshot</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>PDF Export</span>
                </li>
              </ul>
              {loading ? (
                <Button disabled className="mt-auto w-full rounded-xl text-sm">
                  Get Your Roast
                </Button>
              ) : (
                <Button asChild className="mt-auto w-full rounded-xl text-sm">
                  <Link href={checkoutHref(user, "pro")}>Buy Pro</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col rounded-xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-2)] shadow-none">
            <CardHeader className="pb-2 pt-6">
              <CardTitle className="text-lg text-[var(--lv-minimal-text)]">Agency Pack (Bundle)</CardTitle>
              <CardDescription className="text-sm">Bulk Option</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4 py-4">
              <div className="mb-1 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-xl tabular-nums text-muted-foreground line-through">
                  {usdLanding(LANDING_BUNDLE_LIST_USD)}
                </span>
                <span className="font-mono text-3xl font-semibold tabular-nums text-[var(--lv-minimal-text)]">
                  {usdLanding(LANDING_BUNDLE_USD)}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--lv-minimal-accent)]">
                Save {usdLanding(LANDING_BUNDLE_SAVE_USD)} (~{LANDING_BUNDLE_SAVE_PCT}% off)
              </p>
              <p className="text-xs text-muted-foreground">≈ {perCreditAgencyApprox()} per credit</p>
              <ul className="flex-1 list-none space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>5 Advanced Roast Credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Detailed Roast Summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Site Performance Radar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Element Wise Audit Report</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>Step by Step Action Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>First viewport snapshot</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-minimal-text)]">•</span>
                  <span>PDF Export</span>
                </li>
              </ul>
              {loading ? (
                <Button disabled className="mt-auto w-full rounded-xl text-sm">
                  Get Agency Pack
                </Button>
              ) : (
                <Button asChild className="mt-auto w-full rounded-xl text-sm">
                  <Link href={checkoutHref(user, "agency")}>Buy Agency</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
