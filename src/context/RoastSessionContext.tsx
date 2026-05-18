"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { buildRoastTeaser } from "@/lib/roast-teaser";
import {
  persistRoastForClientNavigation,
  stripRoastApiBillingFields,
} from "@/lib/roast-storage";
import type { AuditReportPayload } from "@/lib/report-html";
import type { FreeReportPayload } from "@/types/free-report";
import { isPreviewRoastFree } from "@/lib/credits-config";
import { formatCreditsBalance } from "@/lib/credits-balance-display";
import { useAuth } from "@/context/AuthContext";
import { roastGenerationCreditCostClient } from "@/lib/roast-credit-cost-client";
import { InsufficientCreditsDialog } from "@/components/roast/insufficient-credits-dialog";
import { RoastGenerationOverlay } from "@/components/landing/roast-generation-overlay";
import { FreeScanGenerationOverlay } from "@/components/landing/free-scan-generation-overlay";
import { FREE_REPORT_SESSION_KEY } from "@/lib/free-report-storage-key";

export type RoastPhase = "idle" | "analyzing" | "teaser";

export type CreditGateState = {
  requiredCredits: number;
  balance?: number;
} | null;

function busyToast(kind: string) {
  toast.info(`Already running ${kind}. Wait for it to finish or dismiss the preview.`);
}

type RoastSessionContextValue = {
  roastPhase: RoastPhase;
  analysisComplete: boolean;
  loaderKey: number;
  teaserContent: ReturnType<typeof buildRoastTeaser> | null;
  accountCreditsLine: string | null;
  handleLoaderReveal: () => void;
  handleContinueToReport: () => void;
  startAuthenticatedRoast: (url: string) => Promise<void>;
  roastBusy: boolean;
  roastError: string | null;
  setRoastError: (v: string | null) => void;
  startFreeScan: (url: string, device?: "desktop" | "mobile") => Promise<FreeReportPayload>;
  freeScanBusy: boolean;
  freeScanError: string | null;
  setFreeScanError: (v: string | null) => void;
  workspaceBusy: boolean;
};

const RoastSessionContext = createContext<RoastSessionContextValue | null>(null);

export function useRoastSession(): RoastSessionContextValue {
  const ctx = useContext(RoastSessionContext);
  if (!ctx) {
    throw new Error("useRoastSession must be used within RoastSessionProvider");
  }
  return ctx;
}

