"use client";

import Link from "next/link";
import { UrlInputForm } from "@/components/landing/shared/url-input-form";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";
import { Check } from "lucide-react";

const BULLETS = [
  "See where attention dies before anyone scrolls",
  "Quantify leak scenarios against your price and traffic",
  "Leave with ranked fixes—not a vague slide deck",
] as const;

export function HeroC1({ roastForm }: { roastForm: LandingRoastFormProps }) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-28 md:px-8">
      <div className="max-w-3xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--lv-c1-accent)]">
          CRO AUDIT · SIGNAL, NOT SLIDES
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-[1.05]">
          Stop guessing why the landing leaks pipeline.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/65 md:text-xl">
          Paste a URL. In under a minute you get scores, radar, and a blunt list of what to fix
          first—built for operators who ship, not agencies who schedule.
        </p>
        <ul className="mx-auto mt-8 max-w-xl space-y-3 text-left text-sm text-white/80 md:text-base">
          {BULLETS.map((line) => (
            <li key={line} className="flex gap-3">
              <Check
                className="mt-0.5 size-5 shrink-0 text-[var(--lv-c1-accent)] [&_svg]:stroke-[2]"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <UrlInputForm {...roastForm} variant="a2" secondaryHref="#preview" />
      <p className="text-xs text-white/40">
        <Link href="/" className="underline-offset-4 hover:underline">
          Default landing
        </Link>
      </p>
    </section>
  );
}
