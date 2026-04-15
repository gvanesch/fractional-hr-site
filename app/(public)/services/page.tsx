import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services",
  description:
    "HR operations and transformation support for growing companies, complex organisations, and businesses that need focused senior HR advisory.",
};

const servicePaths = [
  {
    title: "Growing Companies & Mid-Market",
    text: "For organisations that need stronger HR foundations, clearer operating rhythms, and more scalable processes before complexity starts to slow the business down.",
    bullets: [
      "HR foundations and operating model clarity",
      "Onboarding and employee lifecycle design",
      "Manager-friendly workflows and documentation",
      "HR systems improvement and practical automation",
    ],
    href: "/services/growing-companies",
    cta: "Explore growing companies",
  },
  {
    title: "Enterprise & Complex Organisations",
    text: "For organisations navigating shared services, HR technology programmes, regulatory complexity, and transformation across multiple markets or entities.",
    bullets: [
      "HR operations transformation and optimisation",
      "Service delivery and shared services design",
      "HR technology and workflow redesign at scale",
      "M&A integration and organisational harmonisation",
    ],
    href: "/services/enterprise",
    cta: "Explore enterprise support",
  },
  {
    title: "Fractional HR Advisory",
    text: "For organisations that need senior HR operations input without a full-time hire, whether during growth, transition, integration, or a period of operational strain.",
    bullets: [
      "Senior advisory input with operational depth",
      "Recurring support for defined priorities",
      "Project-based delivery where progress is needed",
      "Interim cover during change or transition",
    ],
    href: "/services/fractional-hr-advisory",
    cta: "Explore fractional advisory",
  },
];

const recognitionPairs = [
  {
    from: "Ownership feels unclear",
    to: "Clearer accountability",
  },
  {
    from: "Delivery varies across teams",
    to: "More consistent execution",
  },
  {
    from: "Managers get uneven support",
    to: "Better manager enablement",
  },
  {
    from: "Processes do not hold",
    to: "Stronger process discipline",
  },
  {
    from: "Handoffs are unreliable",
    to: "More dependable operating flow",
  },
  {
    from: "The function feels reactive",
    to: "Better operational control",
  },
];

const sprintSteps = [
  {
    title: "1. Diagnostic insight",
    text: "Start with structured insight into where inconsistency, drag, or delivery risk is building.",
  },
  {
    title: "2. Focused analysis",
    text: "Assess the areas creating the most strain rather than reopening every part of the model.",
  },
  {
    title: "3. Prioritisation and design",
    text: "Clarify what should change first, where ownership should sit, and how the model should run.",
  },
  {
    title: "4. Roadmap",
    text: "Turn diagnostic insight into a sequenced plan for the next phase of improvement.",
  },
];

