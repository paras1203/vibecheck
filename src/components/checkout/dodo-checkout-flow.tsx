"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signInAnonymously } from "firebase/auth";
import { DodoPayments, type CheckoutEvent } from "dodopayments-checkout";
import { Button } from "@/components/ui/button";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { GuestCheckoutIdentityForm } from "@/components/checkout/guest-checkout-identity-form";
import { fetchDodoCheckoutSessionUrl } from "@/components/dodo-open-checkout";
import { useAuth } from "@/context/AuthContext";
import {
  PLAN_PURCHASE_CREDITS_PER_UNIT,
  creditsForPurchase,
  normalizeCheckoutQty,
  type BillingCheckoutPlanId,
} from "@/lib/billing-plans";
import { getFirebaseAuth } from "@/lib/firebase";
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
  const { firebaseUser, user, loading, authResolved, isSyncing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [sessionLoading, setSessionLoading] = useState(true);
  const [anonBootError, setAnonBootError] = useState<string | null>(null);

  const handleEvent = useCallback((event: CheckoutEvent) => {
    switch (event.event_type) {
      case "checkout.breakdown": {
        const message = event.data?.message as BreakdownMoney | undefined;
        if (message) setBreakdown(message);
        break;
      }
      case "checkout.opened":
        setSessionLoading(false);
        break;
      case "checkout.closed":
        setSessionLoading(false);
        break;
      case "checkout.form_ready":
      case "checkout.payment_page_opened":
        setSessionLoading(false);
        break;
      case "checkout.error": {
        const msg = event.data?.message;
        toast.error(typeof msg === "string" ? msg : "Checkout error");
        break;
      }
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (!authResolved || loading || firebaseUser) return;
    let cancelled = false;
    void signInAnonymously(getFirebaseAuth())
      .then(() => {
        if (!cancelled) setAnonBootError(null);
      })
      .catch((e) => {
        if (!cancelled) {
          setAnonBootError(e instanceof Error ? e.message : "Could not start guest session");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authResolved, loading, firebaseUser]);

  const identityReadyForCheckout =
    Boolean(firebaseUser) &&
    (!firebaseUser?.isAnonymous || Boolean(user?.guestCheckoutEmail?.trim()));

  useEffect(() => {
    if (!firebaseUser || !plan || !identityReadyForCheckout || isSyncing || !authResolved) return;

    let cancelled = false;

    void (async () => {
      setBootError(null);
      setSessionLoading(true);
      try {
        const token = await firebaseUser.getIdToken(true);
        const { checkoutUrl, sdkMode } = await fetchDodoCheckoutSessionUrl(
          plan,
          token,
          plan === "free_test" ? undefined : unitQty
        );
        if (cancelled) return;

        // #region agent log
        let checkoutHost = "";
        try {
          checkoutHost = new URL(checkoutUrl).hostname;
        } catch {
          checkoutHost = "parse_fail";
        }
        fetch("http://127.0.0.1:7848/ingest/82f5425f-b2b1-4559-a030-418ece2f80c9", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "b9a3d6" },
          body: JSON.stringify({
            sessionId: "b9a3d6",
            runId: "overlay-checkout",
            hypothesisId: "H2",
            location: "dodo-checkout-flow.tsx:open-overlay",
            message: "checkout session ok, opening overlay",
            data: { checkoutHost, sdkMode, plan },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

        DodoPayments.Initialize({
          mode: sdkMode,
          displayType: "overlay",
          onEvent: handleEvent,
        });

        DodoPayments.Checkout.open({ checkoutUrl });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Could not open checkout";
        setBootError(msg);
        setSessionLoading(false);
        toast.error("Checkout failed", { description: msg });
      }
    })();

    return () => {
      cancelled = true;
      DodoPayments.Checkout.close();
    };
  }, [
    authResolved,
    firebaseUser,
    handleEvent,
    identityReadyForCheckout,
    isSyncing,
    plan,
    unitQty,
  ]);

  useEffect(() => {
    if (!firebaseUser || loading || !authResolved) return;
    if (!plan) {
      toast.error("Invalid plan", { description: "Choose a plan from Billing." });
      router.replace("/billing");
    }
  }, [authResolved, firebaseUser, loading, plan, router]);

  if (!authResolved || loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">Signing you in…</span>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-center">
        {anonBootError ? (
          <p className="text-sm text-destructive">{anonBootError}</p>
        ) : (
          <>
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Preparing checkout…</span>
          </>
        )}
      </div>
    );
  }

  if (!plan) return null;

  const copy = planOrderCopy(plan, unitQty);
  const guestNeedsForm = firebaseUser.isAnonymous && !user?.guestCheckoutEmail?.trim();

  return (
    <AuthenticatedShell constrainContentWidth>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Checkout</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            A secure Dodo Payments window opens on top of this page. Complete payment there, then
            return here if the window does not redirect automatically.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/billing">Back to billing</Link>
        </Button>
      </div>

      {guestNeedsForm ? (
        <div className="mx-auto mb-10 max-w-md">
          <GuestCheckoutIdentityForm />
        </div>
      ) : null}

      {bootError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
          {bootError}
        </div>
      ) : null}

      {!guestNeedsForm ? (
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
          <div className="flex min-h-[280px] w-full flex-col justify-center rounded-lg border border-border bg-muted/20 p-8">
            {!bootError && sessionLoading ? (
              <div className="flex flex-col items-center gap-3 text-center text-muted-foreground" aria-busy="true">
                <Loader2 className="size-8 animate-spin" />
                <p className="text-sm">Starting secure checkout…</p>
              </div>
            ) : !bootError ? (
              <p className="text-center text-sm text-muted-foreground">
                If you closed the payment window, go back to Billing or refresh this page to try
                again.
              </p>
            ) : null}
          </div>
          <div className="space-y-4">
            <CheckoutOrderSummary title={copy.title} description={copy.description} breakdown={breakdown} />
            <p className="text-xs text-muted-foreground">
              Renewal and subscription details appear in checkout when applicable.
            </p>
          </div>
        </div>
      ) : null}
    </AuthenticatedShell>
  );
}
