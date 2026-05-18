import type { Metadata } from "next";
import { LandingV2 } from "@/components/landing/v2/landing-v2";

const OG_TITLE = "SiteRoast — AI Conversion Audit for SaaS Landing Pages";
const OG_DESCRIPTION =
  "Paste your URL to get a scored conversion audit with quick wins, trust gaps, copy issues, UX friction, and a step-by-step action plan. First pass in under 60 seconds.";

export const metadata: Metadata = {
  title: OG_TITLE,
  description: OG_DESCRIPTION,
  alternates: {
    canonical: "https://siteroast.ai/V2",
  },
  openGraph: {
    type: "website",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    siteName: "SiteRoast",
    url: "https://siteroast.ai/V2",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SiteRoast — AI conversion audit for SaaS landing pages",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function V2Page() {
  return <LandingV2 />;
}
