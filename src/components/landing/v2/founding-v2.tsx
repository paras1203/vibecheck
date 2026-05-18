"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { User } from "@/context/AuthContext";
import { checkoutHref } from "@/lib/landing-pricing-utils";

type FoundingV2Props = {
  user: User | null;
  loading: boolean;
};

function secondaryDemoLink(): {
  href: string;
  label: string;
  newTab: boolean;
  useLink: boolean;
} {
  const demoUrl = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL?.trim() ?? "";
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim() ?? "";
  if (demoUrl) {
    return { href: demoUrl, label: "Talk to us", newTab: true, useLink: false };
  }
  if (adminEmail) {
    const q = new URLSearchParams({ subject: "SiteRoast — early access" });
    return {
      href: `mailto:${adminEmail}?${q}`,
      label: "Talk to us",
      newTab: false,
      useLink: false,
    };
  }
  return { href: "#v2-pricing", label: "Talk to us", newTab: false, useLink: true };
}

export function FoundingV2({ user, loading }: FoundingV2Props) {
  const secondary = secondaryDemoLink();
  const proHref = checkoutHref(user, "pro");

  return (
    <section
      id="v2-founding"
      className="border-t border-border bg-background px-4 py-16 md:px-8"
    >
      <div className="container mx-auto max-w-3xl min-w-0">
        <div className="rounded-xl border border-border bg-card p-7 shadow-surface-xs ring-1 ring-primary/10 md:p-9">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Early customers
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Faster support while we grow
          </h2>
          <p className="mt-4 text-muted-foreground">
            Early customers get faster responses and a tighter feedback loop
            while we improve the product. Your feedback reaches the team
            directly — no ticket queues. If you see strong results, we may ask
            whether you would like to share a short quote; it is entirely
            optional.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {loading ? (
              <Button disabled className="w-full rounded-xl sm:w-auto">
                Get Single Audit
              </Button>
            ) : (
              <Button asChild className="w-full rounded-xl sm:w-auto">
                <Link href={proHref}>Get Single Audit</Link>
              </Button>
            )}
            {secondary.useLink ? (
              <Button
                variant="outline"
                asChild
                className="w-full rounded-xl sm:w-auto"
              >
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                asChild
                className="w-full rounded-xl sm:w-auto"
              >
                <a
                  href={secondary.href}
                  {...(secondary.newTab
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {secondary.label}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
