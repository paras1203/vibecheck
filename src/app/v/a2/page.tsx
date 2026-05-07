"use client";

import { Navbar } from "@/components/navbar";
import { RoastGenerationOverlay } from "@/components/landing/roast-generation-overlay";
import { useLandingRoast } from "@/hooks/use-landing-roast";
import { HeroA2 } from "@/components/landing/a2/hero-a2";
import { SocialProofStrip } from "@/components/landing/shared/social-proof-strip";
import { PreviewA2 } from "@/components/landing/a2/preview-a2";
import { FeaturesA2 } from "@/components/landing/a2/features-a2";
import { ComparisonA2 } from "@/components/landing/a2/comparison-a2";
import { FoundingA2 } from "@/components/landing/a2/founding-a2";
import { PricingA2 } from "@/components/landing/a2/pricing-a2";
import { FooterA2 } from "@/components/landing/a2/footer-a2";

export default function LandingA2Page() {
  const {
    user,
    roastPhase,
    analysisComplete,
    loaderKey,
    teaserContent,
    accountCreditsLine,
    handleLoaderReveal,
    handleContinueToReport,
    roastForm,
    handleRoast,
  } = useLandingRoast();

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navbar landingVisualId="a2" showLandingVariationSwitcher navMode="concept" tone="dark" />
      <RoastGenerationOverlay
        phase={roastPhase}
        analysisComplete={analysisComplete}
        loaderKey={loaderKey}
        teaserContent={teaserContent}
        accountCreditsLine={accountCreditsLine}
        onReveal={handleLoaderReveal}
        onContinueToReport={handleContinueToReport}
      />
      <main>
        <HeroA2 roastForm={roastForm} />
        <SocialProofStrip variant="stats-only" />
        <PreviewA2 />
        <FeaturesA2 />
        <ComparisonA2 roastForm={roastForm} />
        <FoundingA2 user={user} loading={roastForm.loading} />
        <PricingA2 loading={roastForm.loading} onRoast={handleRoast} user={user} />
        <FooterA2 />
      </main>
    </div>
  );
}
