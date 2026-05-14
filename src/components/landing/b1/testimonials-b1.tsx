"use client";

import { TestimonialsRow } from "@/components/landing/shared/testimonial-row";

export function TestimonialsB1() {
  return (
    <section
      id="testimonials"
      className="border-t border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-surface-1)] px-4 py-20 md:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <h2 className="sr-only">Social proof</h2>
        <TestimonialsRow cardClassName="rounded-xl border border-[var(--lv-minimal-border)] bg-[var(--lv-minimal-bg)] shadow-none hover:shadow-none" />
      </div>
    </section>
  );
}
