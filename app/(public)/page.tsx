import Link from "next/link";

const problemItems = [
  {
    number: "01",
    title: "Similar situations start being handled in different ways",
    text: "What was once straightforward begins to vary across teams. Hiring, onboarding, and employee support start to depend more on who is involved than on a consistent approach.",
  },
  {
    number: "02",
    title: "Questions and decisions become harder to resolve cleanly",
    text: "More issues return to HR because ownership, guidance, or service routes are not always clear enough to support the business as it grows.",
  },
  {
    number: "03",
    title: "Onboarding and employee experience begin to drift",
    text: "New joiners have different experiences depending on the team, the manager, or the moment. Early gaps begin to show more clearly.",
  },
  {
    number: "04",
    title: "Time shifts towards reacting rather than improving",
    text: "As demand increases, attention is pulled into handling issues and workarounds rather than strengthening how things operate overall.",
  },
];

const pathwayItems = [
  {
    number: "01",
    title: "HR Health Check",
    text: "A structured initial read on where operational strain may be building and whether the issue appears local or more systemic.",
    href: "/diagnostic",
    cta: "Take the Health Check",
  },
  {
    number: "02",
    title: "Diagnostic Assessment",
    text: "A deeper, multi-perspective diagnostic of how HR actually operates across leadership, managers, and HR.",
    href: "/diagnostic-assessment",
    cta: "View Diagnostic Assessment",
  },
  {
    number: "03",
    title: "HR Foundations Sprint",
    text: "Focused improvement support once the priorities are clearer and the organisation needs practical action on the highest-impact gaps.",
    href: "/services/hr-foundations-sprint",
    cta: "See the HR Foundations Sprint",
  },
];

