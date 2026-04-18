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
                  You may use the website only for lawful purposes and in a way
                  that does not interfere with the operation, security,
                  integrity, or availability of the site.
                </p>
                <p>You must not:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    attempt to gain unauthorised access to the website, its
                    infrastructure, or any connected systems
                  </li>
                  <li>
                    introduce malicious code, harmful material, or any form of
                    interference intended to disrupt the site
                  </li>
                  <li>
                    use automated means to scrape, probe, overload, or test the
                    website without prior written permission
                  </li>
                  <li>
                    submit information that is unlawful, misleading, defamatory,
                    malicious, or intended to misuse the website or its tools
                  </li>
                </ul>
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
                  employment, compliance, or other professional advice. It
                  should not be relied upon as a substitute for advice tailored
                  to the facts, circumstances, and operational context of a
                  particular organisation or situation.
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
                  The HR Operations Health Check is a public-facing, high-level
                  self-assessment tool. It is designed to generate an indicative
                  score, summary, and initial pattern signals based solely on
                  the information submitted by the user.
                </p>
                <p>
                  The Health Check is not a comprehensive organisational
                  diagnostic, audit, assurance exercise, or substitute for
                  tailored professional advice. Outputs are general and
                  indicative only. They are not independently verified and
                  should not be relied upon as a basis for legal, tax,
                  regulatory, employment, compliance, operational, or other
                  business decisions.
                </p>
                <p>
                  Use of the Health Check does not create a client, advisory,
                  fiduciary, or professional relationship between you and Van
                  Esch Advisory Ltd.
                </p>
                <p>
                  Any fuller diagnostic assessment, stakeholder questionnaire
                  process, formal report, or advisory engagement is separate and
                  will be governed only by specific written terms agreed with
                  the relevant client.
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
                  the HR Operations Health Check does not by itself create a
                  contract for services.
                </p>
                <p>
                  Any advisory, diagnostic, reporting, or consulting services
                  provided by Van Esch Advisory Ltd will be governed by separate
                  written terms agreed with the client. Where applicable, those
                  arrangements may also include separate data protection and
                  confidentiality provisions.
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
                  republish, distribute, modify, adapt, extract, or exploit it
                  commercially without prior written permission.
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
                  complete accuracy, availability, compatibility, or freedom
                  from errors, bugs, or harmful components cannot be guaranteed.
                </p>
                <p>
                  Van Esch Advisory Ltd may change, suspend, withdraw, or
                  restrict the availability of the website or any part of it,
                  including the HR Operations Health Check, at any time and
                  without notice.
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
                  excludes all liability for any loss, damage, cost, or claim
                  arising from or in connection with use of, inability to use,
                  or reliance on this website, its content, or outputs generated
                  by the HR Operations Health Check.
                </p>
                <p>
                  No representation, warranty, or guarantee is given that the
                  website, its content, or Health Check outputs are complete,
                  accurate, current, suitable for any particular purpose, or
                  free from errors or omissions.
                </p>
                <p>
                  Health Check outputs depend on the completeness and accuracy
                  of the information submitted by the user and are provided on
                  an indicative, informational-only basis.
                </p>
                <p>
                  Nothing in these terms excludes or limits liability for death
                  or personal injury caused by negligence, fraud or fraudulent
                  misrepresentation, or any other liability which cannot
                  lawfully be excluded or limited.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Links</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Third-party websites and services
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website may include links to third-party websites for
                  convenience or reference.
                </p>
                <p>
                  This website may also use third-party services, such as
                  scheduling platforms, to support communication or service
                  delivery. Use of those services is subject to their own terms
                  and policies.
                </p>
                <p>
                  Van Esch Advisory Ltd is not responsible for the content,
                  availability, security, or privacy practices of external
                  websites or services.
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