"use client";

import { ComparisonB1 } from "@/components/landing/b1/comparison-b1";
import type { LandingRoastFormProps } from "@/components/landing/hero-section";

export function ComparisonB2({ roastForm }: { roastForm: LandingRoastFormProps }) {
  return <ComparisonB1 roastForm={roastForm} />;
}
