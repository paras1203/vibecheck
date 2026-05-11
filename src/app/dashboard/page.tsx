"use client";

import React, { useMemo } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { listRoastHistory } from "@/lib/roast-history";
import { WorkspaceTitle } from "@/components/dashboard/workspace-title";
import { RecentReportsSection } from "@/components/dashboard/recent-reports-section";
import { DashboardAnalyticsSection } from "@/components/dashboard/dashboard-analytics-section";

export default function DashboardPage() {
  const isAuthenticated = useRequireAuth();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  const history = useMemo(() => listRoastHistory(user?.uid), [user?.uid]);

  const avgScore = useMemo(() => {
    const scores = history
      .map((h) => h.overallScore)
      .filter((n): n is number => typeof n === "number");
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [history]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "14.4rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-auto">
        <div className="flex min-h-screen w-full min-w-0 flex-col gap-8 bg-background p-6 pt-8 md:ml-[14.4rem] md:p-10 md:pt-10">
          <WorkspaceTitle user={user} />

          <DashboardAnalyticsSection history={history} avgScore={avgScore} />

          <RecentReportsSection user={user} isAdmin={isAdmin} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
