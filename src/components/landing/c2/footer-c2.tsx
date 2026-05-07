"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

export function FooterC2() {
  return (
    <footer className="border-t border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)] px-4 py-16 md:px-8">
      <div className="container mx-auto max-w-6xl space-y-10">
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-[var(--lv-c2-border)] bg-[var(--lv-c2-bg)] px-6 py-10 text-center shadow-[0_12px_40px_rgba(28,25,23,0.08)] md:px-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--lv-c2-text)] md:text-3xl">
              One URL away from clarity
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              Jump back to the hero—paste a link and get your first pass in minutes.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="rounded-2xl bg-[var(--lv-c2-accent)] px-10 font-semibold text-white hover:bg-[color-mix(in_srgb,var(--lv-c2-accent)_92%,black)]"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to top
          </Button>
        </div>
        <div className="flex flex-col items-center justify-between gap-6 border-t border-[var(--lv-c2-border)] pt-10 md:flex-row">
          <div className="text-lg font-semibold text-[var(--lv-c2-text)]">{BRAND_NAME}</div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="transition-colors hover:text-[var(--lv-c2-text)]">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-[var(--lv-c2-text)]">
              Privacy
            </Link>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--lv-c2-text)]"
            >
              Twitter
            </a>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
