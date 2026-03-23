import Link from "next/link";

const audiencePaths = [
  {
    title: "Growing Companies & Mid-Market",
    text: "For organisations building stronger HR foundations, clearer operating rhythms, and more scalable processes before complexity starts to slow the business down.",
    bullets: [
      "HR foundations and operational clarity",
      "Onboarding and employee lifecycle design",
      "Manager-friendly processes and guidance",
      "Practical HR systems improvement and automation",
    ],
    href: "/services/growing-companies",
    cta: "For Growing Companies",
  },
  {
    title: "Enterprise & Complex Organisations",
    text: "For organisations refining global HR operations, strengthening service delivery, improving governance, and navigating transformation across multiple markets, teams, or systems.",
    bullets: [
      "HR operations transformation",
      "Shared services and service delivery design",
      "HR technology and workflow redesign",
      "Governance, controls, and operating discipline",
    ],
    href: "/services/enterprise",
    cta: "Enterprise Organisations",
  },
];

const diagnosticSignals = [
  "Managers handle similar HR issues differently across teams",
  "Employees are unclear on where to go for support",
  "Onboarding feels inconsistent or overly manual",
  "The same HR questions continue to resurface",
  "HR spends too much time reacting rather than improving",
  "Processes begin to strain as the organisation grows",
];

export default function HomePage() {
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
                  Designing and strengthening HR operations for organisations
                  that need to scale with clarity and control.
                </h1>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Van Esch Advisory Ltd works with growing and complex
                  organisations to improve HR service delivery, operating models,
                  and technology foundations — ensuring people operations are
                  consistent, scalable, and able to support business execution.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/services"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Explore Services
                </Link>
                <Link
                  href="/diagnostic"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Take the Diagnostic
                </Link>
              </div>
            </div>

            <div className="brand-card-dark p-8 lg:p-9">
              <div className="brand-stack-md">
                <p className="brand-kicker">Where the firm typically helps</p>

                <div className="space-y-4 text-lg text-white">
                  {[
                    "Strengthening HR operating models as organisations scale",
                    "Improving service delivery, shared services, and support design",
                    "Redesigning workflows, controls, and HR process execution",
                    "Making HR technology more useful in practice, not just on paper",
                    "Creating greater consistency across teams, markets, and manager experience",
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
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Operational self-check</p>
                <h2 className="brand-heading-lg text-slate-950">
                  Is HR still working, but no longer working cleanly?
                </h2>
                <p className="brand-subheading text-slate-700">
                  Many organisations do not begin by looking for
                  “transformation”. They begin by noticing friction: repeated
                  questions, inconsistent manager handling, manual workarounds,
                  and HR becoming more reactive as complexity increases.
                </p>
                <p className="brand-body">
                  The HR Operations Health Check is designed to help you assess
                  whether those signs are isolated irritations or indicators of a
                  wider operating model issue that now needs attention.
                </p>
              </div>

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

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-md">
                <p className="brand-section-kicker">Common signals</p>
                <div className="space-y-3">
                  {diagnosticSignals.map((signal) => (
                    <div
                      key={signal}
                      className="rounded-lg bg-white px-4 py-3 text-base text-slate-700"
                    >
                      {signal}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">
              Advisory support shaped to organisational context
            </p>
            <h2 className="brand-heading-lg text-slate-950">
              Different organisations face different HR operational pressures.
            </h2>
            <p className="brand-subheading text-slate-700">
              A growing business putting stronger foundations in place needs a
              different operating response from a more complex organisation
              refining service delivery, governance, and execution across scale.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {audiencePaths.map((path) => (
              <div key={path.title} className="brand-surface-card p-8">
                <div className="brand-stack-md">
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

                  <div>
                    <Link
                      href={path.href}
                      className="brand-button-dark px-5 py-3 text-base font-medium"
                    >
                      {path.cta}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="brand-surface-soft rounded-[2rem] p-8 lg:p-10">
            <div className="max-w-4xl brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">
                  Signature offer for growing organisations
                </p>
                <h2 className="brand-heading-lg text-slate-950">
                  HR Foundations Sprint
                </h2>
                <p className="brand-subheading text-slate-700">
                  A focused four-week engagement for organisations that need
                  stronger HR operating foundations, clearer process discipline,
                  and a practical view of what to stabilise first.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/services/hr-foundations-sprint"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Learn About the Sprint
                </Link>
                <Link
                  href="/diagnostic"
                  className="brand-button-dark px-6 py-3 text-base font-medium"
                >
                  Take the Diagnostic First
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
                <p className="brand-kicker">Start the conversation</p>
                <h2 className="brand-heading-lg">
                  If HR operations are becoming harder to manage, the answer is
                  usually not more effort. It is better operating clarity.
                </h2>
                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Whether the need is stronger foundations, better service
                  delivery, tighter process discipline, or clearer transformation
                  priorities, the next step can begin with a short conversation
                  or the HR Operations Health Check.
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
                  Take the Diagnostic
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}