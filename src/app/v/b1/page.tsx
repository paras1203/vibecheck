"use client";

import { Navbar } from "@/components/navbar";
import { RoastGenerationOverlay } from "@/components/landing/roast-generation-overlay";
import { useLandingRoast } from "@/hooks/use-landing-roast";
import { HeroB1 } from "@/components/landing/b1/hero-b1";
import { TestimonialsB1 } from "@/components/landing/b1/testimonials-b1";
import { PreviewB1 } from "@/components/landing/b1/preview-b1";
import { ProcessB1 } from "@/components/landing/b1/process-b1";
import { ComparisonB1 } from "@/components/landing/b1/comparison-b1";
import { FoundingB1 } from "@/components/landing/b1/founding-b1";
import { PricingB1 } from "@/components/landing/b1/pricing-b1";
import { FooterB1 } from "@/components/landing/b1/footer-b1";

export default function LandingB1Page() {
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
    <div className="min-h-screen bg-[var(--lv-minimal-bg)] text-foreground">
      <Navbar landingVisualId="b1" showLandingVariationSwitcher navMode="concept" tone="minimal" />
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
        <HeroB1 roastForm={roastForm} />
        <TestimonialsB1 />
        <PreviewB1 />
        <ProcessB1 />
        <ComparisonB1 roastForm={roastForm} />
        <FoundingB1 user={user} loading={roastForm.loading} />
        <PricingB1 loading={roastForm.loading} onRoast={handleRoast} user={user} />
        <FooterB1 />
      </main>
    </div>
  );
}
