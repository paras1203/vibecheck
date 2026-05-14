"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { FreeReportPayload } from "@/types/free-report";

export function useFreeReportFlow() {
  const { firebaseUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runFreeReport = useCallback(
    async (url: string, device: "desktop" | "mobile" = "desktop") => {
      setBusy(true);
      setError(null);
      try {
        const token = firebaseUser ? await firebaseUser.getIdToken() : null;
        if (!token) {
          throw new Error("Sign in to run a free scan.");
        }
        const res = await fetch("/api/free-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: url.trim(), device }),
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

        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong.";
        setError(msg);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [firebaseUser]
  );

  return { runFreeReport, busy, error, setError };
}
