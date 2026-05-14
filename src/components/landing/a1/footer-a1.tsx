"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

export function FooterA1() {
  return (
    <footer className="border-t border-border bg-background px-4 py-12 md:px-8">
      <div className="container mx-auto flex max-w-6xl min-w-0 flex-col items-center justify-between gap-6 md:flex-row">
        <div className="text-lg font-semibold text-foreground">{BRAND_NAME}</div>
        <div className="flex max-w-full flex-wrap justify-center gap-4 text-sm text-muted-foreground sm:gap-6">
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
        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-xl"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Back to top
        </Button>
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
      </p>
    </footer>
  );
}
