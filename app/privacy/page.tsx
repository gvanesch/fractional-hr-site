import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Van Esch Advisory Ltd",
  description:
    "Privacy Policy for https://vanesch.uk, explaining how personal information is collected, used, stored, and protected.",
};

export default function PrivacyPage() {
  return (
    <main>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl">
            <p className="brand-kicker">Privacy Policy</p>
            <h1 className="brand-heading-xl mt-3">Privacy Policy</h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This Privacy Policy explains how personal information is
              collected, used, stored, and protected when you visit
              https://vanesch.uk, contact Van Esch Advisory Ltd through the
              website, or use the HR Operations Health Check.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="space-y-12">

            {/* CONTROLLER */}
            <section>
              <p className="brand-section-kicker">Who we are</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Data controller
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website is operated by Van Esch Advisory Ltd. For the
                  purposes of applicable data protection law, Van Esch Advisory
                  Ltd acts as the data controller for personal data collected
                  through this website and the public HR Operations Health Check.
                </p>
              </div>
            </section>

            {/* DATA */}
            <section>
              <p className="brand-section-kicker">Information collected</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                What information may be collected
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <ul className="list-disc space-y-2 pl-6">
                  <li>Your name (if provided)</li>
                  <li>Your email address (if provided)</li>
                  <li>Your organisation name (if provided)</li>
                  <li>Details included in contact enquiries</li>
                  <li>
                    Contextual information provided in the HR Operations Health
                    Check (such as company size, industry, role, and region)
                  </li>
                  <li>
                    Your responses to Health Check questions, together with
                    generated scores, bands, summaries, and indicative
                    assessments derived from those responses
                  </li>
                  <li>
                    Basic technical and usage data required for security,
                    performance, and operation of the website
                  </li>
                </ul>
              </div>
            </section>

            {/* COLLECTION */}
            <section>
              <p className="brand-section-kicker">How information is collected</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Sources of personal data
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <ul className="list-disc space-y-2 pl-6">
                  <li>Submitting a contact form</li>
                  <li>Communicating about potential services</li>
                  <li>Completing the HR Operations Health Check</li>
                  <li>Using the website in a way that generates technical data</li>
                </ul>
              </div>
            </section>

            {/* PURPOSE */}
            <section>
              <p className="brand-section-kicker">Why information is used</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Purposes of processing
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <ul className="list-disc space-y-2 pl-6">
                  <li>Respond to enquiries</li>
                  <li>Provide and improve the HR Operations Health Check</li>
                  <li>
                    Generate automated scores, summaries, and indicative outputs
                    based on submitted responses
                  </li>
                  <li>
                    Understand patterns across submissions in aggregated form
                  </li>
                  <li>
                    Support relevant follow-up where contact details are
                    provided
                  </li>
                  <li>Maintain and secure the website</li>
                </ul>
              </div>
            </section>

            {/* LAWFUL BASIS */}
            <section>
              <p className="brand-section-kicker">Lawful bases</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Why this processing is lawful
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    <strong>Legitimate interests</strong> in operating,
                    improving, and securing the website and Health Check,
                    generating indicative outputs, and responding to enquiries
                  </li>
                  <li>
                    <strong>Steps prior to entering into a contract</strong> where
                    you request further discussion of services
                  </li>
                  <li>
                    <strong>Legal obligations</strong> where applicable
                  </li>
                  <li>
                    <strong>Consent</strong> where specifically required
                  </li>
                </ul>
              </div>
            </section>

            {/* HEALTH CHECK */}
            <section>
              <p className="brand-section-kicker">HR Operations Health Check</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                How diagnostic data is handled
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  The HR Operations Health Check is a public-facing,
                  self-assessment tool. It uses the information you submit to
                  generate an automated score, band, and indicative output
                  reflecting your responses.
                </p>
                <p>
                  Outputs are based solely on submitted information and are not
                  independently verified.
                </p>
                <p>
                  Where you choose to provide contact details or continue to a
                  follow-up enquiry, your diagnostic responses, scores, and
                  contextual information may be linked to that enquiry to allow
                  it to be reviewed in context.
                </p>
                <p>
                  Aggregated and anonymised patterns may be used to improve the
                  diagnostic and develop broader insight, without identifying
                  individual organisations.
                </p>
                <p>
                  This public Health Check is distinct from any formal client
                  diagnostic or advisory engagement, which is governed by
                  separate contractual terms.
                </p>
              </div>
            </section>

            {/* LOCAL STORAGE */}
            <section>
              <p className="brand-section-kicker">Local storage</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Browser-based data storage
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Information entered into the Health Check may be stored locally
                  in your browser to allow you to continue or resume the
                  assessment.
                </p>
                <p>
                  This data is stored on your device and can be cleared at any
                  time by resetting the assessment or clearing browser storage.
                </p>
              </div>
            </section>

            {/* SHARING */}
            <section>
              <p className="brand-section-kicker">Sharing information</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Who information may be shared with
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <ul className="list-disc space-y-2 pl-6">
                  <li>Supabase (data storage)</li>
                  <li>Resend (email delivery)</li>
                  <li>Calendly (scheduling)</li>
                  <li>Cloudflare (hosting and security)</li>
                  <li>GitHub (deployment infrastructure)</li>
                </ul>
                <p>Information is not sold to third parties.</p>
              </div>
            </section>

            {/* RETENTION */}
            <section>
              <p className="brand-section-kicker">Retention</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                How long information is kept
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Personal data is retained only as long as necessary for its
                  purpose.
                </p>
                <p>
                  Diagnostic and enquiry data is typically retained for up to 12
                  months unless a client relationship is established or a legal
                  requirement applies.
                </p>
              </div>
            </section>

            {/* RIGHTS */}
            <section>
              <p className="brand-section-kicker">Your rights</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Data protection rights
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>You may have rights to access, correct, or delete your data.</p>
                <p>
                  You also have the right to object to processing, including
                  where data is used for direct marketing purposes.
                </p>
                <p>
                  You may lodge a complaint with the Information Commissioner’s
                  Office.
                </p>
              </div>
            </section>

            {/* CONTACT */}
            <section>
              <p className="brand-section-kicker">Contact</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Questions about privacy
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>Email: privacy@vanesch.uk</p>
                <Link href="/contact" className="brand-link font-medium">
                  Contact form
                </Link>
              </div>
            </section>

          </div>
        </div>
      </section>
    </main>
  );
}