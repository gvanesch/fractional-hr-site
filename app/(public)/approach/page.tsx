import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Approach",
  description:
    "A practical, structured approach to HR operations advisory grounded in operational reality, diagnostic clarity, and sustainable implementation.",
};

const recognitionItems = [
  {
    number: "01",
    title: "Templates do not reflect how organisations actually operate",
    text: "Standard models can be useful, but they often miss how work really gets done across teams, systems, and decision-making environments.",
  },
  {
    number: "02",
    title: "The same issue looks different across the organisation",
    text: "HR, managers, and leadership experience the operating model differently. Without that comparison, the real pattern is hard to see.",
  },
  {
    number: "03",
    title: "Activity increases without improving outcomes",
    text: "More process, more documentation, and more effort do not always create better delivery. The model needs to be understood before it is changed.",
  },
];

const principles = [
  {
    title: "Grounded in how the business operates",
    text: "The starting point is how work actually happens across the organisation. Not how it is supposed to work on paper.",
  },
  {
    title: "Focused on what will make a difference",
    text: "The aim is not to improve everything. It is to identify where change will have the greatest operational impact.",
  },
  {
    title: "Designed for the stage of the business",
    text: "A growing company and a complex enterprise require different levels of structure. The work reflects that.",
  },
];

export default function ApproachPage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Approach</p>

              <h1 className="brand-heading-xl">
                A practical approach to improving how HR operates.
              </h1>
            </div>

            <p className="brand-subheading brand-body-on-dark max-w-3xl">
              The work starts by understanding how the organisation actually
              runs.
            </p>

            <p className="max-w-3xl text-base leading-8 text-[#C7D8EA]">
              From there, it focuses on where change will have the greatest
              operational impact, and what can be implemented in a way that
              holds over time.
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

      {/* SECTION A */}
      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Why this approach matters</p>

            <h2 className="brand-heading-lg max-w-3xl text-slate-950">
              The right answer depends on how the organisation actually works.
            </h2>

            <p className="brand-body-lg">
              Most organisations are not short on effort. They are short on
              clarity about where to act. The work starts by understanding where
              the HR model is no longer running cleanly at the current scale or
              level of complexity.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="border-b border-slate-200">
              {recognitionItems.map((item) => (
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

      {/* SECTION B */}
      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-kicker">How the work starts</p>

            <h2 className="max-w-3xl text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.035em] text-white lg:text-[3.45rem]">
              Start with clarity before deciding what to change.
            </h2>

            <p className="max-w-3xl text-[1.05rem] leading-8 text-white/90">
              The work usually begins with a structured view of how HR operates
              today. That may start with the{" "}
              <Link href="/diagnostic" className="underline decoration-white/30 underline-offset-4 hover:text-white">
                Health Check
              </Link>
              , a{" "}
              <Link href="/diagnostic-assessment" className="underline decoration-white/30 underline-offset-4 hover:text-white">
                deeper diagnostic
              </Link>
              , or a focused discussion where the pattern is already visible.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
              <div className="border-t border-white/12 pt-8">
                <h3 className="brand-heading-sm text-white">
                  Initial signal
                </h3>
                <p className="mt-4 text-base leading-8 text-white/60">
                  A quick read of where operational strain may be building.
                </p>
              </div>

              <div className="border-t border-white/12 pt-8">
                <h3 className="brand-heading-sm text-white">
                  Structured diagnostic
                </h3>
                <p className="mt-4 text-base leading-8 text-white/60">
                  A clearer view across HR, managers, and leadership.
                </p>
              </div>

              <div className="border-t border-white/12 pt-8">
                <h3 className="brand-heading-sm text-white">
                  Focused discussion
                </h3>
                <p className="mt-4 text-base leading-8 text-white/60">
                  Where the issue is visible and needs to be shaped into action.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C */}
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Principles</p>

            <h2 className="brand-heading-lg max-w-3xl text-slate-950">
              The work follows a small number of consistent principles.
            </h2>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              {principles.map((item) => (
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

      {/* SECTION D */}
      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">What this means in practice</p>

            <h2 className="brand-heading-lg max-w-3xl text-slate-950">
              Clear priorities, practical improvements, and work that holds.
            </h2>

            <p className="brand-body-lg">
              The outcome is not documentation for its own sake. It is a clearer
              understanding of what needs to change, where effort should be
              focused, and how improvement can be implemented without adding
              unnecessary complexity.
            </p>
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