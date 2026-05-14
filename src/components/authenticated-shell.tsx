"use client";

import type { CSSProperties, ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SHELL_MAIN_MAX_NARROW_CLASS, SHELL_SIDEBAR_WIDTH_DESKTOP } from "@/lib/shell-layout";
import { cn } from "@/lib/utils";

type AuthenticatedShellProps = {
  children: ReactNode;
  constrainContentWidth?: boolean;
  insetClassName?: string;
  title?: string;
  headerRight?: ReactNode;
  contentClassName?: string;
};

const CONTENT_PAD = "px-4 pb-10 pt-6 md:px-8 md:pb-14 md:pt-8";

export function AuthenticatedShell({
  children,
  constrainContentWidth = false,
  insetClassName,
  title,
  headerRight,
  contentClassName,
}: AuthenticatedShellProps) {
  const contentWidthCls = constrainContentWidth
    ? cn("mx-auto w-full", SHELL_MAIN_MAX_NARROW_CLASS)
    : null;

  return (
    <SidebarProvider
      style={{ "--sidebar-width": SHELL_SIDEBAR_WIDTH_DESKTOP } as CSSProperties}
    >
      <AppSidebar />
      <SidebarInset
        className={cn(
          "flex min-h-svh min-h-0 flex-col overflow-x-hidden overflow-y-auto",
          insetClassName,
        )}
      >
        <div
          className={cn(
            "flex min-h-0 w-full min-w-0 flex-1 flex-col bg-background",
            contentWidthCls,
          )}
        >
          {title ? (
            <>
              <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 md:min-h-16 md:gap-4 md:px-8 md:py-3.5">
                <SidebarTrigger className="shrink-0" />
                <h1 className="min-w-0 flex-1 text-lg font-semibold tracking-tight text-foreground md:text-xl">
                  {title}
                </h1>
                {headerRight ? (
                  <div className="flex shrink-0 items-center gap-2">{headerRight}</div>
                ) : null}
              </header>
              <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col gap-8", CONTENT_PAD, contentClassName)}>
                {children}
              </div>
            </>
          ) : (
            <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col gap-8", CONTENT_PAD, contentClassName)}>
              {children}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
