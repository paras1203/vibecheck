"use client";

import { Zap, FileText, Share2 } from "lucide-react";

const STEPS = [
  {
    title: "Paste",
    body: "Drop any public URL—no setup, no staging links required.",
    icon: Zap,
  },
  {
    title: "Review",
    body: "See scores, radar, and the exact friction points worth fixing first.",
    icon: FileText,
  },
  {
    title: "Ship",
    body: "Export or hand off the action plan—your team executes without guesswork.",
    icon: Share2,
  },
] as const;

export function StepsC3() {
  return (
    <section
      id="features"
      className="border-t border-[var(--lv-c3-border)] bg-[var(--lv-c3-surface-1)] px-4 py-20 md:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--lv-c3-text)] md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--lv-c3-muted)] md:text-base">
            Three short moves—built for speed without dumbing down the audit.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="flex flex-col rounded-xl border border-[var(--lv-c3-border)] bg-[var(--lv-c3-bg)] p-6 md:flex-row md:items-start md:gap-4"
            >
              <div className="mb-4 flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--lv-c3-surface-2)] md:mb-0">
                <s.icon className="size-5 text-[var(--lv-c3-accent)]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--lv-c3-accent)]">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--lv-c3-text)]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lv-c3-muted)]">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
