"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { AccountSettings } from "@/components/settings/account-settings";
import { ThemeIconToggle } from "@/components/settings/theme-icon-toggle";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const ok = useRequireAuth();

  if (!ok) return null;

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
        <div className="ml-[14.4rem] flex min-h-screen flex-col gap-8 bg-background p-6 pt-8 md:p-10 md:pt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
            <ThemeIconToggle className="sm:pt-1" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manage account</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountSettings />
            </CardContent>
          </Card>

          <Separator />

          <div className="flex flex-col gap-4 pb-8">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => logout()}>
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
