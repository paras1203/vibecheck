"use client";

import { TestimonialsRow } from "@/components/landing/shared/testimonial-row";

export function TestimonialsC2() {
  return (
    <section
      id="testimonials"
      className="border-t border-[var(--lv-c2-border)] bg-[var(--lv-c2-surface-1)] px-4 py-24 md:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <h2 className="sr-only">Social proof</h2>
        <TestimonialsRow palette="c2" />
      </div>
    </section>
  );
}
