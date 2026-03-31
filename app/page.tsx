import Link from "next/link";

const calendlyUrl = "https://calendly.com/greg-vanesch/30min";

const audiencePaths = [
  {
    title: "Growing Companies & Mid-Market",
    text: "For organisations that need stronger HR foundations, clearer ownership, better onboarding, and more reliable operational structure before growth creates bigger problems.",
    bullets: [
      "HR foundations and operating clarity",
      "Onboarding and employee lifecycle design",
      "Manager-friendly processes and guidance",
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
];

const diagnosticSignals = [
  "Managers handle similar HR issues differently across teams",
  "Employees are unsure where to go for HR support",
  "Onboarding feels inconsistent or overly manual",
  "The same HR questions keep resurfacing",
  "HR spends too much time reacting instead of improving",
  "Processes start to strain as the business grows",
];

const journeySteps = [
  {
    title: "1. HR Health Check",
    text: "A quick first read on where operational strain may be building and whether the issue appears isolated or more systemic.",
    href: "/diagnostic",
    cta: "Take the Health Check",
  },
  {
    title: "2. HR Operations Diagnostic Assessment",
    text: "A structured, multi-perspective diagnostic of how HR actually operates across leadership, managers, and HR.",
    href: "/diagnostic-assessment",
    cta: "Explore the Diagnostic Assessment",
  },
  {
    title: "3. HR Foundations Sprint",
    text: "A focused engagement to act on diagnostic insight, improve the highest-impact gaps, and create a practical roadmap.",
    href: "/services/hr-foundations-sprint",
    cta: "View the Sprint",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="brand-stack-md">
              <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-[#8AAAC8]">
                HR Operations • Service Delivery • Transformation Advisory
              </div>

              <div className="brand-stack-sm">
                <h1 className="brand-heading-xl max-w-4xl">
                  HR operations, designed to work in practice.
                </h1>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Van Esch Advisory Ltd helps organisations strengthen HR
                  operations, service delivery clarity, process discipline, and
                  operating structure so HR can scale more cleanly through
                  growth, complexity, and change.
                </p>

                <p className="brand-body-on-dark max-w-3xl text-lg leading-8 text-[#C7D8EA]">
                  The focus is not on generic consulting advice. It is on
                  identifying where operational friction is building, diagnosing
                  how HR actually works in practice, and improving what matters
                  first.
                </p>

                <p className="brand-body-on-dark max-w-3xl text-base leading-7 text-[#C7D8EA]">
                  HR improves when its operations are designed deliberately, not
                  allowed to evolve by default.
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
                  href="/diagnostic-assessment"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Explore the Diagnostic Assessment
                </Link>
                <Link
                  href="/services/hr-foundations-sprint"
                  className="brand-button-dark px-6 py-3 text-base font-medium"
                >
                  View the Sprint
                </Link>
              </div>
            </div>

            <div className="brand-card-dark p-8 lg:p-9">
              <div className="brand-stack-md">
                <p className="brand-kicker">Where Van Esch Adisory Ltd typically helps</p>

                <div className="space-y-4 text-lg text-white">
                  {[
                    "HR foundations for scaling businesses and mid-market organisations",
                    "Global HR operating models and shared services",
                    "HR technology, workflow automation, and ServiceNow HRIS automation",
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
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Quick self-check</p>
                <h2 className="brand-heading-lg text-slate-950">
                  Is your HR starting to feel messy?
                </h2>
                <p className="brand-subheading text-slate-700">
                  Many organisations do not start by looking for HR
                  transformation. What they notice first is friction: repeated
                  questions, inconsistent decisions, manual workarounds, and HR
                  becoming increasingly reactive.
                </p>
                <p className="brand-body">
                  The HR Health Check is a short self-assessment designed to
                  help you assess whether these are isolated frustrations or
                  signs of wider operational strain.
                </p>
                <p className="brand-body">
                  It is the first step. For organisations that need a deeper
                  view, it can lead into the HR Operations Diagnostic
                  Assessment across leadership, managers, and HR.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/diagnostic"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Take the HR Health Check
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
                <p className="brand-section-kicker">Common warning signs</p>
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

      <section className="border-b border-slate-200 bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">
              A structured path from signal to action
            </p>
            <h2 className="brand-heading-lg text-slate-950">
              Identify the issue. Diagnose it properly. Improve what matters
              first.
            </h2>
            <p className="brand-subheading text-slate-700">
              The model is designed to move from early signal to deeper clarity,
              then into focused execution. Each step has a different purpose,
              and each one reduces ambiguity before more substantial work
              begins.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {journeySteps.map((step) => (
              <div
                key={step.title}
                className="brand-surface-card flex h-full flex-col p-8"
              >
                <div className="flex-1 brand-stack-sm">
                  <h3 className="brand-heading-md text-slate-950">
                    {step.title}
                  </h3>
                  <p className="brand-body">{step.text}</p>
                </div>

                <div className="pt-6">
                  <Link
                    href={step.href}
                    className="brand-button-dark px-5 py-3 text-base font-medium"
                  >
                    {step.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white px-6 py-5">
            <p className="text-sm leading-7 text-slate-700">
              Some organisations start with the Health Check. Others move
              directly into the Diagnostic Assessment when the pattern of
              operational friction is already clear. The Sprint then turns that
              clarity into structured action where focused improvement support
              is needed.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">
              Choose the path that fits your organisation
            </p>
            <h2 className="brand-heading-lg text-slate-950">
              Different organisations need different kinds of HR support.
            </h2>
            <p className="brand-subheading text-slate-700">
              A growing business building its HR foundations has very different
              needs from a global organisation redesigning service delivery or
              navigating complex change. Choose the path that best reflects
              where your organisation is today.
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
                  Signature offer for growing companies
                </p>
                <h2 className="brand-heading-lg text-slate-950">
                  HR Foundations Sprint
                </h2>
                <p className="brand-subheading text-slate-700">
                  A focused 4 week engagement for growing organisations that
                  need stronger HR foundations, clearer processes, and a
                  practical plan for what to improve first.
                </p>
                <p className="brand-body">
                  The Sprint builds on structured diagnostic insight and focuses
                  on the areas that will make the greatest difference to
                  operational clarity, consistency, and control.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/services/hr-foundations-sprint"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  View the Sprint
                </Link>
                <Link
                  href="/diagnostic-assessment"
                  className="brand-button-dark px-6 py-3 text-base font-medium"
                >
                  Explore the Diagnostic Assessment
                </Link>
              </div>

              <p className="text-sm leading-7 text-slate-600">
                For some organisations, the Health Check is enough to prompt a
                conversation. For others, the Diagnostic Assessment creates the
                clarity needed before the Sprint begins.
              </p>
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
                  Whether the challenge is enterprise transformation or simply
                  getting the basics right in a growing business, a useful next
                  step is either a short diagnostic conversation or the HR
                  Health Check.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Book a 30-Minute Diagnostic Conversation
                </a>
                <Link
                  href="/diagnostic"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Take the Health Check
                </Link>
              </div>

              <p className="text-sm text-[#8AAAC8]">
                17+ years in HR operations and service delivery. Global
                experience across 30+ countries. Practical support across
                growth, transformation, and complexity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}