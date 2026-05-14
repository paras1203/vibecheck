"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { getRoastInputMicrocopy } from "@/lib/landing-copy";
import { cn } from "@/lib/utils";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export type UrlInputVariant = "a1" | "a2" | "b1" | "b2" | "c2" | "c3" | "default";

type UrlInputFormProps = LandingRoastFormProps & {
  variant?: UrlInputVariant;
  showSecondarySample?: boolean;
  secondaryHref?: string;
  className?: string;
};

const HERO_WRAP_A1 = "mx-auto w-full max-w-xl sm:max-w-2xl";
const HERO_WRAP_B1 = "mx-auto w-full max-w-xl sm:max-w-2xl";

export function UrlInputForm({
  url,
  setUrl,
  loading,
  error,
  onRoast,
  variant = "default",
  showSecondarySample = true,
  secondaryHref = "#preview",
  className,
}: UrlInputFormProps) {
  const roastMicrocopy = getRoastInputMicrocopy();
  const isHeroStackB1 = variant === "b1";

  const inputClass =
    variant === "a1"
      ? "h-12 flex-1 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground sm:h-14"
      : variant === "a2"
        ? "h-12 flex-1 rounded-none border-2 border-white bg-black text-white placeholder:text-white/50 sm:h-14"
        : variant === "b1"
          ? "h-12 flex-1 rounded-2xl border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] shadow-surface-sm sm:h-14"
          : variant === "c2"
            ? "h-12 flex-1 rounded-2xl border border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)] shadow-[0_1px_0_rgba(28,25,23,0.04),0_8px_24px_rgba(28,25,23,0.06)] sm:h-14"
            : variant === "c3"
              ? "h-12 flex-1 rounded-lg border border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-1)] text-[var(--lv-c3-text)] placeholder:text-[var(--lv-c3-muted)] sm:h-14"
              : variant === "b2"
                ? "h-12 flex-1 rounded-lg border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] sm:h-14"
                : "h-12 flex-1 rounded-lg border-border text-base sm:h-14 sm:text-lg";

  const inputClassHeroA1 =
    "h-12 min-w-0 flex-1 rounded-2xl border-border bg-background text-center text-sm text-foreground shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_30%,transparent)] ring-2 ring-primary/25 ring-offset-2 ring-offset-background placeholder:text-muted-foreground focus-visible:ring-primary/45 sm:h-14 sm:text-[0.9375rem]";
  const inputClassHeroB1 =
    "h-9 w-full rounded-xl border-[color-mix(in_srgb,var(--lv-minimal-border)_82%,var(--lv-minimal-accent)_18%)] bg-[color-mix(in_srgb,var(--lv-minimal-bg)_94%,var(--lv-minimal-accent)_6%)] text-sm text-[var(--lv-minimal-text)] shadow-none ring-1 ring-[var(--lv-minimal-accent)]/12 placeholder:text-muted-foreground sm:h-10";

  const primaryBtnClass =
    variant === "a1"
      ? "h-12 rounded-2xl border-0 bg-primary px-8 font-semibold text-primary-foreground shadow-none hover:opacity-90 sm:h-14"
      : variant === "a2"
        ? "h-12 rounded-none border-2 border-white bg-white px-8 font-semibold text-black hover:bg-white/90 sm:h-14"
        : variant === "b1"
          ? "h-12 rounded-2xl border-0 px-8 font-semibold shadow-none sm:h-14"
          : variant === "c2"
            ? "h-12 rounded-2xl bg-[var(--lv-c2-accent)] px-8 font-semibold text-white hover:bg-[color-mix(in_srgb,var(--lv-c2-accent)_92%,black)] sm:h-14"
            : variant === "c3"
              ? "h-12 rounded-lg bg-[var(--lv-c3-accent)] px-8 font-semibold text-[var(--lv-c3-bg)] hover:opacity-90 sm:h-14"
              : variant === "b2"
                ? "h-12 rounded-lg px-8 font-semibold sm:h-14"
                : "h-12 rounded-lg px-8 font-semibold sm:h-14";

  const heroPrimaryB1 =
    "h-9 w-full rounded-xl border-0 px-5 text-sm font-semibold shadow-none sm:h-9";

  const secondaryBtnClass =
    variant === "a1"
      ? "h-12 rounded-2xl border border-border bg-secondary px-6 font-semibold text-secondary-foreground shadow-none hover:bg-secondary/80 sm:h-14"
      : variant === "a2"
        ? "h-12 rounded-none border-2 border-white/40 bg-transparent px-6 font-semibold text-white hover:bg-white/10 sm:h-14"
        : variant === "b1"
          ? "h-12 rounded-2xl border-0 bg-[var(--lv-minimal-surface-2)] px-6 font-semibold text-[var(--lv-minimal-text)] shadow-none hover:opacity-90 sm:h-14"
          : variant === "c2"
            ? "h-12 rounded-2xl border border-[var(--lv-c2-border)] bg-[var(--lv-c2-bg)] px-6 font-semibold text-[var(--lv-c2-text)] sm:h-14"
            : variant === "c3"
              ? "h-12 rounded-lg border border-[var(--lv-c3-border)] bg-transparent px-6 font-semibold text-[var(--lv-c3-text)] hover:bg-[var(--lv-c3-surface-2)] sm:h-14"
              : variant === "b2"
                ? "h-12 rounded-lg border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] px-6 font-semibold sm:h-14"
                : "h-12 rounded-lg px-6 font-semibold sm:h-14";

  const microcopyClass =
    variant === "a1"
      ? "text-center text-sm text-muted-foreground"
      : variant === "a2"
        ? "text-center text-sm text-white/65"
        : variant === "b1" || variant === "b2" || variant === "c2"
          ? "text-center text-sm text-muted-foreground"
          : variant === "c3"
            ? "text-center text-sm text-[var(--lv-c3-muted)]"
            : "text-center text-sm text-muted-foreground";

  const sampleLinkLight =
    "text-center text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline sm:text-xs";

  const heroButtonColumnB1 = (
    <div className="flex w-full flex-col gap-2 sm:gap-1.5">
      <Button
        onClick={onRoast}
        disabled={loading}
        size="sm"
        className={cn(heroPrimaryB1, "bg-[var(--lv-minimal-accent)] text-white")}
      >
        {loading ? "Roasting..." : "Roast My Site"}
      </Button>
      {showSecondarySample ? (
        <Link href={secondaryHref} className={sampleLinkLight}>
          See sample report
        </Link>
      ) : null}
    </div>
  );

  const classicButtons = (
    <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
      <Button
        onClick={onRoast}
        disabled={loading}
        size="lg"
        className={cn(primaryBtnClass, variant === "default" && "sm:h-14")}
        variant={variant === "b1" || variant === "b2" || variant === "c2" ? "default" : undefined}
      >
        {loading ? "Roasting..." : "Roast My Site"}
      </Button>
      {showSecondarySample ? (
        <Button
          variant="secondary"
          size="lg"
          className={cn(
            secondaryBtnClass,
            variant === "default" && "sm:h-14",
            (variant === "b1" || variant === "b2" || variant === "c2" || variant === "c3") &&
              "bg-transparent shadow-none",
          )}
          asChild
        >
          <Link href={secondaryHref}>See sample report</Link>
        </Button>
      ) : null}
    </div>
  );

  const classicRow = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
      {variant === "b2" ? (
        <div className="lv-input-focus-ring-b2 flex min-w-0 flex-1 rounded-lg border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)]">
          <Input
            type="text"
            placeholder="Enter URL (e.g., https://example.com or www.example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) onRoast();
            }}
            disabled={loading}
            className={cn(inputClass, "border-0 shadow-none focus-visible:ring-0")}
          />
        </div>
      ) : variant === "c3" ? (
        <div className="lv-input-focus-ring-c3 flex min-w-0 flex-1 rounded-lg border border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-1)]">
          <Input
            type="text"
            placeholder="Enter URL (e.g., https://example.com or www.example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) onRoast();
            }}
            disabled={loading}
            className={cn(inputClass, "border-0 shadow-none focus-visible:ring-0")}
          />
        </div>
      ) : (
        <Input
          type="text"
          placeholder="Enter URL (e.g., https://example.com or www.example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) onRoast();
          }}
          disabled={loading}
          className={inputClass}
        />
      )}
      {classicButtons}
    </div>
  );

  const inner = (
    <>
      {variant === "a1" ? (
        <div className="flex w-full flex-col gap-2">
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
              className={inputClassHeroA1}
            />
            <Button
              onClick={onRoast}
              disabled={loading}
              size="lg"
              className="h-12 shrink-0 rounded-2xl bg-primary px-8 font-semibold text-primary-foreground hover:opacity-90 sm:h-14"
            >
              {loading ? "Roasting..." : "Roast My Site"}
            </Button>
          </div>
          {showSecondarySample ? (
            <Link href={secondaryHref} className={sampleLinkLight}>
              See sample report
            </Link>
          ) : null}
        </div>
      ) : isHeroStackB1 ? (
        <div className="flex w-full flex-col gap-2.5">
          <Input
            type="text"
            placeholder="Enter URL (e.g., https://example.com or www.example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) onRoast();
            }}
            disabled={loading}
            className={inputClassHeroB1}
          />
          {heroButtonColumnB1}
        </div>
      ) : (
        classicRow
      )}
      {roastMicrocopy ? <p className={microcopyClass}>{roastMicrocopy}</p> : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );

  if (variant === "a1") {
    return (
      <div className={cn("flex w-full flex-col gap-4", HERO_WRAP_A1, className)}>
        {inner}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex w-full flex-col gap-4",
        variant === "b1" ? HERO_WRAP_B1 : "max-w-2xl",
        variant === "b1" ? "mx-auto" : "",
        className,
      )}
    >
      {inner}
    </div>
  );
}
