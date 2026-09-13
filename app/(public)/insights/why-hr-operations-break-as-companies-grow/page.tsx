import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why HR Operations Break as Companies Grow",
  description:
    "Why informal HR processes become harder to sustain as organisations scale, and the operational signs that show where the HR model needs strengthening.",
};

const signals = [
  "Managers begin handling similar situations in different ways.",
  "Employees are less clear about where to go for HR support.",
  "Onboarding starts to vary by team, manager, or location.",
  "The same questions and exceptions return repeatedly to HR.",
  "Manual handoffs increase between systems, teams, and countries.",
  "HR capacity shifts towards reacting rather than improving the model.",
];

export default function ArticlePage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl">
            <p className="brand-kicker">HR Operations Insights</p>
            <h1 className="brand-heading-xl mt-3">
              Why HR Operations Break as Companies Grow
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Informal HR ways of working can serve an organisation well for a
              long time. The problem appears when growth makes those same ways
              of working harder to repeat consistently.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section">
          <article className="mx-auto max-w-4xl">
            <div className="brand-body-lg space-y-6">
              <p>
                In an earlier-stage organisation, HR often works through direct
                relationships, local knowledge, and quick decisions. Processes
                evolve around what the business needs at the time. That is not
                necessarily a weakness. It can be a sensible response to pace
                and limited complexity.
              </p>

              <p>
                The challenge is that growth changes the operating conditions.
                More managers, more locations, more systems, more employee
                journeys, and more exceptions make it harder for informal
                coordination to produce the same result every time.
              </p>
            </div>

            <div className="mt-12">
              <p className="brand-section-kicker">The shift</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                Growth exposes the limits of informal coordination.
              </h2>
              <div className="brand-body mt-5 space-y-5">
                <p>
                  HR operations rarely fail in one dramatic moment. The pattern
                  is usually gradual. A process that worked through memory and
                  judgement becomes dependent on who is involved. A shared
                  inbox becomes difficult to manage. Local workarounds multiply.
                  Managers receive different answers to similar questions.
                </p>
                <p>
                  At that point, the issue is not simply whether HR needs more
                  people. The more important question is whether the operating
                  model is clear enough for the organisation that now exists.
                </p>
              </div>
            </div>

            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-7 lg:p-8">
              <h2 className="brand-heading-md text-slate-950">
                Common signals that the model is under strain
              </h2>
              <ul className="mt-5 list-disc space-y-3 pl-6 text-base leading-8 text-slate-700">
                {signals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>

            <div className="mt-12">
              <p className="brand-section-kicker">Operating model</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                The answer is usually more than process documentation.
              </h2>
              <div className="brand-body mt-5 space-y-5">
                <p>
                  An HR operating model is not just an organisation chart. It
                  is the combination of process, ownership, service routes,
                  technology, knowledge, capacity, data handoffs, and governance
                  that determines how work actually moves through HR.
                </p>
                <p>
                  A stronger model makes routine work easier to repeat and
                  exceptions easier to resolve. It should clarify who owns the
                  work, where managers and employees go for support, what should
                  be standardised, where local flexibility is needed, and how
                  systems support the process rather than creating additional
                  handoffs.
                </p>
              </div>
            </div>

            <div className="mt-12">
              <p className="brand-section-kicker">Priorities</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                Strengthen the highest-impact parts of the model first.
              </h2>
              <div className="brand-body mt-5 space-y-5">
                <p>
                  Most organisations do not need to redesign everything at
                  once. The better starting point is to identify where the
                  operating model is creating the greatest inconsistency or
                  avoidable demand and strengthen those areas first.
                </p>
                <p>
                  That might mean clearer process ownership, a better service
                  entry point, stronger manager guidance, a more deliberate case
                  management approach, simpler handoffs, or technology that is
                  better aligned to the way work should happen.
                </p>
                <p>
                  The sequence matters. Adding technology to an unclear process
                  can automate the confusion. Adding headcount to an unclear
                  service model can increase capacity without improving
                  consistency. Operational clarity should come first.
                </p>
              </div>
            </div>

            <div className="mt-12 rounded-2xl bg-[#0D1F3C] p-8 text-white lg:p-10">
              <p className="brand-kicker">A practical first step</p>
              <h2 className="brand-heading-lg mt-3 text-white">
                Start by understanding where the strain is showing up.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#C7D8EA]">
                The HR Operations Health Check provides an initial structured
                view across the core areas that determine how reliably HR runs.
                If the organisation already has an established operating model,
                the Diagnostic Assessment goes deeper across HR, managers, and
                leadership.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/diagnostic" className="brand-button-primary">
                  Take the Health Check
                </Link>
                <Link
                  href="/diagnostic-assessment"
                  className="brand-button-secondary-dark"
                >
                  View Diagnostic Assessment
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
