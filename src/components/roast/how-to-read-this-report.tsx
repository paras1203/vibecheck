import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { BookOpen } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

export function HowToReadThisReport() {
  return (
    <Card className="border-border-muted bg-muted/25">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <IconFrame size="sm" className="bg-primary/10 text-primary">
            <BookOpen className="size-4 stroke-[1.5]" />
          </IconFrame>
          How to read this report
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">
        {`${BRAND_NAME} combines Gemini-audited pillars, quick fixes, programmatic SEO and lab speed checks, plus illustrative traffic. Use Quick Fixes first, radar for balance, then Experiments / Checklist to sequence execution. Figures are directional, not guarantees.`}
      </CardContent>
    </Card>
  );
}
