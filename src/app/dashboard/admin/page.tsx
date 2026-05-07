"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
      <SidebarProvider
        style={{ "--sidebar-width": "14.4rem" } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="ml-[14.4rem] flex min-h-screen flex-col gap-6 bg-background p-6 pt-8 md:p-10 md:pt-10">
            <Card>
              <CardHeader>
                <CardTitle>Access denied</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                This page is only available to the configured admin account.
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "14.4rem" } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-auto">
        <div className="ml-[14.4rem] flex min-h-screen flex-col gap-8 bg-background p-6 pt-8 md:p-10 md:pt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Admin overview
              </h1>
              <p className="mt-1 text-muted-foreground">
                Tools and shortcuts for operating {BRAND_NAME}.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => void resetUserData()}
            >
              Reset my data
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Social Content Pack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                On any{" "}
                <strong className="text-foreground">Site Conversion Report</strong>, open a saved
                roast from the dashboard. The{" "}
                <strong className="text-foreground">Social Content Pack</strong> card appears at the
                top of the report (admin only). It maps drafts to that report&apos;s URL and can
                anonymize the domain for public posts.
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
        </div>
      </SidebarInset>
    </SidebarProvider>
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
