"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DodoPayments, type CheckoutEvent } from "dodopayments-checkout";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { fetchDodoCheckoutSessionUrl } from "@/components/dodo-open-checkout";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  PLAN_PURCHASE_CREDITS_PER_UNIT,
  creditsForPurchase,
  normalizeCheckoutQty,
  type BillingCheckoutPlanId,
} from "@/lib/billing-plans";
import { dodoCheckoutSdkMode } from "@/lib/dodo-checkout-sdk-mode";
import { DODO_INLINE_CHECKOUT_ELEMENT_ID } from "@/lib/dodo-inline-checkout-element-id";
import { toast } from "sonner";

function isCheckoutPlanId(v: string | null): v is BillingCheckoutPlanId {
  return v === "pro" || v === "agency" || v === "free_test";
}

function planOrderCopy(plan: BillingCheckoutPlanId, unitQty: number): {
  title: string;
  description: string;
} {
  switch (plan) {
    case "pro": {
      const n = creditsForPurchase("pro", unitQty);
      return {
        title: `SiteRoast Pro — ${n} roast credit${n === 1 ? "" : "s"}`,
        description: "Unlock the full audit: radar, snapshots, deep dives, and prioritized fixes.",
      };
    }
    case "agency": {
      const n = creditsForPurchase("agency", unitQty);
      return {
        title: `Agency pack — ${unitQty} bundle${unitQty === 1 ? "" : "s"} (${n} credits total)`,
        description: `Each bundle includes ${PLAN_PURCHASE_CREDITS_PER_UNIT.agency} advanced roast credits.`,
      };
    }
    case "free_test":
      return {
        title: "Sandbox test purchase",
        description:
          "Tiny test charge to validate Dodo checkout and webhooks in your environment.",
      };
  }
}

type BreakdownMoney = Parameters<typeof CheckoutOrderSummary>[0]["breakdown"];

export function DodoCheckoutFlow() {
  const { firebaseUser, isSyncing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useRequireAuth();

  const plan = useMemo(() => {
    const raw = searchParams.get("plan");
    return isCheckoutPlanId(raw) ? raw : null;
  }, [searchParams]);

  const unitQty = useMemo(() => {
    if (!plan || plan === "free_test") return 1;
    return normalizeCheckoutQty(plan, searchParams.get("qty"));
  }, [plan, searchParams]);

  const [bootError, setBootError] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownMoney>({});
  const [frameLoading, setFrameLoading] = useState(true);

  const handleEvent = useCallback(
    (event: CheckoutEvent) => {
      switch (event.event_type) {
        case "checkout.breakdown": {
          const message = event.data?.message as BreakdownMoney | undefined;
          if (message) setBreakdown(message);
          break;
        }
        case "checkout.opened":
          setFrameLoading(true);
          break;
        case "checkout.form_ready":
          setFrameLoading(false);
          break;
        case "checkout.payment_page_opened":
          setFrameLoading(false);
          break;
        case "checkout.error": {
          const msg = event.data?.message;
          toast.error(typeof msg === "string" ? msg : "Checkout error");
          break;
        }
        default:
          break;
      }
    },
    []
  );

  useEffect(() => {
    if (!isAuthenticated || !firebaseUser || !plan || isSyncing) return;

    let cancelled = false;

    void (async () => {
      setBootError(null);
      try {
        const token = await firebaseUser.getIdToken(true);
        const checkoutUrl = await fetchDodoCheckoutSessionUrl(
          plan,
          token,
          plan === "free_test" ? undefined : unitQty
        );
        if (cancelled) return;

        DodoPayments.Initialize({
          mode: dodoCheckoutSdkMode(),
          displayType: "inline",
          onEvent: handleEvent,
        });

        DodoPayments.Checkout.open({
          checkoutUrl,
          elementId: DODO_INLINE_CHECKOUT_ELEMENT_ID,
        });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Could not open checkout";
        setBootError(msg);
        toast.error("Checkout failed", { description: msg });
      }
    })();

    return () => {
      cancelled = true;
      DodoPayments.Checkout.close();
    };
  }, [firebaseUser, handleEvent, isAuthenticated, isSyncing, plan, unitQty]);

  useEffect(() => {
    if (isAuthenticated && !plan) {
      toast.error("Invalid plan", { description: "Choose a plan from Billing." });
      router.replace("/billing");
    }
  }, [isAuthenticated, plan, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (!plan) {
    return null;
  }

  const copy = planOrderCopy(plan, unitQty);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "14.4rem",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-auto">
        <div className="ml-[14.4rem] flex min-h-screen w-[calc(100%-14.4rem)] max-w-[min(100%,88rem)] flex-col gap-8 bg-background p-6 pt-8 md:p-10 md:pt-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Checkout</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Complete payment below. The full Dodo frame (including footer with terms) must stay
                visible for compliance.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/billing">Back to billing</Link>
            </Button>
          </div>

          {bootError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
              {bootError}
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
            <div className="relative min-h-[560px] w-full">
              {!bootError && frameLoading ? (
                <div
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/70"
                  aria-busy="true"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    <span className="text-sm">Loading checkout…</span>
                  </div>
                </div>
              ) : null}
              <div id={DODO_INLINE_CHECKOUT_ELEMENT_ID} className="min-h-[520px] w-full" />
            </div>
            <div className="space-y-4">
              <CheckoutOrderSummary title={copy.title} description={copy.description} breakdown={breakdown} />
              <p className="text-xs text-muted-foreground">
                Renewal and subscription details appear in checkout when applicable (e.g. recurring
                products).
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
