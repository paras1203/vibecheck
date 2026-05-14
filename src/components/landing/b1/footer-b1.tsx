"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

export function FooterB1() {
  return (
    <footer className="border-t border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)] px-4 py-16 md:px-8">
      <div className="container mx-auto max-w-6xl space-y-10">
        <div className="flex flex-col items-center gap-6 rounded-xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] px-6 py-10 text-center md:px-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--lv-minimal-text)] md:text-3xl">
              Ready to stop leaking conversions?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              Paste your URL on the hero — your first pass is minutes away.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="rounded-xl px-10 font-semibold"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to top
          </Button>
        </div>
        <div className="flex flex-col items-center justify-between gap-6 border-t border-[var(--lv-minimal-border)] pt-10 md:flex-row">
          <div className="text-lg font-semibold text-[var(--lv-minimal-text)]">{BRAND_NAME}</div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="transition-colors hover:text-[var(--lv-minimal-text)]">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-[var(--lv-minimal-text)]">
              Privacy
            </Link>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--lv-minimal-text)]"
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
