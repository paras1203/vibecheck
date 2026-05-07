"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { User } from "@/context/AuthContext";
import {
  checkoutHref,
  freeTestCheckoutHref,
  LANDING_BUNDLE_USD,
  LANDING_CHECKOUT_SINGLE_USD,
  LANDING_FREE_TEST_USD,
  usdLanding,
} from "@/lib/landing-pricing-utils";

type PricingA2Props = {
  loading: boolean;
  onRoast: () => void;
  user: User | null;
};

export function PricingA2({ loading, onRoast, user }: PricingA2Props) {
  return (
    <section id="pricing" className="border-t-2 border-white bg-black px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
          Choose your plan
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-white/65">
          Start free, upgrade when you need full radar, audits, and exports.
        </p>
        <div className="overflow-x-auto border-2 border-white">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-white bg-white">
                <th className="px-4 py-3 text-sm font-bold text-black"> </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-black">The Tease</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-black">Pro Plan</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-black">
                  Agency Pack (Bundle)
                </th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              <tr className="border-b border-white/25">
                <th className="px-4 py-3 text-sm font-semibold text-white">Price</th>
                <td className="px-4 py-3 text-center font-mono font-bold text-white">
                  {usdLanding(LANDING_FREE_TEST_USD)}
                </td>
                <td className="px-4 py-3 text-center font-mono font-bold text-white">
                  {usdLanding(LANDING_CHECKOUT_SINGLE_USD)}
                </td>
                <td className="px-4 py-3 text-center font-mono font-bold text-white">
                  {usdLanding(LANDING_BUNDLE_USD)}
                  <span className="ml-1 text-xs font-sans font-normal text-white/65">/ 5</span>
                </td>
              </tr>
              <tr className="border-b border-white/25">
                <th className="px-4 py-3 text-sm font-semibold text-white">Full radar &amp; PDF</th>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <X className="size-5 text-white/45" aria-label="No" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <Check className="size-5 text-white" aria-label="Yes" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <Check className="size-5 text-white" aria-label="Yes" />
                  </div>
                </td>
              </tr>
              <tr className="border-b border-white/25">
                <th className="px-4 py-3 text-sm font-semibold text-white">Element-wise audit</th>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <X className="size-5 text-white/45" aria-label="No" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <Check className="size-5 text-white" aria-label="Yes" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <Check className="size-5 text-white" aria-label="Yes" />
                  </div>
                </td>
              </tr>
              <tr>
                <th className="px-4 py-4 text-sm font-semibold text-white">CTA</th>
                <td className="px-4 py-4 text-center align-top">
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={onRoast}
                      disabled={loading}
                      className="rounded-none border-2 border-white bg-transparent text-white hover:bg-white hover:text-black"
                    >
                      Get Free Audit
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-none border-white/55 text-xs text-white">
                      <Link href={freeTestCheckoutHref(user)}>Test checkout</Link>
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-4 text-center align-top">
                  {loading ? (
                    <Button disabled className="rounded-none border-2 border-white">
                      Buy
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="rounded-none border-2 border-white bg-white font-bold text-black hover:bg-white/90"
                    >
                      <Link href={checkoutHref(user, "pro")}>Buy Pro</Link>
                    </Button>
                  )}
                </td>
                <td className="px-4 py-4 text-center align-top">
                  {loading ? (
                    <Button disabled className="rounded-none border-2 border-white">
                      Buy
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="rounded-none border-2 border-white bg-white font-bold text-black hover:bg-white/90"
                    >
                      <Link href={checkoutHref(user, "agency")}>Buy Agency</Link>
                    </Button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
