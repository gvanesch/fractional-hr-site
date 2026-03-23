import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | Van Esch Advisory Ltd",
  description:
    "Terms of Use for vanesch.uk, setting out how the website may be used and the limits of liability and reliance.",
};

export default function TermsPage() {
  return (
    <main>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl">
            <p className="brand-kicker">Terms of Use</p>
            <h1 className="brand-heading-xl mt-3">Terms of Use</h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              These Terms of Use govern access to and use of vanesch.uk.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="space-y-12">
            <section>
              <p className="brand-section-kicker">Website use</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Access and permitted use
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website is provided for general information about Van
                  Esch Advisory Ltd, its services, and related HR operations,
                  service delivery, and transformation topics.
                </p>
                <p>
                  You may use the site only for lawful purposes and in a way
                  that does not interfere with the operation, security, or
                  availability of the website.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Information on the site</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                No reliance as professional advice
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Website content is provided for general informational purposes
                  only.
                </p>
                <p>
                  Nothing on this site constitutes legal, tax, regulatory, HR,
                  employment, or other professional advice. It should not be
                  relied upon as a substitute for advice tailored to the facts
                  and circumstances of a particular organisation or situation.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Diagnostic tool</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                HR Operations Health Check
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  The HR Operations Health Check is designed as a high-level
                  self-assessment tool. It is intended to provide an indicative
                  view of operational maturity and potential areas of friction.
                </p>
                <p>
                  Diagnostic results, scores, summaries, or interpretations are
                  provided for general informational purposes only. They do not
                  constitute formal advice and should not be relied upon as the
                  sole basis for business, people, legal, compliance, or
                  operational decisions.
                </p>
                <p>
                  Use of the diagnostic does not create a client, advisory, or
                  professional relationship between you and Van Esch Advisory
                  Ltd.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Client relationship</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                When services begin
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Accessing this website, submitting a contact form, or using
                  the diagnostic does not by itself create a contract for
                  services.
                </p>
                <p>
                  Any advisory services provided by Van Esch Advisory Ltd will
                  be governed by separate written terms agreed with the client.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Intellectual property</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Ownership of content
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Unless otherwise stated, the content on this website is owned
                  by, or used with permission by, Van Esch Advisory Ltd.
                </p>
                <p>
                  You may view and use the content for personal or internal
                  business evaluation purposes. You may not reproduce,
                  republish, distribute, modify, or exploit it commercially
                  without prior written permission.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Availability</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Website operation
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Reasonable efforts are made to keep the website available and
                  its content up to date. However, uninterrupted access,
                  complete accuracy, or freedom from errors cannot be
                  guaranteed.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Liability</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Limits of responsibility
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  To the fullest extent permitted by law, Van Esch Advisory Ltd
                  shall not be liable for any loss or damage arising from use
                  of, or reliance on, this website, its content, or outputs from
                  the HR Operations Health Check.
                </p>
                <p>
                  Nothing in these terms excludes or limits liability that
                  cannot lawfully be excluded or limited.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Links</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Third-party websites
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website may include links to third-party websites for
                  convenience or reference.
                </p>
                <p>
                  This website may use third-party services such as scheduling platforms to facilitate communication and service delivery. Use of those services is subject to their own terms and policies.
                </p>
                <p>
                  Van Esch Advisory Ltd is not responsible for the content,
                  availability, security, or privacy practices of external
                  sites.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Changes</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Updates to these terms
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  These Terms of Use may be updated from time to time. Continued
                  use of the website after changes are published indicates
                  acceptance of the revised terms.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Governing law</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Applicable law and jurisdiction
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  These Terms of Use are governed by the laws of England and
                  Wales.
                </p>
                <p>
                  The courts of England and Wales shall have exclusive
                  jurisdiction over any dispute arising out of or in connection
                  with these terms or use of the website.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Contact</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Questions
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  If you have questions about these terms, please use the{" "}
                  <Link href="/contact" className="brand-link font-medium">
                    Contact
                  </Link>{" "}
                  page.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}