import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modern Slavery Statement | Van Esch Advisory Ltd",
  description:
    "Voluntary Modern Slavery Statement for https://vanesch.uk and Van Esch Advisory Ltd.",
};

export default function ModernSlaveryPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-4xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="brand-kicker">Modern Slavery Statement</p>
            <h1 className="brand-heading-xl mt-3">Modern Slavery Statement</h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This is a voluntary statement setting out Van Esch Advisory Ltd&apos;s approach
              to modern slavery, forced labour, and human trafficking in connection
              with the operation of vanesch.uk and related advisory services.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="space-y-12">
            <section>
              <p className="brand-section-kicker">Overview</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Commitment
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Although Van Esch Advisory Ltd is not currently required by law to publish
                  a modern slavery statement, there is a clear commitment to acting
                  ethically, conducting business with integrity, and opposing modern
                  slavery and human trafficking in all forms.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Business and services</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Nature of the business
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Van Esch Advisory Ltd supports boutique HR operations and transformation
                  advisory services. The business model is low-volume, professional,
                  and service-based, with limited supply-chain complexity compared with
                  larger organisations operating physical production, logistics, or
                  large-scale procurement.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Risk approach</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Managing risk
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  The overall risk of modern slavery within the direct operating model
                  of the business is considered low. Even so, the expectation is that
                  service providers, suppliers, and business partners should operate in
                  a lawful, ethical, and responsible way.
                </p>
                <p>
                  As the business develops, supplier choices and external partnerships
                  will continue to be considered with these principles in mind.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Standards</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Expectations of suppliers and partners
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Where relevant, the aim is to work with reputable suppliers and
                  service providers and to avoid relationships that raise obvious
                  concerns about labour exploitation, coercion, or serious ethical
                  misconduct.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Review</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Ongoing attention
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This statement may be reviewed and updated over time as the business
                  grows, its operating model changes, or its use of suppliers and
                  partners becomes more complex.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}