import Link from "next/link";

const participantGroups = [
  {
    title: "HR",
    text: "Input from HR helps build a structured view of how processes, ownership, service access, and operating discipline are intended to work, and how consistently they are being carried through in practice.",
  },
  {
    title: "Managers",
    text: "Manager input helps show how people processes are experienced day to day, where guidance is clear, where support is easy to access, and where delivery can be made more consistent.",
  },
  {
    title: "Leadership",
    text: "Leadership input adds a broader view of whether HR operations are supporting organisational execution effectively, where alignment is strong, and where greater clarity or consistency would support scale.",
  },
];

const revealPoints = [
  "Where delivery is working well across roles",
  "Where ownership would benefit from greater clarity",
  "Where systems and manual activity are not yet working as cleanly together as they could",
  "Where guidance and self-service can be strengthened",
  "Where operational capacity may be shaping service experience",
  "Where perspectives differ materially by role or level",
];

const deliverables = [
  "Cross-role scoring across core operational dimensions",
  "A clear view of the areas that would benefit most from attention",
  "Narrative insight across observation, implication, and next step",
  "A client-ready diagnostic report",
  "Practical priorities for where to focus first",
  "A structured basis for deciding whether execution support is needed",
];

const flowSteps = [
  {
    title: "1. HR Health Check",
    text: "A quick initial signal to indicate whether a deeper review would be valuable.",
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
    text: "A focused engagement to turn structured insight into practical improvements, where appropriate.",
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
                  A structured, multi-perspective diagnostic of how HR operates
                  across your organisation.
                </p>

                <p className="brand-body-on-dark max-w-3xl text-lg leading-8 text-[#C7D8EA]">
                  This goes beyond the Health Check and brings together
                  structured input from leadership, managers, and HR to build a
                  clearer view of how operations are experienced, where
                  alignment is strong, where consistency varies, and where focus
                  is likely to have the greatest value.
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
                    across the organisation, where delivery is already working
                    well, and where greater clarity, consistency, or operational
                    discipline would strengthen performance over time.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                    This is not a general survey
                  </p>
                  <p className="mt-3 text-base leading-7 text-slate-200">
                    It is a structured diagnostic designed to compare how HR
                    operations are understood and experienced across leadership,
                    managers, and HR.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                    Best suited to
                  </p>
                  <p className="mt-3 text-base leading-7 text-slate-200">
                    Organisations that want a more complete view than a quick
                    signal can provide, and need stronger evidence to support
                    priorities, sequencing, and next-step decisions.
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
            <p className="brand-section-kicker">How this differs from the Health Check</p>
            <h2 className="brand-heading-lg text-slate-950">
              The Health Check gives you a signal. The Diagnostic Assessment
              gives you a structured view.
            </h2>
            <p className="brand-subheading text-slate-700">
              The Health Check is designed as a quick entry point. The
              Diagnostic Assessment goes further by combining multiple
              perspectives to build a more grounded and decision-useful picture
              of how HR operations are working across the organisation.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="brand-surface-card p-8">
              <div className="brand-stack-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  HR Health Check
                </p>
                <h3 className="brand-heading-md text-slate-950">
                  A fast initial signal
                </h3>
                <p className="brand-body">
                  A short 10-question assessment designed to indicate whether a
                  wider operational review may be valuable and to open an
                  informed conversation.
                </p>
              </div>
            </div>

            <div className="brand-surface-card p-8">
              <div className="brand-stack-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Diagnostic Assessment
                </p>
                <h3 className="brand-heading-md text-slate-950">
                  A deeper, cross-role diagnostic
                </h3>
                <p className="brand-body">
                  A more structured piece of work that compares input across HR,
                  managers, and leadership to clarify priorities, support
                  decision-making, and identify where focused execution support
                  may be useful.
                </p>
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
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">What it reveals</p>
              <h2 className="brand-heading-lg text-slate-950">
                A clearer view of where operations are working well and where
                they would benefit from attention.
              </h2>
              <p className="brand-subheading text-slate-700">
                The value is not just in a score. It is in understanding where
                experience differs across roles, where processes are interpreted
                differently, and where greater consistency or clarity would have
                the greatest effect.
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
              <p className="brand-section-kicker">Value and decision support</p>
              <h2 className="brand-heading-lg text-slate-950">
                A structured piece of work with a clear output.
              </h2>
              <p className="brand-subheading text-slate-700">
                The Diagnostic Assessment is designed as a serious diagnostic,
                not a light-touch add-on. It creates a more complete view of how
                HR operates and produces structured insight that can be used to
                clarify priorities, support internal conversations, and decide
                what should happen next.
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
                  narrative output, prioritised observations, and a client-ready
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
              clarity that helps determine what matters most and whether a
              targeted sprint would add value.
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
                  Need a more structured view of how HR operates across the
                  organisation?
                </h2>
                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  The Diagnostic Assessment is designed for organisations that
                  need more than a quick signal. It creates a more complete,
                  multi-perspective view of current operations and helps clarify
                  where focus is likely to create the greatest value.
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