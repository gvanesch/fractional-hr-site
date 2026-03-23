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
              This Privacy Policy explains how personal information may be
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
                  through this website.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Information collected</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                What information may be collected
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Depending on how you use the website, the following may be
                  collected:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Your name</li>
                  <li>Your email address</li>
                  <li>Your organisation name</li>
                  <li>Details you include in a contact form enquiry</li>
                  <li>
                    Information you choose to provide when completing the HR
                    Operations Health Check, such as company size, industry,
                    role, country or region, and optional contact details
                  </li>
                  <li>
                    Your responses to the HR Operations Health Check questions,
                    together with resulting scores, indicative assessments, and
                    related benchmark or comparison data generated from those
                    responses
                  </li>
                  <li>
                    Basic technical information needed for the website to
                    function properly, maintain security, and support
                    performance monitoring
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">
                How information is collected
              </p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Sources of personal data
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>Information may be collected when you:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Submit an enquiry through the contact form</li>
                  <li>
                    Communicate directly in relation to potential services
                  </li>
                  <li>Complete the HR Operations Health Check</li>
                  <li>
                    Use the website in ways that generate technical or
                    server-side information
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Why information is used</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Purposes of processing
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>Personal information may be used to:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Respond to enquiries</li>
                  <li>Communicate about potential advisory services</li>
                  <li>
                    Generate and display HR Operations Health Check results
                  </li>
                  <li>
                    Analyse diagnostic trends and create aggregated,
                    anonymised, or de-identified benchmarking insights
                  </li>
                  <li>
                    Improve the website, services, and diagnostic experience
                  </li>
                  <li>Manage and administer the website</li>
                  <li>Maintain website security and performance</li>
                  <li>
                    Comply with legal or regulatory obligations where applicable
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Lawful bases</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Why this processing is lawful
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Depending on the context, personal data is processed on one or
                  more of the following lawful bases:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    <strong>Legitimate interests</strong>, including operating
                    and improving the website, responding to enquiries,
                    generating diagnostic results, maintaining security, and
                    understanding broad patterns in HR operational maturity
                  </li>
                  <li>
                    <strong>Steps prior to entering into a contract</strong>,
                    where you ask us to discuss or scope potential advisory
                    services
                  </li>
                  <li>
                    <strong>Legal obligation</strong>, where processing is
                    necessary to comply with applicable legal or regulatory
                    requirements
                  </li>
                  <li>
                    <strong>Consent</strong>, where consent is specifically
                    required
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">
                HR Operations Health Check
              </p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                How diagnostic data is handled
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  The HR Operations Health Check is designed as a practical
                  self-assessment tool. Information submitted through the tool
                  may be used to generate your result, understand common
                  operational patterns, and improve the quality of the
                  diagnostic over time.
                </p>
                <p>
                  Where benchmark or trend information is created from
                  diagnostic submissions, it is intended to be used in
                  aggregated, anonymised, or de-identified form so that
                  individual organisations are not identified.
                </p>
                <p>
                  If you choose to provide contact details in connection with
                  the diagnostic, those details may be used to respond to your
                  request, discuss the result, or provide further interpretation
                  of the diagnostic.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">
                Technical and identifier data
              </p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Website security and technical information
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Like most websites, https://vanesch.uk may generate technical
                  logs and other information needed for security,
                  troubleshooting, and performance monitoring.
                </p>
                <p>
                  Where possible, the intention is to minimise the storage of
                  directly identifying technical data. If identifiers are used
                  for fraud prevention, rate limiting, or deduplication, they
                  may be transformed, tokenised, hashed, truncated, or
                  otherwise handled in a privacy-aware way rather than retained
                  in raw form unless there is a specific operational need to do
                  so.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Sharing information</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Who information may be shared with
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Personal data may be shared with service providers who support
                  the operation of the website and related services, where
                  necessary and subject to appropriate safeguards.
                </p>
                <p>These providers may include:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Supabase, for database and application data storage</li>
                  <li>Resend, for email delivery</li>
                  <li>
                    Cloudflare, for website delivery, security, and performance
                  </li>
                  <li>GitHub, for code hosting and deployment workflows</li>
                </ul>
                <p>
                  Information is not sold to third parties.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Retention</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                How long information is kept
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Personal data is kept only for as long as reasonably
                  necessary for the relevant purpose. This includes responding
                  to enquiries, maintaining business records, operating and
                  improving the diagnostic, and meeting legal or regulatory
                  obligations where applicable.
                </p>
                <p>
                  In most cases, enquiry and diagnostic-related personal data
                  will not be retained for longer than 12 months unless there is
                  an ongoing business relationship, a continuing operational
                  need, or a legal reason to keep it for longer.
                </p>
                <p>
                  Aggregated, anonymised, or de-identified benchmarking
                  information may be retained for longer where it no longer
                  identifies an individual or organisation.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">
                International transfers
              </p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Where data may be processed
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Depending on the service providers used to operate the
                  website, personal data may be processed in countries outside
                  the UK. Where that happens, reasonable steps will be taken to
                  use appropriate safeguards where required by applicable law.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Your rights</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Data protection rights
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Depending on the applicable law and circumstances, you may
                  have rights to request access, correction, erasure,
                  restriction, objection, or portability in relation to your
                  personal data.
                </p>
                <p>
                  Where processing is based on consent, you may also have the
                  right to withdraw that consent.
                </p>
                <p>
                  You may also have the right to complain to the Information
                  Commissioner’s Office or another relevant supervisory
                  authority.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Contact</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Questions about privacy
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  If you have any questions about this Privacy Policy or how
                  personal data is handled, you can contact Van Esch Advisory
                  Ltd directly.
                </p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:privacy@vanesch.uk"
                    className="brand-link font-medium"
                  >
                    privacy@vanesch.uk
                  </a>
                </p>
                <p>
                  You may also contact Van Esch Advisory Ltd using the{" "}
                  <Link href="/contact" className="brand-link font-medium">
                    website contact form
                  </Link>
                  .
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Updates</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Changes to this policy
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This policy may be updated from time to time to reflect
                  changes to the website, services, diagnostic features, or
                  legal requirements.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}