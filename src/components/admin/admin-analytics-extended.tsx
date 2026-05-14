"use client";

import React from "react";
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

export type AdminAnalyticsExtendedShape = {
  audits: {
    distinctAuditedUrls: number;
    auditsByHourUtc: { hour: number; audits: number; distinctUsers: number }[];
  };
  failures: { count: number; failuresByDay: { date: string; count: number }[] };
  users: {
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
};

export function AdminAnalyticsExtended({ data }: { data: AdminAnalyticsExtendedShape }) {
  const hourRows = data.audits.auditsByHourUtc.map((r) => ({
    label: `${String(r.hour).padStart(2, "0")}:00`,
    audits: r.audits,
    activeUsers: r.distinctUsers,
  }));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distinct audited URLs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {data.audits.distinctAuditedUrls.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Audit failures (range)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{data.failures.count}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Capture / server errors after debit (refunded)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New registrations (range)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {data.users.registrationsInRange.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Profiles with createdAt in window</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credits sold (range)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {data.payments.totalCreditsSoldInRange.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Sum of creditsGranted on payments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Audits by hour (UTC)</CardTitle>
          </CardHeader>
          <CardContent className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourRows}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="audits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active users by hour (UTC)</CardTitle>
          </CardHeader>
          <CardContent className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourRows}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="activeUsers" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registrations by day</CardTitle>
          </CardHeader>
          <CardContent className="h-56 w-full">
            {data.users.registrationsByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dated registrations in window.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.users.registrationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Failures by day</CardTitle>
          </CardHeader>
          <CardContent className="h-56 w-full">
            {data.failures.failuresByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">No logged failures in window.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.failures.failuresByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Promo pool</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Remaining signup promo slots:{" "}
              <strong className="text-foreground tabular-nums">
                {data.promo.remainingSlots == null ? "—" : data.promo.remainingSlots}
              </strong>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Region</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{data.geo.regionNote}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
