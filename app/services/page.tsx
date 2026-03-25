import Link from "next/link";

const servicePaths = [
  {
    title: "Growing Companies & Mid-Market",
    text: "For organisations building stronger HR foundations, clearer operating rhythms, and more scalable processes before complexity starts to slow the business down.",
    bullets: [
      "HR foundations and operational clarity",
      "Onboarding and employee lifecycle design",
      "Manager-friendly workflows and documentation",
      "HR systems improvement and practical automation",
    ],
    href: "/services/growing-companies",
    cta: "For Growing Companies",
  },
  {
    title: "Enterprise & Complex Organisations",
    text: "For organisations navigating global operations, shared services, HR technology programmes, regulatory complexity, and transformation across multiple markets or entities.",
    bullets: [
      "HR operations transformation",
      "Service delivery and shared services",
      "HR technology and workflow redesign",
      "M&A integration and harmonisation",
    ],
    href: "/services/enterprise",
    cta: "Enterprise Organisations",
  },
  {
    title: "Flexible Support",
    text: "For organisations that need senior HR operations support, but do not need or want a full-time hire. Support can be provided on an ad hoc, recurring, interim, or project basis.",
    bullets: [
      "Ad hoc strategic HR operations support",
      "Recurring senior advisory input",
      "Project-based delivery for specific priorities",
      "Interim support during growth or transition",
    ],
    href: "/contact?topic=Flexible%20Support",
    cta: "Discuss Flexible Support",
  },
];

const sprintSteps = [
  {
    title: "1. Diagnostic Insight",
    text: "Start with the HR Operations Diagnostic Assessment to establish where friction sits across HR, managers, and leadership.",
  },
  {
    title: "2. Focused Analysis",
    text: "Assess the areas creating the most drag, inconsistency, or delivery risk rather than reopening every part of the operating model.",
  },
  {
    title: "3. Prioritisation & Design",
    text: "Define what needs to change first, where ownership should sit, and how processes, workflows, and controls should operate.",
  },
  {
    title: "4. Roadmap",
    text: "Translate diagnostic insight into a practical, sequenced plan for implementation over the next phase of growth.",
  },
];

