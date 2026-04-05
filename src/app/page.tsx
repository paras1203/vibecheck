"use client";

import { useState, useCallback, useMemo, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { buildRoastTeaser } from "@/lib/roast-teaser";
import { persistRoastForClientNavigation, stripRoastApiBillingFields } from "@/lib/roast-storage";
import type { AuditReportPayload } from "@/lib/report-html";
import { isPreviewRoastFree } from "@/lib/credits-config";
type RoastPhase = "idle" | "analyzing" | "teaser";

export default function Home() {
  const router = useRouter();
  const { user, firebaseUser, refreshProfile, updateCredits } = useAuth();
  const [url, setUrl] = useState("");
  const [device] = useState<"desktop" | "mobile">("desktop");
  const [roastPhase, setRoastPhase] = useState<RoastPhase>("idle");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roastData, setRoastData] = useState<Record<string, unknown> | null>(null);
  const [loaderKey, setLoaderKey] = useState(0);

  const handleRoast = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoaderKey((k) => k + 1);
    setRoastPhase("analyzing");
    setAnalysisComplete(false);
    setError(null);
    setRoastData(null);

    try {
      const idToken = firebaseUser
        ? await firebaseUser.getIdToken().catch(() => null)
        : null;
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          device,
          ...(idToken ? { idToken } : {}),
        }),
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        const errorMsg = (data.error as string) || "Failed to generate roast";
        const details = data.details ? `: ${String(data.details)}` : "";
        if (response.status === 402) {
          toast.error("Not enough credits", { description: String(data.details || errorMsg) });
        }
        throw new Error(`${errorMsg}${details}`);
      }

      const creditsRemaining = data.creditsRemaining;
      const clean = stripRoastApiBillingFields(data);

      startTransition(() => {
        setRoastData(clean);
        if (typeof creditsRemaining === "number") {
          updateCredits(creditsRemaining);
        }
        setAnalysisComplete(true);
      });
    } catch (err) {
      startTransition(() => {
        setError(err instanceof Error ? err.message : "An error occurred");
        setRoastPhase("idle");
        setAnalysisComplete(false);
      });
    }
  };

  const handleLoaderReveal = useCallback(() => {
    setRoastPhase("teaser");
  }, []);

  const handleContinueToReport = useCallback(() => {
    if (!roastData) return;
    const id = `${Date.now()}`;
    const payload: AuditReportPayload = {
      ...(stripRoastApiBillingFields(roastData as Record<string, unknown>) as AuditReportPayload),
      audited_url: url.trim() || (roastData as AuditReportPayload).audited_url,
    };
    try {
      persistRoastForClientNavigation(id, payload);
      router.push(`/roast/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Storage full or unavailable.";
      toast.error("Could not open full report", {
        description: `${msg} Try disabling private mode or clear site data for this origin.`,
      });
    }
  }, [roastData, url, router]);

  const roastBusy = roastPhase !== "idle";
  const teaserContent = useMemo(() => {
    if (!roastData) return null;
    const merged = {
      ...roastData,
      audited_url:
        (typeof roastData.audited_url === "string" && roastData.audited_url.trim()) ||
        url.trim() ||
        roastData.audited_url,
    } as Record<string, unknown>;
    return buildRoastTeaser(merged);
  }, [roastData, url]);

  useEffect(() => {
    if (roastPhase === "teaser" && user) {
      void refreshProfile();
    }
  }, [roastPhase, user, refreshProfile]);

  const accountCreditsLine =
    user && roastPhase === "teaser"
      ? isPreviewRoastFree()
        ? `This preview is free (0 credits). Your balance: ${user.credits} credits.`
        : `Credits remaining: ${user.credits}`
      : null;

  const roastForm = {
    url,
    setUrl,
    loading: roastBusy,
    error,
    onRoast: handleRoast,
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroHighlight containerClassName="!h-auto min-h-screen bg-background">
        <Navbar />

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
          <FoundingCustomerSection user={user} loading={roastBusy} />
          <PricingSection loading={roastBusy} onRoast={handleRoast} user={user} />
          <LandingFooter />
        </div>
      </HeroHighlight>
    </div>
  );
}
