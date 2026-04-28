import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Clear pricing aligned to how HR operations work typically progresses, from initial signal to structured diagnostic and focused improvement.",
};

export default function PricingPage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Pricing</p>

              <h1 className="brand-heading-xl">
                Clear pricing aligned to how the work actually progresses.
              </h1>
            </div>

            <p className="brand-subheading brand-body-on-dark max-w-3xl">
              Most organisations start with a signal or a diagnostic. Then move
              into focused improvement once the priorities are clear.
            </p>

            <div className="brand-actions">
              <Link href="/diagnostic" className="brand-button-primary">
                Take the Health Check
              </Link>

              <Link href="/contact" className="brand-button-secondary-dark">
                Start a conversation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PATHWAY */}
      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">How the work is structured</p>

            <h2 className="brand-heading-lg text-slate-950">
              A clear path from signal to action.
            </h2>
          </div>

          <div className="brand-section-body-xl">
            <div className="border-b border-slate-200">
              {[
                {
                  number: "01",
                  title: "Initial signal",
                  text: "A quick read of where operational strain may be building.",
                },
                {
                  number: "02",
                  title: "Structured diagnostic",
                  text: "A cross-role view of how HR operates in practice.",
                },
                {
                  number: "03",
                  title: "Focused improvement",
                  text: "Targeted work on the areas that will make the biggest difference.",
                },
              ].map((item) => (
                <div
                  key={item.number}
                  className="grid grid-cols-[4.25rem_1fr] gap-5 border-t border-slate-200 py-10 lg:grid-cols-[5.5rem_minmax(0,1fr)] lg:gap-8 lg:py-12"
                >
                  <div className="pt-1">
                    <p className="text-[3rem] font-semibold leading-none tracking-[-0.04em] text-slate-300 lg:text-[4.5rem]">
                      {item.number}
                    </p>
                  </div>

                  <div className="max-w-2xl">
                    <h3 className="text-[1.35rem] font-semibold leading-[1.2] text-slate-950 lg:text-[1.55rem]">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-base leading-8 text-slate-600">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HEALTH CHECK */}
      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Initial signal</p>

            <h2 className="brand-heading-lg text-slate-950">
              HR Operations Health Check
            </h2>

            <p className="brand-body-lg max-w-3xl">
              A structured self-assessment of how HR operations are working
              across your organisation. It takes around three minutes and
              produces an immediate view of where operational strain may be
              building.
            </p>

            <p className="brand-body max-w-3xl">
              This is the simplest place to start if you want to understand
              whether the issue looks isolated or part of a broader operating
              pattern.
            </p>
          </div>

          <div className="mt-8">
            <Link href="/diagnostic" className="brand-button-primary">
              Take the Health Check
            </Link>
          </div>
        </div>
      </section>

      {/* DIAGNOSTIC */}
      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-kicker">Structured diagnostic</p>

            <h2 className="brand-heading-lg max-w-3xl">
              HR Operations Diagnostic Assessment
            </h2>

            <p className="brand-body-on-dark max-w-3xl">
              Used when a quick signal is not enough and a clearer cross-role
              view is needed before acting.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-case-split">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                  Investment
                </p>

                <p className="mt-3 text-[2.75rem] font-semibold tracking-[-0.035em] text-white">
                  £3,000 + VAT
                </p>

                <p className="mt-5 text-base leading-8 text-white/70">
                  Fully credited against the HR Foundations Sprint if you
                  proceed.
                </p>
              </div>

              <div>
                <h3 className="text-[1.2rem] font-semibold text-white">
                  What this gives you
                </h3>

                <div className="mt-5 space-y-3 text-white/70">
                  <p>
                    Structured input gathered across HR, managers, and
                    leadership.
                  </p>
                  <p>
                    A scored view of where delivery is consistent and where it
                    is not.
                  </p>
                  <p>
                    Clear identification of the highest-impact areas to address
                    first.
                  </p>
                  <p>
                    A report the leadership team can use to make decisions and
                    allocate focus.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="brand-actions">
              <Link
                href="/diagnostic-assessment"
                className="brand-button-primary"
              >
                View Diagnostic Assessment
              </Link>

              <Link href="/contact" className="brand-button-secondary-dark">
                Start a conversation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SPRINT */}
      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Focused improvement</p>

            <h2 className="brand-heading-lg text-slate-950">
              HR Foundations Sprint
            </h2>

            <p className="brand-body-lg max-w-3xl">
              A defined engagement, typically run over four weeks, that turns
              diagnostic insight into practical improvement.
            </p>

            <p className="brand-body max-w-3xl">
              The work focuses directly on the areas identified through the
              diagnostic. The output is practical change that can be implemented
              and sustained, not a set of recommendations to act on later.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-case-split">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Standard investment
                </p>

                <p className="mt-3 text-[2.75rem] font-semibold tracking-[-0.035em] text-slate-950">
                  £11,500 + VAT
                </p>

                <p className="mt-5 text-base leading-8 text-slate-600">
                  Includes the Diagnostic Assessment, typically valued at
                  £3,000.
                </p>
              </div>

              <div>
                <h3 className="text-[1.2rem] font-semibold text-slate-950">
                  What this focuses on
                </h3>

                <div className="mt-5 space-y-3 text-slate-600">
                  <p>Clarifying ownership and decision points.</p>
                  <p>Strengthening process consistency across teams.</p>
                  <p>Reducing manual workarounds and operational friction.</p>
                  <p>Creating a sequenced roadmap for improvement.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="brand-actions">
              <Link
                href="/services/hr-foundations-sprint"
                className="brand-button-primary"
              >
                View the HR Foundations Sprint
              </Link>

              <Link href="/contact" className="brand-button-dark">
                Start a conversation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOLLOW-ON */}
      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Follow-on support</p>

            <h2 className="brand-heading-lg text-slate-950">
              Further work is scoped around what the diagnostic reveals.
            </h2>

            <p className="brand-body-lg max-w-3xl">
              Some organisations implement the improvements internally. Others
              continue with targeted support across service delivery,
              onboarding, process redesign, HR technology, governance, or
              operational execution.
            </p>

            <p className="brand-body max-w-3xl">
              Follow-on advisory and implementation support is scoped
              individually based on the organisation, the priorities identified,
              and the level of support required.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="brand-dark-section-plain">
        <div className="brand-container brand-section-tight">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>

                <h2 className="brand-heading-lg max-w-3xl">
                  Start with the Health Check, or move straight into a
                  conversation if the need is already clear.
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  The right starting point depends on how much clarity you
                  already have.
                </p>
              </div>

              <div className="brand-actions">
                <Link href="/diagnostic" className="brand-button-primary">
                  Take the Health Check
                </Link>

                <Link href="/contact" className="brand-button-secondary-dark">
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