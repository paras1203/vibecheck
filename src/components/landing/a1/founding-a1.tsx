"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { User } from "@/context/AuthContext";

type FoundingA1Props = {
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

export function FoundingA1({ user, loading }: FoundingA1Props) {
  const secondary = secondaryDemoLink();
  const proHref = checkoutHref(user, "pro");

  return (
    <section
      id="founding"
      className="border-t border-[var(--lv-bold-border)] bg-[var(--lv-bold-bg)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-3xl">
        <div className="rounded-xl border border-[var(--lv-bold-border)] bg-[var(--lv-bold-surface-1)] p-8 shadow-surface-xs ring-1 ring-[var(--lv-bold-primary)]/20 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lv-bold-primary)]">
            Founding cohort
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Early access for serious operators
          </h2>
          <p className="mt-4 text-white/65">
            We&apos;re onboarding a small founding cohort—teams who treat conversion work as a
            priority, not a side project. We&apos;re capping it so support stays hands-on while we
            scale (target: first 100 paid accounts).
          </p>
          <ul className="mt-8 list-none space-y-4 text-white/65">
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-white">•</span>
              <span>
                <span className="font-medium text-white">Priority handling.</span> Founding
                members get faster responses and direct access when something blocks you—not a
                ticket queue.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-white">•</span>
              <span>
                <span className="font-medium text-white">Tighter iteration.</span> Your feedback
                lands with the people building the product, so the loop from signal to shipped
                improvement stays short.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-white">•</span>
              <span>
                <span className="font-medium text-white">A real voice in what comes next.</span>{" "}
                We read every note; you help shape priorities—we don&apos;t promise a custom
                roadmap, but we do listen.
              </span>
            </li>
          </ul>
          <p className="mt-8 border-t border-[var(--lv-bold-border)] pt-8 text-sm text-white/55">
            If you see strong results, we may ask to feature your story—a short quote or case
            study—with your approval. It&apos;s optional, and it&apos;s a way to get your brand in
            front of others who care about the same problems.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {loading ? (
              <Button disabled className="w-full rounded-xl bg-[var(--lv-bold-primary)] sm:w-auto">
                Upgrade to Pro
              </Button>
            ) : (
              <Button asChild className="w-full rounded-xl bg-[var(--lv-bold-primary)] sm:w-auto">
                <Link href={proHref}>Upgrade to Pro</Link>
              </Button>
            )}
            {secondary.useLink ? (
              <Button
                variant="outline"
                asChild
                className="w-full rounded-xl border-[var(--lv-bold-border)] bg-transparent text-white hover:bg-[var(--lv-bold-surface-2)] sm:w-auto"
              >
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                asChild
                className="w-full rounded-xl border-[var(--lv-bold-border)] bg-transparent text-white hover:bg-[var(--lv-bold-surface-2)] sm:w-auto"
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
