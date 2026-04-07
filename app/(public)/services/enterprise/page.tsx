import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Enterprise & Complex Organisations | Van Esch Advisory Ltd",
  description:
    "HR operations advisory for enterprise organisations navigating service delivery transformation, HR technology change, shared services, governance, and global complexity.",
};

const enterpriseServices = [
  {
    title: "HR Operations Transformation",
    text: "Support for larger organisations redesigning HR operations, service delivery, and operating models to improve scale, control, and efficiency.",
    bullets: [
      "Global HR operating model design",
      "Shared services and service delivery improvement",
      "Employee lifecycle process redesign",
      "Operational governance and controls",
    ],
  },
  {
    title: "HR Technology & Workflow Transformation",
    text: "Advisory and delivery support across HR technology, workflow orchestration, and automation to reduce manual effort and improve data quality.",
    bullets: [
      "ServiceNow HRSD implementation and optimisation",
      "HRIS integration and process automation",
      "Workflow and approval design",
      "Operational readiness for AI-enabled service delivery",
    ],
  },
  {
    title: "M&A, Integration & Harmonisation",
    text: "Operational support through acquisitions, integrations, TUPE activity, entity consolidation, and workforce harmonisation across jurisdictions.",
    bullets: [
      "Operational due diligence support",
      "Integration planning and execution",
      "TUPE and harmonisation workstreams",
      "Benefits and policy alignment",
    ],
  },
  {
    title: "Governance, Compliance & Controls",
    text: "Strengthening operational discipline across HR through clear ownership, documentation, controls, and audit-ready structures.",
    bullets: [
      "Operational policies and SOPs",
      "Compliance controls and audit readiness",
      "Risk reduction across HR processes",
      "Vendor and service governance",
    ],
  },
];

export default function EnterprisePage() {
  return (
    <main>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Enterprise & Complex Organisations</p>
              <h1 className="brand-heading-lg">
                Advisory for organisations navigating scale, complexity, and
                transformation.
              </h1>
              <p className="brand-subheading brand-body-on-dark max-w-3xl">
                Larger organisations often face a different kind of HR
                challenge. Processes exist, but they have become fragmented.
                Shared services struggle with scale. Technology environments
                grow more complex. M&A introduces multiple operating models.
                Van Esch Advisory focuses on stabilising and redesigning HR
                operations so they can operate more consistently across regions,
                systems, and regulatory environments.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/contact?topic=Enterprise%20HR%20Operations%20%26%20Transformation"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Discuss Your Situation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">Typical areas of support</p>
            <h2 className="brand-heading-lg text-slate-950">
              Support for complex HR operating environments
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {enterpriseServices.map((service) => (
              <div
                key={service.title}
                className="brand-surface-card p-8"
              >
                <div className="brand-stack-md">
                  <div className="brand-stack-sm">
                    <h3 className="brand-heading-md text-slate-950">
                      {service.title}
                    </h3>
                    <p className="brand-body">{service.text}</p>
                  </div>

                  <ul className="space-y-3 text-base text-slate-700">
                    {service.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="rounded-lg bg-slate-50 px-4 py-3"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>
                <h2 className="brand-heading-lg">
                  Need support in a complex HR operating environment?
                </h2>
                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  If you are working through service delivery redesign, HR
                  technology change, global operating model complexity, or
                  post-acquisition integration, I would be happy to discuss your
                  situation.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/contact?topic=Enterprise%20HR%20Operations%20%26%20Transformation"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Contact
                </Link>
                <Link
                  href="/case-studies"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  View Case Studies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}