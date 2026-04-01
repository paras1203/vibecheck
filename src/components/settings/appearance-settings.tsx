"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "light" as const, label: "Light", Icon: Sun },
  { id: "dark" as const, label: "Dark", Icon: Moon },
  { id: "system" as const, label: "System", Icon: Monitor },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-11 max-w-md rounded-lg border border-border bg-muted/20" aria-hidden />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map(({ id, label, Icon }) => (
        <Button
          key={id}
          type="button"
          variant={theme === id ? "default" : "outline"}
          size="sm"
          className={cn("gap-2")}
          onClick={() => setTheme(id)}
        >
          <Icon className="size-4 shrink-0 stroke-[1.5]" aria-hidden />
          {label}
        </Button>
      ))}
    </div>
  );
}
