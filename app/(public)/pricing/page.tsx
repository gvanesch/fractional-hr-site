import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | Greg van Esch",
  description:
    "Clear starting points for improving HR operations, including the HR Operations Diagnostic Assessment, the HR Foundations Sprint, and follow-on advisory support.",
};

const sprintIncludes = [
  "HR Operations Diagnostic Assessment",
  "Leadership and HR stakeholder discussions",
  "Focused analysis of priority process areas and operational friction",
  "Targeted process mapping and optimisation in the areas that matter most",
  "Prioritisation and practical design decisions",
  "Development of a sequenced improvement roadmap",
];

const sprintDeliverables = [
  "Scored diagnostic output across key dimensions",
  "Priority process analysis and mapping",
  "Operational friction analysis",
  "Prioritised improvement areas",
  "HR Foundations roadmap",
  "Executive recommendations presentation",
];

const diagnosticAssessmentIncludes = [
  "Multi-perspective input across HR, managers, and leadership",
  "Scored output across core operational dimensions",
  "Identification of alignment gaps and weakest areas",
  "Narrative insight across observation, implication, and next step",
  "A structured report to clarify what should be prioritised first",
];

const followOnWork = [
  "HR service delivery design",
  "Onboarding, offboarding and lifecycle process redesign",
  "HR knowledge management structures",
  "HR technology optimisation",
];

const advisoryAreas = [
  "Operational governance",
  "HR technology optimisation",
  "Service delivery improvement",
  "Leadership guidance",
];

