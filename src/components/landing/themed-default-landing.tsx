"use client";

import { Navbar } from "@/components/navbar";
import { RoastGenerationOverlay } from "@/components/landing/roast-generation-overlay";
import { useLandingRoast } from "@/hooks/use-landing-roast";
import { HeroA1 } from "@/components/landing/a1/hero-a1";
import { PreviewA1 } from "@/components/landing/a1/preview-a1";
import { FeaturesA1 } from "@/components/landing/a1/features-a1";
import { ComparisonA1 } from "@/components/landing/a1/comparison-a1";
import { FoundingA1 } from "@/components/landing/a1/founding-a1";
import { PricingA1 } from "@/components/landing/a1/pricing-a1";
import { FooterA1 } from "@/components/landing/a1/footer-a1";

export function ThemedDefaultLanding() {
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

  const overlay = (
    <RoastGenerationOverlay
      phase={roastPhase}
      analysisComplete={analysisComplete}
      loaderKey={loaderKey}
      teaserContent={teaserContent}
      accountCreditsLine={accountCreditsLine}
      onReveal={handleLoaderReveal}
      onContinueToReport={handleContinueToReport}
    />
  );

  return (
    <div className="min-h-screen w-full min-w-0 bg-background text-foreground">
      <Navbar landingVisualId="a1" showLandingVariationSwitcher={false} navMode="concept" tone="default" />
      {overlay}
      <main className="w-full min-w-0 overflow-x-clip">
        <HeroA1 roastForm={roastForm} />
        <PreviewA1 />
        <FeaturesA1 />
        <ComparisonA1 roastForm={roastForm} />
        <FoundingA1 user={user} loading={roastForm.loading} />
        <PricingA1 loading={roastForm.loading} onRoast={handleRoast} user={user} />
        <FooterA1 />
      </main>
    </div>
  );
}
