"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { IconFrame } from "@/components/ui/icon-frame";
import { openRazorpayCheckout } from "@/components/razorpay-open-checkout";

interface PaymentPlan {
  id: "pro" | "agency";
  name: string;
  price: number;
  listPrice?: number;
  credits: number;
  cornerBadge: string;
  discountLabel: string;
  creditsLabel: string;
  priceSub?: string;
}

const paymentPlans: PaymentPlan[] = [
  {
    id: "pro",
    name: "Pro Pack",
    price: 1599,
    listPrice: 12499,
    credits: 1,
    cornerBadge: "Launch Offer",
    discountLabel: "87% OFF",
    creditsLabel: "1 Advanced Roast Credit",
  },
  {
    id: "agency",
    name: "Agency Pack",
    price: 4099,
    credits: 5,
    cornerBadge: "Save 50%",
    discountLabel: "Save 50% — Perfect for agencies or teams",
    creditsLabel: "5 Advanced Roast Credits",
    priceSub: "for 5 Roasts",
  },
];

function BillingPageContent() {
  const { user, updateCreditsAndPlan } = useAuth();
  const isAuthenticated = useRequireAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const highlightedRef = useRef<HTMLDivElement | null>(null);
  const paidToastRef = useRef(false);

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan !== "pro" && plan !== "agency") return;
    const t = window.setTimeout(() => {
      highlightedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("paid") !== "1" || paidToastRef.current) return;
    paidToastRef.current = true;
    toast.success("Payment complete", { description: "Your credits are updated." });
  }, [searchParams]);

  const runCheckout = useCallback(
    async (planId: "pro" | "agency") => {
      if (!user) {
        toast.error("Please log in to purchase credits");
        return;
      }
      setLoading(planId);
      try {
        const result = await openRazorpayCheckout(
          planId,
          user.uid,
          user.email,
          user.displayName
        );
        updateCreditsAndPlan(result.credits, result.plan);
      } catch (error) {
        if (error instanceof Error && error.message === "CLOSED") {
          toast.message("Checkout closed", {
            description: "You can try again when you're ready.",
          });
        } else {
          console.error("Payment error:", error);
          toast.error("Payment failed", {
            description: error instanceof Error ? error.message : "Unknown error",
          });
        }
      } finally {
        setLoading(null);
      }
    },
    [user, updateCreditsAndPlan]
  );

  useEffect(() => {
    if (!user) return;
    if (searchParams.get("checkout") !== "razorpay") return;
    const plan = searchParams.get("plan");
    if (plan !== "pro" && plan !== "agency") return;
    const dedupeKey = `rzp_billing_auto_${plan}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, "1");
    void runCheckout(plan);
  }, [user, searchParams, runCheckout]);

  if (!isAuthenticated) {
    return null;
  }

  const handleBuy = (plan: PaymentPlan) => {
    void runCheckout(plan.id);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "14.4rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-auto">
        <div className="ml-[14.4rem] flex min-h-screen w-[calc(100%-14.4rem)] max-w-[min(100%,88rem)] flex-col items-stretch gap-8 bg-background p-6 pt-8 md:p-10 md:pt-10">
          <div className="w-full max-w-4xl">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
                Billing & Credits
              </h1>
              <p className="text-muted-foreground">
                Purchase credits via Razorpay (INR) to unlock advanced roast features
              </p>
            </div>

            {user && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconFrame size="sm" className="bg-primary/10 text-primary">
                      <Zap className="size-4 stroke-[1.5]" />
                    </IconFrame>
                    Your Credits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 font-mono text-4xl font-semibold tabular-nums text-primary">
                    {user.credits}
                  </div>
                  <p className="text-sm text-muted-foreground">Available roast credits</p>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {paymentPlans.map((plan) => (
                <Card
                  key={plan.id}
                  ref={plan.id === searchParams.get("plan") ? highlightedRef : undefined}
                  data-plan={plan.id}
                  className={`relative overflow-hidden ${
                    searchParams.get("plan") === plan.id
                      ? "ring-2 ring-primary/50 shadow-surface-sm"
                      : ""
                  } ${plan.id === "pro" ? "border-primary/35 ring-1 ring-primary/20" : ""}`}
                >
                  <div className="absolute right-3 top-3 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    {plan.cornerBadge}
                  </div>
                  <CardHeader className="pr-24">
                    <CardTitle>{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm font-medium leading-snug text-foreground">
                      Buy extra roast credits at the same launch pricing as the homepage — top up any
                      time.
                    </div>
                    <div>
                      <div className="mb-1 flex flex-wrap items-baseline gap-2">
                        {plan.listPrice != null ? (
                          <span className="font-mono text-2xl tabular-nums text-muted-foreground line-through">
                            ₹{plan.listPrice.toLocaleString("en-IN")}
                          </span>
                        ) : null}
                        <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                          ₹{plan.price.toLocaleString("en-IN")}
                        </span>
                        {plan.priceSub ? (
                          <span className="text-sm text-muted-foreground">{plan.priceSub}</span>
                        ) : null}
                      </div>
                      <p
                        className={
                          plan.id === "pro"
                            ? "text-sm font-semibold text-primary"
                            : "text-sm text-muted-foreground"
                        }
                      >
                        {plan.discountLabel}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.creditsLabel}</p>
                    </div>
                    <Button
                      onClick={() => handleBuy(plan)}
                      disabled={loading === plan.id || !user}
                      className="w-full"
                      size="lg"
                    >
                      {loading === plan.id ? "Opening Razorpay…" : "Buy with Razorpay"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!user && (
              <Card className="mt-8 border-warning/35 bg-warning/10">
                <CardContent className="pt-6">
                  <p className="text-sm text-foreground">Please log in to purchase credits</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading…
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
