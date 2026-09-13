import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Protection Complaints | Van Esch Advisory Ltd",
  description:
    "How to raise a data protection complaint with Van Esch Advisory Ltd and what to expect from the complaints process.",
};

export default function DataProtectionComplaintsPage() {
  return (
    <main>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl">
            <p className="brand-kicker">Data Protection</p>
            <h1 className="brand-heading-xl mt-3">
              Data protection complaints
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              If you are concerned about how Van Esch Advisory Ltd has handled
              your personal information, this page explains how to raise a
              complaint and what you can expect from us.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="space-y-12">
            <section>
              <p className="brand-section-kicker">How to complain</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Raise the complaint directly with us
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Please send data protection complaints to{" "}
                  <a
                    href="mailto:privacy@vanesch.uk"
                    className="brand-link font-medium"
                  >
                    privacy@vanesch.uk
                  </a>
                  . You can also write to Van Esch Advisory Ltd, 17 Heather
                  Way, Harwell, Didcot, Oxfordshire, OX11 6JZ, United Kingdom.
                </p>
                <p>
                  You do not need to use legal terminology. Please explain what
                  you believe has gone wrong and provide enough information for
                  us to understand and investigate the issue.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Helpful information</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                What to include
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>Where relevant, it is helpful to include:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>your name and preferred contact details</li>
                  <li>a clear description of your concern</li>
                  <li>the personal information or activity involved</li>
                  <li>relevant dates, correspondence, or supporting evidence</li>
                  <li>what you would like us to do to resolve the issue</li>
                </ul>
                <p>
                  If you are complaining on behalf of someone else, we may ask
                  for appropriate evidence that you are authorised to act for
                  them. We may also request proportionate identity information
                  where this is necessary to protect personal data.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">What happens next</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Acknowledgement and investigation
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  We will acknowledge receipt of a data protection complaint
                  within 30 days. If we can complete the investigation and give
                  you an outcome within that period, the acknowledgement and
                  outcome may be provided together.
                </p>
                <p>
                  We will take appropriate steps to investigate the complaint
                  without undue delay. This may include reviewing relevant
                  records, checking how personal information was collected,
                  used, stored, shared, retained, or secured, and asking you for
                  additional information where necessary.
                </p>
                <p>
                  Once the investigation is complete, we will explain the
                  outcome without unjustifiable or excessive delay. If the
                  investigation takes longer, we will keep you appropriately
                  informed of progress.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Escalation</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Information Commissioner&apos;s Office
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  We encourage you to contact us first so that we have an
                  opportunity to investigate and respond. You also have the
                  right to complain to the Information Commissioner&apos;s Office
                  if you remain concerned about how your personal information
                  has been handled.
                </p>
                <p>
                  You can find information about making a complaint on the{" "}
                  <a
                    href="https://ico.org.uk/make-a-complaint/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-link font-medium"
                  >
                    ICO website
                  </a>
                  .
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Related information</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Privacy and general contact
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  For more information about how personal information is
                  handled, please read our{" "}
                  <Link href="/privacy" className="brand-link font-medium">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <p>
                  For general business enquiries that are not data protection
                  complaints, please use the{" "}
                  <Link href="/contact" className="brand-link font-medium">
                    Contact
                  </Link>{" "}
                  page.
                </p>
                <p>
                  <strong>Last updated:</strong> 13 September 2026
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
