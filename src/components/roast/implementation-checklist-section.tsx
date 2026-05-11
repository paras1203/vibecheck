import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { ListTodo } from "lucide-react";
import { resolveChecklistItems } from "@/lib/report-artifacts-html";
import type { ReportArtifactsInput } from "@/lib/report-artifacts-html";
import { Badge } from "@/components/ui/badge";

type Props = { roastLike: ReportArtifactsInput };

export function ImplementationChecklistSection({ roastLike }: Props) {
  const items = resolveChecklistItems(roastLike);
  if (!items.length) return null;
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <ListTodo className="size-4 stroke-[1.5]" />
          </IconFrame>
          Implementation checklist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
          {items.map((it, i) => (
            <li key={`${it.task}-${i}`} className="pl-1">
              <span className="text-foreground">{it.task}</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="font-normal">
                  Owner: {it.owner}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  Effort: {it.effort}
                </Badge>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
