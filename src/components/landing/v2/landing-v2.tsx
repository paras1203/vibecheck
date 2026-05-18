"use client";

import { Navbar } from "@/components/navbar";
import { useLandingRoast } from "@/hooks/use-landing-roast";
import { HeroV2 } from "@/components/landing/v2/hero-v2";
import { FeaturesV2 } from "@/components/landing/v2/features-v2";
import { PreviewV2 } from "@/components/landing/v2/preview-v2";
import { ComparisonV2 } from "@/components/landing/v2/comparison-v2";
import { FaqV2 } from "@/components/landing/v2/faq-v2";
import { PricingV2 } from "@/components/landing/v2/pricing-v2";
import { FoundingV2 } from "@/components/landing/v2/founding-v2";
import { FooterV2 } from "@/components/landing/v2/footer-v2";

export function LandingV2() {
  const { user, roastForm, handleRoast } = useLandingRoast();

  return (
    <div className="min-h-screen w-full min-w-0 bg-background text-foreground">
      <Navbar
        landingVisualId={null}
        showLandingVariationSwitcher={false}
        navMode="concept"
        tone="default"
      />
      <main className="w-full min-w-0 overflow-x-clip">
        <HeroV2 roastForm={roastForm} />
        <FeaturesV2 />
        <PreviewV2 onRoast={handleRoast} />
        <ComparisonV2 roastForm={roastForm} />
        <FaqV2 />
        <PricingV2
          loading={roastForm.loading}
          onRoast={handleRoast}
          user={user}
        />
        <FoundingV2 user={user} loading={roastForm.loading} />
        <FooterV2 />
      </main>
    </div>
  );
}
