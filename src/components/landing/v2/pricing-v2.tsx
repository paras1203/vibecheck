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
  LANDING_BUNDLE_LIST_USD,
  LANDING_BUNDLE_SAVE_PCT,
  LANDING_BUNDLE_SAVE_USD,
  LANDING_BUNDLE_USD,
  LANDING_CHECKOUT_SINGLE_USD,
  LANDING_LIST_SINGLE_USD,
  LANDING_PRO_SAVE_PCT,
  LANDING_PRO_SAVE_USD,
  perCreditAgencyApprox,
  usdLanding,
} from "@/lib/landing-pricing-utils";
import { trackEvent } from "@/lib/analytics-events";

type PricingV2Props = {
  loading: boolean;
  onRoast: () => void;
  user: User | null;
};

export function PricingV2({ loading, onRoast, user }: PricingV2Props) {
  const handleRoastCta = () => {
    trackEvent("pricing_cta_click");
    onRoast();
  };

  const handleCheckoutCta = () => {
    trackEvent("pricing_cta_click");
  };

  return (
    <section
      id="v2-pricing"
      className="border-t border-border bg-surface-2 px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-5xl min-w-0">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
          One credit = one full audit of one URL. Start with the free pass,
          upgrade when you need the complete report and export.
        </p>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {/* Free tier — visually demoted */}
          <Card className="flex h-full flex-col rounded-2xl border-border bg-card opacity-90">
            <CardHeader>
              <CardTitle>Free Audit</CardTitle>
              <CardDescription>
                For SaaS founders who want a quick first look
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4 py-6">
              <div className="mb-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
                Free
              </div>
              <p className="text-xs leading-snug text-muted-foreground">
                A quick scan to see your headline score and top issues. No
                credit card required.
              </p>
              <div className="h-4" />
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Overall site score</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Short executive summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>3 top quick fixes</span>
                </li>
              </ul>
              <div className="mt-auto">
                <Button
                  id="pricing-free-btn-v2"
                  onClick={handleRoastCta}
                  disabled={loading}
                  className="w-full rounded-xl"
                  variant="outline"
                >
                  {loading ? "Analysing…" : "Get free audit"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pro — primary */}
          <Card className="relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-primary/50 bg-card text-card-foreground shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_12%,transparent),0_20px_50px_-20px_color-mix(in_srgb,var(--primary)_35%,transparent)] ring-2 ring-primary/20">
            <div className="absolute right-4 top-4 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Most popular
            </div>
            <CardHeader>
              <CardTitle>Single Audit</CardTitle>
              <CardDescription>
                For founders and marketers reviewing one landing page
              </CardDescription>
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
                Save {usdLanding(LANDING_PRO_SAVE_USD)} ({LANDING_PRO_SAVE_PCT}
                % off launch pricing)
              </p>
              <p className="text-xs text-muted-foreground">
                1 credit = 1 full audit of 1 URL
              </p>
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Full scored report (all six pillars)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Conversion radar chart</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Element-level audit findings</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Step-by-step action plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Viewport snapshot</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>PDF export</span>
                </li>
              </ul>
              {loading ? (
                <Button disabled className="mt-auto w-full rounded-xl">
                  Get my audit
                </Button>
              ) : (
                <Button
                  asChild
                  className="mt-auto w-full rounded-xl"
                  onClick={handleCheckoutCta}
                >
                  <Link href={checkoutHref(user, "pro")}>Get my audit</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Agency / Team Pack */}
          <Card className="flex h-full flex-col rounded-2xl border-border bg-card">
            <CardHeader>
              <CardTitle>Team Pack</CardTitle>
              <CardDescription>
                For agencies and teams auditing multiple pages
              </CardDescription>
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
                Save {usdLanding(LANDING_BUNDLE_SAVE_USD)} (~
                {LANDING_BUNDLE_SAVE_PCT}% off)
              </p>
              <p className="text-xs text-muted-foreground">
                5 credits — ≈ {perCreditAgencyApprox()} per audit
              </p>
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>5 full audit credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Everything in Single Audit</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Use across multiple URLs</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>PDF export per audit</span>
                </li>
              </ul>
              {loading ? (
                <Button disabled className="mt-auto w-full rounded-xl">
                  Get Team Pack
                </Button>
              ) : (
                <Button
                  asChild
                  className="mt-auto w-full rounded-xl"
                  onClick={handleCheckoutCta}
                >
                  <Link href={checkoutHref(user, "agency")}>
                    Get Team Pack
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          All prices in USD. Illustrative estimates, not a guarantee of results.
        </p>
      </div>
    </section>
  );
}
