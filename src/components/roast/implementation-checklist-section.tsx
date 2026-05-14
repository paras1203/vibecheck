import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { ListTodo } from "lucide-react";
import { resolveChecklistItems } from "@/lib/report-artifacts-html";
import type { ReportArtifactsInput } from "@/lib/report-artifacts-html";

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
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[min(100%,320px)] table-auto text-sm">
          <thead className="border-b border-border text-left text-caption text-muted-foreground">
            <tr>
              <th className="py-2 pr-3 align-bottom font-medium">Task</th>
              <th className="py-2 pr-2 align-bottom font-medium">Owner</th>
              <th className="py-2 align-bottom font-medium">Effort</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={`${it.task}-${i}`} className="border-b border-border-muted align-top last:border-0">
                <td className="min-w-[12rem] max-w-[min(100%,48rem)] py-2.5 pr-3 break-words text-foreground [overflow-wrap:anywhere]">
                  {it.task}
                </td>
                <td className="min-w-[5rem] whitespace-normal py-2.5 pr-2 break-words text-muted-foreground">
                  {it.owner}
                </td>
                <td className="min-w-[4rem] whitespace-normal py-2.5 break-words text-muted-foreground">
                  {it.effort}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
