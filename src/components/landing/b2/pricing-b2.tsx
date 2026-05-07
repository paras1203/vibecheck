"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type PricingB2Props = {
  loading: boolean;
  onRoast: () => void;
  user: User | null;
};

export function PricingB2({ loading, onRoast, user }: PricingB2Props) {
  const [mode, setMode] = useState<"single" | "bundle">("single");

  return (
    <section id="pricing" className="border-t border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-[var(--lv-minimal-text)] md:text-4xl">
          Choose your plan
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-muted-foreground">
          Start free, upgrade when you need full radar, audits, and exports.
        </p>

        <div className="w-full">
        <Tabs
          defaultValue="single"
          value={mode}
          onValueChange={(v) => setMode(v as "single" | "bundle")}
        >
          <TabsList className="mx-auto mb-10 grid w-full max-w-md grid-cols-2 rounded-lg border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)] p-1">
            <TabsTrigger value="single" className="rounded-md">
              Single audit
            </TabsTrigger>
            <TabsTrigger value="bundle" className="rounded-md">
              Bundle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-0">
            <div className="grid min-h-[420px] gap-6 md:grid-cols-2">
              <Card className="flex flex-col rounded-xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)] shadow-none">
                <CardHeader>
                  <CardTitle className="text-[var(--lv-minimal-text)]">The Tease</CardTitle>
                  <CardDescription>Free Tier</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <div className="font-mono text-4xl font-semibold tabular-nums text-[var(--lv-minimal-text)]">
                    {usdLanding(LANDING_FREE_TEST_USD)}
                  </div>
                  <ul className="flex-1 list-none space-y-2 text-sm text-muted-foreground">
                    <li>• Basic Roasts (Audit)</li>
                    <li>• Site Score</li>
                    <li>• Short Summary</li>
                    <li>• 3 Quick fixes</li>
                  </ul>
                  <div className="mt-auto flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={onRoast}
                    disabled={loading}
                    className="w-full border-[var(--lv-minimal-border)]"
                  >
                    Get Free Audit
                  </Button>
                  <Button asChild variant="outline" className="w-full border-[var(--lv-minimal-border)] text-xs">
                    <Link href={freeTestCheckoutHref(user)}>Test checkout</Link>
                  </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex flex-col rounded-xl border border-[var(--lv-minimal-accent)]/30 bg-[var(--lv-minimal-bg)] shadow-surface-xs">
                <CardHeader>
                  <CardTitle className="text-[var(--lv-minimal-text)]">Pro Plan</CardTitle>
                  <CardDescription>Paid Tier</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-xl tabular-nums text-muted-foreground line-through">
                      {usdLanding(LANDING_LIST_SINGLE_USD)}
                    </span>
                    <span className="font-mono text-4xl font-semibold tabular-nums text-[var(--lv-minimal-text)]">
                      {usdLanding(LANDING_CHECKOUT_SINGLE_USD)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[var(--lv-minimal-accent)]">
                    Save {usdLanding(LANDING_PRO_SAVE_USD)} ({LANDING_PRO_SAVE_PCT}% off).
                  </p>
                  <ul className="flex-1 list-none space-y-2 text-sm text-muted-foreground">
                    <li>• 1 Roast Credit</li>
                    <li>• Detailed Roast Summary</li>
                    <li>• Site Performance Radar</li>
                    <li>• Element Wise Audit Report</li>
                    <li>• Step by Step Action Plan</li>
                    <li>• First viewport snapshot</li>
                    <li>• PDF Export</li>
                  </ul>
                  {loading ? (
                    <Button disabled className="mt-auto w-full">
                      Get Your Roast
                    </Button>
                  ) : (
                    <Button asChild className="mt-auto w-full">
                      <Link href={checkoutHref(user, "pro")}>Buy Pro</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bundle" className="mt-0">
            <div className="grid min-h-[420px] gap-6 md:grid-cols-2">
              <Card className="flex flex-col rounded-xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)] shadow-none">
                <CardHeader>
                  <CardTitle className="text-[var(--lv-minimal-text)]">The Tease</CardTitle>
                  <CardDescription>Free Tier</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <div className="font-mono text-4xl font-semibold tabular-nums text-[var(--lv-minimal-text)]">
                    {usdLanding(LANDING_FREE_TEST_USD)}
                  </div>
                  <ul className="flex-1 list-none space-y-2 text-sm text-muted-foreground">
                    <li>• Basic Roasts (Audit)</li>
                    <li>• Site Score</li>
                    <li>• Short Summary</li>
                    <li>• 3 Quick fixes</li>
                  </ul>
                  <div className="mt-auto flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={onRoast}
                    disabled={loading}
                    className="w-full border-[var(--lv-minimal-border)]"
                  >
                    Get Free Audit
                  </Button>
                  <Button asChild variant="outline" className="w-full border-[var(--lv-minimal-border)] text-xs">
                    <Link href={freeTestCheckoutHref(user)}>Test checkout</Link>
                  </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex flex-col rounded-xl border border-[var(--lv-minimal-accent)]/30 bg-[var(--lv-minimal-bg)] shadow-surface-xs">
                <CardHeader>
                  <CardTitle className="text-[var(--lv-minimal-text)]">Agency Pack (Bundle)</CardTitle>
                  <CardDescription>Bulk Option</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-lg tabular-nums text-muted-foreground line-through">
                      {usdLanding(LANDING_BUNDLE_LIST_USD)}
                    </span>
                    <span className="font-mono text-3xl font-semibold tabular-nums text-[var(--lv-minimal-text)]">
                      {usdLanding(LANDING_BUNDLE_USD)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--lv-minimal-accent)]">
                    <p>≈ {perCreditAgencyApprox()} per credit</p>
                    <p>
                      Save {usdLanding(LANDING_BUNDLE_SAVE_USD)} (~{LANDING_BUNDLE_SAVE_PCT}%).
                    </p>
                  </div>
                  <ul className="flex-1 list-none space-y-2 text-sm text-muted-foreground">
                    <li>• 5 Advanced Roast Credits</li>
                    <li>• Detailed Roast Summary</li>
                    <li>• Site Performance Radar</li>
                    <li>• Element Wise Audit Report</li>
                    <li>• Step by Step Action Plan</li>
                    <li>• First viewport snapshot</li>
                    <li>• PDF Export</li>
                  </ul>
                  {loading ? (
                    <Button disabled className="mt-auto w-full">
                      Get Agency Pack
                    </Button>
                  ) : (
                    <Button asChild className="mt-auto w-full">
                      <Link href={checkoutHref(user, "agency")}>Buy Agency</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </section>
  );
}