export default function PricingPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="brand-kicker">Pricing</p>
            <h1 className="brand-heading-xl mt-3">
              Clear starting points for improving HR operations.
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              The model is designed as a structured path: begin with the HR
              Operations Health Check, move into the HR Operations Diagnostic
              Assessment when deeper clarity is needed, and use the HR
              Foundations Sprint to act on that insight.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/diagnostic-assessment"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                View Diagnostic Assessment
              </Link>
              <Link
                href="/services/hr-foundations-sprint"
                className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
              >
                View the HR Foundations Sprint
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="space-y-8">
            <div className="brand-surface rounded-[2rem] p-8 lg:p-10">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                <div className="brand-stack-sm">
                  <p className="brand-section-kicker">
                    HR Operations Diagnostic Assessment
                  </p>
                  <h2 className="brand-heading-lg text-slate-950">
                    Structured diagnostic insight before focused action
                  </h2>
                  <p className="brand-subheading text-slate-700">
                    A structured, multi-perspective diagnostic of how HR
                    actually operates across your organisation.
                  </p>

                  <div className="grid gap-4 pt-2 sm:grid-cols-2">
                    <div className="brand-surface-soft rounded-2xl p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Investment
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                        £3,000 + VAT
                      </p>
                    </div>

                    <div className="brand-surface-soft rounded-2xl p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Position in the journey
                      </p>
                      <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                        Step 2
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        Follows the Health Check and can lead into the Sprint.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="brand-stack-sm">
                  <p className="brand-section-kicker">What clients receive</p>
                  <div className="grid gap-3 pt-2">
                    {diagnosticAssessmentIncludes.map((item) => (
                      <div
                        key={item}
                        className="rounded-lg bg-slate-50 px-4 py-3 text-base text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <div className="brand-body brand-body-lg space-y-4 text-slate-700">
                  <p>
                    This is designed for organisations that need more than a
                    quick signal, but are not yet ready to move straight into
                    implementation support.
                  </p>
                  <p>
                    It provides structured insight into where operational
                    friction is building, where experience differs by role, and
                    where the greatest operational value is likely to come from
                    focused follow-up.
                  </p>
                  <p>
                    The assessment is fully credited against the HR Foundations
                    Sprint if that becomes the right next step.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  <Link
                    href="/diagnostic-assessment"
                    className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
                  >
                    View Diagnostic Assessment
                  </Link>
                  <Link
                    href="/contact"
                    className="brand-button-dark rounded-xl px-6 py-3 text-base font-medium"
                  >
                    Discuss the Assessment
                  </Link>
                </div>
              </div>
            </div>

            <div className="brand-surface rounded-[2rem] p-8 lg:p-10">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                <div className="brand-stack-sm">
                  <p className="brand-section-kicker">HR Foundations Sprint</p>
                  <h2 className="brand-heading-lg text-slate-950">
                    Focused execution support for organisations improving HR
                    operations
                  </h2>
                  <p className="brand-subheading text-slate-700">
                    A focused four-week engagement to turn structured diagnostic
                    insight into clear priorities, practical design decisions,
                    and a sequenced roadmap.
                  </p>

                  <div className="grid gap-4 pt-2 sm:grid-cols-2">
                    <div className="brand-surface-soft rounded-2xl p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Standard investment
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                        £11,500 + VAT
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        For organisations up to 120 employees.
                      </p>
                    </div>

                    <div className="brand-surface-soft rounded-2xl p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Duration
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                        4 weeks
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        Larger or more complex organisations are quoted
                        separately.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Included value
                    </p>
                    <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                      Includes HR Operations Diagnostic Assessment, typically
                      valued at £3,000
                    </p>
                    <p className="mt-3 text-base leading-7 text-slate-700">
                      Total engagement value: £14,500. The Diagnostic
                      Assessment is included within the Sprint and credited in
                      full when the Sprint is the chosen next step.
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <p className="brand-section-kicker">
                      What the Sprint includes
                    </p>
                    <div className="mt-6 grid gap-3">
                      {sprintIncludes.map((item) => (
                        <div
                          key={item}
                          className="rounded-lg bg-slate-50 px-4 py-3 text-base text-slate-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="brand-section-kicker">Deliverables</p>
                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                      {sprintDeliverables.map((item) => (
                        <div
                          key={item}
                          className="rounded-lg bg-slate-50 px-4 py-3 text-base text-slate-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <div className="brand-body brand-body-lg space-y-4 text-slate-700">
                  <p>
                    The Sprint is designed for organisations where HR processes
                    have evolved organically and are starting to feel
                    inconsistent, reactive, or harder to scale.
                  </p>
                  <p>
                    It is not open-ended discovery. It is a structured,
                    diagnostic-informed engagement that uses the HR Operations
                    Diagnostic Assessment to focus effort on the areas creating
                    the most operational drag.
                  </p>
                  <p>
                    That often includes unclear ownership, inconsistent manager
                    practice, fragmented service delivery, weak handoffs, manual
                    workarounds, or process gaps that are making day-to-day
                    execution harder than it should be.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  <Link
                    href="/services/hr-foundations-sprint"
                    className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
                  >
                    View the HR Foundations Sprint
                  </Link>
                  <Link
                    href="/diagnostic-assessment"
                    className="brand-button-dark rounded-xl px-6 py-3 text-base font-medium"
                  >
                    View Diagnostic Assessment
                  </Link>
                </div>
              </div>
            </div>

            <div className="brand-surface-soft rounded-[1.75rem] p-8">
              <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
                <div className="brand-stack-sm">
                  <p className="brand-section-kicker">
                    Start with the lighter first step
                  </p>
                  <h3 className="brand-heading-md text-slate-950">
                    HR Operations Health Check
                  </h3>
                </div>

                <div className="brand-body space-y-4">
                  <p>
                    If you are still trying to identify whether the issue is
                    isolated friction or a wider operational pattern, the
                    Health Check is the simplest place to start.
                  </p>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg bg-white px-4 py-3 text-base text-slate-700">
                      A quick self-assessment across 10 questions
                    </div>
                    <div className="rounded-lg bg-white px-4 py-3 text-base text-slate-700">
                      An immediate score and result band
                    </div>
                    <div className="rounded-lg bg-white px-4 py-3 text-base text-slate-700">
                      A practical first read on where operational strain may be
                      building
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/diagnostic"
                      className="brand-button-primary inline-flex rounded-xl px-5 py-3 text-base font-medium"
                    >
                      Take the Health Check
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="brand-surface-soft h-full rounded-[1.75rem] p-8">
                <p className="brand-section-kicker">
                  What happens after the Sprint?
                </p>
                <h3 className="brand-heading-md mt-3 text-slate-950">
                  Follow-on implementation support
                </h3>
                <div className="brand-body mt-4 space-y-4">
                  <p>
                    Following the Sprint, organisations typically either
                    implement improvements internally or continue with targeted
                    support to implement specific operational improvements.
                  </p>
                  <p>Common areas of follow-on work include:</p>
                </div>

                <div className="mt-5 space-y-3">
                  {followOnWork.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg bg-white px-4 py-3 text-base text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <p className="brand-body mt-5">
                  These engagements are scoped individually depending on the
                  organisation and the areas being addressed.
                </p>
              </div>

              <div className="brand-surface-soft h-full rounded-[1.75rem] p-8">
                <p className="brand-section-kicker">Ongoing advisory support</p>
                <h3 className="brand-heading-md mt-3 text-slate-950">
                  Ongoing support while HR operations improve
                </h3>
                <div className="brand-body mt-4 space-y-4">
                  <p>
                    Some organisations also choose to retain ongoing advisory
                    support while improving their HR operational infrastructure.
                  </p>
                  <p>This can include:</p>
                </div>

                <div className="mt-5 space-y-3">
                  {advisoryAreas.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg bg-white px-4 py-3 text-base text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <p className="brand-body mt-5">
                  Advisory engagements are typically structured on a monthly
                  basis and scoped based on the organisation&apos;s needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-dark-section py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="brand-card-dark max-w-4xl rounded-[2rem] p-10 shadow-2xl shadow-black/20">
            <p className="brand-kicker">Start with the right level of clarity</p>
            <h2 className="brand-heading-lg mt-3">
              There are three sensible ways to begin.
            </h2>
            <p className="brand-subheading brand-body-on-dark mt-4 max-w-3xl">
              You can start with the HR Operations Health Check, move into the
              HR Operations Diagnostic Assessment for deeper clarity, or discuss
              whether the HR Foundations Sprint is the right next step for your
              organisation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/diagnostic"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                Take the Health Check
              </Link>
              <Link
                href="/diagnostic-assessment"
                className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
              >
                View Diagnostic Assessment
              </Link>
              <Link
                href="/services/hr-foundations-sprint"
                className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium transition hover:bg-white/10"
              >
                View the HR Foundations Sprint
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}