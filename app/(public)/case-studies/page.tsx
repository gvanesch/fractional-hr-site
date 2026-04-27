import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Selected examples of HR operations, service delivery, HR technology, and transformation work across growing and complex organisations.",
};

const growthStageExamples = [
  {
    title: "Bringing structure to HR in a growing technology company",
    context:
      "HR activity was spread across managers, finance, and operations. Onboarding varied by team, employee information sat in different places, and managers needed clearer guidance.",
    work:
      "The work focused on the employee lifecycle, clearer ownership, more consistent onboarding, and a stronger operational framework for core HR activity.",
    result:
      "The business gained clearer HR processes, better onboarding consistency, improved visibility of employee information, and a stronger base for continued growth.",
  },
  {
    title: "Improving onboarding in a scaling business",
    context:
      "New hires were having different experiences depending on team and manager. Preparation before day one was inconsistent, and there was no repeatable onboarding structure.",
    work:
      "The onboarding journey was reviewed end to end. Pre-boarding, manager responsibilities, onboarding checkpoints, and first-90-day structure were tightened.",
    result:
      "The organisation gained a more consistent onboarding process, stronger manager confidence, and a repeatable structure for future hiring.",
  },
];

const enterpriseExamples = [
  {
    title: "Transforming global onboarding through HR technology automation",
    context:
      "A global onboarding process had become fragmented, manual, and difficult to scale across regions.",
    work:
      "The onboarding lifecycle was redesigned through ServiceNow HR Service Delivery integrated with the HRIS. Workflows, approvals, task orchestration, and data structures were standardised.",
    result:
      "Onboarding became faster, more consistent, and more measurable across countries, with stronger controls and better leadership visibility.",
  },
  {
    title: "Scaling global HR operations across 27 countries",
    context:
      "A global organisation needed a stronger HR operations model to support more than 4,000 employees, contractors, and consultants across multiple jurisdictions.",
    work:
      "The People Operations and Shared Services function was restructured to standardise lifecycle processes, strengthen governance, improve controls, and create more scalable operating rhythms.",
    result:
      "The result was a more resilient HR service environment with clearer ownership, stronger compliance foundations, and more scalable delivery.",
  },
  {
    title: "Operational integration through global M&A activity",
    context:
      "Following multiple transactions, the business needed to integrate HR operations, benefits, legal entities, and workforce structures while maintaining continuity and compliance.",
    work:
      "Operational support covered due diligence, clean room activity, integration planning, TUPE and harmonisation workstreams, and post-close execution.",
    result:
      "Multiple transactions were supported, including entity consolidation, benefit harmonisation, and integration of 30+ employer entities supporting around 2,000 employees globally.",
  },
];

const proofPoints = [
  {
    title: "Growth-stage operating structure",
    text: "Experience strengthening HR foundations where informal ways of working need to become more consistent without adding unnecessary complexity.",
  },
  {
    title: "Enterprise transformation",
    text: "Experience operating across shared services, HR technology, governance, controls, and global service delivery environments.",
  },
  {
    title: "Integration and execution",
    text: "Experience translating complex operational change into practical execution across entities, countries, systems, and teams.",
  },
];

function CaseStudyRow({
  title,
  context,
  work,
  result,
}: {
  title: string;
  context: string;
  work: string;
  result: string;
}) {
  return (
    <div className="border-t border-slate-200 py-10 lg:py-12">
      <h3 className="max-w-3xl text-[1.35rem] font-semibold leading-[1.2] text-slate-950 lg:text-[1.55rem]">
        {title}
      </h3>

      <div className="mt-7 grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Context
          </p>
          <p className="mt-3 brand-body">{context}</p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Work
          </p>
          <p className="mt-3 brand-body">{work}</p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Result
          </p>
          <p className="mt-3 brand-body">{result}</p>
        </div>
      </div>
    </div>
  );
}

export default function CaseStudiesPage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Case Studies</p>

              <h1 className="brand-heading-xl">
                Operating experience across growth, complexity, and transformation.
              </h1>
            </div>

            <p className="brand-subheading brand-body-on-dark max-w-3xl">
              Selected examples of work across HR operations, service delivery,
              HR technology, global transformation, and operational integration.
            </p>

            <p className="max-w-3xl text-base leading-8 text-[#C7D8EA]">
              Some examples are representative scenarios based on common
              growth-stage challenges. Others reflect direct enterprise
              transformation experience across larger, more complex environments.
            </p>

            <div className="brand-actions">
              <Link
                href="/diagnostic"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Take the Health Check
              </Link>

              <Link
                href="/contact"
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Start a conversation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* GROWTH EXAMPLES */}
      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">
              Growing Companies & Mid-Market
            </p>

            <h2 className="brand-heading-lg text-slate-950">
              Representative examples of where stronger HR foundations become useful.
            </h2>

            <p className="brand-body-lg">
              These examples reflect common situations in growing and mid-market
              organisations. They are anonymised and presented as representative
              scenarios.
            </p>
          </div>

          <div className="brand-section-body-xl border-b border-slate-200">
            {growthStageExamples.map((study) => (
              <CaseStudyRow
                key={study.title}
                title={study.title}
                context={study.context}
                work={study.work}
                result={study.result}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ENTERPRISE EXPERIENCE */}
      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">
              Enterprise & Complex Organisations
            </p>

            <h2 className="brand-heading-lg text-slate-950">
              Transformation experience in more complex operating environments.
            </h2>

            <p className="brand-body-lg">
              Examples of work across global People Operations, shared services,
              HR technology, service delivery, and operational integration.
            </p>
          </div>

          <div className="brand-section-body-xl border-b border-slate-200">
            {enterpriseExamples.map((study) => (
              <CaseStudyRow
                key={study.title}
                title={study.title}
                context={study.context}
                work={study.work}
                result={study.result}
              />
            ))}
          </div>
        </div>
      </section>

      {/* WHAT THIS SHOWS */}
      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">What these examples show</p>

            <h2 className="brand-heading-lg text-slate-950">
              Practical operating experience, not advisory theory.
            </h2>

            <p className="brand-body-lg">
              The common thread is operational reality. The work is shaped by
              how HR actually runs, where delivery becomes harder to maintain,
              and what needs to change for the organisation to operate more
              clearly.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              {proofPoints.map((item) => (
                <div key={item.title} className="brand-rule-col">
                  <h3 className="brand-heading-sm text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-4 brand-body">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="brand-dark-section-plain">
        <div className="brand-container brand-section-tight">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>

                <h2 className="brand-heading-lg">
                  Get a clearer view of how your HR model is running.
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Use the Health Check for an initial read, or start a
                  conversation if the situation is already clear.
                </p>
              </div>

              <div className="brand-actions">
                <Link
                  href="/diagnostic"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Take the Health Check
                </Link>

                <Link
                  href="/contact"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Start a conversation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}