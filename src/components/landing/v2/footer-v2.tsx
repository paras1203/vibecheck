"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal-contact";
import { trackEvent } from "@/lib/analytics-events";

export function FooterV2() {
  return (
    <footer className="border-t border-border bg-background px-4 py-12 md:px-8">
      <div className="container mx-auto max-w-6xl min-w-0">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-lg font-semibold text-foreground">{BRAND_NAME}</div>
          <div className="flex max-w-full flex-wrap justify-center gap-4 text-sm text-muted-foreground sm:gap-6">
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <a
              href={`mailto:${LEGAL_CONTACT_EMAIL}`}
              className="transition-colors hover:text-foreground"
              onClick={() => trackEvent("contact_cta_click")}
            >
              Contact
            </a>
          </div>
          <Button
            id="footer-back-to-top-v2"
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
        <p className="mt-2 text-center text-xs text-muted-foreground/70">
          Illustrative estimates shown in sample reports are not a guarantee of
          results. We only use the submitted URL to generate your audit.
        </p>
      </div>
    </footer>
  );
}
