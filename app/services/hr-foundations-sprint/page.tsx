import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HR Foundations Sprint | Van Esch Advisory Ltd",
  description:
    "A focused 4 week engagement for growing companies that need stronger HR foundations, clearer processes, better onboarding, and a practical roadmap for improvement.",
};

const outcomes = [
  "Clearer HR processes and ownership",
  "More consistent onboarding and employee lifecycle management",
  "Improved HR system structure and data clarity",
  "Stronger operational discipline",
  "A clear roadmap for future improvements",
];

const idealFor = [
  "Scaling businesses (50–500 employees)",
  "Founder-led organisations growing quickly",
  "Companies preparing for funding, expansion, or operational change",
  "Businesses that feel HR has become operationally messy or reactive",
];

export default function HRFoundationsSprintPage() {
  return (
    <main>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Signature Offer</p>
              <h1 className="brand-heading-lg">HR Foundations Sprint</h1>
              <p className="brand-subheading brand-body-on-dark max-w-3xl">
                A focused four-week engagement for growing organisations that
                need stronger HR foundations, clearer processes, and a practical
                plan for what to fix first.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/contact?topic=HR%20Foundations%20for%20Growing%20Companies"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Discuss the Sprint
              </Link>
              <Link
                href="/diagnostic"
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Take the Diagnostic First
              </Link>
              <Link
                href="/services/growing-companies"
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Back to Growing Companies
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="max-w-4xl brand-stack-sm">
              <p className="brand-section-kicker">Why this exists</p>
              <h2 className="brand-heading-lg text-slate-950">
                A clear starting point for growing businesses
              </h2>
              <p className="brand-subheading text-slate-700">
                Many scaling businesses reach a point where HR starts to feel
                messy and reactive. Processes exist, but they are inconsistent,
                managers handle situations differently, onboarding varies
                between teams, and HR spends too much time coordinating rather
                than improving. The HR Foundations Sprint is designed to quickly
                diagnose the operational gaps and establish the core structures
                that help a growing organisation run its people operations more
                smoothly.
              </p>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">
                  Not sure if you need the sprint yet?
                </p>
                <h3 className="brand-heading-md text-slate-950">
                  Start with the HR Operations Health Check.
                </h3>
                <p className="brand-body">
                  If you are still trying to understand whether the issue is
                  isolated friction or a wider operational pattern, the
                  diagnostic is a useful first step.
                </p>
                <ul className="space-y-2 text-base leading-8 text-slate-700">
                  <li className="ml-5 list-disc">
                    A quick self-assessment of HR operational strain
                  </li>
                  <li className="ml-5 list-disc">
                    An immediate score and high-level interpretation
                  </li>
                  <li className="ml-5 list-disc">
                    A practical way to gauge whether deeper support may help
                  </li>
                </ul>
                <div className="pt-2">
                  <Link
                    href="/diagnostic"
                    className="brand-button-primary px-5 py-3 text-base font-medium"
                  >
                    Take the Diagnostic
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">How it works</p>
            <h2 className="brand-heading-lg text-slate-950">
              A focused four-week engagement
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <h3 className="brand-heading-md text-slate-950">
                  Week 1 — Discovery & Business Understanding
                </h3>
                <p className="brand-body">
                  We start by understanding how the organisation currently
                  operates through leadership conversations, HR discussions,
                  review of documentation, and a grounded understanding of the
                  growth context of the business.
                </p>
              </div>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <h3 className="brand-heading-md text-slate-950">
                  Week 2 — Current State Mapping
                </h3>
                <p className="brand-body">
                  Existing onboarding, employee lifecycle processes,
                  responsibilities, systems, and manual workarounds are mapped
                  so that operational friction becomes visible.
                </p>
              </div>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <h3 className="brand-heading-md text-slate-950">
                  Week 3 — Insight & Prioritisation
                </h3>
                <p className="brand-body">
                  Improvement opportunities are identified and prioritised using
                  practical exercises such as Start / Stop / Continue reviews,
                  leadership prioritisation discussions, and future-state
                  thinking.
                </p>
              </div>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <h3 className="brand-heading-md text-slate-950">
                  Week 4 — Practical Recommendations
                </h3>
                <p className="brand-body">
                  You receive a clear set of recommendations covering process
                  improvements, onboarding, systems, policy priorities, and
                  next-step actions that fit the reality of the business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">Typical outcomes</p>
              <h2 className="brand-heading-lg text-slate-950">
                What you leave with
              </h2>
              <div className="mt-8 space-y-3 text-base text-slate-700">
                {outcomes.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg bg-slate-50 px-4 py-3"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="brand-stack-sm">
              <p className="brand-section-kicker">Best suited to</p>
              <h2 className="brand-heading-lg text-slate-950">
                Ideal organisations
              </h2>
              <div className="mt-8 space-y-3 text-base text-slate-700">
                {idealFor.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg bg-slate-50 px-4 py-3"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
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
                  A clear plan before deeper transformation work.
                </h2>
                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Some organisations use the sprint to create clarity and
                  implement internally. Others continue into project-based
                  support. Either way, the sprint gives the business a practical
                  and credible starting point.
                </p>
                <p className="brand-body-on-dark max-w-3xl">
                  If you are still weighing up whether the sprint is the right
                  fit, the diagnostic can give you a useful first read before
                  starting a conversation.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/contact?topic=HR%20Foundations%20for%20Growing%20Companies"
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
                  href="/services/growing-companies"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Back to Growing Companies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}