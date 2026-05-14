"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listRoastHistory } from "@/lib/roast-history";
import { formatReportDisplayName, reportTimestampFromRoastId } from "@/lib/report-display-name";
import { RoastGenerationOverlay } from "@/components/landing/roast-generation-overlay";
import { ChevronRight } from "lucide-react";
import { useAuthenticatedRoastFlow } from "@/hooks/use-authenticated-roast-flow";
import { PendingHomeMessageBanner } from "@/components/dashboard/pending-home-message-banner";
import { useClaimPromoOnMount } from "@/hooks/use-claim-promo-on-mount";
import { toast } from "sonner";
import { useFreeReportFlow } from "@/hooks/use-free-report-flow";
import { FREE_REPORT_SESSION_KEY } from "@/lib/free-report-storage-key";

export default function HomeWorkspacePage() {
  const ok = useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  useClaimPromoOnMount();
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

  const { runFreeReport, busy: freeReportBusy } = useFreeReportFlow();

  useEffect(() => {
    if (!ok || !user?.firestoreSynced || user.onboardingCompleted) return;
    router.replace("/onboarding");
  }, [ok, user, router]);

  const history = useMemo(() => listRoastHistory(user?.uid), [user?.uid]);
  const recentThree = useMemo(() => history.slice(0, 3), [history]);

  const handleRoast = useCallback(async () => {
    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }
    setError(null);
    await startAuthenticatedRoast();
  }, [url, setError, startAuthenticatedRoast]);

  const handleFreeScan = useCallback(async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL.");
      return;
    }
    try {
      const data = await runFreeReport(url.trim(), "desktop");
      sessionStorage.setItem(FREE_REPORT_SESSION_KEY, JSON.stringify(data));
      router.push("/free-report");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Free scan failed.");
    }
  }, [url, runFreeReport, router]);

  const workspaceBusy = roastPhase !== "idle" || freeReportBusy;

  if (!ok) return null;

  return (
    <>
      <AuthenticatedShell title="Home">
        <PendingHomeMessageBanner />

        <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Roast my site</CardTitle>
              <CardDescription>Paste a URL and we&apos;ll generate a conversion-focused audit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  placeholder="https://yoursite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && roastPhase === "idle" && !freeReportBusy) void handleRoast();
                  }}
                  disabled={workspaceBusy}
                  className="h-12 w-full text-base sm:h-11"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <Button
                    type="button"
                    size="lg"
                    className="h-12 flex-1 px-6 font-semibold sm:h-11"
                    onClick={() => void handleRoast()}
                    disabled={workspaceBusy}
                  >
                    {roastPhase !== "idle" ? "Working…" : "Roast my site"}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="h-12 flex-1 px-6 font-semibold sm:h-11"
                    onClick={() => void handleFreeScan()}
                    disabled={workspaceBusy}
                  >
                    {freeReportBusy ? "Scanning…" : "Free conversion scan"}
                  </Button>
                </div>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </CardContent>
          </Card>

          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">Recent reports</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" asChild>
                <Link href="/dashboard">
                  Dashboard for full list
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
            {recentThree.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No saved reports on this device yet. Run a roast above to create your first one.
                </CardContent>
              </Card>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentThree.map((entry) => {
                  const ts = reportTimestampFromRoastId(entry.id, entry.savedAt);
                  const label = formatReportDisplayName(entry.auditedUrl, ts);
                  return (
                    <li key={entry.id}>
                      <Link
                        href={`/roast/${entry.id}`}
                        className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                      >
                        <span className="truncate font-medium text-foreground">{label}</span>
                        {typeof entry.overallScore === "number" ? (
                          <span className="ml-3 shrink-0 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-sm font-semibold tabular-nums text-primary">
                            {entry.overallScore}/100
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
      </AuthenticatedShell>

      <RoastGenerationOverlay
        phase={roastPhase}
        analysisComplete={analysisComplete}
        loaderKey={loaderKey}
        teaserContent={teaserContent}
        accountCreditsLine={accountCreditsLine}
        onReveal={handleLoaderReveal}
        onContinueToReport={handleContinueToReport}
      />
    </>
  );
}
