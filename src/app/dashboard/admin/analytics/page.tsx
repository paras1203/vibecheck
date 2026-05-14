"use client";

import React, { Suspense } from "react";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { BRAND_NAME } from "@/lib/brand";
import { AdminAnalyticsDashboard } from "@/components/admin/admin-analytics-dashboard";

function Content() {
  const ok = useRequireAuth();
  const isAdmin = useIsAdmin();

  if (!ok) return null;

  if (!isAdmin) {
    return (
      <AuthenticatedShell>
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This page is only available to the configured admin account.
          </CardContent>
        </Card>
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell title="Admin analytics">
      <p className="text-muted-foreground">
        Usage, tokens, and model config for {BRAND_NAME}.
      </p>
      <AdminAnalyticsDashboard />
    </AuthenticatedShell>
  );
}

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <Content />
    </Suspense>
  );
}
