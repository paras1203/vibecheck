"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  SESSION_FULL_REPORT_KEY,
  skipPaymentUnlockEnabled,
} from "@/lib/billing-flags";

export function useBillingBypassUnlock() {
  const bypass = skipPaymentUnlockEnabled();
  const [sessionUnlocked, setSessionUnlocked] = useState(false);

  useEffect(() => {
    if (!bypass || typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_FULL_REPORT_KEY) === "1") {
        setSessionUnlocked(true);
      }
    } catch {
      /* ignore */
    }
  }, [bypass]);

  const unlockFullReport = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_FULL_REPORT_KEY, "1");
    } catch {
      /* ignore */
    }
    setSessionUnlocked(true);
    toast.success("Full report unlocked", {
      description: "Payment flow is off until billing is live.",
    });
  }, []);

  return { bypassPaymentUnlock: bypass, sessionUnlocked, unlockFullReport };
}
