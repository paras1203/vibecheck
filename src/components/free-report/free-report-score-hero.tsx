"use client";

import Image from "next/image";
import type { FreeReportPayload } from "@/types/free-report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FreeReportProUpsell } from "@/components/free-report/free-report-pro-upsell";

function heroDataUrl(b64: string | null): string | null {
  if (!b64) return null;
  const b = b64.replace(/\s/g, "");
  if (b.startsWith("data:")) return b;
  const mime = b.startsWith("iVBORw0KGgo")
    ? "image/png"
    : b.startsWith("UklGR")
      ? "image/webp"
      : "image/jpeg";
  return `data:${mime};base64,${b}`;
}

export function FreeReportScoreHero({ data }: { data: FreeReportPayload }) {
  const hero = heroDataUrl(data.heroScreenshot);

  return (
    <>
      <FreeReportProUpsell />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conversion readiness</CardTitle>
            <p className="text-xs text-muted-foreground">
              Automated-only score from SEO, speed, structure, and trust signals—before human or AI
              diagnosis.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="font-mono text-5xl font-bold tabular-nums text-primary">
                {data.conversionReadinessScore}
              </span>
              <span className="pb-2 text-sm text-muted-foreground">/ 100</span>
            </div>
            {(
              [
                ["SEO", data.scoreBreakdown.seo],
                ["Performance", data.scoreBreakdown.performance],
                ["Structure", data.scoreBreakdown.structure],
                ["Trust", data.scoreBreakdown.trust],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-foreground">
                  <span>{label}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{val}</span>
                </div>
                <Progress value={val} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">First screen snapshot</CardTitle>
            <p className="text-xs text-muted-foreground">
              {data.audited_url} · {data.device} · {data.page_type}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row">
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:max-w-[340px]">
              {hero ? (
                <Image
                  src={hero}
                  alt="Captured viewport"
                  fill
                  className="object-cover object-top"
                  unoptimized
                  sizes="340px"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                  No hero image captured.
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <p className="font-medium text-foreground">Scroll & attention</p>
              <p className="text-muted-foreground">{data.scrollEffectiveness.situation}</p>
              <p className="text-foreground">{data.scrollEffectiveness.action}</p>
              <p className="text-xs text-muted-foreground">
                Page height ~{Math.round(data.pageHeight)}px. Most visitors decide on the first
                screen—weak hooks show up as higher bounce, not “bad traffic.”
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
