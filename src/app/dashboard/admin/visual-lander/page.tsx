"use client";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { LandingVisualPickerPanel } from "@/components/admin/landing-visual-picker-panel";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminVisualLanderPage() {
  const ok = useRequireAuth();
  const isAdmin = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (ok && !isAdmin) router.replace("/dashboard");
  }, [ok, isAdmin, router]);

  if (!ok || !isAdmin) return null;

  return (
    <AuthenticatedShell title="Landing visuals">
      <LandingVisualPickerPanel />
    </AuthenticatedShell>
  );
}
