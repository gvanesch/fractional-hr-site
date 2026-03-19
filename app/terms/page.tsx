import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | Van Esch Advisory Ltd",
  description:
    "Terms of Use for vanesch.uk, setting out how the website may be used and the limits of liability and reliance.",
};

export default function TermsPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="brand-kicker">Terms of Use</p>
            <h1 className="brand-heading-xl mt-3">
              Terms of Use
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              These Terms of Use govern access to and use of vanesch.uk.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="space-y-12">
            <section>
              <p className="brand-section-kicker">Website use</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Access and permitted use</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website is provided for general information about advisory services and related topics.
                </p>
                <p>
                  You may use the site only for lawful purposes and in a way that does not interfere
                  with the operation, security, or availability of the website.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Information on the site</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">No reliance as professional advice</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Website content is provided for general informational purposes only.
                </p>
                <p>
                  Nothing on this site constitutes legal, tax, regulatory, or other professional advice,
                  and it should not be relied on as a substitute for tailored professional guidance.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Intellectual property</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Ownership of content</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Unless otherwise stated, the content on this website is owned by or used with permission
                  by the site operator.
                </p>
                <p>
                  You may view and use the content for personal or internal business evaluation purposes,
                  but you may not reproduce, republish, distribute, or exploit it commercially without permission.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Availability</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Website operation</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Reasonable efforts are made to keep the website available and accurate, but uninterrupted
                  access, complete accuracy, or freedom from errors cannot be guaranteed.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Liability</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Limits of responsibility</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  To the fullest extent permitted by law, no liability is accepted for loss or damage
                  arising from use of, or reliance on, this website or its content.
                </p>
                <p>
                  Nothing in these terms excludes liability that cannot lawfully be excluded.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Links</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Third-party websites</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website may include links to third-party websites for convenience or reference.
                </p>
                <p>
                  No responsibility is accepted for the content, availability, or privacy practices
                  of external sites.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Changes</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Updates to these terms</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  These Terms of Use may be updated from time to time. Continued use of the site
                  after changes are published indicates acceptance of the revised terms.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Contact</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Questions</h2>
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
    </>
  );
}