"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Menu } from "lucide-react";
import { NavbarThemeToggle } from "@/components/navbar-theme-toggle";
import { BRAND_NAME } from "@/lib/brand";
import { VariationSwitcher, type LandingVisualId } from "@/components/landing/shared/variation-switcher";
import { cn } from "@/lib/utils";

const FULL_LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#preview", label: "Preview" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#comparison", label: "Compare" },
  { href: "#founding", label: "Founding" },
  { href: "#pricing", label: "Pricing" },
] as const;

const CONCEPT_LINKS = [
  { href: "#preview", label: "Preview" },
  { href: "#features", label: "Features" },
  { href: "#comparison", label: "Compare" },
  { href: "#founding", label: "Founding" },
  { href: "#pricing", label: "Pricing" },
] as const;

export type NavbarProps = {
  landingVisualId?: LandingVisualId | null;
  showLandingVariationSwitcher?: boolean;
  navMode?: "full" | "concept";
  tone?: "default" | "dark" | "minimal" | "c2" | "c3";
};

export function Navbar({
  landingVisualId = null,
  showLandingVariationSwitcher = false,
  navMode = "full",
  tone = "default",
}: NavbarProps) {
  const { user, logout, loading, isSyncing } = useAuth();
  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const links = navMode === "concept" ? CONCEPT_LINKS : FULL_LINKS;

  const navShell = cn(
    "sticky top-0 z-50 w-full border-b shadow-surface-xs backdrop-blur-md",
    tone === "default" && "border-border bg-background/85",
    tone === "dark" && "border-white/10 bg-black/80 text-white",
    tone === "minimal" &&
      "border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)]/92 text-[var(--lv-minimal-text)]",
    tone === "c2" &&
      "border-[var(--lv-c2-border)] bg-[color-mix(in_srgb,var(--lv-c2-bg)_92%,transparent)] text-[var(--lv-c2-text)]",
    tone === "c3" &&
      "border-[var(--lv-c3-border)] bg-[color-mix(in_srgb,var(--lv-c3-bg)_92%,transparent)] text-[var(--lv-c3-text)]",
  );

  const linkClass = cn(
    "text-sm transition-colors",
    tone === "default" && "text-muted-foreground hover:text-foreground",
    tone === "dark" && "text-white/70 hover:text-white",
    tone === "minimal" && "text-[var(--lv-minimal-text)]/70 hover:text-[var(--lv-minimal-text)]",
    tone === "c2" && "text-[var(--lv-c2-text)]/70 hover:text-[var(--lv-c2-text)]",
    tone === "c3" && "text-[var(--lv-c3-muted)] hover:text-[var(--lv-c3-text)]",
  );

  const brandClass = cn(
    "shrink-0 text-[1.35rem] font-semibold leading-none tracking-tight md:text-2xl",
    tone === "default" && "text-foreground",
    tone === "dark" && "text-white",
    tone === "minimal" && "text-[var(--lv-minimal-text)]",
    tone === "c2" && "text-[var(--lv-c2-text)]",
    tone === "c3" && "text-[var(--lv-c3-text)]",
  );

  return (
    <nav className={navShell}>
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 md:h-16 md:px-8">
        <Link href="/" className={brandClass}>
          {BRAND_NAME}
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-5 md:flex lg:gap-7">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {navMode === "concept" ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "md:hidden",
                    tone === "dark" && "text-white hover:bg-white/10",
                    tone === "c3" && "text-[var(--lv-c3-text)] hover:bg-[var(--lv-c3-surface-2)]",
                    tone === "c2" && "text-[var(--lv-c2-text)] hover:bg-[var(--lv-c2-surface-2)]",
                  )}
                  aria-label="Open menu"
                >
                  <Menu className="size-5 stroke-[1.5]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-2rem,320px)]">
                <SheetHeader>
                  <SheetTitle>Navigate</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-1">
                  {links.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          ) : null}

          {showLandingVariationSwitcher ? (
            <VariationSwitcher
              current={landingVisualId}
              triggerClassName={cn(
                tone === "dark" &&
                  "border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white",
                tone === "minimal" && "border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)]",
                tone === "c2" &&
                  "border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)] text-[var(--lv-c2-text)]",
                tone === "c3" &&
                  "border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-1)] text-[var(--lv-c3-text)]",
              )}
            />
          ) : null}

          <NavbarThemeToggle />

          {loading ? (
            <div
              className={cn(
                "flex items-center gap-2 text-sm",
                tone === "default" && "text-muted-foreground",
                tone === "dark" && "text-white/70",
                tone === "minimal" && "text-[var(--lv-minimal-text)]/70",
                tone === "c2" && "text-[var(--lv-c2-text)]/70",
                tone === "c3" && "text-[var(--lv-c3-muted)]",
              )}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Loading...</span>
            </div>
          ) : isSyncing ? (
            <div
              className={cn(
                "flex items-center gap-2 text-sm",
                tone === "default" && "text-muted-foreground",
                tone === "dark" && "text-white/70",
                tone === "minimal" && "text-[var(--lv-minimal-text)]/70",
                tone === "c2" && "text-[var(--lv-c2-text)]/70",
                tone === "c3" && "text-[var(--lv-c3-muted)]",
              )}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Syncing...</span>
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={user?.photoURL} alt={user?.displayName || user?.email} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {user?.displayName
                        ? user.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : user?.email
                          ? getInitials(user.email)
                          : "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing" className="cursor-pointer">
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div
              className={cn(
                "flex items-center gap-3 text-sm font-medium",
                tone === "dark" && "text-white",
                tone === "minimal" && "text-[var(--lv-minimal-text)]",
                tone === "c2" && "text-[var(--lv-c2-text)]",
                tone === "c3" && "text-[var(--lv-c3-text)]",
              )}
            >
              <Link
                href="/login"
                className={cn(
                  "transition-colors",
                  tone === "default" && "text-muted-foreground hover:text-foreground",
                  tone === "dark" && "text-white/70 hover:text-white",
                  tone === "minimal" &&
                    "text-[var(--lv-minimal-text)]/70 hover:text-[var(--lv-minimal-text)]",
                  tone === "c2" &&
                    "text-[var(--lv-c2-text)]/70 hover:text-[var(--lv-c2-text)]",
                  tone === "c3" && "text-[var(--lv-c3-muted)] hover:text-[var(--lv-c3-text)]",
                )}
              >
                Log in
              </Link>
              <span
                className={cn(
                  tone === "dark" && "text-white/25",
                  tone === "c3" && "text-[var(--lv-c3-border)]",
                  tone !== "dark" && tone !== "c3" && "text-border",
                )}
                aria-hidden
              >
                |
              </span>
              <Link
                href="/login?mode=signup"
                className={cn(
                  "transition-colors",
                  tone === "default" && "text-foreground hover:text-primary",
                  tone === "dark" && "text-white hover:text-[var(--lv-bold-accent)]",
                  tone === "minimal" &&
                    "text-[var(--lv-minimal-text)] hover:text-[var(--lv-minimal-accent)]",
                  tone === "c2" && "text-[var(--lv-c2-text)] hover:text-[var(--lv-c2-accent)]",
                  tone === "c3" && "text-[var(--lv-c3-text)] hover:text-[var(--lv-c3-accent)]",
                )}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
