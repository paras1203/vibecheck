import { LEGAL_CONTACT_EMAIL } from "@/lib/legal-contact";

export function TermsContent() {
  return (
    <>
      <section className="space-y-4">
        <h2>1. Agreement</h2>
        <p className="text-muted-foreground">
          These Terms &amp; Conditions (“Terms”) govern your access to and use of SiteRoast’s website,
          applications, and related services (the “Service”). By using the Service, you agree to these
          Terms. If you do not agree, do not use the Service.
        </p>
      </section>

      <section className="space-y-4">
        <h2>2. Service description</h2>
        <p className="text-muted-foreground">
          SiteRoast allows you to submit website URLs and related inputs. We fetch and process publicly
          available data and use automated and AI-assisted analysis to generate audit reports, scores, and
          suggestions aimed at improving conversion and user experience. Features may vary by plan. We may
          modify, suspend, or discontinue parts of the Service with reasonable notice where practicable.
        </p>
      </section>

      <section className="space-y-4">
        <h2>3. Eligibility and accounts</h2>
        <p className="text-muted-foreground">
          You must be legally able to enter a binding contract in your jurisdiction. You are responsible for
          account credentials and for all activity under your account. Notify us promptly at{" "}
          <a className="text-foreground underline hover:no-underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          if you suspect unauthorised access.
        </p>
      </section>

      <section className="space-y-4">
        <h2>4. Acceptable use</h2>
        <p className="text-muted-foreground">You agree not to:</p>
        <ul>
          <li>Use the Service unlawfully or to violate others’ rights;</li>
          <li>
            Submit URLs or content you are not allowed to analyse, or use the Service to scrape, overload, or
            attack third-party sites or our infrastructure;
          </li>
          <li>
            Reverse engineer, circumvent security, probe vulnerabilities, or resell access except as we
            expressly permit;
          </li>
          <li>
            Upload malware, spam, or misleading information, or attempt to manipulate outputs or billing;
          </li>
          <li>Use the Service to build a competing product through systematic extraction of our outputs.</li>
        </ul>
        <p className="text-muted-foreground">
          We may investigate and suspend or terminate access for violations or risk to the Service or other
          users.
        </p>
      </section>

      <section className="space-y-4">
        <h2>5. Third-party websites and your submissions</h2>
        <p className="text-muted-foreground">
          You are responsible for URLs and materials you submit. You represent that you have the right to
          submit them for processing. We are not responsible for third-party sites’ content, availability,
          or terms. Processing is at your direction; we do not endorse analysed sites.
        </p>
      </section>

      <section className="space-y-4">
        <h2>6. AI outputs and disclaimers</h2>
        <p className="text-muted-foreground">
          Reports may be produced in whole or in part using AI and automation. Outputs may be incomplete,
          inaccurate, or unsuitable for your situation. You must exercise independent judgment and, where
          appropriate, consult qualified professionals.
        </p>
      </section>

      <section className="space-y-4">
        <h2>7. No guarantee of business results</h2>
        <p className="text-muted-foreground">
          The Service is provided for informational and analytical purposes. We do not guarantee any
          particular business outcome, revenue, conversion rate, ranking, or performance improvement. Your
          results depend on many factors outside our control.
        </p>
      </section>

      <section className="space-y-4">
        <h2>8. Fees, payments, credits, and refunds</h2>
        <p className="text-muted-foreground">
          Paid features and <span className="text-foreground">roast credits</span> are billed as described at
          checkout or on our pricing page. Payments are processed in <span className="text-foreground">USD</span>{" "}
          through <span className="text-foreground">Razorpay</span> (or another processor we designate). You
          authorise us and our payment partners to charge your selected payment method.
        </p>
        <p className="text-muted-foreground">
          <span className="text-foreground">Credits.</span> Credits unlock advanced roast runs and paid report
          features as described in the product. Credits are consumed when you use them for an eligible roast or
          export, unless we state otherwise. Credits may expire or change if we update the Service, subject to
          notice where required by law. Free-tier and preview features remain subject to limits shown in the app.
        </p>
        <p className="text-muted-foreground">
          <span className="text-foreground">Local reports.</span> Some report data may be stored only in your
          browser (&quot;on this device&quot;). You are responsible for backups; clearing site data may remove
          those copies. Server-side retention is described in our Privacy Policy.
        </p>
        <p className="text-muted-foreground">
          <span className="text-foreground">Refunds.</span> Unless otherwise required by applicable law or
          expressly stated at purchase, fees are generally non-refundable once credits have been delivered,
          consumed, or digital deliverables supplied. If you believe you were charged in error, contact us
          within a reasonable time at{" "}
          <a className="text-foreground underline hover:no-underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>
          ; we will review good-faith disputes in line with law and our policies.
        </p>
        <p className="text-muted-foreground">
          Taxes, currency conversion, and bank fees may apply as determined by your location and payment
          provider.
        </p>
      </section>

      <section className="space-y-4">
        <h2>9. Intellectual property</h2>
        <p className="text-muted-foreground">
          The Service, including software, branding, templates, and our report formats (excluding your
          underlying site content), is owned by SiteRoast or its licensors. We grant you a limited,
          non-exclusive, non-transferable licence to use outputs for your internal business purposes, subject
          to these Terms.
        </p>
        <p className="text-muted-foreground">
          You retain rights in your URLs and site content. You grant us a licence to process submissions as
          needed to provide and improve the Service, including hosting, displaying, and generating derivative
          analytical outputs for you.
        </p>
      </section>

      <section className="space-y-4">
        <h2>10. Limitation of liability</h2>
        <p className="text-muted-foreground">
          To the fullest extent permitted by applicable law, the Service is provided “as is” and “as
          available” without warranties of any kind, whether express or implied, including merchantability,
          fitness for a particular purpose, and non-infringement.
        </p>
        <p className="text-muted-foreground">
          To the fullest extent permitted by law, neither SiteRoast nor its suppliers will be liable for any
          indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data,
          goodwill, or business opportunities, arising from or related to your use of the Service, even if
          advised of the possibility.
        </p>
        <p className="text-muted-foreground">
          Our aggregate liability for claims arising out of or related to the Service in any twelve-month
          period is limited to the greater of (a) the amount you paid us for the Service in that period or (b)
          a nominal amount where you used only free features, except where law prohibits such caps (for
          example certain consumer rights in your jurisdiction).
        </p>
      </section>

      <section className="space-y-4">
        <h2>11. Indemnity</h2>
        <p className="text-muted-foreground">
          You will defend and indemnify SiteRoast and its affiliates, officers, and agents against third-party
          claims, damages, and costs (including reasonable legal fees) arising from your misuse of the
          Service, your submissions, or your breach of these Terms, to the extent permitted by law.
        </p>
      </section>

      <section className="space-y-4">
        <h2>12. Termination</h2>
        <p className="text-muted-foreground">
          You may stop using the Service at any time. We may suspend or terminate access if you breach these
          Terms, if we must comply with law, or if we discontinue the Service (with notice where reasonable).
          Provisions that by nature should survive (including intellectual property, disclaimers, limitation
          of liability, and indemnity) will survive termination.
        </p>
      </section>

      <section className="space-y-4">
        <h2>13. Governing law and disputes</h2>
        <p className="text-muted-foreground">
          These Terms are governed by the laws of India, without regard to conflict-of-law rules, except
          that mandatory consumer protections in your country of residence may still apply where they cannot
          be waived.
        </p>
        <p className="text-muted-foreground">
          Courts in India shall have exclusive jurisdiction for commercial disputes where permitted; nothing
          prevents consumers from bringing claims in their home courts where required by law.
        </p>
      </section>

      <section className="space-y-4">
        <h2>14. Changes</h2>
        <p className="text-muted-foreground">
          We may update these Terms. We will post the revised Terms with an updated date. Continued use after
          changes become effective constitutes acceptance, except where we need additional consent under law.
        </p>
      </section>

      <section className="space-y-4">
        <h2>15. Contact</h2>
        <p className="text-muted-foreground">
          Questions about these Terms:{" "}
          <a className="text-foreground underline hover:no-underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </>
  );
}
