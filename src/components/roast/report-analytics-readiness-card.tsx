import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { Gauge } from "lucide-react";
import type { TechStackAuditResult } from "@/lib/audits/tech-stack-audit";
import type { BehaviourToolsAdvice } from "@/lib/audits/behaviour-tools";

type Props = {
  tech_stack?: TechStackAuditResult | null;
  behaviour_tools?: BehaviourToolsAdvice | null;
};

export function ReportAnalyticsReadinessCard({ tech_stack, behaviour_tools }: Props) {
  const tools =
    tech_stack?.detectedTools?.filter((t) =>
      ["analytics", "heatmap", "tag_manager"].includes(t.category)
    ) ?? [];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <Gauge className="size-4 stroke-[1.5]" />
          </IconFrame>
          Analytics readiness
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Patterns from HTML—not a substitute for verifying your tag manager setup.
        </p>
      </CardHeader>
      <CardContent className="text-sm">
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {tools.length > 0 ? (
            tools.map((t) => (
              <li key={t.id}>
                <span className="text-foreground">{t.name}</span>{" "}
                <span className="text-xs">({t.category})</span>
              </li>
            ))
          ) : (
            <li>No common analytics / heatmap / tag-manager signatures detected.</li>
          )}
        </ul>
        {behaviour_tools?.recommendationMessage ? (
          <p className="mt-3 text-sm text-foreground">{behaviour_tools.recommendationMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
