import type { ReactNode } from "react";
import { LegalDocNavLinks } from "@/components/legal/legal-doc-nav";

type LegalDocShellProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalDocShell({ title, lastUpdated, children }: LegalDocShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface-2/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 md:h-16 md:px-6">
          <LegalDocNavLinks />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground md:text-[15px] [&_h2]:mt-0 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:text-muted-foreground">
          {children}
        </div>
      </main>
    </div>
  );
}
