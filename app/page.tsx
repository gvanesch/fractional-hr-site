import Link from "next/link";

const calendlyUrl = "https://calendly.com/greg-vanesch/30min";

const proofPoints = [
  "Global People Operations leadership",
  "ServiceNow HRIS automation and workflow transformation",
  "Shared services, controls, and governance",
  "Transformation support across growth, complexity, and change",
];

const audiencePaths = [
  {
    title: "Growing Companies & Mid-Market",
    text: "For scaling businesses that need stronger HR foundations, clearer processes, better onboarding, and systems that support growth without unnecessary bureaucracy.",
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
];

const diagnosticSignals = [
  "Managers handle similar HR issues differently across teams",
  "Employees are unsure where to go for HR support",
  "Onboarding feels inconsistent or overly manual",
  "The same HR questions keep resurfacing",
  "HR spends too much time reacting instead of improving",
  "Processes start to strain as the business grows",
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
                  Building HR operations that scale with growth, complexity, and
                  change.
                </h1>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  I help organisations strengthen HR operations, service delivery,
                  knowledge frameworks, and HR technology so they can scale with
                  more clarity, control, and operational confidence.
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
                <p className="brand-kicker">Where I typically help</p>

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
        <div className="brand-container py-8">
          <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-[#F4F6FA] p-6 md:grid-cols-2 lg:grid-cols-4">
            {proofPoints.map((point) => (
              <div
                key={point}
                className="brand-surface rounded-xl px-4 py-4 text-sm font-medium text-slate-700"
              >
                {point}
              </div>
            ))}
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
                  Many organisations do not start by looking for “HR transformation”.
                  What they notice first is friction: repeated questions,
                  inconsistent decisions, manual workarounds, and HR becoming
                  increasingly reactive.
                </p>
                <p className="brand-body">
                  The HR Operations Health Check is a short self-assessment designed
                  to help you understand whether these are isolated frustrations or
                  signs of wider operational strain.
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
              navigating complex change. Choose the path that best reflects where
              your organisation is today.
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
                      <li key={bullet} className="rounded-lg bg-slate-50 px-4 py-3">
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
                  Signature Offer for Growing Companies
                </p>
                <h2 className="brand-heading-lg text-slate-950">
                  HR Foundations Sprint
                </h2>
                <p className="brand-subheading text-slate-700">
                  A focused 4 week engagement for growing organisations that need
                  stronger HR foundations, clearer processes, and a practical plan
                  for what to fix first.
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
                <p className="brand-kicker">Start here</p>
                <h2 className="brand-heading-lg">
                  Need stronger HR operations, better service delivery, or more
                  scalable infrastructure?
                </h2>
                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Whether the challenge is enterprise transformation or simply
                  getting the basics right in a growing business, a useful next
                  step is either a short diagnostic conversation or the HR
                  Operations Health Check.
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
                  Take the Diagnostic
                </Link>
              </div>

              <p className="text-sm text-[#8AAAC8]">
                17+ years in HR operations and service delivery. Global experience
                across 30+ countries. Practical support across growth,
                transformation, and complexity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}