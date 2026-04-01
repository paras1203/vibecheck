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

type PricingSectionProps = {
  loading: boolean;
  onRoast: () => void;
  user: User | null;
};

function billingPath(plan: "pro" | "agency") {
  return `/billing?plan=${plan}&checkout=razorpay`;
}

function checkoutHref(user: User | null, plan: "pro" | "agency") {
  const path = billingPath(plan);
  return user ? path : `/login?next=${encodeURIComponent(path)}`;
}

export function PricingSection({ loading, onRoast, user }: PricingSectionProps) {
  return (
    <section id="pricing" className="border-t border-border bg-surface-2 px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Choose your plan
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
          Start free, upgrade when you need full radar, audits, and exports.
        </p>
        <div className="mb-8 grid min-h-[480px] gap-6 md:grid-cols-3 md:gap-8">
          <Card className="flex h-full flex-col border-border bg-card">
            <CardHeader>
              <CardTitle>The Tease</CardTitle>
              <CardDescription>Free Tier</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-6 py-6">
              <div className="mb-2 font-mono text-4xl font-semibold tabular-nums text-foreground">
                ₹0
              </div>
              <div className="h-8" />
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
              <Button onClick={onRoast} disabled={loading} className="mt-auto w-full">
                Get Free Audit
              </Button>
            </CardContent>
          </Card>

          <Card className="relative flex h-full flex-col overflow-hidden border-primary/35 bg-surface-1 ring-1 ring-primary/20">
            <div className="absolute right-4 top-4 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Launch Offer
            </div>
            <CardHeader>
              <CardTitle>The Fix</CardTitle>
              <CardDescription>Pro Tier</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-6 py-6">
              <div className="mb-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl tabular-nums text-muted-foreground line-through">
                  ₹12,499
                </span>
                <span className="font-mono text-4xl font-semibold tabular-nums text-foreground">
                  ₹1,599
                </span>
              </div>
              <div className="h-8 text-sm font-semibold text-primary">87% OFF</div>
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Advance Roast (Audit) Credits - 1</span>
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
                  <span>Heatmap</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>PDF Export</span>
                </li>
              </ul>
              {loading ? (
                <Button disabled className="mt-auto w-full">
                  Get Your Roast
                </Button>
              ) : (
                <Button asChild className="mt-auto w-full">
                  <Link href={checkoutHref(user, "pro")}>Buy Pro — Razorpay</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col border-border bg-card">
            <CardHeader>
              <CardTitle>Agency Pack</CardTitle>
              <CardDescription>Bulk Option</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-6 py-6">
              <div className="mb-2 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                  ₹4,099
                </span>
                <span className="text-muted-foreground">for 5 Roasts</span>
              </div>
              <div className="h-8 text-sm text-muted-foreground">
                Save 50% - Perfect for agencies or teams
              </div>
              <ul className="flex-1 list-none space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Advance Roasts (Audit) Credit - 5</span>
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
                  <span>Heatmap</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>PDF Export</span>
                </li>
              </ul>
              {loading ? (
                <Button disabled className="mt-auto w-full">
                  Get Agency Pack
                </Button>
              ) : (
                <Button asChild className="mt-auto w-full">
                  <Link href={checkoutHref(user, "agency")}>Buy Agency Pack — Razorpay</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
