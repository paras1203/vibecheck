"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  listRoastHistory,
  removeRoastHistoryEntry,
  type RoastHistoryEntry,
} from "@/lib/roast-history";
import {
  formatReportDisplayName,
  reportTimestampFromRoastId,
} from "@/lib/report-display-name";
import { generateAuditReportHTML, type AuditReportPayload } from "@/lib/report-html";
import {
  DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD,
  DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS,
} from "@/lib/insight-layers";
import type { User } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCloudRoastHistory,
  mergeRoastHistoryEntries,
} from "@/lib/roast-cloud-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link2, MoreVertical } from "lucide-react";

type Props = {
  user: User | null;
  isAdmin: boolean;
};

function calculatorForStoredPayload(data: AuditReportPayload) {
  const pg = Number(data.price_guess);
  const priceFromDom =
    Boolean((data as { price_from_page?: boolean }).price_from_page) &&
    Number.isFinite(pg) &&
    pg > 0;
  const price = priceFromDom ? pg : DEFAULT_ILLUSTRATIVE_DEAL_VALUE_USD;
  const industry = data.industry_guess || "SaaS";
  const traffic =
    data.trafficEstimate?.monthlySessions ?? DEFAULT_ILLUSTRATIVE_MONTHLY_SESSIONS;
  return { traffic, price, industry };
}

export function RecentReportsSection({ user, isAdmin }: Props) {
  const { firebaseUser } = useAuth();
  const [tick, setTick] = useState(0);
  const [entries, setEntries] = useState<RoastHistoryEntry[]>(() =>
    listRoastHistory(user?.uid).slice(0, 10),
  );

  const isPaid = Boolean(user && (user.plan === "pro" || user.plan === "agency"));

  useEffect(() => {
    const local = listRoastHistory(user?.uid);
    const localCapped = local.slice(0, 10);
    if (!firebaseUser || !(isPaid || isAdmin)) {
      setEntries(localCapped);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const tok = await firebaseUser.getIdToken();
        const cloudRes = await fetchCloudRoastHistory(tok);
        if (cancelled) return;
        for (const id of cloudRes.purgedClientRoastIds ?? []) {
          removeRoastHistoryEntry(user?.uid, id);
        }
        const localMerged = listRoastHistory(user?.uid);
        setEntries(
          mergeRoastHistoryEntries(localMerged, cloudRes.entries ?? []),
        );
      } catch {
        if (!cancelled) setEntries(local.slice(0, 10));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, firebaseUser, isPaid, isAdmin, tick]);

  const resolvePayload = useCallback(
    async (id: string): Promise<AuditReportPayload | null> => {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(`roast_${id}`);
      if (raw) {
        try {
          return JSON.parse(raw) as AuditReportPayload;
        } catch {
          /* fall through */
        }
      }
      if (user && (isPaid || isAdmin) && firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch(
            `/api/user/roast-cloud-payload?clientRoastId=${encodeURIComponent(id)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (res.ok) {
            const data = (await res.json()) as { payload?: unknown };
            if (data.payload && typeof data.payload === "object") {
              return data.payload as AuditReportPayload;
            }
          }
        } catch {
          return null;
        }
      }
      return null;
    },
    [user, isPaid, isAdmin, firebaseUser],
  );

  const displayNameForEntry = (entry: RoastHistoryEntry) => {
    const ts = reportTimestampFromRoastId(entry.id, entry.savedAt);
    return formatReportDisplayName(entry.auditedUrl, ts);
  };

  const fileBaseForExport = (entry: RoastHistoryEntry, payload: AuditReportPayload | null) => {
    const ts = reportTimestampFromRoastId(entry.id, entry.savedAt);
    const url =
      entry.auditedUrl ||
      (payload && typeof payload === "object" && "audited_url" in payload
        ? payload.audited_url
        : undefined);
    return formatReportDisplayName(url, ts);
  };

  const copyReportLink = async (entry: RoastHistoryEntry) => {
    const path = `/roast/${entry.id}`;
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Report link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const downloadHtml = async (entry: RoastHistoryEntry) => {
    const data = await resolvePayload(entry.id);
    if (!data) {
      toast.error("Report data not found on this device or in your cloud backup.");
      return;
    }
    const html = generateAuditReportHTML(data, {
      reportId: entry.id,
      isPaid: isPaid || isAdmin,
      calculator: calculatorForStoredPayload(data),
    });
    const base = fileBaseForExport(entry, data);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${base}.html`;
    a.click();
    URL.revokeObjectURL(href);
    toast.success("HTML downloaded");
  };

  const downloadPdf = async (entry: RoastHistoryEntry) => {
    const data = await resolvePayload(entry.id);
    if (!data) {
      toast.error("Report data not found on this device or in your cloud backup.");
      return;
    }
    const base = fileBaseForExport(entry, data);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roastData: data,
          isPaid: isPaid || isAdmin,
          url: typeof window !== "undefined" ? window.location.origin : "",
          calculator: calculatorForStoredPayload(data),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.details || "PDF failed");
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${base}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF download failed");
    }
  };

  const deleteEntry = (entry: RoastHistoryEntry) => {
    if (!confirm("Remove this report from this device? This cannot be undone.")) return;
    removeRoastHistoryEntry(user?.uid, entry.id);
    setTick((t) => t + 1);
    toast.success("Report removed");
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Recent reports</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => setTick((t) => t + 1)}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {isPaid || isAdmin
            ? "Saved on this device; Pro/Agency and admin reports also sync to your account for recovery."
            : "Saved on this device. Exports use your current plan. Open a report for the live dashboard."}
        </p>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reports yet. Run a roast from the home page — we&apos;ll list it here automatically.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {displayNameForEntry(e)}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">#{e.id}</span>
                    {typeof e.overallScore === "number" && (
                      <span className="inline-flex items-center rounded-md border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono text-sm font-semibold tabular-nums text-primary">
                        Score {e.overallScore}
                      </span>
                    )}
                  </div>
                  {e.auditedUrl ? (
                    <p
                      className={
                        isAdmin
                          ? "break-all font-mono text-xs text-muted-foreground"
                          : "truncate text-xs text-muted-foreground"
                      }
                    >
                      {e.auditedUrl}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.savedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="default">
                    <Link href={`/roast/${e.id}`}>Open report</Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => void copyReportLink(e)}
                  >
                    <Link2 className="size-3.5 stroke-[1.5]" />
                    Copy link
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon" variant="outline" aria-label="Report actions">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => void downloadHtml(e)}>Download HTML</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void downloadPdf(e)}>Download PDF</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteEntry(e)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
