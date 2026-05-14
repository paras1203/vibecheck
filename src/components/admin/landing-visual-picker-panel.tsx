"use client";

import Link from "next/link";
import { VariationSwitcher, type LandingVisualId } from "@/components/landing/shared/variation-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const NEW_CONCEPTS: { id: LandingVisualId; label: string; hint: string }[] = [
  { id: "c1", label: "C1 — Signal brutalist", hint: "Dark / amber trust + preview" },
  { id: "c2", label: "C2 — Warm precision", hint: "Light / Apple-adjacent" },
  { id: "c3", label: "C3 — Operator", hint: "Dark zinc / pricing clarity" },
];

const ORIGINAL_FOUR: { id: LandingVisualId; label: string; hint: string }[] = [
  { id: "a1", label: "A1 — Gradient mesh", hint: "Bold / Linear style" },
  { id: "a2", label: "A2 — Dark brutalist", hint: "Bold / Stripe Radar" },
  { id: "b1", label: "B1 — Apple clean", hint: "Minimal / whitespace" },
  { id: "b2", label: "B2 — Linear crisp", hint: "Minimal / grid" },
];

export function LandingVisualPickerPanel() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Quick picker</CardTitle>
          <CardDescription>Same shortcuts as the old public navbar menu.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <VariationSwitcher current={null} align="start" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All landing visuals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">New concepts</h3>
            <ul className="space-y-2 text-sm">
              {NEW_CONCEPTS.map((opt) => (
                <li key={opt.id}>
                  <Link href={`/v/${opt.id}`} className="text-primary underline-offset-4 hover:underline">
                    {opt.label}
                  </Link>
                  <span className="text-muted-foreground"> — {opt.hint}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Original four</h3>
            <ul className="space-y-2 text-sm">
              {ORIGINAL_FOUR.map((opt) => (
                <li key={opt.id}>
                  <Link href={`/v/${opt.id}`} className="text-primary underline-offset-4 hover:underline">
                    {opt.label}
                  </Link>
                  <span className="text-muted-foreground"> — {opt.hint}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Default landing (/)
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
