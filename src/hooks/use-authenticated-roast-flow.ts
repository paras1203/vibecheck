"use client";

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  startTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buildRoastTeaser } from "@/lib/roast-teaser";
import {
  persistRoastForClientNavigation,
  stripRoastApiBillingFields,
} from "@/lib/roast-storage";
import type { AuditReportPayload } from "@/lib/report-html";
import { isPreviewRoastFree } from "@/lib/credits-config";
import { formatCreditsBalance } from "@/lib/credits-balance-display";
import { useAuth } from "@/context/AuthContext";

export type RoastPhase = "idle" | "analyzing" | "teaser";

export function useAuthenticatedRoastFlow(auditUrl: string) {
  const router = useRouter();
  const urlRef = useRef(auditUrl);
  urlRef.current = auditUrl;
  const { user, firebaseUser, refreshProfile, updateCredits } = useAuth();
  const [device] = useState<"desktop" | "mobile">("desktop");
  const [roastPhase, setRoastPhase] = useState<RoastPhase>("idle");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roastData, setRoastData] = useState<Record<string, unknown> | null>(null);
  const [loaderKey, setLoaderKey] = useState(0);

  const startAuthenticatedRoast = useCallback(async () => {
    const url = urlRef.current;
    setLoaderKey((k) => k + 1);
    setRoastPhase("analyzing");
    setAnalysisComplete(false);
    setError(null);
    setRoastData(null);

    try {
      const idToken = firebaseUser
        ? await firebaseUser.getIdToken().catch(() => null)
        : null;
      if (!idToken) {
        throw new Error("Sign in to run an audit.");
      }
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

      if (!response.ok) {
        const errorMsg = (data.error as string) || "Failed to generate roast";
        const details = data.details ? `: ${String(data.details)}` : "";
        if (response.status === 402) {
          toast.error("Not enough credits", {
            description: String(data.details || errorMsg),
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
        setError(err instanceof Error ? err.message : "An error occurred");
        setRoastPhase("idle");
        setAnalysisComplete(false);
      });
    }
  }, [firebaseUser, device, updateCredits]);

  const handleLoaderReveal = useCallback(() => {
    setRoastPhase("teaser");
  }, []);

  const handleContinueToReport = useCallback(() => {
    if (!roastData) return;
    const trimmed = urlRef.current.trim();
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

  const roastBusy = roastPhase !== "idle";

  const teaserContent = useMemo(() => {
    if (!roastData) return null;
    const trimmed = urlRef.current.trim();
    const merged = {
      ...roastData,
      audited_url:
        (typeof roastData.audited_url === "string" && roastData.audited_url.trim()) ||
        trimmed ||
        roastData.audited_url,
    } as Record<string, unknown>;
    return buildRoastTeaser(merged);
  }, [roastData]);

  useEffect(() => {
    if (roastPhase === "teaser" && user) {
      void refreshProfile();
    }
  }, [roastPhase, user, refreshProfile]);

  const accountCreditsLine =
    user && roastPhase === "teaser"
      ? isPreviewRoastFree()
        ? `This preview is free (0 credits). Your balance: ${formatCreditsBalance(user)} credits.`
        : `Credits remaining: ${formatCreditsBalance(user)}`
      : null;

  return {
    roastPhase,
    analysisComplete,
    loaderKey,
    teaserContent,
    accountCreditsLine,
    handleLoaderReveal,
    handleContinueToReport,
    startAuthenticatedRoast,
    roastBusy,
    error,
    setError,
  };
}
