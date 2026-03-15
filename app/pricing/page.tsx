import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | Greg van Esch",
  description:
    "Clear starting points for improving HR operations, including the HR Foundations Sprint, an HR Operations Health Check, and follow-on advisory support.",
};

const sprintIncludes = [
  "Leadership and HR stakeholder discussions",
  "Review of existing HR processes and systems",
  "Employee lifecycle process mapping",
  "Operational maturity assessment",
  "Leadership prioritisation workshop",
  "Development of a practical improvement roadmap",
];

const sprintDeliverables = [
  "HR Operations Diagnostic",
  "Employee Lifecycle Process Map",
  "Operational Friction Analysis",
  "HR Operational Maturity Assessment",
  "HR Foundations Roadmap",
  "Executive Recommendations Presentation",
];

const followOnWork = [
  "HR service delivery design",
  "Onboarding process redesign",
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
              Most organisations begin with the HR Foundations Sprint, a focused
              engagement designed to diagnose HR operational gaps and create a
              clear improvement roadmap.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/services/hr-foundations-sprint"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                View the HR Foundations Sprint
              </Link>
              <Link
                href="/diagnostic"
                className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
              >
                Take the Diagnostic First
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="brand-surface rounded-[2rem] p-8">
              <p className="brand-section-kicker">HR Foundations Sprint</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                For growing organisations up to 120 employees
              </h2>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="brand-surface-soft rounded-2xl p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Investment
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                    £11,500 + VAT
                  </p>
                </div>

                <div className="brand-surface-soft rounded-2xl p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Duration
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                    4 weeks
                  </p>
                </div>
              </div>

              <div className="brand-body brand-body-lg mt-8 space-y-4">
                <p>
                  The sprint is designed for organisations where HR processes
                  have evolved organically and are starting to feel inconsistent
                  or reactive.
                </p>
                <p>
                  During the sprint, I analyse how HR currently operates,
                  identify operational friction, and provide a practical roadmap
                  for improvement.
                </p>
              </div>

              <div className="mt-10">
                <p className="brand-section-kicker">What the Sprint Includes</p>
                <div className="mt-6 space-y-3">
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

              <div className="mt-10">
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

            <div className="space-y-6">
              <div className="brand-surface-soft rounded-[1.75rem] p-8">
                <p className="brand-section-kicker">Not sure if the sprint is the right starting point?</p>
                <h3 className="brand-heading-md mt-3 text-slate-950">
                  Start with the HR Operations Health Check
                </h3>
                <div className="brand-body mt-4 space-y-4">
                  <p>
                    If you are still trying to understand whether the issue is isolated friction
                    or a wider operational pattern, the diagnostic is a useful lower-commitment
                    first step.
                  </p>
                  <p>The diagnostic gives you:</p>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-lg bg-white px-4 py-3 text-base text-slate-700">
                    A simple HR Operations Score
                  </div>
                  <div className="rounded-lg bg-white px-4 py-3 text-base text-slate-700">
                    An immediate maturity-style result band
                  </div>
                  <div className="rounded-lg bg-white px-4 py-3 text-base text-slate-700">
                    A practical first read on where friction may be building
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/diagnostic"
                    className="brand-button-primary inline-flex rounded-xl px-5 py-3 text-base font-medium"
                  >
                    Take the Diagnostic
                  </Link>
                </div>
              </div>

              <div className="brand-surface-soft rounded-[1.75rem] p-8">
                <p className="brand-section-kicker">What happens after the sprint?</p>
                <h3 className="brand-heading-md mt-3 text-slate-950">
                  Follow-on implementation support
                </h3>
                <div className="brand-body mt-4 space-y-4">
                  <p>
                    Following the sprint, organisations typically either
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

              <div className="brand-surface-soft rounded-[1.75rem] p-8">
                <p className="brand-section-kicker">Ongoing Advisory Support</p>
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
              If you&apos;re unsure whether the sprint is the right starting point, there are two sensible next steps.
            </h2>
            <p className="brand-subheading brand-body-on-dark mt-4 max-w-3xl">
              You can take the HR Operations Health Check for an immediate self-assessment,
              or book a short diagnostic conversation to discuss whether the HR Foundations
              Sprint would be useful for your organisation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/diagnostic"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                Take the Diagnostic
              </Link>
              <Link
                href="/contact"
                className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
              >
                Book a Diagnostic Conversation
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