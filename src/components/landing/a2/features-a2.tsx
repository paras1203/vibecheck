"use client";

import { MousePointerClick, MessageSquareWarning, Code2 } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "UX Analysis",
    body: "We detect confusing navigation, hidden CTAs, and friction points that kill conversions.",
    icon: MousePointerClick,
  },
  {
    n: "02",
    title: "Copy Roast",
    body: "We rewrite your boring headlines and jargon into punchy, benefit-driven sales copy.",
    icon: MessageSquareWarning,
  },
  {
    n: "03",
    title: "Tech Audit",
    body: "We check SEO tags, mobile responsiveness, and load speed bottlenecks.",
    icon: Code2,
  },
] as const;

export function FeaturesA2() {
  return (
    <section id="features" className="border-t-2 border-white bg-black px-4 py-24 md:px-8">
      <div className="container mx-auto max-w-3xl">
        <h2 className="mb-16 text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
          How it works
        </h2>
        <div className="flex flex-col gap-0">
          {STEPS.map((s, i) => (
            <div key={s.n}>
              {i > 0 ? <div className="border-t border-white/20" /> : null}
              <div className="grid gap-8 py-12 md:grid-cols-[auto_1fr] md:items-start">
                <span className="font-mono text-5xl font-bold tabular-nums text-white/90 md:text-6xl">
                  {s.n}
                </span>
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <s.icon className="size-5 stroke-[1.5] text-white" />
                    <h3 className="text-xl font-bold text-white">{s.title}</h3>
                  </div>
                  <p className="max-w-xl text-white/65">{s.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
