"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useFreeReportFlow } from "@/hooks/use-free-report-flow";
import { FreeReportResults } from "@/components/free-report/free-report-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { FreeReportPayload } from "@/types/free-report";
import { ClipboardList, Loader2 } from "lucide-react";
import { FREE_REPORT_SESSION_KEY } from "@/lib/free-report-storage-key";

const STORAGE_KEY = FREE_REPORT_SESSION_KEY;

function parseStored(raw: string | null): FreeReportPayload | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as FreeReportPayload;
    if (data.kind === "free_tools_v1" && typeof data.audited_url === "string") return data;
  } catch {
    /* ignore */
  }
  return null;
}

function FreeReportPageContent() {
  const ok = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [payload, setPayload] = useState<FreeReportPayload | null>(null);
  const { runFreeReport, busy } = useFreeReportFlow();

  useEffect(() => {
    const stored = parseStored(
      typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null
    );
    if (stored) setPayload(stored);
  }, []);

  useEffect(() => {
    const pre = searchParams.get("prefill")?.trim();
    if (pre) setUrl((u) => u || pre);
  }, [searchParams]);

  const run = useCallback(async () => {
    if (!url.trim()) {
      toast.error("Enter a URL to scan.");
      return;
    }
    try {
      const data = await runFreeReport(url.trim(), "desktop");
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setPayload(data);
      router.replace("/free-report", { scroll: false });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Free scan failed.");
    }
  }, [url, runFreeReport, router]);

  if (!ok) return null;

  return (
    <AuthenticatedShell title="Free conversion scan">
      <div className="space-y-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="size-5 text-primary" />
              Programmatic scan (no credits, no AI)
            </CardTitle>
            <CardDescription>
              Captures your first screen and runs SEO, PageSpeed (when configured), meta, and trust
              checks. Use it to see gaps—then run a full roast for narrative and prioritization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <Input
                type="text"
                placeholder="https://yoursite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !busy) void run();
                }}
                disabled={busy}
                className="h-12 flex-1 text-base sm:h-11"
              />
              <Button
                type="button"
                size="lg"
                className="h-12 shrink-0 gap-2 font-semibold sm:h-11"
                onClick={() => void run()}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Scanning…
                  </>
                ) : (
                  "Run free scan"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Prefer the full audit?{" "}
              <Link href="/home" className="font-medium text-primary underline-offset-4 hover:underline">
                Home workspace
              </Link>
            </p>
          </CardContent>
        </Card>

        {payload ? <FreeReportResults data={payload} /> : null}
      </div>
    </AuthenticatedShell>
  );
}

export default function FreeReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading…
        </div>
      }
    >
      <FreeReportPageContent />
    </Suspense>
  );
}
