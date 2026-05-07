"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface-2 px-4 py-16 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-8 rounded-lg border border-border bg-surface-1 px-6 py-10 text-center md:px-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Ready to stop leaking conversions?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              Paste your URL on the hero — your first pass is minutes away.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="rounded-lg px-10 font-semibold"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to top
          </Button>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-lg font-semibold text-foreground">{BRAND_NAME}</div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
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
