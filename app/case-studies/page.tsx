import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case Studies | Greg van Esch",
  description:
    "Selected case studies across HR operations transformation, ServiceNow HRSD, onboarding automation, shared services, and global workforce integration.",
};

const caseStudies = [
  {
    title: "Transforming Global Employee Onboarding Through HR Technology Automation",
    challenge:
      "A global onboarding process had become fragmented across regions, heavily manual, and difficult to scale. The organisation needed a more structured, automated, and globally consistent operating model.",
    approach:
      "The onboarding lifecycle was redesigned using ServiceNow HR Service Delivery integrated with the HRIS. Workflows, approvals, task orchestration, and data structures were standardised to create a scalable operational system rather than a collection of disconnected tasks.",
    impact:
      "Onboarding became faster, more consistent, and more measurable across countries, with a 40% reduction in manual data input, improved data quality, stronger compliance controls, and better leadership visibility.",
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
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Case Studies
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Selected transformation experience.
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-700 sm:text-lg">
            A few examples of the kind of work I have led across global People Operations, service
            delivery, and HR technology transformation.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {caseStudies.map((study) => (
            <div
              key={study.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex flex-wrap gap-2">
                {study.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
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
                  <p className="mt-3 leading-7 text-slate-700">{study.challenge}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Approach
                  </p>
                  <p className="mt-3 leading-7 text-slate-700">{study.approach}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Impact
                  </p>
                  <p className="mt-3 leading-7 text-slate-700">{study.impact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:py-20">
          <div className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-8 sm:py-12">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
                Explore further
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Want to discuss a similar challenge in your organisation?
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                If you are working through HR transformation, onboarding automation, operating
                model redesign, or service delivery complexity, I would be happy to talk.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <Link
                  href="/contact"
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
                >
                  Contact Me
                </Link>
                <Link
                  href="/services"
                  className="w-full rounded-xl border border-white/20 px-6 py-3 text-center text-sm font-medium transition hover:bg-white/10 sm:w-auto"
                >
                  View Services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}