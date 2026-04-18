import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Growing Companies & Mid-Market",
  description:
    "Practical HR foundations for growing companies and mid-market organisations, including stronger onboarding, clearer ownership, better process discipline, and a structured path from initial read to focused action.",
};

const recognitionItems = [
  {
    number: "01",
    title: "Managers start creating their own ways of doing things",
    text: "Hiring, onboarding, and employee support begin to vary by manager, team, or urgency. What feels practical in the moment creates inconsistency over time.",
  },
  {
    number: "02",
    title: "Processes exist, but do not always hold",
    text: "Policies and documentation are there, but they are not always followed or understood consistently across the organisation.",
  },
  {
    number: "03",
    title: "HR becomes increasingly reactive",
    text: "Work is driven by incoming issues rather than a clear operating rhythm. The same questions and problems surface repeatedly.",
  },
  {
    number: "04",
    title: "Onboarding and employee experience varies",
    text: "New joiners have very different experiences depending on who is involved, which creates gaps early in the lifecycle.",
  },
];

const outcomeAreas = [
  {
    title: "Clearer ownership",
    text: "So HR work does not sit loosely across managers, founders, finance, and ad hoc fixes.",
  },
  {
    title: "Stronger onboarding",
    text: "So new joiners experience a more consistent start, with fewer gaps, delays, and workarounds.",
  },
  {
    title: "Better process discipline",
    text: "So the basics hold under pressure, instead of changing by manager, team, or urgency.",
  },
];

const journeySteps = [
  {
    title: "Start with an initial read",
    text: "A useful starting point when you want a quick view of whether the strain you are seeing is isolated or part of a broader pattern.",
    href: "/diagnostic",
    cta: "Take the Health Check",
  },
  {
    title: "Build a clearer diagnosis",
    text: "Where the pattern is already visible and a more structured view is needed across leadership, managers, and HR.",
    href: "/diagnostic-assessment",
    cta: "View Diagnostic Assessment",
  },
  {
    title: "Move into focused action",
    text: "Once the priorities are clear enough to act, and the focus shifts to improving the highest-impact gaps first.",
    href: "/services/hr-foundations-sprint",
    cta: "See the HR Foundations Sprint",
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

function JourneyRow({
  title,
  text,
  href,
  cta,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="grid gap-10 border-t border-slate-200 py-8 lg:grid-cols-[minmax(0,18rem)_1fr_auto] lg:items-center lg:gap-12 lg:py-10">
      <h3 className="text-[1.1rem] font-semibold leading-[1.3] text-slate-950 lg:text-[1.2rem]">
        {title}
      </h3>

      <p className="text-[0.98rem] leading-7 text-slate-600">{text}</p>

      <div>
        <Link
          href={href}
          className="brand-button-dark rounded-xl px-5 py-3 text-base font-medium whitespace-nowrap"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

export default function GrowingCompaniesPage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Growing Companies & Mid-Market</p>

              <h1 className="brand-heading-xl">
                HR foundations that support growth without unnecessary complexity.
              </h1>
            </div>

            <p className="brand-subheading brand-body-on-dark max-w-3xl">
              Growing organisations often reach the point where informal
              processes start to break down. Managers create their own
              workarounds, onboarding varies, and HR becomes more
              reactive than operational.
            </p>

            <p className="max-w-3xl text-base leading-8 text-[#C7D8EA]">
              What’s needed at that point is not more activity, but more
              structure. Clearer ownership, stronger onboarding, and
              processes that support the business as it grows.
            </p>

            <div className="brand-actions">
              <Link
                href="/diagnostic"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Take the Health Check
              </Link>

              <Link
                href="/services/hr-chaos-signals"
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Recognise the Signs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION A */}
      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">What starts to break</p>

            <h2 className="brand-heading-lg text-slate-950">
              You usually feel it before you step back and fix it.
            </h2>

            <p className="brand-body-lg">
              Growing organisations rarely set out to build inconsistent HR
              operations. The model evolves around speed, pressure, and what
              works at the time. Over time, that creates friction.
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
              The work is usually about creating clarity, consistency, and
              control.
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
            <p className="brand-section-kicker">How organisations usually begin</p>

            <h2 className="brand-heading-lg text-slate-950">
              Start with the right level of clarity.
            </h2>

            <p className="brand-body-lg">
              Some organisations start with an initial read. Others move
              straight into a more structured diagnosis when the pattern is
              already visible. Focused action follows once the highest-impact
              gaps are clear.
            </p>
          </div>

          <div className="brand-section-body-xl grid gap-8 lg:grid-cols-3 lg:gap-10">
            {journeySteps.map((step) => (
              <div
                key={step.title}
                className="flex h-full flex-col border-t border-slate-200 pt-8"
              >
                <h3 className="min-h-[3.25rem] text-[1.1rem] font-semibold leading-[1.3] text-slate-950 lg:min-h-[3.5rem] lg:text-[1.2rem]">
                  {step.title}
                </h3>

                <p className="mt-4 flex-1 text-[0.98rem] leading-7 text-slate-600">
                  {step.text}
                </p>

                <div className="mt-6">
                  <Link
                    href={step.href}
                    className="brand-button-dark rounded-xl px-5 py-3 text-base font-medium"
                  >
                    {step.cta}
                  </Link>
                </div>
              </div>
            ))}
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
                  Get clear on what needs tightening before growth makes it harder.
                </h2>

                <p className="brand-subheading brand-body-on-dark">
                  Start with the Health Check, move into the Diagnostic
                  Assessment for deeper clarity, or request a tailored
                  discussion if the pattern is already clear.
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
                  href="/contact?topic=HR%20Foundations%20for%20Growing%20Companies"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Request a tailored discussion
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}