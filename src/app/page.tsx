"use client";

import { HeroHighlight } from "@/components/ui/hero-highlight";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/context/AuthContext";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { ReportPreviewSection } from "@/components/landing/report-preview-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FeaturesBentoSection } from "@/components/landing/features-bento-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { FoundingCustomerSection } from "@/components/landing/founding-customer-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { RoastGenerationOverlay } from "@/components/landing/roast-generation-overlay";
import { useLandingRoast } from "@/hooks/use-landing-roast";

export default function Home() {
  const { user } = useAuth();
  const {
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
    <div className="min-h-screen bg-background">
      <HeroHighlight containerClassName="!h-auto min-h-screen bg-background">
        <Navbar showLandingVariationSwitcher />

        <RoastGenerationOverlay
          phase={roastPhase}
          analysisComplete={analysisComplete}
          loaderKey={loaderKey}
          teaserContent={teaserContent}
          accountCreditsLine={accountCreditsLine}
          onReveal={handleLoaderReveal}
          onContinueToReport={handleContinueToReport}
        />

        <div className="w-full">
          <HeroSection {...roastForm} />
          <ProblemSection />
          <ReportPreviewSection />
          <HowItWorksSection />
          <FeaturesBentoSection />
          <ComparisonSection {...roastForm} />
          <FoundingCustomerSection user={user} loading={roastForm.loading} />
          <PricingSection loading={roastForm.loading} onRoast={handleRoast} user={user} />
          <LandingFooter />
        </div>
      </HeroHighlight>
    </div>
  );
}
