"use client";

import { useCallback } from "react";
import { useRoastSession } from "@/context/RoastSessionContext";

export function useAuthenticatedRoastFlow(auditUrl: string) {
  const {
    roastPhase,
    analysisComplete,
    loaderKey,
    teaserContent,
    accountCreditsLine,
    handleLoaderReveal,
    handleContinueToReport,
    startAuthenticatedRoast: ctxStart,
    roastBusy,
    roastError,
    setRoastError,
  } = useRoastSession();

  const startAuthenticatedRoast = useCallback(async () => {
    await ctxStart(auditUrl);
  }, [ctxStart, auditUrl]);

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
    error: roastError,
    setError: setRoastError,
  };
}
