"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { listRoastHistory } from "@/lib/roast-history";
import { WorkspaceTitle } from "@/components/dashboard/workspace-title";
import { RecentReportsSection } from "@/components/dashboard/recent-reports-section";
import { DashboardAnalyticsSection } from "@/components/dashboard/dashboard-analytics-section";
import { PendingHomeMessageBanner } from "@/components/dashboard/pending-home-message-banner";
import { useClaimPromoOnMount } from "@/hooks/use-claim-promo-on-mount";

export default function DashboardPage() {
  const isAuthenticated = useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  useClaimPromoOnMount();

  useEffect(() => {
    if (!isAuthenticated || !user?.firestoreSynced || user.onboardingCompleted) return;
    router.replace("/onboarding");
  }, [isAuthenticated, user, router]);

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
    <AuthenticatedShell title="Dashboard">
      <WorkspaceTitle user={user} />

      <PendingHomeMessageBanner />

      <DashboardAnalyticsSection history={history} avgScore={avgScore} />

      <RecentReportsSection user={user} isAdmin={isAdmin} />
    </AuthenticatedShell>
  );
}
