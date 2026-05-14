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

type PricingA1Props = {
  loading: boolean;
  onRoast: () => void;
  user: User | null;
};

export function PricingA1({ loading, onRoast, user }: PricingA1Props) {
  return (
    <section id="pricing" className="border-t border-border bg-surface-2 px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-5xl min-w-0">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Choose your plan
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
          Start free, upgrade when you need full radar, audits, and exports.
        </p>
        <div className="mb-8 grid min-h-[480px] gap-6 md:grid-cols-3 md:gap-8">
          <Card className="flex h-full flex-col rounded-2xl border-border bg-card">
            <CardHeader>
              <CardTitle>The Tease</CardTitle>
              <CardDescription>Free Tier</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4 py-6">
              <div className="mb-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
                {usdLanding(LANDING_FREE_TEST_USD)}
              </div>
              <p className="text-xs leading-snug text-muted-foreground">
                Temporary headline for a live $0.10 test checkout (no extra credits).
              </p>
              <div className="h-6" />
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Basic Roasts (Audit)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Site Score</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Short Summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>3 Quick fixes</span>
                </li>
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <Button
                  onClick={onRoast}
                  disabled={loading}
                  className="w-full rounded-xl"
                  variant="outline"
                >
                  Get Free Audit
                </Button>
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link href={freeTestCheckoutHref(user)}>Test checkout</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-primary/50 bg-card text-card-foreground shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_12%,transparent),0_20px_50px_-20px_color-mix(in_srgb,var(--primary)_35%,transparent)] ring-2 ring-primary/20">
            <div className="absolute right-4 top-4 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Single roast
            </div>
            <CardHeader>
              <CardTitle>Pro Plan</CardTitle>
              <CardDescription>Paid Tier</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-6 py-6">
              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-xl tabular-nums text-muted-foreground line-through">
                  {usdLanding(LANDING_LIST_SINGLE_USD)}
                </span>
                <span className="font-mono text-3xl font-semibold tabular-nums text-primary">
                  {usdLanding(LANDING_CHECKOUT_SINGLE_USD)}
                </span>
              </div>
              <p className="text-sm font-semibold text-accent-foreground">
                Save {usdLanding(LANDING_PRO_SAVE_USD)} ({LANDING_PRO_SAVE_PCT}% off)
              </p>
              <p className="text-xs text-muted-foreground">{usdLanding(LANDING_CHECKOUT_SINGLE_USD)} per credit</p>
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>1 Roast Credit</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Detailed Roast Summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Site Performance Radar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Element Wise Audit Report</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Step by Step Action Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>First viewport snapshot</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>PDF Export</span>
                </li>
              </ul>
              {loading ? (
                <Button disabled className="mt-auto w-full rounded-xl">
                  Get Your Roast
                </Button>
              ) : (
                <Button asChild className="mt-auto w-full rounded-xl">
                  <Link href={checkoutHref(user, "pro")}>Buy Pro</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col rounded-2xl border-border bg-card">
            <CardHeader>
              <CardTitle>Agency Pack (Bundle)</CardTitle>
              <CardDescription>Bulk Option</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-6 py-6">
              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-xl tabular-nums text-muted-foreground line-through">
                  {usdLanding(LANDING_BUNDLE_LIST_USD)}
                </span>
                <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                  {usdLanding(LANDING_BUNDLE_USD)}
                </span>
              </div>
              <p className="text-sm font-semibold text-accent-foreground">
                Save {usdLanding(LANDING_BUNDLE_SAVE_USD)} (~{LANDING_BUNDLE_SAVE_PCT}% off)
              </p>
              <p className="text-xs text-muted-foreground">≈ {perCreditAgencyApprox()} per credit</p>
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>5 Advanced Roast Credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Detailed Roast Summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Site Performance Radar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Element Wise Audit Report</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Step by Step Action Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>First viewport snapshot</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>PDF Export</span>
                </li>
              </ul>
              {loading ? (
                <Button disabled className="mt-auto w-full rounded-xl">
                  Get Agency Pack
                </Button>
              ) : (
                <Button asChild className="mt-auto w-full rounded-xl">
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
