"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND_NAME } from "@/lib/brand";
import { toast } from "sonner";

export function FooterB2() {
  return (
    <footer className="border-t border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)] px-4 py-16 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="text-lg font-semibold text-[var(--lv-minimal-text)]">{BRAND_NAME}</div>
          </div>
          <div>
            <p className="text-label text-[var(--lv-minimal-text)]">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#preview" className="hover:text-[var(--lv-minimal-text)]">
                  Preview
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-[var(--lv-minimal-text)]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[var(--lv-minimal-text)]">
                  Log in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-label text-[var(--lv-minimal-text)]">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-[var(--lv-minimal-text)]">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--lv-minimal-text)]">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <form
          className="mt-12 flex max-w-md flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            toast.message("Newsletter coming soon");
          }}
        >
          <Input
            type="email"
            name="email"
            placeholder="Email"
            className="border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)]"
            autoComplete="email"
          />
          <Button type="submit" className="shrink-0">
            Notify me
          </Button>
        </form>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--lv-minimal-border)] pt-8 text-sm text-muted-foreground md:flex-row">
          <span>
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </span>
          <Link href="/" className="hover:text-[var(--lv-minimal-text)]">
            Default landing
          </Link>
        </div>
      </div>
    </footer>
  );
}
