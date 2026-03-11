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
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
          Case Studies
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Selected transformation experience.
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-700">
          A few examples of the kind of work I have led across global People Operations, service
          delivery, and HR technology transformation.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {caseStudies.map((study) => (
          <div
            key={study.title}
            className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
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
  );
}