"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type LandingVisualId = "a1" | "a2" | "b1" | "b2" | "c1" | "c2" | "c3";

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

const ALL_OPTIONS = [...NEW_CONCEPTS, ...ORIGINAL_FOUR] as const;

type VariationSwitcherProps = {
  current?: LandingVisualId | null;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
};

export function VariationSwitcher({
  current,
  triggerClassName,
  align = "end",
}: VariationSwitcherProps) {
  const currentLabel =
    ALL_OPTIONS.find((o) => o.id === current)?.label ?? "Landing visuals";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("gap-1.5 border-border font-medium", triggerClassName)}
          aria-label="Choose landing page visual"
        >
          <LayoutGrid className="size-4 stroke-[1.5]" />
          <span className="hidden sm:inline">{currentLabel}</span>
          <span className="sm:hidden">Visuals</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64">
        <DropdownMenuLabel>New concepts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {NEW_CONCEPTS.map((opt) => (
          <DropdownMenuItem key={opt.id} asChild className="cursor-pointer">
            <Link href={`/v/${opt.id}`} className="flex flex-col gap-0.5 py-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  current === opt.id && "text-primary",
                )}
              >
                {opt.label}
              </span>
              <span className="text-xs text-muted-foreground">{opt.hint}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Original four</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ORIGINAL_FOUR.map((opt) => (
          <DropdownMenuItem key={opt.id} asChild className="cursor-pointer">
            <Link href={`/v/${opt.id}`} className="flex flex-col gap-0.5 py-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  current === opt.id && "text-primary",
                )}
              >
                {opt.label}
              </span>
              <span className="text-xs text-muted-foreground">{opt.hint}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/">Default landing</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
