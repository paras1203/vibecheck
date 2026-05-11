import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { MapPin } from "lucide-react";
import type { PageSpeedSummary } from "@/lib/pagespeed";
import type { TrafficEstimate } from "@/types/roast-extras";

type PerfAudit = NonNullable<
  import("@/lib/audits/performance-pagespeed").PerformanceAuditResult
>;

type Props = {
  page_type?: string;
  trafficEstimate?: TrafficEstimate;
  performance?: PageSpeedSummary | null;
  performance_audit?: PerfAudit | null;
  price_guess?: number;
  price_from_page?: boolean;
  price_billing_note?: string;
};

function pageLabel(pt: string | undefined) {
  switch (pt) {
    case "landing":
      return "Landing";
    case "blog":
      return "Blog";
    case "product":
      return "Product";
    case "unknown":
      return "Unknown";
    default:
      return pt || "—";
  }
}

export function ReportContextCard({
  page_type,
  trafficEstimate,
  performance,
  performance_audit,
  price_guess,
  price_from_page,
  price_billing_note,
}: Props) {
  const mobile = performance_audit?.mobile;
  const perfScore =
    typeof performance?.performanceScore === "number"
      ? performance.performanceScore
      : typeof mobile?.performanceScore === "number"
        ? mobile.performanceScore
        : null;
  const metricBits: string[] = [];
  if (mobile?.lcp) metricBits.push(`LCP ${mobile.lcp}`);
  if (mobile?.inp) metricBits.push(`INP ${mobile.inp}`);
  if (!metricBits.length && mobile?.cls) metricBits.push(`CLS ${mobile.cls}`);

  const priceLine =
    typeof price_guess === "number" && price_guess > 0
      ? `$${price_guess.toLocaleString()}${price_from_page ? " (from page)" : " (illustrative)"}`
      : "—";

  const trafficLine = trafficEstimate
    ? `${trafficEstimate.monthlySessions.toLocaleString()} visits/mo (${
        trafficEstimate.source === "gemini" ? "model estimate" : "benchmark"
      })`
    : "—";

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <MapPin className="size-4 stroke-[1.5]" />
          </IconFrame>
          Scan context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Page type:</span>{" "}
          {pageLabel(page_type)}
        </p>
        <p>
          <span className="font-medium text-foreground">Traffic (illustrative):</span>{" "}
          {trafficLine}
          {trafficEstimate?.note ? ` — ${trafficEstimate.note}` : ""}
        </p>
        <p>
          <span className="font-medium text-foreground">Deal value (models):</span> {priceLine}
          {price_billing_note?.trim() ? ` — ${price_billing_note.trim()}` : ""}
        </p>
        <p>
          <span className="font-medium text-foreground">Lighthouse performance:</span>{" "}
          {perfScore ?? "—"} ({metricBits.join(" · ") || "—"}
          {!mobile ? ", lab data not captured in this snapshot" : ""})
        </p>
      </CardContent>
    </Card>
  );
}
