import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services | Greg van Esch",
  description:
    "HR operations advisory services for enterprise organisations, scale-ups, and growing businesses, including HR technology, shared services, governance, and onboarding automation.",
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

const growthServices = [
  {
    title: "HR Foundations for Growing Companies",
    text: "Practical support for SMEs and mid-sized businesses that need stronger HR infrastructure, clearer processes, and more consistency as they grow.",
    bullets: [
      "Core HR lifecycle process design",
      "Foundational documentation and templates",
      "Manager-friendly workflows",
      "Scalable HR operating basics",
    ],
  },
  {
    title: "Policies, Processes & Operational Clarity",
    text: "Building the practical HR foundations that many growing organisations delay until the wheels start wobbling.",
    bullets: [
      "Core policy suite",
      "Onboarding and employee journey processes",
      "Approval flows and responsibilities",
      "Operational process mapping",
    ],
  },
  {
    title: "HR Systems Setup & Improvement",
    text: "Helping businesses select, structure, or improve the systems that support their people operations without overengineering the solution.",
    bullets: [
      "HR system selection support",
      "Setup and process alignment",
      "Data structure and ownership clarity",
      "Practical automation opportunities",
    ],
  },
  {
    title: "Knowledge, SOPs & Internal Service Design",
    text: "Creating the internal documentation and service structures that make HR easier to run and easier for managers and employees to navigate.",
    bullets: [
      "Knowledge base design",
      "SOP and playbook creation",
      "Internal HR service catalogue thinking",
      "Reduced dependency on tribal knowledge",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Services
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Advisory support for both complex organisations and growing businesses.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              My work sits at the intersection of HR operations, service delivery, systems,
              governance, and transformation. For larger organisations, that often means
              redesigning or stabilising complex operating environments. For growing companies,
              it often means building the practical HR infrastructure needed to scale properly.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Enterprise & Complex Environments
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            For larger organisations navigating scale, complexity, or transformation.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-700 sm:text-lg">
            This area is suited to organisations with multi-country operations, shared services
            environments, HR technology programmes, regulatory complexity, or significant change
            activity such as M&A, harmonisation, or service delivery redesign.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {enterpriseServices.map((service) => (
            <div
              key={service.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <h3 className="text-2xl font-semibold text-slate-950">{service.title}</h3>
              <p className="mt-4 leading-7 text-slate-600">{service.text}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
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
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Growing Companies, SMB & Mid-Market
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              For businesses that need stronger HR infrastructure before complexity gets expensive.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-700 sm:text-lg">
              Many growing organisations do not need enterprise-scale HR transformation. They
              need clear foundations: better processes, stronger policies, sensible systems,
              cleaner onboarding, and operational discipline that supports growth without adding
              bureaucracy for the sake of it.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {growthServices.map((service) => (
              <div
                key={service.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8"
              >
                <h3 className="text-2xl font-semibold text-slate-950">{service.title}</h3>
                <p className="mt-4 leading-7 text-slate-600">{service.text}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  {service.bullets.map((bullet) => (
                    <li key={bullet} className="rounded-lg bg-white px-4 py-3">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-8 sm:py-12">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              How support is typically structured
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Advisory that fits the work, rather than forcing the work to fit a model.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold">Advisory Support</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Ongoing strategic and operational guidance on a flexible basis.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold">Project-Based Delivery</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Focused support for a specific transformation, implementation, or operational challenge.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold">Interim Leadership</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Short-term leadership support during periods of change, transition, or build-out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:py-20">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-10 sm:px-8 sm:py-12">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Next step
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                Need help shaping the right HR operating model?
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
                Whether you need transformation support or stronger foundations, the best place
                to start is a conversation.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <Link
                  href="/contact"
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
                >
                  Contact Me
                </Link>
                <Link
                  href="/case-studies"
                  className="w-full rounded-xl border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-800 transition hover:bg-white sm:w-auto"
                >
                  View Case Studies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}