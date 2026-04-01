import type { Metadata } from "next";
import { LegalDocShell } from "@/components/legal/legal-doc-shell";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy — SiteRoast",
  description: "How SiteRoast collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalDocShell title="Privacy Policy" lastUpdated="28 March 2026">
      <PrivacyPolicyContent />
    </LegalDocShell>
  );
}
