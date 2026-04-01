"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { User } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

type Props = {
  user: User | null;
  isAdmin: boolean;
};

export function RecentReportsSection({ user, isAdmin }: Props) {
  const [tick, setTick] = useState(0);
  const entries = useMemo(() => {
    void tick;
    return listRoastHistory(user?.uid);
  }, [user?.uid, tick]);

  const isPaid = Boolean(user && (user.plan === "pro" || user.plan === "agency"));

  const loadRoastPayload = useCallback((id: string): AuditReportPayload | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(`roast_${id}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuditReportPayload;
    } catch {
      return null;
    }
  }, []);

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

  const downloadHtml = (entry: RoastHistoryEntry) => {
    const data = loadRoastPayload(entry.id);
    if (!data) {
      toast.error("Saved report data not found on this device.");
      return;
    }
    const html = generateAuditReportHTML(data, {
      reportId: entry.id,
      isPaid,
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
    const data = loadRoastPayload(entry.id);
    if (!data) {
      toast.error("Saved report data not found on this device.");
      return;
    }
    const base = fileBaseForExport(entry, data);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roastData: data,
          isPaid,
          url: typeof window !== "undefined" ? window.location.origin : "",
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
          Saved on this device. Exports use your current plan. Open a report for the live dashboard.
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
                      <Badge variant="secondary">Score {e.overallScore}</Badge>
                    )}
                    {e.planAtSave && (
                      <Badge variant="outline">Saved as {e.planAtSave}</Badge>
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
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild size="sm" variant="default">
                    <Link href={`/roast/${e.id}`}>Open report</Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon" variant="outline" aria-label="Report actions">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => downloadHtml(e)}>Download HTML</DropdownMenuItem>
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
