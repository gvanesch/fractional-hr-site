import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HR Foundations Sprint | Van Esch Advisory Ltd",
  description:
    "A focused 4 week engagement for organisations that need stronger HR foundations, clearer processes, and a practical roadmap for improvement built on structured diagnostic insight.",
};

const outcomes = [
  "Clearer HR processes and ownership",
  "More consistent onboarding and employee lifecycle management",
  "More effective process mapping and operational improvement priorities",
  "Stronger operational discipline",
  "A clear roadmap for future improvements",
];

const idealFor = [
  "Scaling businesses that need stronger HR operational foundations",
  "Founder-led organisations growing quickly",
  "Companies preparing for funding, expansion, or operational change",
  "Businesses where HR feels increasingly messy, reactive, or inconsistent",
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
                A focused four-week engagement for organisations that need
                stronger HR foundations, clearer processes, and a practical plan
                for improving what matters first.
              </p>
              <p className="brand-body-on-dark max-w-3xl">
                The Sprint is designed as diagnostic-informed execution. It
                builds on structured insight to clarify priorities, reduce
                ambiguity early, and focus effort on the changes most likely to
                improve operational clarity, consistency, and control.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/contact?topic=HR%20Foundations%20Sprint"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Discuss the Sprint
              </Link>
              <Link
                href="/diagnostic-assessment"
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                See the Diagnostic Assessment
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
                A clear starting point for organisations that need stronger HR
                operations
              </h2>
              <p className="brand-subheading text-slate-700">
                Many organisations reach a point where HR starts to feel messy
                and reactive. Processes exist, but they are inconsistent,
                managers handle similar situations differently, onboarding varies
                between teams, and HR spends too much time coordinating rather
                than improving.
              </p>
              <p className="brand-body">
                The HR Foundations Sprint is designed to turn structured
                diagnostic insight into focused analysis, clearer priorities, and
                practical design decisions. It is not open-ended discovery. It
                is a concentrated piece of work aimed at improving the areas that
                will make the greatest operational difference.
              </p>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">What informs the Sprint</p>
                <h3 className="brand-heading-md text-slate-950">
                  The Sprint works best when it begins with clarity
                </h3>
                <p className="brand-body">
                  Where appropriate, it builds on the HR Operations Diagnostic
                  Assessment so the engagement starts with a structured view of
                  where friction, inconsistency, and operational risk are
                  already visible.
                </p>
                <ul className="space-y-2 text-base leading-8 text-slate-700">
                  <li className="ml-5 list-disc">
                    A clearer read on where operational drag is building
                  </li>
                  <li className="ml-5 list-disc">
                    Better focus on the areas most in need of attention
                  </li>
                  <li className="ml-5 list-disc">
                    Less ambiguity about where effort should be directed first
                  </li>
                </ul>
                <div className="pt-2">
                  <Link
                    href="/diagnostic-assessment"
                    className="brand-button-primary px-5 py-3 text-base font-medium"
                  >
                    View Diagnostic Assessment
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
            <p className="brand-subheading text-slate-700">
              The structure is designed to move from confirmed priorities into
              targeted analysis, practical design decisions, and a roadmap that
              fits the organisation as it actually operates.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <h3 className="brand-heading-md text-slate-950">
                  Week 1 — Priority Confirmation & Context
                </h3>
                <p className="brand-body">
                  We begin by confirming the priority areas, business context,
                  and operational realities that matter most. This is about
                  grounding the Sprint in evidence and organisational context,
                  not starting from a blank sheet.
                </p>
              </div>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <h3 className="brand-heading-md text-slate-950">
                  Week 2 — Current State Mapping
                </h3>
                <p className="brand-body">
                  The most relevant processes, responsibilities, systems, and
                  manual workarounds are mapped so that operational friction,
                  weak handoffs, and inconsistent ownership become visible.
                </p>
              </div>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <h3 className="brand-heading-md text-slate-950">
                  Week 3 — Prioritisation & Design
                </h3>
                <p className="brand-body">
                  Improvement opportunities are assessed and prioritised. The
                  Sprint focuses on practical design decisions that strengthen
                  clarity, consistency, and execution rather than producing
                  generic observations.
                </p>
              </div>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <h3 className="brand-heading-md text-slate-950">
                  Week 4 — Recommendations & Roadmap
                </h3>
                <p className="brand-body">
                  You receive a clear set of recommendations, practical next
                  steps, and a roadmap that reflects the operational reality of
                  the business and the changes most likely to have meaningful
                  effect.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 lg:p-10">
            <div className="max-w-4xl brand-stack-sm">
              <p className="brand-section-kicker">Why the sequence matters</p>
              <h2 className="brand-heading-lg text-slate-950">
                This is designed to reduce ambiguity early
              </h2>
              <p className="brand-subheading text-slate-700">
                The value of the Sprint comes from focusing effort where it will
                make the greatest operational difference. Starting with
                structured diagnostic insight helps distinguish symptoms from
                causes, avoids unnecessary activity, and improves the quality of
                the roadmap that follows.
              </p>
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
                  Focused execution, grounded in structured insight
                </h2>
                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Some organisations use the Sprint to create clarity and then
                  implement internally. Others continue into project-based
                  support. Either way, the Sprint gives the business a practical
                  and credible starting point for improving HR operations.
                </p>
                <p className="brand-body-on-dark max-w-3xl">
                  If you are not yet sure whether the Sprint is the right fit,
                  the HR Operations Diagnostic Assessment is the best next step.
                  It creates the structured clarity that helps determine whether
                  focused execution support is needed.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/contact?topic=HR%20Foundations%20Sprint"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Discuss the Sprint
                </Link>
                <Link
                  href="/diagnostic-assessment"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  See the Diagnostic Assessment
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