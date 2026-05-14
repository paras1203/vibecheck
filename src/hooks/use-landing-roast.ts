"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticatedRoastFlow, type RoastPhase } from "@/hooks/use-authenticated-roast-flow";
import { useAuth } from "@/context/AuthContext";
import { stashPendingAuditUrl } from "@/lib/pending-audit-url";

export type { RoastPhase };

export function useLandingRoast() {
  const router = useRouter();
  const { user, firebaseUser } = useAuth();
  const [url, setUrl] = useState("");

  const {
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
  } = useAuthenticatedRoastFlow(url);

  const handleRoast = useCallback(async () => {
    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    if (!firebaseUser) {
      setError(null);
      stashPendingAuditUrl(url);
      router.push("/login?next=/onboarding");
      return;
    }

    if (user?.firestoreSynced && !user.onboardingCompleted) {
      setError(null);
      stashPendingAuditUrl(url);
      router.push("/onboarding");
      return;
    }

    setError(null);
    await startAuthenticatedRoast();
  }, [url, firebaseUser, user, router, setError, startAuthenticatedRoast]);

  const roastForm = useMemo(
    () => ({
      url,
      setUrl,
      loading: roastBusy,
      error,
      onRoast: handleRoast,
    }),
    [url, roastBusy, error, handleRoast],
  );

  return {
    user,
    url,
    setUrl,
    roastPhase,
    analysisComplete,
    loaderKey,
    teaserContent,
    accountCreditsLine,
    handleLoaderReveal,
    handleContinueToReport,
    roastForm,
    roastBusy,
    handleRoast,
  };
}