function ServiceCard({
  title,
  text,
  bullets,
  href,
  cta,
}: {
  title: string;
  text: string;
  bullets: string[];
  href: string;
  cta: string;
}) {
  return (
    <div className="brand-surface-card flex h-full flex-col p-8 lg:p-9">
      <div className="flex h-full flex-col">
        <div className="min-h-[7rem] lg:min-h-[7.5rem]">
          <h3 className="brand-heading-md text-slate-950">{title}</h3>
        </div>

        <div className="mt-4 min-h-[9.5rem]">
          <p className="brand-body">{text}</p>
        </div>

        <div className="mt-6 flex-1">
          <div className="space-y-3">
            {bullets.map((bullet) => (
              <div key={bullet} className="brand-surface rounded-xl px-4 py-3">
                <p className="text-base leading-7 text-slate-700">{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Link
            href={href}
            className="brand-button-dark rounded-xl px-5 py-3 text-base font-medium"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PathwayCard({
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
    <div className="brand-surface h-full p-6">
      <div className="flex h-full flex-col">
        <div className="flex-1">
          <h3 className="brand-heading-sm text-slate-950">{title}</h3>
          <p className="mt-3 text-base leading-7 text-slate-700">{text}</p>
        </div>

        <div className="mt-6">
          <Link
            href={href}
            className="brand-button-dark rounded-xl px-5 py-3 text-base font-medium"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="brand-surface h-full p-6">
      <h3 className="brand-heading-sm text-slate-950">{title}</h3>
      <p className="mt-3 text-base leading-7 text-slate-700">{text}</p>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="flex h-full flex-col justify-between">
              <div className="brand-stack-md">
                <div className="brand-stack-sm">
                  <p className="brand-kicker">Services</p>

                  <h1 className="brand-heading-xl">
                    HR advisory focused on how HR actually runs.
                  </h1>
                </div>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Support for organisations that need clearer service delivery,
                  stronger process discipline, better operational control, and a
                  more scalable HR model.
                </p>

                <p className="max-w-3xl text-base leading-8 text-[#C7D8EA]">
                  Some need stronger foundations. Some need support through
                  complexity or change. Others need a clearer diagnostic view
                  before deciding what to improve first.
                </p>
              </div>

              <div className="brand-stack-sm pt-8">
                <div className="flex flex-wrap gap-4">
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
                    Explore the Diagnostic Assessment
                  </Link>
                </div>

                <p className="max-w-3xl text-sm text-[#8AAAC8]">
                  Start with a quick signal, or move into a more structured
                  diagnostic if you need a deeper view.
                </p>
              </div>
            </div>

            <div className="brand-card-dark h-full p-8 lg:p-9">
              <div className="flex h-full flex-col">
                <div className="brand-stack-sm">
                  <p className="brand-kicker">Where this usually helps</p>
                  <p className="text-sm leading-7 text-[#C7D8EA]">
                    Most relevant where the organisation needs more structure,
                    clearer ownership, and stronger operational consistency as it
                    grows or becomes more complex.
                  </p>
                </div>

                <div className="mt-6 grid gap-4">
                  {[
                    "Growing businesses that need stronger HR foundations before complexity becomes embedded",
                    "Organisations improving service delivery, governance, or manager-facing processes",
                    "Businesses navigating transformation, integration, or HR technology change",
                    "Leadership teams that need senior HR operations input for a defined period",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-4"
                    >
                      <p className="text-base leading-7 text-white">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="max-w-4xl brand-stack-sm">
            <p className="brand-section-kicker">Service routes</p>
            <h2 className="brand-heading-lg text-slate-950">
              Three ways to engage, depending on what the organisation needs.
            </h2>
            <p className="brand-body-lg">
              Each route is designed around a different operating context, but
              they are all grounded in the same principle: improve how HR runs,
              not just how it is described.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {servicePaths.map((path) => (
              <ServiceCard key={path.title} {...path} />
            ))}
          </div>
        </div>
      </section>


      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="max-w-4xl brand-stack-sm">
            <p className="brand-section-kicker">How work typically starts</p>

            <h2 className="brand-heading-lg text-slate-950">
              From initial signal to structured action
            </h2>

            <p className="brand-body-lg">
              Most organisations do not start with a full programme of work.
              They begin by understanding where strain is building, then move
              into more structured analysis, followed by focused execution.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <PathwayCard
              title="Initial signal"
              text="A quick way to identify where operational strain may be building across HR, managers, and leadership."
              href="/diagnostic"
              cta="Take the Health Check"
            />

            <PathwayCard
              title="Deeper diagnosis"
              text="A structured, cross-role diagnostic of how HR actually operates, highlighting inconsistency, ownership gaps, and delivery risk."
              href="/diagnostic-assessment"
              cta="Explore Diagnostic Assessment"
            />

            <PathwayCard
              title="Focused action"
              text="A defined engagement to act on diagnostic insight and improve the areas that will have the most operational impact first."
              href="/services/hr-foundations-sprint"
              cta="Explore HR Foundations Sprint"
            />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <div className="brand-surface-soft p-8 lg:p-10 flex flex-col">
              <div className="flex-1 brand-stack-sm">
                <p className="brand-section-kicker">A common operating pattern</p>
                <h2 className="brand-heading-lg text-slate-950">
                  Is HR starting to feel inconsistent or reactive?
                </h2>
                <p className="brand-subheading text-slate-700">
                  Many organisations do not begin by asking for transformation.
                  What they notice first is inconsistency, unclear ownership,
                  manual workarounds, fragmented manager practice, and HR
                  becoming more reactive than operational.
                </p>
                <p className="brand-body">
                  If that feels familiar, reviewing common warning signs is
                  often the first useful step.
                </p>
              </div>

              <div className="mt-6">
                <Link
                  href="/services/hr-chaos-signals"
                  className="brand-button-dark rounded-xl px-6 py-3 text-base font-medium"
                >
                  Read HR Chaos Signals
                </Link>
              </div>
            </div>

            <div className="brand-surface-card p-8 lg:p-10 flex flex-col">
              <div className="flex-1 brand-stack-sm">
                <p className="brand-section-kicker">Focused execution option</p>
                <h2 className="brand-heading-lg text-slate-950">
                  HR Foundations Sprint
                </h2>
                <p className="brand-body-lg">
                  A defined engagement to turn diagnostic insight into focused
                  action, clearer priorities, and a practical plan for improving
                  what matters first.
                </p>
                <p className="brand-body">
                  It can support growing businesses strengthening their
                  foundations, or more complex organisations working through a
                  specific operational challenge or transition.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/services/hr-foundations-sprint"
                  className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
                >
                  Learn about the Sprint
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

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
            {sprintSteps.map((step) => (
              <StepCard key={step.title} title={step.title} text={step.text} />
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
                  Decide which route makes the most sense for your organisation
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Book a short discussion now, or request a tailored discussion
                  if you want your situation reviewed before deciding where to
                  begin.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="https://calendly.com/greg-vanesch/20min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
                >
                  Book a 20-minute discussion
                </a>

                <Link
                  href="/contact"
                  className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
                >
                  Request a tailored discussion
                </Link>
              </div>

              <p className="text-sm text-[#8AAAC8]">
                Book now for a direct conversation, or request a tailored
                discussion if you want your context reviewed in advance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}