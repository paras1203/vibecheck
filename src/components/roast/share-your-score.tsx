"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Linkedin, Twitter, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShareScoreCard } from "@/components/roast/share-score-card";
import {
  type RoastShareInput,
  displayDomain,
  pickShareIssues,
  pickImprovementHeadline,
  buildSharePostText,
} from "@/lib/share-audit";

type ShareYourScoreProps = {
  roastData: RoastShareInput;
  overallScore: number;
  /** Toolbar-only row (no card / textarea). */
  compact?: boolean;
};

export function ShareYourScore({ roastData, overallScore, compact }: ShareYourScoreProps) {
  const [anonymize, setAnonymize] = useState(false);
  const pathname = usePathname() || "";
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://siteroast.ai";
    return `${window.location.origin}${pathname}`;
  }, [pathname]);
  const [copied, setCopied] = useState(false);

  const domainLabel = useMemo(
    () => displayDomain(roastData.audited_url, anonymize),
    [roastData.audited_url, anonymize],
  );

  const issues = useMemo(() => pickShareIssues(roastData), [roastData]);
  const improvement = useMemo(() => pickImprovementHeadline(roastData), [roastData]);

  const postText = useMemo(
    () =>
      buildSharePostText({
        score: overallScore,
        domainLabel,
        issues,
        improvement,
        shareUrl,
      }),
    [overallScore, domainLabel, issues, improvement, shareUrl],
  );

  const xHref = useMemo(() => {
    const text = `${postText}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  }, [postText]);

  const linkedInHref = useMemo(() => {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  }, [shareUrl]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(postText);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — try selecting the text manually");
    }
  }

  const shareButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={xHref} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
          <Twitter className="size-4" />
          X
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a
          href={linkedInHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="size-4" />
          LinkedIn
        </a>
      </Button>
      <Button variant="outline" size="sm" type="button" onClick={handleCopy} aria-label="Copy post text">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        Copy text
      </Button>
    </div>
  );

  if (compact) {
    return (
      <div
        className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
        aria-label="Share report summary"
      >
        <div className="flex items-center gap-2">
          <input
            id="share-anonymize-domain-compact"
            type="checkbox"
            checked={anonymize}
            onChange={(e) => setAnonymize(e.target.checked)}
            className="size-4 shrink-0 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Label htmlFor="share-anonymize-domain-compact" className="text-xs font-normal text-muted-foreground">
            Hide domain
          </Label>
        </div>
        {shareButtons}
      </div>
    );
  }

  return (
    <section className="w-full space-y-6" aria-labelledby="share-your-score-heading">
      <div>
        <h2
          id="share-your-score-heading"
          className="text-lg font-semibold tracking-tight text-foreground md:text-xl"
        >
          Share your score
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Share a concise summary of your conversion audit. Wording stays professional so you can post
          it publicly with confidence.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <input
            id="share-anonymize-domain"
            type="checkbox"
            checked={anonymize}
            onChange={(e) => setAnonymize(e.target.checked)}
            className="mt-1 size-4 shrink-0 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Label htmlFor="share-anonymize-domain" className="cursor-pointer font-normal leading-snug">
            Hide domain in preview and post
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Useful if you do not want the URL visible in your share.
            </span>
          </Label>
        </div>
        {shareButtons}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ShareScoreCard
          score={overallScore}
          domainLabel={domainLabel}
          issues={issues}
          improvement={improvement}
        />
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">Compare your score against similar sites.</p>
          <div>
            <Label htmlFor="share-post-text" className="text-label text-muted-foreground">
              Post text
            </Label>
            <textarea
              id="share-post-text"
              readOnly
              value={postText}
              rows={12}
              className="mt-2 w-full resize-y rounded-lg border border-border bg-surface-1 px-3 py-2.5 font-sans text-sm leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
