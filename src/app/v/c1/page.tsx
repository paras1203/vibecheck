"use client";

import { Navbar } from "@/components/navbar";
import { useLandingRoast } from "@/hooks/use-landing-roast";
import { HeroC1 } from "@/components/landing/c1/hero-c1";
import { SocialProofStrip } from "@/components/landing/shared/social-proof-strip";
import { PreviewC1 } from "@/components/landing/c1/preview-c1";
import { FeaturesA2 } from "@/components/landing/a2/features-a2";
import { ComparisonA2 } from "@/components/landing/a2/comparison-a2";
import { FoundingA2 } from "@/components/landing/a2/founding-a2";
import { PricingA2 } from "@/components/landing/a2/pricing-a2";
import { FooterA2 } from "@/components/landing/a2/footer-a2";

export default function LandingC1Page() {
  const { user, roastForm, handleRoast } = useLandingRoast();

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navbar landingVisualId="c1" showLandingVariationSwitcher navMode="concept" tone="dark" />
      <main>
        <HeroC1 roastForm={roastForm} />
        <SocialProofStrip variant="marquee" marqueePalette="c1" className="border-t-2 border-white/10" />
        <PreviewC1 />
        <FeaturesA2 />
        <ComparisonA2 roastForm={roastForm} />
        <FoundingA2 user={user} loading={roastForm.loading} />
        <PricingA2 loading={roastForm.loading} onRoast={handleRoast} user={user} />
        <FooterA2 />
      </main>
    </div>
  );
}
