"use client";

import React, { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
      <SidebarProvider
        style={{ "--sidebar-width": "14.4rem" } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="flex min-h-screen w-full min-w-0 flex-col gap-6 bg-background p-6 pt-8 md:ml-[14.4rem] md:p-10 md:pt-10">
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
    <SidebarProvider style={{ "--sidebar-width": "14.4rem" } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-auto">
        <div className="flex min-h-screen w-full min-w-0 flex-col gap-8 bg-background p-6 pt-8 md:ml-[14.4rem] md:p-10 md:pt-10">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Admin analytics
            </h1>
            <p className="mt-1 text-muted-foreground">
              Usage, tokens, and model config for {BRAND_NAME}.
            </p>
          </div>
          <AdminAnalyticsDashboard />
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

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <Content />
    </Suspense>
  );
}
