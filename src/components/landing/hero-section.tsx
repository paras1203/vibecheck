"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Highlight } from "@/components/ui/hero-highlight";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { scrollToSection } from "./landing-scroll";
import { getRoastInputMicrocopy } from "@/lib/landing-copy";

export type LandingRoastFormProps = {
  url: string;
  setUrl: (v: string) => void;
  loading: boolean;
  error: string | null;
  onRoast: () => void;
};

export function HeroSection({ url, setUrl, loading, error, onRoast }: LandingRoastFormProps) {
  const roastMicrocopy = getRoastInputMicrocopy();
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-20 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-72 max-w-3xl rounded-full bg-primary/10 blur-3xl glow-primary-soft dark:bg-primary/12" />
      <div className="relative space-y-4 text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
          Your Landing Page is <Highlight>Leaking Money.</Highlight>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
          AI-powered audit. Fix your conversion rate in minutes.
        </p>
      </div>

      <div className="relative flex w-full max-w-2xl flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
          <Input
            type="text"
            placeholder="Enter URL (e.g., https://example.com or www.example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) onRoast();
            }}
            disabled={loading}
            className="h-12 flex-1 rounded-lg border-border text-base sm:h-14 sm:text-lg"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
            <Button
              onClick={onRoast}
              disabled={loading}
              size="lg"
              className="h-12 rounded-lg px-8 font-semibold sm:h-14"
            >
              {loading ? "Roasting..." : "Roast My Site"}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="h-12 rounded-lg px-6 font-semibold sm:h-14"
              asChild
            >
              <Link href="#preview">See sample report</Link>
            </Button>
          </div>
        </div>
        {roastMicrocopy ? (
          <p className="text-center text-sm text-muted-foreground">{roastMicrocopy}</p>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <button
        type="button"
        className="absolute bottom-14 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground animate-bounce"
        onClick={() => scrollToSection("problem")}
        aria-label="Scroll to next section"
      >
        <ArrowDown className="size-5 stroke-[1.5]" />
      </button>
    </section>
  );
}
