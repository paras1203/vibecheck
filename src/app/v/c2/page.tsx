"use client";

import { Navbar } from "@/components/navbar";
import { useLandingRoast } from "@/hooks/use-landing-roast";
import { HeroC2 } from "@/components/landing/c2/hero-c2";
import { TestimonialsC2 } from "@/components/landing/c2/testimonials-c2";
import { PreviewC2 } from "@/components/landing/c2/preview-c2";
import { ProcessC2 } from "@/components/landing/c2/process-c2";
import { ComparisonC2 } from "@/components/landing/c2/comparison-c2";
import { FoundingC2 } from "@/components/landing/c2/founding-c2";
import { PricingC2 } from "@/components/landing/c2/pricing-c2";
import { FooterC2 } from "@/components/landing/c2/footer-c2";

export default function LandingC2Page() {
  const { user, roastForm, handleRoast } = useLandingRoast();

  return (
    <div className="min-h-screen bg-[var(--lv-c2-bg)] text-foreground">
      <Navbar landingVisualId="c2" showLandingVariationSwitcher navMode="concept" tone="c2" />
      <main>
        <HeroC2 roastForm={roastForm} />
        <TestimonialsC2 />
        <PreviewC2 />
        <ProcessC2 />
        <ComparisonC2 roastForm={roastForm} />
        <FoundingC2 user={user} loading={roastForm.loading} />
        <PricingC2 loading={roastForm.loading} onRoast={handleRoast} user={user} />
        <FooterC2 />
      </main>
    </div>
  );
}
