"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { AccountSettings } from "@/components/settings/account-settings";
import { ThemeIconToggle } from "@/components/settings/theme-icon-toggle";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { Separator } from "@/components/ui/separator";
import { AuthenticatedShell } from "@/components/authenticated-shell";

export default function SettingsPage() {
  const { logout } = useAuth();
  const ok = useRequireAuth();

  if (!ok) return null;

  return (
    <AuthenticatedShell title="Settings" headerRight={<ThemeIconToggle />}>
          <Card>
            <CardHeader>
              <CardTitle>Manage account</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountSettings />
            </CardContent>
          </Card>

          <Separator />

          <div className="flex flex-col gap-3 pb-8 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full min-w-0 px-4 text-sm font-medium sm:w-auto"
              onClick={() => logout()}
            >
              Log out
            </Button>
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
              <Link href="/terms" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                Terms &amp; Conditions
              </Link>
              <Link href="/privacy" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                Privacy Policy
              </Link>
            </div>
            <DeleteAccountDialog />
          </div>
    </AuthenticatedShell>
  );
}
