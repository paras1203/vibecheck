"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics-events";

const FAQS = [
  {
    id: "what-do-i-get",
    q: "What do I get after I submit a URL?",
    a: "You receive a scored audit report covering six conversion pillars: UX, trust, copy, conversion, visuals, and speed. The report includes an overall site score, a radar breakdown, prioritised quick wins, and a step-by-step action plan. Paid audits also include a PDF export and a viewport snapshot of your page.",
  },
  {
    id: "how-long",
    q: "How long does an audit take?",
    a: "A first-pass audit typically completes in under 60 seconds. We fetch your page in real time, run the analysis, and return scored results immediately — no queue, no waiting for a human reviewer.",
  },
  {
    id: "real-analytics",
    q: "Is this based on real analytics?",
    a: "The audit is based on what the AI observes on your page — copy, layout, trust signals, technical signals, and page speed. It does not connect to your traffic data (Google Analytics, etc.). Revenue or uplift figures shown in sample previews are illustrative estimates, not a guarantee of results.",
  },
  {
    id: "install",
    q: "Do I need to install anything?",
    a: "No. There is nothing to install, no code snippet to add, and no third-party access to grant. Paste a URL and the audit runs immediately. We only use the submitted URL to generate your audit.",
  },
] as const;

export function FaqV2() {
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (id: string) => {
    const next = open === id ? null : id;
    if (next) trackEvent("faq_expand");
    setOpen(next);
  };

  return (
    <section
      id="v2-faq"
      className="border-t border-border bg-background px-4 py-20 md:px-8"
    >
      <div className="container mx-auto max-w-2xl min-w-0">
        <div className="mb-10 text-center">
          <p className="text-label text-primary">Common questions</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Before you buy
          </h2>
        </div>
        <div className="divide-y divide-border">
          {FAQS.map((faq) => (
            <div key={faq.id}>
              <button
                id={`faq-btn-${faq.id}`}
                type="button"
                onClick={() => toggle(faq.id)}
                aria-expanded={open === faq.id}
                aria-controls={`faq-body-${faq.id}`}
                className="flex w-full items-start justify-between gap-4 py-5 text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                {faq.q}
                <ChevronDown
                  className={cn(
                    "mt-0.5 size-4 shrink-0 stroke-[1.5] text-muted-foreground transition-transform duration-200",
                    open === faq.id && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              <div
                id={`faq-body-${faq.id}`}
                role="region"
                aria-labelledby={`faq-btn-${faq.id}`}
                className={cn(
                  "overflow-hidden text-sm leading-relaxed text-muted-foreground transition-all duration-200",
                  open === faq.id
                    ? "max-h-96 pb-5 opacity-100"
                    : "max-h-0 opacity-0",
                )}
              >
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
