"use client";

import { useCallback, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { toast } from "sonner";
import { Copy, Loader2, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { IconFrame } from "@/components/ui/icon-frame";

type RoastPayload = {
  overall_score?: number;
  overview?: { overallScore?: number; executiveSummary?: string; roastAnalysis?: string };
  roastSummary?: string;
  hook?: string;
  script?: string;
  analysis?: string;
  verdict?: string;
  closer?: string;
  radarMetrics?: Record<string, number>;
  radar_scores?: Record<string, number>;
  quickWins?: Array<{
    title?: string;
    elementName?: string;
    problem?: string;
    fix?: string;
    lift?: string;
  }>;
  quick_wins?: Array<{
    title?: string;
    elementName?: string;
    problem?: string;
    fix?: string;
    lift?: string;
  }>;
  industry_guess?: string;
  audited_url?: string;
};

export type SocialPack = {
  linkedinPostSummary: string;
  linkedinFounderStory: string;
  xShortHook: string;
  xThreadOpener: string;
  ctaLinkedIn: string;
  ctaX: string;
};

function buildRequestBody(roastData: RoastPayload, anonymize: boolean) {
  const executive =
    roastData.hook ||
    roastData.overview?.executiveSummary ||
    roastData.roastSummary ||
    "";
  const roastAnalysis =
    [roastData.script, roastData.analysis, roastData.overview?.roastAnalysis]
      .filter(Boolean)
      .join("\n\n") ||
    roastData.verdict ||
    roastData.closer ||
    "";
  const quickWins = roastData.quickWins || roastData.quick_wins || [];
  const radarScores = roastData.radar_scores || roastData.radarMetrics || {};
  const overallScore =
    roastData.overall_score ?? roastData.overview?.overallScore;

  return {
    anonymize,
    auditedUrl: roastData.audited_url || "",
    overallScore,
    executiveSummary: executive,
    roastAnalysis,
    quickWins,
    radarScores,
    industryGuess: roastData.industry_guess,
  };
}

function CopyRow({ label, text }: { label: string; text: string }) {
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — try selecting the text");
    }
  }, [text]);

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
          <Copy className="size-3.5 stroke-[1.5]" />
          Copy
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

export function SocialContentPackSection({
  roastData,
  firebaseUser,
  reportId,
}: {
  roastData: RoastPayload;
  firebaseUser: User | null;
  reportId: string;
}) {
  const [anonymize, setAnonymize] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<SocialPack | null>(null);

  const reportUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/roast/${reportId}`;
  }, [reportId]);

  const generate = useCallback(async () => {
    if (!firebaseUser) {
      toast.error("Sign in to generate the social pack.");
      return;
    }
    setLoading(true);
    setPack(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/admin/social-content-pack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildRequestBody(roastData, anonymize)),
      });
      const data = (await res.json()) as {
        pack?: SocialPack;
        error?: string;
        details?: string;
      };
      if (!res.ok) {
        throw new Error(data.details || data.error || "Request failed");
      }
      if (!data.pack) throw new Error("Empty response");
      setPack(data.pack);
      toast.success("Social content pack ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }, [anonymize, firebaseUser, roastData]);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <IconFrame size="sm" className="bg-primary/10 text-primary">
              <Share2 className="size-4 stroke-[1.5]" />
            </IconFrame>
            <div>
              <CardTitle className="text-lg">Social Content Pack</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Turn this audit into LinkedIn and X drafts. Mapped to{" "}
                <span className="font-mono text-xs text-foreground">{reportUrl || `…/roast/${reportId}`}</span>
                {roastData.audited_url ? (
                  <>
                    {" "}
                    · Source URL{" "}
                    <span className="font-mono text-xs break-all text-foreground">
                      {roastData.audited_url}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={anonymize}
                onChange={(e) => setAnonymize(e.target.checked)}
                className="size-4 rounded border-input"
              />
              Anonymize domain in generated copy
            </label>
            <Button
              type="button"
              disabled={loading}
              onClick={() => void generate()}
              className="flex w-full items-center gap-2 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin stroke-[1.5]" />
                  Generating…
                </>
              ) : pack ? (
                "Regenerate"
              ) : (
                "Generate social pack"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <SectionHeader
          title="Drafts"
          description="Professional tone from your audit findings — not for posting verbatim without a pass."
          size="compact"
        />
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          <strong className="text-foreground">Review before posting:</strong> Edit for your voice,
          fact-check claims, and ensure nothing identifies a client you must keep confidential.
        </div>
        {!pack && !loading ? (
          <p className="text-sm text-muted-foreground">
            Generate to create a LinkedIn summary, founder-style angle, X hook, thread opener, and
            platform-specific CTAs from this report.
          </p>
        ) : null}
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin stroke-[1.5]" />
            Drafting…
          </p>
        ) : null}
        {pack ? (
          <div className="space-y-4">
            <CopyRow label="1. LinkedIn post summary" text={pack.linkedinPostSummary} />
            <CopyRow label="2. LinkedIn founder-style story angle" text={pack.linkedinFounderStory} />
            <CopyRow label="3. X short post hook" text={pack.xShortHook} />
            <CopyRow label="4. X thread opener" text={pack.xThreadOpener} />
            <CopyRow label="5. CTA — LinkedIn" text={pack.ctaLinkedIn} />
            <CopyRow label="6. CTA — X" text={pack.ctaX} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
