import { LEGAL_CONTACT_EMAIL } from "@/lib/legal-contact";

export function PrivacyPolicyContentRest() {
  return (
    <>
      <section className="space-y-4">
        <h2>7. International transfers</h2>
        <p className="text-muted-foreground">
          We operate from India and may process or store data in India and other countries where our
          providers maintain facilities. If we transfer personal data from the EEA, UK, or Switzerland to
          countries not deemed adequate, we use appropriate safeguards (such as standard contractual clauses)
          where required by law.
        </p>
      </section>

      <section className="space-y-4">
        <h2>8. Retention</h2>
        <p className="text-muted-foreground">
          We keep personal data only as long as needed for the purposes above, unless a longer period is
          required or permitted by law. Indicative periods (subject to change and your choices):
        </p>
        <ul>
          <li>
            <span className="text-foreground">Account data</span> — for the life of your account plus a
            short wind-down period, unless we must retain certain records longer.
          </li>
          <li>
            <span className="text-foreground">Audit inputs and outputs</span> — long enough to deliver the
            Service, let you access saved reports (including copies stored on your device), and resolve disputes;
            we may delete or anonymise sooner when no longer needed.
          </li>
          <li>
            <span className="text-foreground">Security and billing records</span> — as required for security,
            accounting, and legal compliance. If you use self-service deletion, we may keep limited transaction
            metadata needed for those purposes with your account identifiers removed where feasible.
          </li>
        </ul>
        <p className="text-muted-foreground">
          You may delete your account yourself from in-product settings (Settings → Delete account), which
          removes your sign-in identity and deletes or detaches personal data we associate with that account,
          subject to the billing and legal retention points above. You may also request deletion or other
          privacy rights by emailing us. Some residual copies may persist in backups for a limited time
          before automatic purge.
        </p>
      </section>

      <section className="space-y-4">
        <h2>9. Cookies and similar technologies</h2>
        <p className="text-muted-foreground">
          We and our partners may use cookies, local storage, pixels, and similar technologies to remember
          preferences, keep you signed in, measure usage, and protect against abuse. Essential cookies are
          needed for core functionality. Where law requires consent for non-essential cookies or analytics,
          we will obtain it through our cookie controls or prompts where available.
        </p>
        <p className="text-muted-foreground">
          You can restrict cookies through your browser settings; disabling some cookies may affect how the
          Service works.
        </p>
      </section>

      <section className="space-y-4">
        <h2>10. Your rights</h2>
        <p className="text-muted-foreground">
          Depending on where you live, you may have rights to access, correct, delete, restrict, or object
          to certain processing, and to data portability. Where processing is based on consent, you may
          withdraw consent. You may also have the right to lodge a complaint with a supervisory authority.
        </p>
        <p className="text-muted-foreground">
          To exercise rights, you can use{" "}
          <span className="text-foreground">Settings → Delete account</span> for full self-service account
          erasure, or email{" "}
          <a className="text-foreground underline hover:no-underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          for access, correction, portability, objection, or other requests. We may need to verify your
          identity before fulfilling requests. We will respond within the timeframe required by applicable
          law where applicable.
        </p>
      </section>

      <section className="space-y-4">
        <h2>11. Security</h2>
        <p className="text-muted-foreground">
          We implement reasonable technical and organisational measures designed to protect personal data.
          No method of transmission or storage is completely secure; we cannot guarantee absolute security.
        </p>
      </section>

      <section className="space-y-4">
        <h2>12. Children</h2>
        <p className="text-muted-foreground">
          The Service is not directed at children under 16 (or the minimum age in your jurisdiction). We do
          not knowingly collect personal data from children. If you believe we have, contact us and we will
          take appropriate steps to delete it.
        </p>
      </section>

      <section className="space-y-4">
        <h2>13. Changes</h2>
        <p className="text-muted-foreground">
          We may update this Privacy Policy from time to time. We will post the revised version with a new
          “Last updated” date and, where appropriate, provide additional notice (for example by email or
          in-product message).
        </p>
      </section>

      <section className="space-y-4">
        <h2>14. Contact</h2>
        <p className="text-muted-foreground">
          Questions or requests:{" "}
          <a className="text-foreground underline hover:no-underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </>
  );
}
