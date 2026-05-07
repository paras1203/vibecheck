"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

export function FooterA1() {
  return (
    <footer className="border-t border-[var(--lv-bold-border)] bg-[var(--lv-bold-bg)] px-4 py-12 md:px-8">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="text-lg font-semibold text-white">{BRAND_NAME}</div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-white/55">
          <Link href="/terms" className="transition-colors hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-white">
            Privacy
          </Link>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            Twitter
          </a>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-xl bg-[var(--lv-bold-primary)] text-white hover:opacity-90"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Back to top
        </Button>
      </div>
      <p className="mt-8 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
      </p>
    </footer>
  );
}
