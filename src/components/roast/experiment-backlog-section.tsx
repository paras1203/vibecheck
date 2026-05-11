import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { FlaskConical } from "lucide-react";
import { resolveExperimentItems } from "@/lib/report-artifacts-html";
import type { ReportArtifactsInput } from "@/lib/report-artifacts-html";

type Props = { roastLike: ReportArtifactsInput };

export function ExperimentBacklogSection({ roastLike }: Props) {
  const items = resolveExperimentItems(roastLike);
  if (!items.length) return null;
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <FlaskConical className="size-4 stroke-[1.5]" />
          </IconFrame>
          Experiment backlog
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {items.map((it) => (
          <div key={it.testName} className="rounded-lg border border-border-muted bg-surface-2/20 p-3">
            <p className="font-semibold text-foreground">{it.testName}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Hypothesis:</span> {it.hypothesis}
              </li>
              <li>
                <span className="font-medium text-foreground">Primary metric:</span>{" "}
                {it.primaryMetric}
              </li>
              <li>
                <span className="font-medium text-foreground">Variant:</span> {it.variantDescription}
              </li>
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
