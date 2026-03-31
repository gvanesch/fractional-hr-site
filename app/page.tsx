import Link from "next/link";

const calendlyUrl = "https://calendly.com/greg-vanesch/30min";

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
    title: "Identify",
    label: "HR Health Check",
    text: "A quick self-assessment to identify where operational strain may be building and whether the issue appears localised or more systemic.",
    href: "/diagnostic",
    cta: "Take the Health Check",
  },
  {
    title: "Diagnose",
    label: "HR Operations Diagnostic Assessment",
    text: "A structured, multi-perspective analysis of how HR actually operates across the organisation.",
    href: "/diagnostic-assessment",
    cta: "Explore the Diagnostic Assessment",
  },
  {
    title: "Improve",
    label: "HR Foundations Sprint",
    text: "A focused engagement to improve the highest-impact areas and create a practical roadmap.",
    href: "/services/hr-foundations-sprint",
    cta: "View the Sprint",
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="brand-stack-md">
              <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-[#8AAAC8]">
                HR Operations • Service Delivery • Transformation Advisory
              </div>

              <h1 className="brand-heading-xl max-w-4xl">
                Building HR operations that scale with growth, complexity, and change.
              </h1>

              <p className="brand-subheading brand-body-on-dark max-w-3xl">
                Strengthening HR operations, service delivery, and process clarity so HR works cleanly as organisations grow.
              </p>

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
                  Explore Diagnostic Assessment
                </Link>

                <Link
                  href="/services/hr-foundations-sprint"
                  className="brand-button-dark px-6 py-3 text-base font-medium"
                >
                  View the Sprint
                </Link>
              </div>
            </div>

            <div className="brand-card-dark p-8">
              <p className="brand-kicker">Where I typically help</p>

              <div className="space-y-3 text-white">
                {[
                  "HR foundations for scaling businesses",
                  "HR service delivery and shared services",
                  "HR technology and workflow design",
                  "Governance, controls, and operational structure",
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
      </section>

      {/* QUICK CHECK */}
      <section className="border-b border-slate-200 bg-white">
        <div className="brand-container brand-section grid gap-8 lg:grid-cols-2">
          <div className="brand-stack-md">
            <p className="brand-section-kicker">Quick self-check</p>

            <h2 className="brand-heading-lg text-slate-950">
              Is your HR starting to feel messy?
            </h2>

            <p className="brand-body">
              The HR Health Check is a short self-assessment designed to show whether friction is isolated or part of a wider pattern.
            </p>

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
            <p className="brand-section-kicker">Common signals</p>

            <div className="space-y-3">
              {diagnosticSignals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-lg bg-white px-4 py-3 text-slate-700"
                >
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="max-w-3xl">
            <p className="brand-section-kicker">From signal to action</p>

            <h2 className="brand-heading-lg text-slate-950">
              Identify. Diagnose. Improve.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {journeySteps.map((step) => (
              <div key={step.label} className="brand-surface-card p-8 flex flex-col">
                <div className="flex-1">
                  <p className="brand-section-kicker">{step.title}</p>
                  <h3 className="brand-heading-md text-slate-950">
                    {step.label}
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
        </div>
      </section>

      {/* CTA */}
      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-card-dark max-w-4xl p-10">
            <p className="brand-kicker">Start here</p>

            <h2 className="brand-heading-lg">
              Need stronger HR operations or clearer structure?
            </h2>

            <p className="brand-subheading brand-body-on-dark max-w-3xl">
              Start with the Health Check or book a short conversation to discuss your situation.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Book a 30-minute conversation
              </a>

              <Link
                href="/diagnostic"
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Take the Health Check
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}