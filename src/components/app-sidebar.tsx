"use client";

import { Suspense, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  CreditCard,
  Settings,
  LayoutDashboard,
  Flame,
  Shield,
  Home,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/hooks/use-is-admin";
import Link from "next/link";
import { IconFrame } from "@/components/ui/icon-frame";
import { MetricCard } from "@/components/ui/metric-card";
import { BRAND_NAME } from "@/lib/brand";
import { creditsBalanceTitle, formatCreditsBalance } from "@/lib/credits-balance-display";

function SidebarNavFallback() {
  return (
    <SidebarGroup className="px-1 py-2">
      <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">
        Navigation
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="px-2 py-3 text-xs text-sidebar-foreground/50">Loading…</div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function SidebarNavInner() {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();

  const menuItems = [
    {
      title: "Home",
      icon: Home,
      href: "/home",
      active: pathname === "/home",
    },
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      title: "Billing",
      icon: CreditCard,
      href: "/billing",
      active: pathname === "/billing",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
      active: pathname === "/settings",
    },
  ];

  return (
    <>
      <SidebarGroup className="px-1 py-2">
        <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">
          Navigation
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.active}>
                    <Link href={item.href}>
                      <IconFrame
                        size="sm"
                        className="border-sidebar-border/80 bg-sidebar-accent/50 text-sidebar-foreground [&_svg]:size-4 [&_svg]:stroke-[1.5]"
                      >
                        <Icon className="size-4 stroke-[1.5]" />
                      </IconFrame>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {isAdmin ? (
        <SidebarGroup className="px-1 py-2">
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">
            Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/admin"}>
                  <Link href="/dashboard/admin">
                    <IconFrame
                      size="sm"
                      className="border-sidebar-border/80 bg-sidebar-accent/50 text-sidebar-foreground [&_svg]:size-4 [&_svg]:stroke-[1.5]"
                    >
                      <Shield className="size-4 stroke-[1.5]" />
                    </IconFrame>
                    <span>Admin overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/admin/analytics"}
                >
                  <Link href="/dashboard/admin/analytics">
                    <IconFrame
                      size="sm"
                      className="border-sidebar-border/80 bg-sidebar-accent/50 text-sidebar-foreground [&_svg]:size-4 [&_svg]:stroke-[1.5]"
                    >
                      <BarChart3 className="size-4 stroke-[1.5]" />
                    </IconFrame>
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}
    </>
  );
}

export function AppSidebar() {
  const { user } = useAuth();

  return (
    <Sidebar
      style={
        {
          "--sidebar-width": "14.4rem",
        } as CSSProperties
      }
      className="w-[14.4rem]"
    >
      <SidebarHeader className="border-b border-sidebar-border p-3.5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md outline-none ring-sidebar-ring focus-visible:ring-2"
        >
          <IconFrame
            size="sm"
            className="border-sidebar-border bg-sidebar-accent text-sidebar-primary"
          >
            <Flame className="size-4 stroke-[1.5]" />
          </IconFrame>
          <span className="text-[1.35rem] font-semibold leading-tight tracking-tight text-sidebar-foreground">
            {BRAND_NAME}
          </span>
        </Link>
        {user && (
          <MetricCard
            className="mt-3 border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground shadow-none [&_.text-caption]:text-sidebar-foreground/60"
            label="Credits"
            value={
              <span
                className="font-mono text-2xl font-semibold tabular-nums text-sidebar-primary"
                title={creditsBalanceTitle(user)}
              >
                {formatCreditsBalance(user)}
              </span>
            }
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<SidebarNavFallback />}>
          <SidebarNavInner />
        </Suspense>
      </SidebarContent>
    </Sidebar>
  );
}