export function RoastSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, firebaseUser, refreshProfile, updateCredits } = useAuth();

  const [device] = useState<"desktop" | "mobile">("desktop");
  const [roastPhase, setRoastPhase] = useState<RoastPhase>("idle");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [roastError, setRoastError] = useState<string | null>(null);
  const [roastData, setRoastData] = useState<Record<string, unknown> | null>(null);
  const [loaderKey, setLoaderKey] = useState(0);
  const [creditGate, setCreditGate] = useState<CreditGateState>(null);

  const activeAuditUrlRef = useRef("");

  const [freeScanAnalysisComplete, setFreeScanAnalysisComplete] = useState(false);
  const [freeScanLoaderKey, setFreeScanLoaderKey] = useState(0);
  const [freeScanActive, setFreeScanActive] = useState(false);
  const [freeScanError, setFreeScanError] = useState<string | null>(null);
  const pendingFreePayloadRef = useRef<FreeReportPayload | null>(null);
  const freeResolveRef = useRef<((d: FreeReportPayload) => void) | null>(null);
  const freeRejectRef = useRef<((e: Error) => void) | null>(null);

  const startAuthenticatedRoast = useCallback(
    async (urlParam: string) => {
      const url = urlParam.trim();
      setRoastError(null);

      if (freeScanActive) {
        busyToast("a free scan");
        return;
      }
      if (roastPhase !== "idle") {
        busyToast("an audit");
        return;
      }

      let nominalCost = roastGenerationCreditCostClient();
      const enforceCredits = nominalCost > 0 && !isPreviewRoastFree();

      try {
        const idToken = firebaseUser
          ? await firebaseUser.getIdToken().catch(() => null)
          : null;
        if (!idToken) {
          throw new Error("Sign in to run an audit.");
        }

        if (enforceCredits) {
          let credits = user?.credits ?? 0;
          let synced = Boolean(user?.firestoreSynced);
          if (!synced) {
            const r = await refreshProfile();
            synced = r.firestoreSynced;
            credits = r.credits;
          }
          if (!synced) {
            toast.error("Could not confirm your credit balance", {
              description: "Check your connection and try again.",
            });
            return;
          }
          if (credits < nominalCost) {
            setCreditGate({ requiredCredits: nominalCost, balance: credits });
            return;
          }
        }

        activeAuditUrlRef.current = url;
        setLoaderKey((k) => k + 1);
        setRoastPhase("analyzing");
        setAnalysisComplete(false);
        setRoastData(null);

        const response = await fetch("/api/roast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            device,
            idToken,
          }),
        });

        const data = (await response.json()) as Record<string, unknown>;

        nominalCost = roastGenerationCreditCostClient();
        const showCreditGateOn402 = nominalCost > 0 && !isPreviewRoastFree();

        if (!response.ok) {
          const errorMsg = (data.error as string) || "Failed to generate roast";
          const details = data.details ? `: ${String(data.details)}` : "";
          if (response.status === 402 && showCreditGateOn402) {
            setCreditGate({
              requiredCredits: nominalCost,
              balance: typeof user?.credits === "number" ? user.credits : undefined,
            });
          }
          if (response.status === 403) {
            toast.error("Account setup required", {
              description: String(data.details || errorMsg),
            });
          }
          if (response.status === 503) {
            toast.error("Could not verify credits", {
              description: String(data.details || errorMsg),
            });
          }
          if (response.status === 422) {
            toast.error("Audit stopped", {
              description: String(data.details || errorMsg),
            });
          }
          throw new Error(`${errorMsg}${details}`);
        }

        const creditsRemaining = data.creditsRemaining;
        const clean = stripRoastApiBillingFields(data);

        startTransition(() => {
          setRoastData(clean);
          if (typeof creditsRemaining === "number") {
            updateCredits(creditsRemaining, { fromServer: true });
          }
          setAnalysisComplete(true);
        });
      } catch (err) {
        startTransition(() => {
          setRoastError(err instanceof Error ? err.message : "An error occurred");
          setRoastPhase("idle");
          setAnalysisComplete(false);
        });
      }
    },
    [
      firebaseUser,
      device,
      updateCredits,
      user?.credits,
      user?.firestoreSynced,
      refreshProfile,
      freeScanActive,
      roastPhase,
    ],
  );

  const handleLoaderReveal = useCallback(() => {
    setRoastPhase("teaser");
  }, []);

  const handleContinueToReport = useCallback(() => {
    if (!roastData) return;
    const trimmed = activeAuditUrlRef.current.trim();
    const id = `${Date.now()}`;
    const payload: AuditReportPayload = {
      ...(stripRoastApiBillingFields(roastData as Record<string, unknown>) as AuditReportPayload),
      audited_url: trimmed || (roastData as AuditReportPayload).audited_url,
    };
    try {
      persistRoastForClientNavigation(id, payload);
      router.push(`/roast/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Storage full or unavailable.";
      toast.error("Could not open full report", {
        description: `${msg} Try disabling private mode or clear site data for this origin.`,
      });
    }
  }, [roastData, router]);

  const handleFreeScanReveal = useCallback(() => {
    const data = pendingFreePayloadRef.current;
    pendingFreePayloadRef.current = null;
    if (!data) {
      setFreeScanActive(false);
      setFreeScanAnalysisComplete(false);
      return;
    }
    try {
      sessionStorage.setItem(FREE_REPORT_SESSION_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
    if (pathname === "/free-report") {
      router.replace("/free-report", { scroll: false });
    } else {
      router.push("/free-report");
    }
    setFreeScanActive(false);
    setFreeScanAnalysisComplete(false);
    freeResolveRef.current?.(data);
    freeResolveRef.current = null;
    freeRejectRef.current = null;
  }, [pathname, router]);

  const startFreeScan = useCallback(
    async (urlParam: string, scanDevice: "desktop" | "mobile" = "desktop") => {
      if (roastPhase !== "idle") {
        busyToast("an audit");
        throw new Error("Busy");
      }
      if (freeScanActive) {
        busyToast("a free scan");
        throw new Error("Busy");
      }

      setFreeScanError(null);
      const token = firebaseUser ? await firebaseUser.getIdToken() : null;
      if (!token) {
        throw new Error("Sign in to run a free scan.");
      }

      return new Promise<FreeReportPayload>((resolve, reject) => {
        freeResolveRef.current = resolve;
        freeRejectRef.current = reject;
        pendingFreePayloadRef.current = null;
        setFreeScanLoaderKey((k) => k + 1);
        setFreeScanAnalysisComplete(false);
        setFreeScanActive(true);

        void (async () => {
          try {
            const res = await fetch("/api/free-report", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ url: urlParam.trim(), device: scanDevice }),
            });
            const data = (await res.json()) as FreeReportPayload & {
              error?: string;
              details?: string;
            };

            if (!res.ok) {
              const msg = (data.error as string) || "Request failed";
              const det = data.details ? `: ${String(data.details)}` : "";
              throw new Error(`${msg}${det}`);
            }

            if (data.kind !== "free_tools_v1") {
              throw new Error("Unexpected response from free report.");
            }

            pendingFreePayloadRef.current = data;
            startTransition(() => {
              setFreeScanAnalysisComplete(true);
            });
          } catch (e) {
            const err = e instanceof Error ? e : new Error("Something went wrong.");
            pendingFreePayloadRef.current = null;
            setFreeScanError(err.message);
            setFreeScanActive(false);
            setFreeScanAnalysisComplete(false);
            freeRejectRef.current?.(err);
            freeResolveRef.current = null;
            freeRejectRef.current = null;
          }
        })();
      });
    },
    [firebaseUser, freeScanActive, roastPhase],
  );

  const roastBusy = roastPhase !== "idle";

  useEffect(() => {
    if (roastPhase === "teaser" && user) {
      void refreshProfile();
    }
  }, [roastPhase, user, refreshProfile]);

  const teaserContent = useMemo(() => {
    if (!roastData) return null;
    const trimmed = activeAuditUrlRef.current.trim();
    const merged = {
      ...roastData,
      audited_url:
        (typeof roastData.audited_url === "string" && roastData.audited_url.trim()) ||
        trimmed ||
        roastData.audited_url,
    } as Record<string, unknown>;
    return buildRoastTeaser(merged);
  }, [roastData]);

  const accountCreditsLine =
    user && roastPhase === "teaser"
      ? isPreviewRoastFree()
        ? `This preview is free (0 credits). Your balance: ${formatCreditsBalance(user)} credits.`
        : `Credits remaining: ${formatCreditsBalance(user)}`
      : null;

  const workspaceBusy = roastBusy || freeScanActive;

  const creditTile =
    creditGate !== null
      ? createElement(InsufficientCreditsDialog, {
          open: true,
          requiredCredits: creditGate.requiredCredits,
          balance: creditGate.balance,
          onOpenChange: (open: boolean) => {
            if (!open) setCreditGate(null);
          },
        })
      : null;

  const value = useMemo<RoastSessionContextValue>(
    () => ({
      roastPhase,
      analysisComplete,
      loaderKey,
      teaserContent,
      accountCreditsLine,
      handleLoaderReveal,
      handleContinueToReport,
      startAuthenticatedRoast,
      roastBusy,
      roastError,
      setRoastError,
      startFreeScan,
      freeScanBusy: freeScanActive,
      freeScanError,
      setFreeScanError,
      workspaceBusy,
    }),
    [
      roastPhase,
      analysisComplete,
      loaderKey,
      teaserContent,
      accountCreditsLine,
      handleLoaderReveal,
      handleContinueToReport,
      startAuthenticatedRoast,
      roastBusy,
      roastError,
      startFreeScan,
      freeScanActive,
      freeScanError,
      workspaceBusy,
    ],
  );

  return (
    <RoastSessionContext.Provider value={value}>
      {children}
      {creditTile}
      <RoastGenerationOverlay
        phase={roastPhase}
        analysisComplete={analysisComplete}
        loaderKey={loaderKey}
        teaserContent={teaserContent}
        accountCreditsLine={accountCreditsLine}
        onReveal={handleLoaderReveal}
        onContinueToReport={handleContinueToReport}
      />
      {freeScanActive ? (
        <FreeScanGenerationOverlay
          loaderKey={freeScanLoaderKey}
          analysisComplete={freeScanAnalysisComplete}
          onReveal={handleFreeScanReveal}
        />
      ) : null}
    </RoastSessionContext.Provider>
  );
}
