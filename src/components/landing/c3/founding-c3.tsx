"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { User } from "@/context/AuthContext";

type FoundingC3Props = {
  user: User | null;
  loading: boolean;
};

function billingPath(plan: "pro") {
  return `/checkout?plan=${plan}`;
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

export function FoundingC3({ user, loading }: FoundingC3Props) {
  const secondary = secondaryDemoLink();
  const proHref = checkoutHref(user, "pro");

  return (
    <section
      id="founding"
      className="border-t border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-1)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-3xl">
        <div className="rounded-2xl border border-[var(--lv-c3-border)] bg-[var(--lv-c3-bg)] p-8 shadow-surface-xs md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lv-c3-accent)]">
            Founding cohort
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--lv-c3-text)] md:text-4xl">
            For teams who measure in pipeline, not pageviews
          </h2>
          <p className="mt-4 text-[var(--lv-c3-muted)]">
            We&apos;re keeping onboarding tight: better support, faster product feedback, zero
            enterprise theater.
          </p>
          <ul className="mt-8 list-none space-y-4 text-[var(--lv-c3-muted)]">
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[var(--lv-c3-text)]">•</span>
              <span>
                <span className="font-medium text-[var(--lv-c3-text)]">Direct line.</span>{" "}
                Founding members get practical responses when something blocks a launch.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[var(--lv-c3-text)]">•</span>
              <span>
                <span className="font-medium text-[var(--lv-c3-text)]">Roadmap signal.</span> Your
                workflows inform exports, team seats, and audit depth.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[var(--lv-c3-text)]">•</span>
              <span>
                <span className="font-medium text-[var(--lv-c3-text)]">Optional spotlight.</span>{" "}
                We only quote wins with explicit approval.
              </span>
            </li>
          </ul>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {loading ? (
              <Button disabled className="w-full rounded-lg sm:w-auto">
                Upgrade to Pro
              </Button>
            ) : (
              <Button
                asChild
                className="w-full rounded-lg bg-[var(--lv-c3-accent)] text-[var(--lv-c3-bg)] hover:opacity-90 sm:w-auto"
              >
                <Link href={proHref}>Upgrade to Pro</Link>
              </Button>
            )}
            {secondary.useLink ? (
              <Button
                variant="outline"
                asChild
                className="w-full rounded-lg border-[var(--lv-c3-border)] bg-transparent text-[var(--lv-c3-text)] hover:bg-[var(--lv-c3-surface-2)] sm:w-auto"
              >
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                asChild
                className="w-full rounded-lg border-[var(--lv-c3-border)] bg-transparent text-[var(--lv-c3-text)] hover:bg-[var(--lv-c3-surface-2)] sm:w-auto"
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