export default function ServicesPage() {
  return (
    <main>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="brand-stack-md">
              <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-[#8AAAC8]">
                Van Esch Advisory Ltd • HR Operations • Service Delivery •
                Transformation Advisory
              </div>

              <div className="brand-stack-sm">
                <h1 className="brand-heading-xl max-w-4xl">
                  Practical HR operations support for growing and complex
                  organisations.
                </h1>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Van Esch Advisory Ltd supports organisations that need
                  stronger HR operations, better service delivery, clearer
                  process discipline, and more scalable infrastructure as the
                  business grows or becomes more complex.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
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
                  Contact
                </Link>
              </div>

              <p className="text-sm text-[#8AAAC8]">
                Start with the HR Operations Health Check, then move into the HR
                Operations Diagnostic Assessment if you need a more structured
                view of how HR actually operates across the organisation.
              </p>
            </div>

            <div className="brand-card-dark p-8 lg:p-9">
              <div className="brand-stack-md">
                <p className="brand-kicker">Where the firm typically helps</p>

                <div className="space-y-4 text-lg text-white">
                  {[
                    "HR foundations for scaling businesses and mid-market organisations",
                    "Global HR operating models and shared services",
                    "HR technology, workflow automation, and ServiceNow HRIS integration and automation",
                    "Knowledge management and employee self-service",
                    "Governance, controls, and audit-ready operations",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">
              Choose the path that fits your organisation
            </p>
            <h2 className="brand-heading-lg text-slate-950">
              Three ways to engage, depending on what your organisation needs.
            </h2>
            <p className="brand-subheading text-slate-700">
              Some organisations need stronger HR foundations. Some need
              enterprise-scale transformation support. Others need flexible
              senior HR operations input without the cost or commitment of a
              full-time hire.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {servicePaths.map((path) => (
              <div
                key={path.title}
                className="brand-surface-card flex h-full flex-col p-8"
              >
                <div className="flex-1 brand-stack-md">
                  <div className="brand-stack-sm">
                    <h3 className="brand-heading-md text-slate-950">
                      {path.title}
                    </h3>
                    <p className="brand-body">{path.text}</p>
                  </div>

                  <ul className="space-y-3 text-base text-slate-700">
                    {path.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="rounded-lg bg-slate-50 px-4 py-3"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href={path.href}
                    className="brand-button-dark px-5 py-3 text-base font-medium"
                  >
                    {path.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="brand-surface-soft rounded-[2rem] p-8">
            <div className="max-w-4xl brand-stack-sm">
              <p className="brand-section-kicker">How the journey works</p>
              <h2 className="brand-heading-lg text-slate-950">
                A structured path from identifying friction to improving how HR
                operates.
              </h2>
              <p className="brand-subheading text-slate-700">
                The model is designed to move from a quick initial read to a
                more structured diagnosis, then into focused execution.
              </p>

              <div className="grid gap-4 pt-4 md:grid-cols-3">
                {[
                  {
                    title: "1. Health Check",
                    text: "A quick self-assessment to identify where operational strain may be building.",
                  },
                  {
                    title: "2. Diagnostic Assessment",
                    text: "A structured, multi-perspective diagnostic of how HR actually operates across your organisation.",
                  },
                  {
                    title: "3. HR Foundations Sprint",
                    text: "A focused engagement to act on diagnostic insight and improve what matters first.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <h3 className="brand-heading-sm text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-slate-700">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/diagnostic"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Start with the Health Check
                </Link>
                <Link
                  href="/diagnostic-assessment"
                  className="brand-button-dark px-6 py-3 text-base font-medium"
                >
                  View Diagnostic Assessment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="brand-surface-soft rounded-[2rem] p-8">
            <div className="max-w-4xl brand-stack-sm">
              <p className="brand-section-kicker">
                A common growth-stage pattern
              </p>
              <h2 className="brand-heading-lg text-slate-950">
                Is HR starting to feel inconsistent or increasingly reactive?
              </h2>
              <p className="brand-subheading text-slate-700">
                Many organisations do not begin by asking for transformation.
                What they notice first is friction: inconsistent onboarding,
                unclear ownership, manual workarounds, fragmented manager
                practice, and HR becoming more reactive than operational.
              </p>
              <p className="brand-body">
                If that feels familiar, a useful next step is either to
                identify the common warning signs or take the HR Operations
                Health Check for a quick read on where operational strain may be
                building.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/diagnostic"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Take the HR Operations Health Check
                </Link>
                <Link
                  href="/services/hr-chaos-signals"
                  className="brand-button-dark px-6 py-3 text-base font-medium"
                >
                  Read HR Chaos Signals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="brand-surface-soft rounded-[2rem] p-8">
            <div className="max-w-5xl brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">
                  Signature offer for growing companies
                </p>
                <h2 className="brand-heading-lg text-slate-950">
                  HR Foundations Sprint
                </h2>
                <p className="brand-subheading text-slate-700">
                  A focused four-week engagement for growing organisations that
                  need stronger HR foundations, clearer processes, and a
                  practical plan for improving what matters first.
                </p>
                <p className="brand-body">
                  The Sprint is designed as diagnostic-informed execution. It
                  builds on the HR Operations Diagnostic Assessment to turn
                  structured insight into focused analysis, prioritised design,
                  and a clear roadmap for action.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {sprintSteps.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <h3 className="brand-heading-sm text-slate-950">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-slate-700">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/services/hr-foundations-sprint"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Learn About the Sprint
                </Link>
                <Link
                  href="/diagnostic-assessment"
                  className="brand-button-dark px-6 py-3 text-base font-medium"
                >
                  View Diagnostic Assessment
                </Link>
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
                <p className="brand-kicker">Start here</p>
                <h2 className="brand-heading-lg">
                  Need stronger HR operations, better service delivery, or more
                  scalable infrastructure?
                </h2>
                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Whether the challenge is growth-stage operational clarity,
                  enterprise transformation, or flexible senior support without
                  full-time overhead, start with the HR Operations Health Check
                  or move straight to a conversation about the HR Operations
                  Diagnostic Assessment.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/contact"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Contact
                </Link>
                <Link
                  href="/diagnostic"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Take the Health Check
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}