import Link from "next/link";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal-contact";
import { PrivacyPolicyContentRest } from "@/components/legal/privacy-policy-content-rest";

export function PrivacyPolicyContent() {
  return (
    <>
      <section className="space-y-4">
        <h2>1. Who we are</h2>
        <p className="text-muted-foreground">
          SiteRoast (“we”, “us”, “our”) provides an online service that analyses websites you submit and
          generates conversion-focused audit reports using automated and AI-assisted processing. The service
          is operated from India and may be used by individuals and businesses worldwide.
        </p>
        <p className="text-muted-foreground">
          For privacy questions, contact us at{" "}
          <a className="text-foreground underline hover:no-underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2>2. Scope</h2>
        <p className="text-muted-foreground">
          This Privacy Policy explains how we collect, use, store, and share personal data when you use our
          website, applications, and related services (together, the “Service”). It is intended to meet
          common transparency expectations, including concepts similar to those under the EU/UK General Data
          Protection Regulation (“GDPR”) where they apply to you. It does not limit any rights you may have
          under applicable local law.
        </p>
      </section>

      <section className="space-y-4">
        <h2>3. Data we collect</h2>
        <p className="text-muted-foreground">We may process the following categories of information:</p>
        <ul>
          <li>
            <span className="text-foreground">Website URLs and extracted content.</span> When you submit a
            URL, we fetch and process publicly available page data (for example HTML, text, metadata, and
            screenshots where our pipeline captures them) to produce audits. We do not control third-party
            sites and only process what you ask us to analyse.
          </li>
          <li>
            <span className="text-foreground">Account and authentication data.</span> If you create an
            account or sign in (for example via email/password or a third-party identity provider), we process
            identifiers such as your user ID, email address, display name, and authentication tokens as
            needed to run the Service.
          </li>
          <li>
            <span className="text-foreground">Usage and technical data.</span> Such as IP address, device and
            browser type, approximate location derived from IP, pages viewed, timestamps, diagnostics, and
            security logs. This helps us operate, secure, and improve the Service.
          </li>
          <li>
            <span className="text-foreground">Billing-related data.</span> When you pay via Dodo Payments
            (or another processor we use), they process payment details; we typically receive limited billing metadata (for
            example transaction IDs, plan, credits purchased, and payment status), not your full card or bank
            details.
          </li>
          <li>
            <span className="text-foreground">Locally stored reports.</span> To improve performance and offline
            access, the app may save roast summaries, report payloads, and history indexes in your
            browser&apos;s local storage. This data stays on your device unless you sync or export it; clearing
            site data removes it from that browser.
          </li>
          <li>
            <span className="text-foreground">Communications.</span> If you email us or use in-product
            support, we keep the content of those messages as needed to respond.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>4. How we use data and AI</h2>
        <p className="text-muted-foreground">
          We use the information above to provide the Service—primarily to{" "}
          <span className="text-foreground">generate audits, scores, and reports</span> based on the URLs and
          data you submit. Processing may include automated analysis and{" "}
          <span className="text-foreground">AI-assisted</span> steps (for example language models or other ML
          services) that interpret extracted site content and produce recommendations.
        </p>
        <p className="text-muted-foreground">We also use data to:</p>
        <ul>
          <li>Authenticate users, enforce limits, and prevent abuse or fraud;</li>
          <li>Maintain security, debug issues, and improve reliability and performance;</li>
          <li>Comply with law, respond to lawful requests, and protect our rights;</li>
          <li>Send service-related notices (and, where permitted, product updates you can opt out of).</li>
        </ul>
        <p className="text-muted-foreground">
          Outputs are informational and do not constitute professional legal, financial, or guaranteed business
          advice. See our{" "}
          <Link href="/terms" className="text-foreground underline hover:no-underline">
            Terms
          </Link>{" "}
          for limitations.
        </p>
      </section>

      <section className="space-y-4">
        <h2>5. Legal bases (GDPR-style)</h2>
        <p className="text-muted-foreground">
          Where GDPR or similar rules apply, we rely on one or more of the following:
        </p>
        <ul>
          <li>
            <span className="text-foreground">Contract</span> — processing necessary to provide the Service
            you request.
          </li>
          <li>
            <span className="text-foreground">Legitimate interests</span> — for example securing the Service,
            improving features, and limited analytics, balanced against your rights.
          </li>
          <li>
            <span className="text-foreground">Consent</span> — where we ask for it (for example non-essential
            cookies or certain marketing), you may withdraw consent at any time without affecting prior lawful
            processing.
          </li>
          <li>
            <span className="text-foreground">Legal obligation</span> — where the law requires us to process
            or retain data.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>6. Third-party services</h2>
        <p className="text-muted-foreground">
          We use trusted service providers who process data on our behalf under appropriate agreements.
          Non-exhaustive examples:
        </p>
        <ul>
          <li>
            <span className="text-foreground">Google Firebase</span> (or similar) for authentication,
            hosting, databases, and related infrastructure;
          </li>
          <li>
            <span className="text-foreground">Dodo Payments</span> (or other payment processors) for payments and
            order handling;
          </li>
          <li>
            <span className="text-foreground">AI and infrastructure providers</span> that power model
            inference and content processing;
          </li>
          <li>
            <span className="text-foreground">Analytics, logging, and email</span> vendors where we use them.
          </li>
        </ul>
        <p className="text-muted-foreground">
          Each provider has its own privacy policy. We recommend reviewing their terms if you want detail on
          how they handle data.
        </p>
      </section>

      <PrivacyPolicyContentRest />
    </>
  );
}
