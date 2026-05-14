"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { AdminAnalyticsExtended } from "@/components/admin/admin-analytics-extended";
import { AdminMasterControls } from "@/components/admin/admin-master-controls";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "120d", label: "120d" },
  { key: "365d", label: "1 year" },
] as const;

type AnalyticsPayload = {
  range: string;
  audits: {
    count: number;
    uniqueUsersWithAudit: number;
    distinctAuditedUrls: number;
    auditsByHourUtc: { hour: number; audits: number; distinctUsers: number }[];
    avgPromptTokensPerAudit: number;
    avgCandidatesTokensPerAudit: number;
    avgTotalTokensPerAudit: number;
    avgEstimatedCostUsdPerAudit: number;
    sumEstimatedCostUsd: number;
    avgOverallScore: number;
    deviceSplit: { mobile: number; desktop: number };
    auditsByDay: { date: string; count: number }[];
    topIndustries: { label: string; count: number }[];
  };
  failures: {
    count: number;
    failuresByDay: { date: string; count: number }[];
  };
  users: {
    totalProfilesCounted: number;
    planSampleSize: number;
    planCountsSample: { free: number; pro: number; agency: number; other: number };
    registrationsInRange: number;
    registrationsByDay: { date: string; count: number }[];
  };
  payments: {
    paidOrdersInRange: number;
    totalCreditsSoldInRange: number;
    revenueNote: string;
  };
  promo: { remainingSlots: number | null };
  geo: { regionNote: string };
  llm: {
    provider: string;
    llm1: { label: string; primary: string; fallback: string };
    llm2: { label: string; primary: string; fallback: string };
  };
  pricingNote: string;
};

function fmtUsd(n: number) {
  if (!Number.isFinite(n) || n === 0) return "$0.0000";
  if (n < 0.0001) return `<$0.0001`;
  return `$${n.toFixed(4)}`;
}

export function AdminAnalyticsDashboard() {
  const { firebaseUser } = useAuth();
  const [range, setRange] = useState<string>("30d");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setErr(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/admin/analytics?range=${encodeURIComponent(range)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = (await res.json().catch(() => ({}))) as AnalyticsPayload & { error?: string };
      if (!res.ok) throw new Error(j.error || "Failed to load analytics");
      setData(j as AnalyticsPayload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, range]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!firebaseUser) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.key}
            type="button"
            size="sm"
            variant={range === r.key ? "default" : "outline"}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={loading}
          onClick={() => void load()}
          className="gap-1"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      <AdminMasterControls analyticsRange={range} />

      {err ? (
        <p className="text-sm text-destructive">{err}</p>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Audits ({data.range})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{data.audits.count}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.audits.uniqueUsersWithAudit} distinct users (logged-in)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg tokens / audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {data.audits.avgTotalTokensPerAudit.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  in {data.audits.avgPromptTokensPerAudit.toLocaleString()} + out{" "}
                  {data.audits.avgCandidatesTokensPerAudit.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg est. cost / audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {fmtUsd(data.audits.avgEstimatedCostUsdPerAudit)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sum: {fmtUsd(data.audits.sumEstimatedCostUsd)} · {data.pricingNote}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg site score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {data.audits.avgOverallScore}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mobile {data.audits.deviceSplit.mobile} · Desktop{" "}
                  {data.audits.deviceSplit.desktop}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audit volume by day</CardTitle>
            </CardHeader>
            <CardContent className="h-64 w-full">
              {data.audits.auditsByDay.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audits in this window yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.audits.auditsByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <AdminAnalyticsExtended
            data={{
              audits: {
                distinctAuditedUrls: data.audits.distinctAuditedUrls,
                auditsByHourUtc: data.audits.auditsByHourUtc,
              },
              failures: data.failures,
              users: {
                registrationsInRange: data.users.registrationsInRange,
                registrationsByDay: data.users.registrationsByDay,
              },
              payments: data.payments,
              promo: data.promo,
              geo: data.geo,
            }}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Users (Firestore)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Profiles (count query):</span>{" "}
                  <strong className="tabular-nums">
                    {data.users.totalProfilesCounted.toLocaleString()}
                  </strong>
                </p>
                <p>
                  <span className="text-muted-foreground">New registrations (range):</span>{" "}
                  <strong className="tabular-nums">{data.users.registrationsInRange}</strong>
                </p>
                <p className="text-muted-foreground">
                  Plan mix from first {data.users.planSampleSize} docs (sample):
                </p>
                <ul className="list-inside list-disc text-foreground">
                  <li>free: {data.users.planCountsSample.free}</li>
                  <li>pro: {data.users.planCountsSample.pro}</li>
                  <li>agency: {data.users.planCountsSample.agency}</li>
                  {data.users.planCountsSample.other ? (
                    <li>other: {data.users.planCountsSample.other}</li>
                  ) : null}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>LLM stack (resolved env)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Provider: {data.llm.provider}
                </p>
                <div>
                  <p className="font-medium">LLM 1 — {data.llm.llm1.label}</p>
                  <p className="text-muted-foreground">
                    Primary: <code className="text-foreground">{data.llm.llm1.primary}</code>
                  </p>
                  <p className="text-muted-foreground">
                    Fallback: <code className="text-foreground">{data.llm.llm1.fallback}</code>
                  </p>
                </div>
                <div>
                  <p className="font-medium">LLM 2 — {data.llm.llm2.label}</p>
                  <p className="text-muted-foreground">
                    Primary: <code className="text-foreground">{data.llm.llm2.primary}</code>
                  </p>
                  <p className="text-muted-foreground">
                    Fallback: <code className="text-foreground">{data.llm.llm2.fallback}</code>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top inferred industries (audits in range)</CardTitle>
              </CardHeader>
              <CardContent>
                {data.audits.topIndustries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {data.audits.topIndustries.map((row) => (
                      <li key={row.label} className="flex justify-between gap-4">
                        <span>{row.label}</span>
                        <span className="tabular-nums text-muted-foreground">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Commerce</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  <span className="text-muted-foreground">Paid orders recorded (range):</span>{" "}
                  <strong className="tabular-nums">{data.payments.paidOrdersInRange}</strong>
                </p>
                <p className="mt-2">
                  <span className="text-muted-foreground">Credits sold (range):</span>{" "}
                  <strong className="tabular-nums">
                    {data.payments.totalCreditsSoldInRange.toLocaleString()}
                  </strong>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{data.payments.revenueNote}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Audit logs are written only for authenticated roasts (Bearer idToken on POST
                  /api/roast). Anonymous runs are not counted here.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
