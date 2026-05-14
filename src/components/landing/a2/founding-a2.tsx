"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { User } from "@/context/AuthContext";

type FoundingA2Props = {
  user: User | null;
  loading: boolean;
};

function billingPath(plan: "pro") {
  return `/checkout?plan=${plan}`;
}

function checkoutHref(_user: User | null, plan: "pro") {
  return billingPath(plan);
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

export function FoundingA2({ user, loading }: FoundingA2Props) {
  const secondary = secondaryDemoLink();
  const proHref = checkoutHref(user, "pro");

  return (
    <section id="founding" className="border-t-2 border-white bg-black px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-3xl">
        <div className="border-2 border-white p-8 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
            Founding cohort
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Early access for serious operators
          </h2>
          <p className="mt-4 text-white/65">
            We&apos;re onboarding a small founding cohort—teams who treat conversion work as a
            priority, not a side project. We&apos;re capping it so support stays hands-on while we
            scale (target: first 100 paid accounts).
          </p>
          <ul className="mt-8 list-none space-y-4 border-t border-white/25 pt-8 text-white/65">
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-white">•</span>
              <span>
                <span className="font-bold text-white">Priority handling.</span> Founding members
                get faster responses and direct access when something blocks you—not a ticket queue.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-white">•</span>
              <span>
                <span className="font-bold text-white">Tighter iteration.</span> Your feedback lands
                with the people building the product, so the loop from signal to shipped improvement
                stays short.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-white">•</span>
              <span>
                <span className="font-bold text-white">A real voice in what comes next.</span> We
                read every note; you help shape priorities—we don&apos;t promise a custom roadmap,
                but we do listen.
              </span>
            </li>
          </ul>
          <p className="mt-8 border-t border-white/25 pt-8 text-sm text-white/55">
            If you see strong results, we may ask to feature your story—a short quote or case
            study—with your approval. It&apos;s optional, and it&apos;s a way to get your brand in
            front of others who care about the same problems.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {loading ? (
              <Button
                disabled
                className="w-full rounded-none border-2 border-white bg-white sm:w-auto"
              >
                Upgrade to Pro
              </Button>
            ) : (
              <Button asChild className="w-full rounded-none border-2 border-white bg-white sm:w-auto">
                <Link href={proHref} className="font-bold text-black">
                  Upgrade to Pro
                </Link>
              </Button>
            )}
            {secondary.useLink ? (
              <Button
                variant="outline"
                asChild
                className="w-full rounded-none border-2 border-white bg-transparent text-white hover:bg-white hover:text-black sm:w-auto"
              >
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                asChild
                className="w-full rounded-none border-2 border-white bg-transparent text-white hover:bg-white hover:text-black sm:w-auto"
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
