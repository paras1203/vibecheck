"use client";

import { Navbar } from "@/components/navbar";
import { RoastGenerationOverlay } from "@/components/landing/roast-generation-overlay";
import { useLandingRoast } from "@/hooks/use-landing-roast";
import { StatsBar } from "@/components/landing/shared/stats-bar";
import { HeroC3 } from "@/components/landing/c3/hero-c3";
import { StepsC3 } from "@/components/landing/c3/steps-c3";
import { ComparisonC3 } from "@/components/landing/c3/comparison-c3";
import { FoundingC3 } from "@/components/landing/c3/founding-c3";
import { PricingC3 } from "@/components/landing/c3/pricing-c3";
import { FooterC3 } from "@/components/landing/c3/footer-c3";

export default function LandingC3Page() {
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
    <div className="min-h-screen bg-[var(--lv-c3-bg)] text-[var(--lv-c3-text)]">
      <Navbar landingVisualId="c3" showLandingVariationSwitcher navMode="concept" tone="c3" />
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
        <HeroC3 roastForm={roastForm} />
        <StatsBar palette="c3" />
        <StepsC3 />
        <ComparisonC3 roastForm={roastForm} />
        <FoundingC3 user={user} loading={roastForm.loading} />
        <PricingC3 loading={roastForm.loading} onRoast={handleRoast} user={user} />
        <FooterC3 />
      </main>
    </div>
  );
}
