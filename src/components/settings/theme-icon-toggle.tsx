"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "light" as const, label: "Light theme", Icon: Sun },
  { id: "dark" as const, label: "Dark theme", Icon: Moon },
  { id: "system" as const, label: "System theme", Icon: Monitor },
];

export function ThemeIconToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("flex gap-1", className)} aria-hidden>
        <div className="size-9 rounded-md border border-border bg-muted/30" />
        <div className="size-9 rounded-md border border-border bg-muted/30" />
        <div className="size-9 rounded-md border border-border bg-muted/30" />
      </div>
    );
  }

  return (
    <div className={cn("flex gap-1", className)} role="group" aria-label="Theme">
      {OPTIONS.map(({ id, label, Icon }) => (
        <Button
          key={id}
          type="button"
          size="icon"
          variant={theme === id ? "default" : "ghost"}
          className="size-9 shrink-0"
          aria-label={label}
          aria-pressed={theme === id}
          onClick={() => setTheme(id)}
        >
          <Icon className="size-4 stroke-[1.5]" />
        </Button>
      ))}
    </div>
  );
}
