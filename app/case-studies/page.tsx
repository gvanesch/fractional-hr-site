import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case Studies | Greg van Esch",
  description:
    "Representative examples of work across growing companies, mid-market organisations, and enterprise HR operations transformation.",
};

const smbExamples = [
  {
    title: "Bringing Structure to HR in a Rapidly Growing Technology Company",
    organisation: "Representative growth-stage example",
    challenge:
      "A growing business had expanded quickly and HR activities were being handled informally across managers, finance, and operations. Onboarding varied by team, employee data sat across multiple spreadsheets, and managers lacked clear guidance.",
    approach:
      "The engagement focused on mapping the employee lifecycle, introducing clearer ownership across key HR processes, creating more structured onboarding, and bringing core HR documentation into a more coherent operational framework.",
    outcome:
      "The business gained clearer HR processes, improved onboarding consistency, better visibility of employee information, and a stronger operational base to support continued growth.",
  },
  {
    title: "Improving Onboarding and Early Employee Experience in a Scaling Business",
    organisation: "Representative growth-stage example",
    challenge:
      "A scaling organisation recognised that new hires were experiencing a confusing first few weeks. Preparation before day one was inconsistent, manager expectations varied, and there was no repeatable onboarding structure.",
    approach:
      "The onboarding journey was reviewed end-to-end, with clearer pre-boarding, manager responsibilities, onboarding checkpoints, and a more structured first-90-day experience introduced.",
    outcome:
      "The result was a more consistent onboarding process, stronger manager confidence, and a repeatable structure that could support future hiring more effectively.",
  },
];

const enterpriseExamples = [
  {
    title: "Transforming Global Employee Onboarding Through HR Technology Automation",
    challenge:
      "A global onboarding process had become fragmented across regions, heavily manual, and difficult to scale. The organisation needed a more structured, automated, and globally consistent operating model.",
    approach:
      "The onboarding lifecycle was redesigned using ServiceNow HR Service Delivery integrated with the HRIS. Workflows, approvals, task orchestration, and data structures were standardised to create a scalable operational system rather than a collection of disconnected tasks.",
    impact:
      "Onboarding became faster, more consistent, and more measurable across countries, with improved data quality, stronger compliance controls, and better leadership visibility.",
    tags: ["ServiceNow HRSD", "HRIS Integration", "Automation", "Global Operations"],
  },
  {
    title: "Scaling Global HR Operations Across 27 Countries",
    challenge:
      "A growing global organisation required a stronger HR operations model capable of supporting more than 4,000 employees, contractors, and consultants across multiple jurisdictions.",
    approach:
      "The People Operations and Shared Services function was restructured to standardise core employee lifecycle processes, strengthen controls, improve governance, and create more scalable global operating rhythms.",
    impact:
      "The result was a more resilient HR service environment with clearer ownership, stronger compliance foundations, and more scalable service delivery across 27 countries.",
    tags: ["Shared Services", "Global HR", "Governance", "Operating Model"],
  },
  {
    title: "Operational Integration Through Global M&A Activity",
    challenge:
      "Following multiple transactions, the business needed to integrate HR operations, benefits, legal entities, and workforce structures while maintaining continuity and compliance.",
    approach:
      "End-to-end operational support was provided across due diligence, clean room activity, integration planning, TUPE and harmonisation workstreams, and post-close operational execution.",
    impact:
      "Multiple transactions were supported successfully, including entity consolidation, benefit harmonisation, and integration of 30+ employer entities supporting around 2,000 employees globally.",
    tags: ["M&A", "TUPE", "Integration", "Harmonisation"],
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <section className="bg-[#0A1628] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8AAAC8]">
              Case Studies
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Selected examples of operational transformation work.
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              The examples below combine representative growth-stage scenarios with selected
              transformation work from more complex enterprise environments.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
            Growing Companies & Mid-Market
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Representative example engagements
          </h2>
          <p className="mt-4 text-xl leading-9 text-slate-700">
            These examples reflect typical challenges seen in scaling businesses and mid-market
            organisations. Client details are anonymised and presented as representative scenarios.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {smbExamples.map((study) => (
            <div
              key={study.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <p className="text-sm font-medium text-[#1E6FD9]">{study.organisation}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{study.title}</h2>
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Challenge
                  </p>
                  <p className="mt-3 text-lg leading-8 text-slate-700">{study.challenge}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Approach
                  </p>
                  <p className="mt-3 text-lg leading-8 text-slate-700">{study.approach}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Outcome
                  </p>
                  <p className="mt-3 text-lg leading-8 text-slate-700">{study.outcome}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
              Enterprise & Complex Organisations
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Selected transformation experience
            </h2>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              Examples of the kind of work delivered across global People Operations, service
              delivery, HR technology, and operational integration.
            </p>
          </div>

          <div className="mt-10 space-y-8">
            {enterpriseExamples.map((study) => (
              <div
                key={study.title}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8"
              >
                <div className="flex flex-wrap gap-2">
                  {study.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-slate-950">{study.title}</h2>
                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Challenge
                    </p>
                    <p className="mt-3 text-lg leading-8 text-slate-700">{study.challenge}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Approach
                    </p>
                    <p className="mt-3 text-lg leading-8 text-slate-700">{study.approach}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Impact
                    </p>
                    <p className="mt-3 text-lg leading-8 text-slate-700">{study.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0D1F3C] py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8AAAC8]">
              Explore further
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Want to discuss a similar challenge in your organisation?
            </h2>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              Whether you are working through scaling challenges, onboarding inconsistency,
              service delivery complexity, or HR transformation, I would be happy to talk.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href="/contact"
                className="w-full rounded-xl bg-[#1E6FD9] px-6 py-3 text-center text-base font-medium text-white transition hover:bg-[#2979FF] sm:w-auto"
              >
                Contact Me
              </Link>
              <Link
                href="/services"
                className="w-full rounded-xl border border-white/20 px-6 py-3 text-center text-base font-medium transition hover:bg-white/10 sm:w-auto"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}