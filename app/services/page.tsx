import Link from "next/link";

const stats = [
  { value: "17+", label: "Years in HR Operations" },
  { value: "30+", label: "Countries Supported" },
  { value: "4,000+", label: "Employees Supported" },
];

const proofPoints = [
  "Global People Operations leadership",
  "ServiceNow HR Integration and workflow transformation",
  "Shared services, controls, and governance",
  "M&A integration and harmonisation",
];

const servicePaths = [
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

export default function ServicesPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-32">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1 text-sm text-[#8AAAC8]">
              HR Operations • Service Delivery • Transformation Advisory
            </div>

            <h1 className="brand-heading-xl max-w-4xl">
              Practical HR operations support for growing and complex organisations.
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              I help organisations strengthen HR operations, service delivery, knowledge
              frameworks, and HR technology so they can scale with more clarity, control,
              and operational confidence.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/diagnostic"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                Take the Diagnostic
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
              >
                Contact
              </Link>
            </div>

            <p className="mt-4 text-sm text-[#8AAAC8]">
              The diagnostic gives you an immediate score and a more detailed interpretation
              pathway if you want to explore the result further.
            </p>
          </div>

          <div className="brand-card-dark rounded-[1.75rem] p-8 shadow-2xl shadow-black/20">
            <p className="brand-kicker">Where I typically help</p>

            <div className="mt-6 space-y-4 text-lg text-white">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                HR foundations for scaling businesses and mid-market organisations
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                Global HR operating models and shared services
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                HR technology, workflow automation, and ServiceNow HR Integration
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                Knowledge management and employee self-service
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                Governance, controls, and audit-ready operations
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="brand-section-kicker">
              Choose the path that fits your organisation
            </p>
            <h2 className="brand-heading-lg mt-3 text-slate-950">
              Three ways to engage, depending on what your organisation needs.
            </h2>
            <p className="brand-subheading mt-4 text-slate-700">
              Some organisations need stronger HR foundations. Some need enterprise-scale
              transformation support. Others need flexible senior HR operations input
              without the cost or commitment of a full-time hire.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {servicePaths.map((path) => (
              <div
                key={path.title}
                className="brand-surface rounded-[1.75rem] p-8"
              >
                <h3 className="brand-heading-md text-slate-950">{path.title}</h3>
                <p className="brand-body mt-4">{path.text}</p>

                <ul className="mt-6 space-y-3 text-base text-slate-700">
                  {path.bullets.map((bullet) => (
                    <li key={bullet} className="rounded-lg bg-slate-50 px-4 py-3">
                      {bullet}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link
                    href={path.href}
                    className="brand-button-dark inline-flex rounded-xl px-5 py-3 text-base font-medium"
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
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-[#F4F6FA] p-6 md:grid-cols-2 lg:grid-cols-4">
            {proofPoints.map((point) => (
              <div
                key={point}
                className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 shadow-sm"
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="brand-surface-soft rounded-2xl p-6 text-center"
            >
              <div className="text-3xl font-semibold tracking-tight text-slate-950">
                {stat.value}
              </div>
              <div className="mt-3 text-base text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="brand-surface-soft rounded-[2rem] p-8">
            <div className="max-w-4xl">
              <p className="brand-section-kicker">A common growth-stage pattern</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                Is your HR starting to feel inconsistent or reactive?
              </h2>
              <p className="brand-subheading mt-4 text-slate-700">
                Many organisations do not begin by asking for transformation. What they
                notice first is friction: inconsistent onboarding, unclear ownership,
                manual workarounds, fragmented manager practice, and HR becoming more
                reactive than operational.
              </p>
              <p className="brand-body mt-4">
                If that feels familiar, a useful next step is either to review the common
                warning signs or take the HR Operations Health Check for a quick read on
                where operational strain may be building.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/diagnostic"
                  className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
                >
                  Take the HR Operations Health Check
                </Link>
                <Link
                  href="/services/hr-chaos-signals"
                  className="brand-button-dark rounded-xl px-6 py-3 text-base font-medium"
                >
                  Read HR Chaos Signals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="brand-surface-soft rounded-[2rem] p-8">
            <div className="max-w-4xl">
              <p className="brand-section-kicker">Signature offer for growing companies</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                HR Foundations Sprint
              </h2>
              <p className="brand-subheading mt-4 text-slate-700">
                A focused 4 week engagement for growing organisations that need stronger
                HR foundations, clearer processes, and a practical plan for what to fix
                first.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/services/hr-foundations-sprint"
                  className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
                >
                  Learn About the Sprint
                </Link>
                <Link
                  href="/diagnostic"
                  className="rounded-xl border border-slate-300 px-6 py-3 text-base font-medium text-slate-800 transition hover:bg-white"
                >
                  Take the Diagnostic First
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-dark-section py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="brand-card-dark max-w-4xl rounded-[2rem] p-10 shadow-2xl shadow-black/20">
            <p className="brand-kicker">Start here</p>
            <h2 className="brand-heading-lg mt-3">
              Need stronger HR operations, better service delivery, or more scalable infrastructure?
            </h2>
            <p className="brand-subheading brand-body-on-dark mt-4 max-w-3xl">
              Whether the challenge is growth-stage operational clarity, enterprise
              transformation, or flexible senior support without full-time overhead, you
              can start with a short conversation or take the HR Operations Health Check first.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                Contact
              </Link>
              <Link
                href="/diagnostic"
                className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
              >
                Take the Diagnostic
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}