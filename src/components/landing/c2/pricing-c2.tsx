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

type PricingC2Props = {
  loading: boolean;
  onRoast: () => void;
  user: User | null;
};

export function PricingC2({ loading, onRoast, user }: PricingC2Props) {
  return (
    <section
      id="pricing"
      className="border-t border-[var(--lv-c2-border)] bg-[var(--lv-c2-bg)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-[var(--lv-c2-text)] md:text-4xl">
          Simple plans for real audits
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
          Start free; upgrade when you need radar depth, element-level report, and PDF export.
        </p>
        <div className="mb-8 grid min-h-[480px] gap-6 md:grid-cols-3 md:gap-8">
          <Card className="flex h-full flex-col rounded-3xl border-0 bg-[var(--lv-c2-surface-1)] shadow-[0_12px_40px_rgba(28,25,23,0.08)]">
            <CardHeader>
              <CardTitle className="text-[var(--lv-c2-text)]">The Tease</CardTitle>
              <CardDescription>Free Tier</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4 py-6">
              <div className="mb-2 font-mono text-4xl font-semibold tabular-nums text-[var(--lv-c2-text)]">
                {usdLanding(LANDING_FREE_TEST_USD)}
              </div>
              <p className="text-xs leading-snug text-muted-foreground">
                Temporary headline for a live $0.10 test checkout (no extra credits).
              </p>
              <div className="h-6" />
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Basic Roasts (Audit)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Site Score</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Short Summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>3 Quick fixes</span>
                </li>
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <Button
                  onClick={onRoast}
                  disabled={loading}
                  variant="outline"
                  className="w-full rounded-2xl border-[var(--lv-c2-border)]"
                >
                  Get Free Audit
                </Button>
                <Button asChild variant="outline" className="w-full rounded-2xl border-[var(--lv-c2-border)]">
                  <Link href={freeTestCheckoutHref(user)}>Test checkout</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="relative flex h-full flex-col overflow-hidden rounded-3xl border-0 bg-[var(--lv-c2-bg)] shadow-[0_16px_48px_rgba(28,25,23,0.12)] ring-2 ring-[var(--lv-c2-accent)]/30">
            <div className="absolute right-4 top-4">
              <Badge className="rounded-full bg-[var(--lv-c2-accent)] text-white hover:bg-[var(--lv-c2-accent)]">
                Single roast
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-[var(--lv-c2-text)]">Pro Plan</CardTitle>
              <CardDescription>Paid Tier</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-6 py-6">
              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-2xl tabular-nums text-muted-foreground line-through">
                  {usdLanding(LANDING_LIST_SINGLE_USD)}
                </span>
                <span className="font-mono text-4xl font-semibold tabular-nums text-[var(--lv-c2-text)]">
                  {usdLanding(LANDING_CHECKOUT_SINGLE_USD)}
                </span>
              </div>
              <div className="h-8 text-sm font-semibold text-[var(--lv-c2-accent)]">
                Save {usdLanding(LANDING_PRO_SAVE_USD)} ({LANDING_PRO_SAVE_PCT}% off).
              </div>
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>1 Roast Credit</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Detailed Roast Summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Site Performance Radar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Element Wise Audit Report</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Step by Step Action Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>First viewport snapshot</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>PDF Export</span>
                </li>
              </ul>
              {loading ? (
                <Button disabled className="mt-auto w-full rounded-2xl bg-[var(--lv-c2-accent)] text-white">
                  Get Your Roast
                </Button>
              ) : (
                <Button
                  asChild
                  className="mt-auto w-full rounded-2xl bg-[var(--lv-c2-accent)] text-white hover:bg-[color-mix(in_srgb,var(--lv-c2-accent)_92%,black)]"
                >
                  <Link href={checkoutHref(user, "pro")}>Buy Pro</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col rounded-3xl border-0 bg-[var(--lv-c2-surface-1)] shadow-[0_12px_40px_rgba(28,25,23,0.08)]">
            <CardHeader>
              <CardTitle className="text-[var(--lv-c2-text)]">Agency Pack (Bundle)</CardTitle>
              <CardDescription>Bulk Option</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-6 py-6">
              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-2xl tabular-nums text-muted-foreground line-through">
                  {usdLanding(LANDING_BUNDLE_LIST_USD)}
                </span>
                <span className="font-mono text-4xl font-semibold tabular-nums text-[var(--lv-c2-text)]">
                  {usdLanding(LANDING_BUNDLE_USD)}
                </span>
              </div>
              <div className="space-y-1 text-sm font-semibold text-[var(--lv-c2-accent)]">
                <p>≈ {perCreditAgencyApprox()} per credit</p>
                <p>
                  Save {usdLanding(LANDING_BUNDLE_SAVE_USD)} (~{LANDING_BUNDLE_SAVE_PCT}%).
                </p>
              </div>
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>5 Advanced Roast Credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Detailed Roast Summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Site Performance Radar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Element Wise Audit Report</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>Step by Step Action Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>First viewport snapshot</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--lv-c2-text)]">•</span>
                  <span>PDF Export</span>
                </li>
              </ul>
              {loading ? (
                <Button disabled className="mt-auto w-full rounded-2xl bg-[var(--lv-c2-accent)] text-white">
                  Get Agency Pack
                </Button>
              ) : (
                <Button
                  asChild
                  className="mt-auto w-full rounded-2xl bg-[var(--lv-c2-accent)] text-white hover:bg-[color-mix(in_srgb,var(--lv-c2-accent)_92%,black)]"
                >
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
