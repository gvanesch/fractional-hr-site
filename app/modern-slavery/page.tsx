import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modern Slavery Statement | Van Esch Advisory Ltd",
  description:
    "Voluntary Modern Slavery Statement for https://vanesch.uk and Van Esch Advisory Ltd.",
};

export default function ModernSlaveryPage() {
  return (
    <main>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl">
            <p className="brand-kicker">Modern Slavery Statement</p>
            <h1 className="brand-heading-xl mt-3">
              Modern Slavery Statement
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This is a voluntary statement setting out Van Esch Advisory Ltd’s
              approach to modern slavery, forced labour, and human trafficking
              in connection with the operation of vanesch.uk and related
              advisory services.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="space-y-12">
            <section>
              <p className="brand-section-kicker">Overview</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Commitment
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Van Esch Advisory Ltd is not currently required by law to
                  publish a modern slavery statement. Even so, the business is
                  committed to acting ethically, conducting business with
                  integrity, and opposing modern slavery and human trafficking
                  in all forms.
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
                  Van Esch Advisory Ltd is a professional services business
                  providing HR operations, service delivery, and transformation
                  advisory.
                </p>
                <p>
                  The business operates with a relatively simple and low-volume
                  supply chain when compared with organisations involved in
                  manufacturing, logistics, large-scale procurement, or physical
                  goods distribution.
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
                  The overall risk of modern slavery within the direct operating
                  model of the business is considered low. However, Van Esch
                  Advisory Ltd expects suppliers, service providers, and business
                  partners to operate lawfully, ethically, and responsibly.
                </p>
                <p>
                  As the business develops, supplier choices and external
                  partnerships will continue to be considered with these
                  principles in mind.
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
                  Where relevant, the intention is to work with reputable
                  suppliers and service providers and to avoid relationships
                  that raise clear concerns about labour exploitation,
                  coercion, or serious ethical misconduct.
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
                  This statement may be reviewed and updated over time as the
                  business grows, its operating model changes, or its use of
                  suppliers and partners becomes more complex.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}