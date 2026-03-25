import Link from "next/link";

const participantGroups = [
  {
    title: "HR",
    text: "Input from HR helps show how processes, ownership, service access, and operating discipline are intended to work and how consistently they are being carried through in practice.",
  },
  {
    title: "Managers",
    text: "Manager input highlights how people processes are experienced day to day, where guidance is clear or unclear, and where handoffs, approvals, or support models may be slowing work down.",
  },
  {
    title: "Leadership",
    text: "Leadership input helps surface whether HR operations are supporting organisational execution effectively, where alignment is strong, and where operational maturity may be constraining scale or consistency.",
  },
];

const revealPoints = [
  "Where handoffs are slowing work down",
  "Where ownership is becoming unclear",
  "Where manual workarounds are filling system gaps",
  "Where guidance is hard to find or trust",
  "Where operational capacity is acting as a constraint",
  "Where experience differs materially by role",
];

const deliverables = [
  "Cross-role scoring across core operational dimensions",
  "Prioritised gaps and areas of lowest maturity",
  "Narrative insight: observation, implication, and next step",
  "A client-ready diagnostic report",
  "Practical next steps for where to focus first",
  "A structured basis for deciding whether execution support is needed",
];

const flowSteps = [
  {
    title: "1. HR Operations Health Check",
    text: "A quick initial signal to identify whether wider operational strain may be building.",
    href: "/diagnostic",
    cta: "View the Health Check",
    isCurrent: false,
  },
  {
    title: "2. HR Operations Diagnostic Assessment",
    text: "A deeper, structured diagnostic across leadership, managers, and HR.",
    href: "/diagnostic-assessment",
    cta: "You are here",
    isCurrent: true,
  },
  {
    title: "3. HR Foundations Sprint",
    text: "A focused engagement to act on structured insight and improve what matters first, where appropriate.",
    href: "/services/hr-foundations-sprint",
    cta: "View the Sprint",
    isCurrent: false,
  },
];

export default function DiagnosticAssessmentPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="brand-stack-md">
              <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-[#8AAAC8]">
                HR Operations Diagnostic Assessment
              </div>

              <div className="brand-stack-sm">
                <h1 className="brand-heading-xl max-w-4xl">
                  HR Operations Diagnostic Assessment
                </h1>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  A structured, multi-perspective diagnostic of how HR actually
                  operates across your organisation.
                </p>

                <p className="brand-body-on-dark max-w-3xl text-lg leading-8 text-[#C7D8EA]">
                  This goes beyond the Health Check and uses structured input
                  across multiple respondent groups to identify where operations
                  feel weak, where alignment is strong, where experience differs
                  by role, and what should be prioritised first.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/contact"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Discuss the Diagnostic Assessment
                </Link>
                <a
                  href="https://calendly.com/greg-vanesch/30min"
                  target="_blank"
                  rel="noreferrer"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Book a Diagnostic Conversation
                </a>
              </div>
            </div>

            <div className="brand-card-dark p-8 lg:p-9">
              <div className="brand-stack-md">
                <p className="brand-kicker">What it is designed to do</p>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-2xl font-semibold text-white">
                    A deeper layer of operational clarity
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-200">
                    The assessment is designed to show how HR is experienced
                    across the organisation, where operational patterns are
                    holding up well, and where they are starting to create drag,
                    inconsistency, or avoidable complexity.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                    Best suited to
                  </p>
                  <p className="mt-3 text-base leading-7 text-slate-200">
                    Organisations that need more than a quick signal and want a
                    more structured view of how work actually flows across HR,
                    managers, and leadership.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">Who participates</p>
            <h2 className="brand-heading-lg text-slate-950">
              A rounded view depends on multiple perspectives.
            </h2>
            <p className="brand-subheading text-slate-700">
              The assessment is designed to compare how HR operations are
              experienced and interpreted across the organisation, rather than
              relying on a single viewpoint.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {participantGroups.map((group) => (
              <div key={group.title} className="brand-surface-card p-8">
                <div className="brand-stack-sm">
                  <h3 className="brand-heading-md text-slate-950">
                    {group.title}
                  </h3>
                  <p className="brand-body">{group.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-6 py-5">
            <p className="text-sm leading-7 text-slate-700">
              A client fact pack is also used to determine baseline data on the
              organisation, operating model, systems, and current ways of
              working. This is contextual only and is not part of the scored
              comparison.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">What it reveals</p>
              <h2 className="brand-heading-lg text-slate-950">
                Where HR is working, where it is straining, and where alignment
                starts to break down.
              </h2>
              <p className="brand-subheading text-slate-700">
                The value is not just in a score. It is in understanding where
                the experience of HR differs across roles, where operational
                friction is becoming normalised, and where improvement is likely
                to have the greatest effect.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {revealPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-5 text-base leading-7 text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">What clients receive</p>
              <h2 className="brand-heading-lg text-slate-950">
                Structured output, not generic commentary.
              </h2>
              <p className="brand-subheading text-slate-700">
                The assessment is designed to produce something practical. It
                should help clarify priorities, support better conversations,
                and create a more grounded basis for next-step decisions.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {deliverables.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-base leading-7 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">Investment</p>
              <h2 className="brand-heading-lg text-slate-950">
                A structured piece of work with a clear output.
              </h2>
              <p className="brand-subheading text-slate-700">
                The Diagnostic Assessment is designed as a serious diagnostic,
                not a light-touch add-on. It creates a more complete view of how
                HR actually operates and produces structured insight that can be
                used to clarify priorities and next steps.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8">
              <div className="brand-stack-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  HR Operations Diagnostic Assessment
                </p>
                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  £3,000 + VAT
                </p>
                <p className="text-base leading-7 text-slate-700">
                  Fully credited against the HR Foundations Sprint if you
                  proceed.
                </p>
                <p className="text-base leading-7 text-slate-700">
                  This includes structured cross-role input, scored insight,
                  narrative output, prioritised gaps, and a client-ready
                  diagnostic report.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">How it fits the broader model</p>
            <h2 className="brand-heading-lg text-slate-950">
              A structured path from signal to action.
            </h2>
            <p className="brand-subheading text-slate-700">
              The Diagnostic Assessment sits between the initial Health Check
              and a more focused execution engagement. It provides the deeper
              clarity that helps determine what matters most and what should
              happen next.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {flowSteps.map((step) => (
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
                  {step.isCurrent ? (
                    <span className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-base font-medium text-slate-500">
                      {step.cta}
                    </span>
                  ) : (
                    <Link
                      href={step.href}
                      className="brand-button-dark px-5 py-3 text-base font-medium"
                    >
                      {step.cta}
                    </Link>
                  )}
                </div>
              </div>
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
                  Need a deeper view of how HR actually operates across the
                  organisation?
                </h2>
                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  The Diagnostic Assessment is designed for organisations that
                  need more than a quick signal. It creates a more structured,
                  multi-perspective view of where friction sits, where alignment
                  is weak, and what should be prioritised first.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/contact"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Discuss the Diagnostic Assessment
                </Link>
                <a
                  href="https://calendly.com/greg-vanesch/30min"
                  target="_blank"
                  rel="noreferrer"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Book a Diagnostic Conversation
                </a>
                <Link
                  href="/diagnostic"
                  className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium transition hover:bg-white/10"
                >
                  Start with the Health Check
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}