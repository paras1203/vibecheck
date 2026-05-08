"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { toast } from "sonner";
import { Zap, Minus, Plus } from "lucide-react";
import { IconFrame } from "@/components/ui/icon-frame";
import { verifyDodoPaymentReturn } from "@/components/dodo-open-checkout";
import { creditsBalanceTitle, formatCreditsBalance } from "@/lib/credits-balance-display";
import {
  AGENCY_PACK_CREDITS,
  CHECKOUT_AGENCY_PACK_USD,
  CHECKOUT_SINGLE_USD,
  LIST_AGENCY_PACK_USD,
  LIST_SINGLE_USD,
  normalizeCheckoutQty,
  type BillingCheckoutPlanId,
  type PaidPlanId,
} from "@/lib/billing-plans";

function formatUsdWhole(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function StepperRow(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const { label, value, min, max, onChange } = props;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Decrease quantity"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="min-w-8 text-center font-mono text-sm tabular-nums">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Increase quantity"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface PlanCardDef {
  id: PaidPlanId;
  title: string;
  listPrimary: number;
  price: number;
  /** Subline under totals (agency per-credit). */
  priceSub?: string;
  discountLines: string[];
  creditsCaption: string;
  buttonLabel: string;
  accent?: boolean;
}

const PRO_SAVE_EACH = LIST_SINGLE_USD - CHECKOUT_SINGLE_USD;
const AGENCY_SAVE_EACH = LIST_AGENCY_PACK_USD - CHECKOUT_AGENCY_PACK_USD;

function BillingPageContent() {
  const { user, updateCreditsAndPlan, firebaseUser } = useAuth();
  const router = useRouter();
  const isAuthenticated = useRequireAuth();
  const searchParams = useSearchParams();

  const [proUnits, setProUnits] = useState(1);
  const [agencyPacks, setAgencyPacks] = useState(1);
  const highlightedRef = useRef<HTMLDivElement | null>(null);
  const paidToastRef = useRef(false);

  useEffect(() => {
    const plan = searchParams.get("plan");
    const qtyRaw = searchParams.get("qty");
    if (!qtyRaw) return;
    const n = parseInt(qtyRaw, 10);
    if (!Number.isFinite(n)) return;
    if (plan === "pro") setProUnits(normalizeCheckoutQty("pro", n));
    if (plan === "agency") setAgencyPacks(normalizeCheckoutQty("agency", n));
  }, [searchParams]);

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan !== "pro" && plan !== "agency" && plan !== "free_test") return;
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

  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    const status = searchParams.get("status");
    if (!paymentId || status !== "succeeded" || !firebaseUser || !user) return;

    const dedupeKey = `dodo_verify_${paymentId}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(dedupeKey)) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const token = await firebaseUser.getIdToken(true);
        const result = await verifyDodoPaymentReturn(paymentId, token);
        if (cancelled) return;
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(dedupeKey, "1");
        updateCreditsAndPlan(result.credits, result.plan);
        router.replace("/billing?paid=1");
      } catch (err) {
        console.error("[billing] Dodo verify:", err);
        toast.error("Could not verify payment", {
          description:
            err instanceof Error ? err.message : "Confirm in dashboard or retry from Billing.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, router, searchParams, updateCreditsAndPlan, user]);

  const runCheckout = useCallback(
    (planId: BillingCheckoutPlanId, quantity?: number) => {
      if (!firebaseUser) {
        toast.error("Please log in to purchase credits");
        return;
      }
      const qs = new URLSearchParams({ plan: planId });
      if (planId !== "free_test") {
        qs.set(
          "qty",
          String(
            planId === "pro"
              ? normalizeCheckoutQty("pro", quantity ?? proUnits)
              : normalizeCheckoutQty("agency", quantity ?? agencyPacks)
          )
        );
      }
      router.push(`/checkout?${qs.toString()}`);
    },
    [agencyPacks, firebaseUser, proUnits, router]
  );

  useEffect(() => {
    const paymentHold = Boolean(
      searchParams.get("payment_id") && searchParams.get("status") === "succeeded"
    );
    if (paymentHold) return;
    if (searchParams.get("checkout") !== "dodo") return;

    const planRaw = searchParams.get("plan");
    const plan: BillingCheckoutPlanId | null =
      planRaw === "pro" || planRaw === "agency" || planRaw === "free_test" ? planRaw : null;
    if (!plan) return;

    const qtyRaw = searchParams.get("qty");
    const qs = new URLSearchParams({ plan });
    if (plan !== "free_test") {
      qs.set(
        "qty",
        String(
          plan === "pro"
            ? normalizeCheckoutQty("pro", qtyRaw ?? proUnits)
            : normalizeCheckoutQty("agency", qtyRaw ?? agencyPacks)
        )
      );
    }

    const dest = `/checkout?${qs.toString()}`;
    const openKey = `dodo_billing_migrate_${dest}`;
    if (typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(openKey)) return;
      sessionStorage.setItem(openKey, "1");
    }

    router.replace(dest);
  }, [agencyPacks, proUnits, router, searchParams]);

  if (!isAuthenticated) {
    return null;
  }

  const proListTotal = LIST_SINGLE_USD * proUnits;
  const proPriceTotal = CHECKOUT_SINGLE_USD * proUnits;
  const proSaveTotal = PRO_SAVE_EACH * proUnits;

  const agencyListTotal = LIST_AGENCY_PACK_USD * agencyPacks;
  const agencyPriceTotal = CHECKOUT_AGENCY_PACK_USD * agencyPacks;
  const agencyCredits = AGENCY_PACK_CREDITS * agencyPacks;
  const agencyPerCredit = agencyPriceTotal / agencyCredits;
  const agencySaveTotal = AGENCY_SAVE_EACH * agencyPacks;

  const agencyPerCreditLabel = agencyPerCredit.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const cardPlans: PlanCardDef[] = [
    {
      id: "pro",
      title: "Pro Plan",
      listPrimary: proListTotal,
      price: proPriceTotal,
      discountLines: [
        `Save ${formatUsdWhole(proSaveTotal)} (${Math.round((PRO_SAVE_EACH / LIST_SINGLE_USD) * 100)}% off).`,
      ],
      creditsCaption: `${proUnits} Roast Credit${proUnits === 1 ? "" : "s"}`,
      buttonLabel: "Buy Pro",
      accent: true,
    },
    {
      id: "agency",
      title: "Agency Pack (Bundle)",
      listPrimary: agencyListTotal,
      price: agencyPriceTotal,
      priceSub: `≈ ${agencyPerCreditLabel} per credit`,
      discountLines: [
        `Save ${formatUsdWhole(agencySaveTotal)} (~${Math.round((AGENCY_SAVE_EACH / LIST_AGENCY_PACK_USD) * 100)}%).`,
      ],
      creditsCaption: `${agencyCredits} Advanced Roast Credit${agencyCredits === 1 ? "" : "s"}`,
      buttonLabel: "Buy Agency",
    },
  ];

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
                Purchase credits through Dodo Payments. Prices are shown in USD; your checkout may
                show tax or local currency depending on your card and region.
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
                  <div
                    className="font-mono text-4xl font-semibold tabular-nums text-primary"
                    title={creditsBalanceTitle(user)}
                  >
                    {formatCreditsBalance(user)}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {cardPlans.map((plan) => (
                <Card
                  key={plan.id}
                  ref={plan.id === searchParams.get("plan") ? highlightedRef : undefined}
                  data-plan={plan.id}
                  className={`relative flex flex-col overflow-hidden ${
                    searchParams.get("plan") === plan.id
                      ? "ring-2 ring-primary/50 shadow-surface-sm"
                      : ""
                  } ${plan.accent ? "border-primary/35 ring-1 ring-primary/20" : ""}`}
                >
                  <div className="absolute right-3 top-3 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    {plan.id === "pro" ? "Per credit" : "Best value"}
                  </div>
                  <CardHeader className="pr-24">
                    <CardTitle>{plan.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-0 p-6 pt-0">
                    <div className="min-h-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-mono text-2xl tabular-nums text-muted-foreground line-through">
                          {formatUsdWhole(plan.listPrimary)}
                        </span>
                        <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                          {formatUsdWhole(plan.price)}
                        </span>
                        {plan.priceSub ? (
                          <span className="text-sm text-muted-foreground">{plan.priceSub}</span>
                        ) : null}
                      </div>
                      {plan.discountLines.map((line) => (
                        <p key={line} className="text-sm font-semibold text-primary">
                          {line}
                        </p>
                      ))}
                      <p className="text-sm text-muted-foreground">{plan.creditsCaption}</p>
                    </div>

                    <div className="mt-auto space-y-3 border-t border-border pt-4">
                      {plan.id === "pro" ? (
                        <StepperRow
                          label="Credits (+1 each)"
                          value={proUnits}
                          min={1}
                          max={50}
                          onChange={(n) => setProUnits(normalizeCheckoutQty("pro", n))}
                        />
                      ) : (
                        <StepperRow
                          label="Packs (+5 credits each)"
                          value={agencyPacks}
                          min={1}
                          max={20}
                          onChange={(n) => setAgencyPacks(normalizeCheckoutQty("agency", n))}
                        />
                      )}
                      <Button
                        onClick={() =>
                          void runCheckout(
                            plan.id,
                            plan.id === "pro" ? proUnits : agencyPacks
                          )
                        }
                        disabled={!firebaseUser}
                        className="w-full"
                        size="lg"
                      >
                        {plan.buttonLabel}
                      </Button>
                    </div>
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
