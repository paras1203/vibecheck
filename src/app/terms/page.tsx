import type { Metadata } from "next";
import { LegalDocShell } from "@/components/legal/legal-doc-shell";
import { TermsContent } from "@/components/legal/terms-content";

export const metadata: Metadata = {
  title: "Terms & Conditions — SiteRoast",
  description: "Terms of use for the SiteRoast service.",
};

export default function TermsPage() {
  return (
    <LegalDocShell title="Terms & Conditions" lastUpdated="28 March 2026">
      <TermsContent />
    </LegalDocShell>
  );
}
