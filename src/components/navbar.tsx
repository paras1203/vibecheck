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
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { NavbarThemeToggle } from "@/components/navbar-theme-toggle";
import { BRAND_NAME } from "@/lib/brand";

export function Navbar() {
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

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/85 shadow-surface-xs backdrop-blur-md">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 md:h-16 md:px-8">
        <Link
          href="/"
          className="shrink-0 text-[1.35rem] font-semibold leading-none tracking-tight text-foreground md:text-2xl"
        >
          {BRAND_NAME}
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-5 md:flex lg:gap-7">
          <Link
            href="#problem"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Problem
          </Link>
          <Link
            href="#preview"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Preview
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#comparison"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Compare
          </Link>
          <Link
            href="#founding"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Founding
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <NavbarThemeToggle />

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : isSyncing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Syncing...</span>
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
            <div className="flex items-center gap-3 text-sm font-medium">
              <Link
                href="/login"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <span className="text-border" aria-hidden>
                |
              </span>
              <Link
                href="/login?mode=signup"
                className="text-foreground transition-colors hover:text-primary"
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
