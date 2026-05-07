"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { User } from "@/context/AuthContext";

type FoundingC2Props = {
  user: User | null;
  loading: boolean;
};

function billingPath(plan: "pro") {
  return `/billing?plan=${plan}`;
}

function checkoutHref(user: User | null, plan: "pro") {
  const path = billingPath(plan);
  return user ? path : `/login?next=${encodeURIComponent(path)}`;
}

function secondaryDemoLink(): {
  href: string;
  label: string;
  newTab: boolean;
  useLink: boolean;
} {
  const demoUrl = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL?.trim() ?? "";
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim() ?? "";
  if (demoUrl) {
    return { href: demoUrl, label: "Book a demo", newTab: true, useLink: false };
  }
  if (adminEmail) {
    const q = new URLSearchParams({
      subject: "SiteRoast — demo request",
    });
    return { href: `mailto:${adminEmail}?${q}`, label: "Book a demo", newTab: false, useLink: false };
  }
  return { href: "#pricing", label: "Talk to us", newTab: false, useLink: true };
}

export function FoundingC2({ user, loading }: FoundingC2Props) {
  const secondary = secondaryDemoLink();
  const proHref = checkoutHref(user, "pro");

  return (
    <section
      id="founding"
      className="border-t border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-3xl">
        <div className="rounded-3xl border border-[var(--lv-c2-border)] bg-[var(--lv-c2-bg)] p-8 shadow-[0_16px_48px_rgba(28,25,23,0.1)] md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lv-c2-accent)]">
            Founding cohort
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--lv-c2-text)] md:text-4xl">
            Built with operators who ship, not committee decks
          </h2>
          <p className="mt-4 text-muted-foreground">
            We&apos;re keeping the cohort small so feedback stays direct and the product stays
            opinionated—conversion clarity first, everything else second.
          </p>
          <ul className="mt-8 list-none space-y-4 text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[var(--lv-c2-text)]">•</span>
              <span>
                <span className="font-medium text-[var(--lv-c2-text)]">Hands-on support.</span>{" "}
                Founding members get a short path to answers when a roast surfaces something
                blocking launch.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[var(--lv-c2-text)]">•</span>
              <span>
                <span className="font-medium text-[var(--lv-c2-text)]">Fast iteration.</span> Your
                notes shape what we prioritize—especially around exports and team workflows.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[var(--lv-c2-text)]">•</span>
              <span>
                <span className="font-medium text-[var(--lv-c2-text)]">Optional spotlight.</span>{" "}
                Strong outcomes may become a anonymized or approved quote—never without your OK.
              </span>
            </li>
          </ul>
          <p className="mt-8 border-t border-[var(--lv-c2-border)] pt-8 text-sm text-muted-foreground">
            Target: first 100 paid accounts while we keep quality bar high.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {loading ? (
              <Button disabled className="w-full rounded-2xl sm:w-auto">
                Upgrade to Pro
              </Button>
            ) : (
              <Button
                asChild
                className="w-full rounded-2xl bg-[var(--lv-c2-accent)] text-white hover:bg-[color-mix(in_srgb,var(--lv-c2-accent)_92%,black)] sm:w-auto"
              >
                <Link href={proHref}>Upgrade to Pro</Link>
              </Button>
            )}
            {secondary.useLink ? (
              <Button variant="outline" asChild className="w-full rounded-2xl border-[var(--lv-c2-border)] sm:w-auto">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : (
              <Button variant="outline" asChild className="w-full rounded-2xl border-[var(--lv-c2-border)] sm:w-auto">
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
