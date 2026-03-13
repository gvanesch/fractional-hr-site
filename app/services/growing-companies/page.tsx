import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Enterprise & Complex Organisations | Greg van Esch",
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
    <>
      <section className="bg-[#123a63] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Enterprise & Complex Organisations
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Advisory for organisations navigating scale, complexity, and transformation.
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-100/90">
              Larger organisations often face a different kind of HR challenge. Processes exist,
              but they have become fragmented. Shared services struggle with scale. Technology
              environments grow complex. M&A introduces multiple operating models. My enterprise
              advisory work focuses on stabilising and redesigning HR operations so they can
              operate consistently across regions, systems, and regulatory environments.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white transition hover:bg-blue-700"
              >
                Discuss Your Situation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Typical areas of support
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Support for complex HR operating environments
          </h2>
          <p className="mt-4 text-xl leading-9 text-slate-700">
            This work is suited to organisations with global operations, shared services
            environments, HR technology programmes, regulatory complexity, or significant change
            activity such as M&A, harmonisation, or service delivery redesign.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {enterpriseServices.map((service) => (
            <div
              key={service.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm"
            >
              <h3 className="text-2xl font-semibold text-slate-950">{service.title}</h3>
              <p className="mt-4 text-lg leading-8 text-slate-600">{service.text}</p>
              <ul className="mt-6 space-y-3 text-base text-slate-700">
                {service.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-lg bg-slate-50 px-4 py-3">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Engagement structure
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Support shaped around the work itself.
            </h2>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              Enterprise engagements vary depending on the scope and context, but typically take
              the form of strategic advisory support, project-based transformation work, or interim
              leadership during periods of change. The focus is always on practical operational
              improvement, not just theoretical design.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] bg-[#123a63] px-8 py-12 text-white shadow-xl">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Next step
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Need support in a complex HR operating environment?
            </h2>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-slate-100/90">
              If you are working through service delivery redesign, HR technology change, global
              operating model complexity, or post-acquisition integration, I would be happy to
              discuss your situation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white transition hover:bg-blue-700"
              >
                Contact Me
              </Link>
              <Link
                href="/case-studies"
                className="rounded-xl border border-white/25 px-6 py-3 text-base font-medium transition hover:bg-white/10"
              >
                View Case Studies
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}