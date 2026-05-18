"use client";

import { Navbar } from "@/components/navbar";
import { useLandingRoast } from "@/hooks/use-landing-roast";
import { HeroB2 } from "@/components/landing/b2/hero-b2";
import { StatsBar } from "@/components/landing/shared/stats-bar";
import { PreviewB2 } from "@/components/landing/b2/preview-b2";
import { FeaturesB2 } from "@/components/landing/b2/features-b2";
import { ComparisonB2 } from "@/components/landing/b2/comparison-b2";
import { FoundingB1 } from "@/components/landing/b1/founding-b1";
import { PricingB2 } from "@/components/landing/b2/pricing-b2";
import { FooterB2 } from "@/components/landing/b2/footer-b2";

export default function LandingB2Page() {
  const { user, roastForm, handleRoast } = useLandingRoast();

  return (
    <div className="min-h-screen bg-[var(--lv-minimal-bg)] text-foreground">
      <Navbar landingVisualId="b2" showLandingVariationSwitcher navMode="concept" tone="minimal" />
      <main>
        <HeroB2 roastForm={roastForm} />
        <StatsBar />
        <PreviewB2 />
        <FeaturesB2 />
        <ComparisonB2 roastForm={roastForm} />
        <FoundingB1 user={user} loading={roastForm.loading} />
        <PricingB2 loading={roastForm.loading} onRoast={handleRoast} user={user} />
        <FooterB2 />
      </main>
    </div>
  );
}
