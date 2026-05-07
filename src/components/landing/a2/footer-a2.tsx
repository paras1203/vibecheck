"use client";

import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export function FooterA2() {
  return (
    <footer className="border-t-2 border-white bg-black px-4 py-10 md:px-8">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-base font-bold text-white">{BRAND_NAME}</div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-white/55">
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            Twitter
          </a>
          <Link href="/" className="hover:text-white">
            Default landing
          </Link>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
      </p>
    </footer>
  );
}
