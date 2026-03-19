import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Van Esch",
  description:
    "Learn more about Greg van Esch, founder of Van Esch Advisory Ltd, and his experience across global HR operations, service delivery, HR systems, M&A, compliance, and operational transformation.",
};

const highlights = [
  "17+ years in HR operations, HR systems, and operational transformation",
  "Led Global People Operations & Shared Services supporting 4,000+ employees, contractors, and consultants across 27 countries",
  "Built and scaled shared services capability across EMEA and through multiple acquisitions",
  "Led HR operational TUPE integrations, entity consolidation, and benefit harmonisation across multiple M&A programmes",
  "Championed ServiceNow HR module implementation and broader HR process automation",
  "Extensive experience across compliance, controls, audits, vendor governance, and HR operating model design",
];

const principles = [
  {
    title: "Practical over theoretical",
    text: "Advice needs to work in the reality of the organisation, not just look good on paper.",
  },
  {
    title: "Structure before scale",
    text: "When HR foundations are unclear, growth usually amplifies friction rather than solving it.",
  },
  {
    title: "Clarity across ownership and handoffs",
    text: "Many operational problems are really problems of accountability, workflow design, and inconsistent execution.",
  },
  {
    title: "Improvement that lasts",
    text: "The aim is not to create dependency, but to leave the organisation with stronger systems, better decisions, and clearer ways of working.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">About Van Esch</p>
              <h1 className="brand-heading-xl">
                Senior HR operations advisory shaped by global experience and practical delivery.
              </h1>
              <p className="brand-subheading brand-body-on-dark max-w-3xl">
                Van Esch Advisory Ltd was created to help organisations strengthen
                HR operations, service delivery, governance, and supporting
                infrastructure in a way that is practical, credible, and built for
                scale.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Founder</p>
                <h2 className="brand-heading-lg text-slate-950">
                  Greg van Esch — Founder &amp; Principal Advisor
                </h2>
              </div>

              <div className="brand-prose">
                <p>
                  I am an HR Operations &amp; Transformation Advisor with more than
                  17 years of experience across HR operations, shared services, HR
                  systems, service delivery, compliance, governance, and
                  organisational change.
                </p>
                <p>
                  Most recently, I served as Director, Global People Operations at
                  Cornerstone OnDemand, where I led Global People Operations &amp;
                  Shared Services supporting more than 4,000 employees,
                  contractors, and consultants across 27 countries. The role
                  covered HR operations, compliance, controls, HR policy, M&amp;A
                  due diligence and integration, HR systems, global mobility,
                  vendor governance, and service delivery improvement.
                </p>
                <p>
                  Earlier in my career, I held senior HR leadership roles across
                  complex operating environments, building experience in industrial
                  relations, restructuring, executive support, talent processes,
                  HRIS, and workforce change.
                </p>
                <p>
                  Across these roles, the consistent thread has been helping
                  organisations create more structured, scalable, and resilient
                  people operations — whether through process redesign, systems
                  improvement, governance, integration work, or sharper operational
                  clarity.
                </p>
              </div>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-md">
                <p className="brand-section-kicker">Selected experience</p>
                <div className="space-y-3 text-base text-slate-700">
                  {highlights.map((highlight) => (
                    <div key={highlight} className="rounded-lg bg-white px-4 py-3">
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="brand-stack-sm max-w-2xl">
              <p className="brand-section-kicker">What this advisory is built for</p>
              <h2 className="brand-heading-lg text-slate-950">
                Designed for organisations where HR operations need to become clearer, more consistent, and more scalable.
              </h2>
              <p className="brand-subheading text-slate-700">
                The work is focused on operational infrastructure rather than HR
                theory alone — the processes, systems, controls, service models,
                and ways of working that shape how HR functions in practice.
              </p>
            </div>

            <div className="brand-surface-card p-8">
              <div className="brand-prose">
                <p>
                  That may mean helping a growing business build stronger HR
                  foundations before inconsistency becomes embedded.
                </p>
                <p>
                  It may mean helping a more complex organisation improve service
                  delivery, redesign workflows, strengthen governance, or align HR
                  technology more closely with operational reality.
                </p>
                <p>
                  In both cases, the goal is similar: reduce friction, improve
                  clarity, and create HR operations that support the organisation
                  more effectively as it grows or changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">How I work</p>
            <h2 className="brand-heading-lg text-slate-950">
              Strategic thinking, operational detail, and a hands-on approach.
            </h2>
            <p className="brand-subheading text-slate-700">
              I work best where structure, systems, service delivery, and business
              reality intersect. That means understanding the bigger picture while
              paying close attention to the details that make HR operations work in
              practice.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {principles.map((principle) => (
              <div key={principle.title} className="brand-surface-card p-8">
                <div className="brand-stack-sm">
                  <h3 className="brand-heading-sm text-slate-950">
                    {principle.title}
                  </h3>
                  <p className="brand-body">{principle.text}</p>
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
                  Need help strengthening HR operations in your organisation?
                </h2>
                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Whether you are building stronger HR foundations in a growing
                  business or navigating transformation in a more complex
                  organisation, you can start with a conversation or take the HR
                  Operations Health Check first.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/contact"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Contact
                </Link>
                <Link
                  href="/diagnostic"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Take the Diagnostic
                </Link>
                <Link
                  href="/approach"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  View Approach
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}