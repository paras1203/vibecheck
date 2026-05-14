"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";
import { useResetUserData } from "@/hooks/use-reset-user-data";
import { BRAND_NAME } from "@/lib/brand";

function AdminDashboardContent() {
  const ok = useRequireAuth();
  const isAdmin = useIsAdmin();
  const { resetUserData } = useResetUserData();

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
    <AuthenticatedShell
      title="Admin overview"
      headerRight={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => void resetUserData()}
        >
          Reset my data
        </Button>
      }
    >
      <p className="text-muted-foreground">
        Tools and shortcuts for operating {BRAND_NAME}.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Social Content Pack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            On any{" "}
            <strong className="text-foreground">Site Conversion Report</strong>, open a saved roast
            from the dashboard. The{" "}
            <strong className="text-foreground">Social Content Pack</strong> card appears at the top
            of the report (admin only). It maps drafts to that report&apos;s URL and can anonymize the
            domain for public posts.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report index & analytics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="default" size="sm">
            <Link href="/dashboard/admin/analytics">Open admin analytics</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">New roast</Link>
          </Button>
        </CardContent>
      </Card>
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

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
