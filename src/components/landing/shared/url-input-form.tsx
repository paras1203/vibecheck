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

  const inputClass =
    variant === "a1"
      ? "h-12 flex-1 rounded-xl border-[var(--lv-bold-border)] bg-[var(--lv-bold-surface-1)]/80 text-[var(--foreground)] placeholder:text-[var(--lv-bold-muted)] sm:h-14"
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

  const primaryBtnClass =
    variant === "a1"
      ? "h-12 rounded-xl bg-[var(--lv-bold-primary)] px-8 font-semibold text-[var(--lv-bold-primary-foreground)] hover:opacity-90 sm:h-14"
      : variant === "a2"
        ? "h-12 rounded-none border-2 border-white bg-white px-8 font-semibold text-black hover:bg-white/90 sm:h-14"
        : variant === "b1"
          ? "h-12 rounded-2xl px-8 font-semibold sm:h-14"
          : variant === "c2"
            ? "h-12 rounded-2xl bg-[var(--lv-c2-accent)] px-8 font-semibold text-white hover:bg-[color-mix(in_srgb,var(--lv-c2-accent)_92%,black)] sm:h-14"
            : variant === "c3"
              ? "h-12 rounded-lg bg-[var(--lv-c3-accent)] px-8 font-semibold text-[var(--lv-c3-bg)] hover:opacity-90 sm:h-14"
              : variant === "b2"
                ? "h-12 rounded-lg px-8 font-semibold sm:h-14"
                : "h-12 rounded-lg px-8 font-semibold sm:h-14";

  const secondaryBtnClass =
    variant === "a1"
      ? "h-12 rounded-xl border border-[var(--lv-bold-border)] bg-transparent px-6 font-semibold text-[var(--foreground)] hover:bg-[var(--lv-bold-surface-2)] sm:h-14"
      : variant === "a2"
        ? "h-12 rounded-none border-2 border-white/40 bg-transparent px-6 font-semibold text-white hover:bg-white/10 sm:h-14"
        : variant === "b1"
          ? "h-12 rounded-2xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)] px-6 font-semibold sm:h-14"
          : variant === "c2"
            ? "h-12 rounded-2xl border border-[var(--lv-c2-border)] bg-[var(--lv-c2-bg)] px-6 font-semibold text-[var(--lv-c2-text)] sm:h-14"
            : variant === "c3"
              ? "h-12 rounded-lg border border-[var(--lv-c3-border)] bg-transparent px-6 font-semibold text-[var(--lv-c3-text)] hover:bg-[var(--lv-c3-surface-2)] sm:h-14"
              : variant === "b2"
                ? "h-12 rounded-lg border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] px-6 font-semibold sm:h-14"
                : "h-12 rounded-lg px-6 font-semibold sm:h-14";

  const microcopyClass =
    variant === "a1" || variant === "a2"
      ? "text-center text-sm text-[var(--lv-bold-muted)]"
      : variant === "b1" || variant === "b2" || variant === "c2"
        ? "text-center text-sm text-muted-foreground"
        : variant === "c3"
          ? "text-center text-sm text-[var(--lv-c3-muted)]"
          : "text-center text-sm text-muted-foreground";

  const inner = (
    <>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Button
            onClick={onRoast}
            disabled={loading}
            size="lg"
            className={cn(primaryBtnClass, variant === "default" && "sm:h-14")}
            variant={
              variant === "b1" || variant === "b2" || variant === "c2" ? "default" : undefined
            }
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
      </div>
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
      <div className={cn("lv-glass lv-glow-violet w-full max-w-2xl rounded-2xl p-5 shadow-surface-sm md:p-6", className)}>
        <div className="flex flex-col gap-4">{inner}</div>
      </div>
    );
  }

  return <div className={cn("relative flex w-full max-w-2xl flex-col gap-4", className)}>{inner}</div>;
}