const audienceItems: {
  title: string;
  text: string;
  href: string;
  cta: string;
}[] = [
    {
      title: "Growing Companies & Mid-Market",
      text: "Where growth begins to expose the limits of informal ways of working, and stronger foundations are needed to support consistency, clarity, and scale without slowing the business down.",
      href: "/services/growing-companies",
      cta: "Explore Growing Companies",
    },
    {
      title: "Enterprise & Complex Organisations",
      text: "For organisations where scale, geography, systems, and operating complexity make consistency across service delivery, governance, and execution harder to maintain.",
      href: "/services/enterprise",
      cta: "Explore Enterprise",
    },
    {
      title: "Fractional HR Advisory",
      text: "Where experienced strategic HR operations leadership is needed to bring structure, direction, and consistency into the organisation, without committing to a full-time role or long-term hire too early.",
      href: "/services/fractional-hr-advisory",
      cta: "Explore Fractional Advisory",
    },
  ];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-5xl">
            <div className="brand-stack-md pb-14 md:pb-16">
              <h1 className="brand-heading-xl max-w-5xl">
                When the HR model stops running cleanly, the signs appear long
                before the diagnosis does.
              </h1>

              <p className="brand-subheading brand-body-on-dark max-w-4xl">
                Van Esch Advisory works with organisations where HR operations,
                service delivery, and day-to-day execution need to run with
                greater clarity and consistency as the business grows in scale
                and complexity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-white">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">
              What organisations often start to notice
            </p>

            <h2 className="brand-heading-lg text-slate-950">
              You usually recognise the pattern before you step back and address
              it.
            </h2>

            <p className="brand-body-lg">
              Most organisations do not set out to create inconsistency. The
              model evolves around pace, pressure, and what works at the time.
              Over time, it becomes harder to run in a way that feels clear and
              reliable.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-ruled-list">
              {problemItems.map((item) => (
                <div key={item.number} className="brand-ruled-item">
                  <p className="brand-ruled-item-num">{item.number}</p>

                  <div>
                    <h3 className="brand-ruled-item-title">{item.title}</h3>
                    <p className="brand-ruled-item-body">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY VAN ESCH ADVISORY */}
      <section className="bg-[#f4f6fa]">
        <div className="brand-container brand-section-tight pb-16 md:pb-20">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Why Van Esch Advisory</p>

            <h2 className="brand-heading-lg text-slate-950">
              Built on operating experience, not advisory theory.
            </h2>

            <p className="brand-body-lg">
              The firm draws on over 17 years of hands-on HR operations
              leadership across both enterprise and rapidly scaling
              environments, including global shared services, HR technology
              transformation, and M&amp;A integration.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              <div className="brand-rule-col">
                <h3 className="brand-heading-sm text-slate-950">
                  Grounded in operating reality
                </h3>

                <p className="mt-4 brand-body">
                  Shaped by how organisations actually run under pressure, where
                  service delivery, ownership, workflow, and governance need to
                  operate clearly enough to support the business.
                </p>
              </div>

              <div className="brand-rule-col">
                <h3 className="brand-heading-sm text-slate-950">
                  Focused on what matters most
                </h3>

                <p className="mt-4 brand-body">
                  Identifies where the model is under strain, what needs
                  tightening first, and where effort will have the greatest
                  operational impact over time.
                </p>
              </div>

              <div className="brand-rule-col">
                <h3 className="brand-heading-sm text-slate-950">
                  Strengthens how HR operates
                </h3>

                <p className="mt-4 brand-body">
                  Brings operating judgement, practical structure, and deep HR
                  operations expertise to improve clarity, consistency, and
                  execution without adding unnecessary complexity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE PATHWAYS */}
      <section className="brand-dark-section-plain">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-kicker">Pathway</p>

            <h2 className="brand-heading-lg">
              A structured path from early signal to focused improvement.
            </h2>

            <p className="brand-subheading brand-body-on-dark">
              Van Esch Advisory is designed to meet organisations at different
              points of readiness, from an initial diagnostic view through to
              more detailed assessment and focused improvement support.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns-dark">
              {pathwayItems.map((item) => (
                <div key={item.number} className="brand-rule-col-dark">
                  <p className="text-[3rem] font-semibold leading-none tracking-[-0.04em] text-white/14">
                    {item.number}
                  </p>

                  <h3 className="mt-5 text-[1.25rem] font-semibold leading-[1.15] text-white">
                    {item.title}
                  </h3>

                  <p className="mt-4 max-w-sm text-[1rem] leading-8 text-[#d6e2f0]">
                    {item.text}
                  </p>

                  <div className="mt-8">
                    <Link
                      href={item.href}
                      className="brand-button-secondary-dark"
                    >
                      {item.cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCE ROUTING */}
      <section className="bg-white">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">
              Choose the path that fits your organisation
            </p>

            <h2 className="brand-heading-lg text-slate-950">
              The right starting point depends on how the operational
              environment is experienced today.
            </h2>

            <p className="brand-body-lg">
              Whether the issue is strengthening foundations, managing
              complexity, or introducing experienced support, the route depends
              on the operating context rather than the label attached to the
              problem.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              {audienceItems.map((item) => (
                <div key={item.title} className="brand-rule-col">
                  <h3 className="min-h-[3.5rem] text-[1.25rem] font-semibold leading-[1.15] text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-4 max-w-sm text-[1rem] leading-8 text-slate-600">
                    {item.text}
                  </p>

                  <div className="mt-8">
                    <Link
                      href={item.href}
                      className="brand-button-secondary-light min-w-[15rem]"
                    >
                      {item.cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SELECTED WORK */}
      <section className="bg-[#f4f6fa]">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Operating experience</p>

            <h2 className="brand-heading-lg text-slate-950">
              Applied in environments of growth, complexity, and transformation.
            </h2>

            <p className="brand-body-lg">
              Examples of operating environments and improvement work across HR
              operations, governance, and organisational transformation.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-case-split">
              <p className="brand-body">
                Global HR operations model restructured to deliver scalable
                service delivery and governance across 4,000+ employees and 27
                countries.
              </p>

              <p className="brand-body">
                Post-acquisition integration of 30+ entities, including benefit
                harmonisation and workforce structure alignment across 2,000
                employees globally.
              </p>
            </div>

            <div className="mt-8 text-right">
              <Link
                href="/case-studies"
                className="brand-button-dark px-5 py-3 text-base font-medium"
              >
                View case studies
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="brand-dark-section-plain">
        <div className="brand-container brand-section-tight">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>

                <h2 className="brand-heading-lg">
                  If the HR function needs to run more clearly, the right place
                  to start is a structured view of where it is today.
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Start with the Health Check for an immediate view, or start a
                  conversation if the challenge is already clear.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/diagnostic" className="brand-button-primary">
                  Take the Health Check
                </Link>

                <Link href="/contact" className="brand-button-secondary-dark">
                  Start a conversation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}