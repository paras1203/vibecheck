"use client";

import { useCallback } from "react";
import { useRoastSession } from "@/context/RoastSessionContext";

export function useFreeReportFlow() {
  const { startFreeScan, freeScanBusy, freeScanError, setFreeScanError } = useRoastSession();

  const runFreeReport = useCallback(
    async (url: string, device: "desktop" | "mobile" = "desktop") => startFreeScan(url, device),
    [startFreeScan],
  );

  return {
    runFreeReport,
    busy: freeScanBusy,
    error: freeScanError,
    setError: setFreeScanError,
  };
}
