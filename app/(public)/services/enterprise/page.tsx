import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Enterprise & Complex Organisations",
  description:
    "HR operations advisory for enterprise organisations navigating service delivery transformation, HR technology change, shared services, governance, and global complexity.",
};

const recognitionItems = [
  {
    number: "01",
    title: "Service delivery starts to drift",
    text: "Variation begins to show across regions, business units, and local operating habits. What worked at one scale stops working at another.",
  },
  {
    number: "02",
    title: "Shared services absorb too much",
    text: "The model takes on complexity it was never designed to handle cleanly. Volume increases but the underlying architecture does not change to match it.",
  },
  {
    number: "03",
    title: "Workflows get heavier",
    text: "Process exists, but execution becomes less reliable across teams and situations. Workarounds accumulate and the real workflow diverges from the documented one.",
  },
  {
    number: "04",
    title: "Governance weakens in practice",
    text: "Control exists on paper, but becomes harder to maintain in day-to-day operation. Decisions get made inconsistently and ownership becomes unclear.",
  },
];

const outcomeAreas = [
  {
    title: "Clearer operating control",
    text: "Service delivery, ownership, and escalation paths hold more consistently across the environment.",
  },
  {
    title: "Stronger workflow discipline",
    text: "Approvals, handoffs, integrations, and process logic operate more cleanly under pressure.",
  },
  {
    title: "Better organisational coherence",
    text: "Shared services, business units, technologies, and acquired models work together more effectively.",
  },
];

const improvementAreas = [
  {
    title: "Clear operating control",
    text: "Defined ownership, clearer escalation paths, and more predictable service delivery across the business.",
  },
  {
    title: "Stronger workflow discipline",
    text: "Cleaner approvals, more reliable process execution, and fewer manual workarounds where the model is under pressure.",
  },
  {
    title: "Better organisational coherence",
    text: "Shared services, business units, technologies, and integration points working together with greater consistency.",
  },
];

function RecognitionItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[4.25rem_1fr] gap-5 border-t border-slate-200 py-10 lg:grid-cols-[5.5rem_minmax(0,1fr)] lg:gap-8 lg:py-12">
      <div className="pt-1">
        <p className="text-[3rem] font-semibold leading-none tracking-[-0.04em] text-slate-300 lg:text-[4.5rem]">
          {number}
        </p>
      </div>

      <div className="max-w-2xl">
        <h3 className="text-[1.35rem] font-semibold leading-[1.2] text-slate-950 lg:text-[1.55rem]">
          {title}
        </h3>

        <p className="mt-3 text-base leading-8 text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function OutcomeStatement({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="border-t border-white/12 pt-8 lg:pt-10">
      <h3 className="min-h-[4.25rem] text-[1.35rem] font-semibold leading-[1.15] text-white lg:min-h-[4.75rem] lg:text-[1.55rem]">
        {title}
      </h3>

      <p className="mt-4 max-w-md text-[0.98rem] leading-8 text-white/60">
        {text}
      </p>
    </div>
  );
}

export default function EnterprisePage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Enterprise & Complex Organisations</p>

              <h1 className="brand-heading-xl">
                Advisory for complex HR operating environments.
              </h1>
            </div>

            <p className="brand-subheading brand-body-on-dark">
              Enterprise HR functions rarely struggle because nothing is in
              place. The challenge is that service delivery, workflow,
              governance, and control stop running cleanly as the environment
              becomes more complex.
            </p>

            <p className="text-base leading-8 text-[#C7D8EA]">
              That usually shows up through more variation, heavier workflows,
              fragmented ownership, and a model that becomes harder to run with
              consistency and confidence.
            </p>

            <div className="brand-actions">
              <Link
                href="/diagnostic"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Take the Health Check
              </Link>

              <Link
                href="/contact?topic=Enterprise%20HR%20Operations%20%26%20Transformation"
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
            <p className="brand-section-kicker">What starts to break at scale</p>

            <h2 className="brand-heading-lg text-slate-950">
              You usually feel it before you step back and diagnose it.
            </h2>

            <p className="brand-body-lg">
              Enterprise HR functions rarely lack effort. The strain shows up
              when the model no longer holds cleanly across services, systems,
              governance, and change.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="border-b border-slate-200">
              {recognitionItems.map((item) => (
                <RecognitionItem
                  key={item.number}
                  number={item.number}
                  title={item.title}
                  text={item.text}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B */}
      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-kicker">What needs to change</p>

            <h2 className="max-w-3xl text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.035em] text-white lg:text-[3.45rem]">
              The work is usually about restoring consistency, control, and
              confidence.
            </h2>

            <p className="max-w-3xl text-[1.05rem] leading-8 text-white/90">
              At this point, the issue is rarely effort. It is that the model no
              longer produces consistent outcomes without increasing reliance on
              workarounds.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
              {outcomeAreas.map((item) => (
                <OutcomeStatement
                  key={item.title}
                  title={item.title}
                  text={item.text}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C */}
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">What we bring</p>

            <h2 className="brand-heading-lg text-slate-950">
              Focused improvements that strengthen how HR operates.
            </h2>

            <p className="brand-body-lg">
              The work is not about replacing what exists. It is about improving
              how it runs, where complexity, scale, or change has made it harder
              to operate cleanly.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              {improvementAreas.map((item) => (
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
      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>

                <h2 className="brand-heading-lg">
                  Get a clearer view of how your HR model is running.
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Start with the Health Check for an immediate view, or start a
                  conversation if the challenge is already clear.
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
                  href="/contact?topic=Enterprise%20HR%20Operations%20%26%20Transformation"
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