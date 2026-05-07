"use client";

import React, { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listRoastHistory } from "@/lib/roast-history";
import { formatReportDisplayName, reportTimestampFromRoastId } from "@/lib/report-display-name";
import { buildRoastTeaser } from "@/lib/roast-teaser";
import { RoastGenerationOverlay } from "@/components/landing/roast-generation-overlay";
import { persistRoastForClientNavigation, stripRoastApiBillingFields } from "@/lib/roast-storage";
import type { AuditReportPayload } from "@/lib/report-html";
import { isPreviewRoastFree } from "@/lib/credits-config";
import { formatCreditsBalance } from "@/lib/credits-balance-display";
import { ChevronRight } from "lucide-react";

type RoastPhase = "idle" | "analyzing" | "teaser";

export default function HomeWorkspacePage() {
  const ok = useRequireAuth();
  const router = useRouter();
  const { user, firebaseUser, refreshProfile, updateCredits } = useAuth();
  const [url, setUrl] = useState("");
  const [device] = useState<"desktop" | "mobile">("desktop");
  const [roastPhase, setRoastPhase] = useState<RoastPhase>("idle");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roastData, setRoastData] = useState<Record<string, unknown> | null>(null);
  const [loaderKey, setLoaderKey] = useState(0);

  const history = useMemo(() => listRoastHistory(user?.uid), [user?.uid]);
  const recentThree = useMemo(() => history.slice(0, 3), [history]);

  const teaserContent = useMemo(() => {
    if (!roastData) return null;
    const merged = {
      ...roastData,
      audited_url:
        (typeof roastData.audited_url === "string" && roastData.audited_url.trim()) ||
        url.trim() ||
        roastData.audited_url,
    } as Record<string, unknown>;
    return buildRoastTeaser(merged);
  }, [roastData, url]);

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

  const handleRoast = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }
    setLoaderKey((k) => k + 1);
    setRoastPhase("analyzing");
    setAnalysisComplete(false);
    setError(null);
    setRoastData(null);
    try {
      const idToken = firebaseUser
        ? await firebaseUser.getIdToken().catch(() => null)
        : null;
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          device,
          ...(idToken ? { idToken } : {}),
        }),
      });
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        const errorMsg = (data.error as string) || "Failed to generate roast";
        const details = data.details ? `: ${String(data.details)}` : "";
        if (response.status === 402) {
          toast.error("Not enough credits", { description: String(data.details || errorMsg) });
        }
        if (response.status === 403) {
          toast.error("Account setup required", { description: String(data.details || errorMsg) });
        }
        if (response.status === 503) {
          toast.error("Could not verify credits", { description: String(data.details || errorMsg) });
        }
        throw new Error(`${errorMsg}${details}`);
      }
      const creditsRemaining = data.creditsRemaining;
      const clean = stripRoastApiBillingFields(data);
      startTransition(() => {
        setRoastData(clean);
        if (typeof creditsRemaining === "number") {
          updateCredits(creditsRemaining);
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
  };

  const handleLoaderReveal = useCallback(() => {
    setRoastPhase("teaser");
  }, []);

  const handleContinueToReport = useCallback(() => {
    if (!roastData) return;
    const id = `${Date.now()}`;
    const payload: AuditReportPayload = {
      ...(stripRoastApiBillingFields(roastData as Record<string, unknown>) as AuditReportPayload),
      audited_url: url.trim() || (roastData as AuditReportPayload).audited_url,
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
  }, [roastData, url, router]);

  if (!ok) return null;

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "14.4rem" } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-auto">
        <div className="ml-[14.4rem] flex min-h-screen flex-col gap-8 bg-background p-6 pt-8 md:p-10 md:pt-10">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Home</h1>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Roast my site</CardTitle>
              <CardDescription>Paste a URL and we&apos;ll generate a conversion-focused audit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <Input
                  type="text"
                  placeholder="https://yoursite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && roastPhase === "idle") void handleRoast();
                  }}
                  disabled={roastPhase !== "idle"}
                  className="h-12 flex-1 text-base sm:h-11"
                />
                <Button
                  type="button"
                  size="lg"
                  className="h-12 shrink-0 px-8 font-semibold sm:h-11"
                  onClick={() => void handleRoast()}
                  disabled={roastPhase !== "idle"}
                >
                  {roastPhase !== "idle" ? "Working…" : "Roast my site"}
                </Button>
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
        </div>
      </SidebarInset>

      <RoastGenerationOverlay
        phase={roastPhase}
        analysisComplete={analysisComplete}
        loaderKey={loaderKey}
        teaserContent={teaserContent}
        accountCreditsLine={accountCreditsLine}
        onReveal={handleLoaderReveal}
        onContinueToReport={handleContinueToReport}
      />
    </SidebarProvider>
  );
}
