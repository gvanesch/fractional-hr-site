import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fractional HR Advisory",
  description:
    "Fractional HR advisory support for organisations that need stronger structure, direction, and operational clarity without a full-time hire.",
};

const fractionalContactHref =
  "/contact?topic=Fractional%20HR%20Advisory";

const recognitionItems = [
  {
    number: "01",
    title: "HR responsibility is spread across the business",
    text: "Responsibility sits across founders, finance, or operations. What works early on becomes harder to manage consistently as the organisation grows.",
  },
  {
    number: "02",
    title: "An existing model becomes harder to run cleanly",
    text: "A structure is in place, but increased scale, pace, or organisational complexity makes consistency harder to maintain across day-to-day HR delivery.",
  },
  {
    number: "03",
    title: "Ownership and decision paths become less clear",
    text: "As the organisation evolves, managers, HR, and leadership do not always operate with the same level of clarity on who owns what, when to escalate, or how decisions should be handled.",
  },
  {
    number: "04",
    title: "HR becomes increasingly reactive",
    text: "Time shifts towards handling issues and workarounds, rather than improving how HR operates overall.",
  },
];

const valuePoints = [
  {
    title: "Senior capability with measured cost",
    text: "Bring in experienced HR operations and service delivery leadership without committing to a full-time senior hire before the business is ready.",
  },
  {
    title: "A clearer HR operating model",
    text: "Create more consistency across ownership, service delivery, onboarding, manager support, and the day-to-day mechanics of how HR runs.",
  },
  {
    title: "Focused operational progress",
    text: "Concentrate effort on the improvements most likely to strengthen clarity, consistency, and scalability.",
  },
];

const deliveryAreas = [
  {
    title: "How the model typically works",
    text: "Usually structured on a part-time basis, often one to two days per week or an equivalent allocation, with priorities agreed against the operating needs of the business.",
  },
  {
    title: "What the work focuses on",
    text: "The emphasis is on bringing more clarity to how HR runs, improving consistency across the employee lifecycle, and strengthening execution where the model is under strain.",
  },
  {
    title: "What the shift looks like",
    text: "The aim is to move from reactive handling towards a more deliberate, scalable, and better-controlled operating model.",
  },
];

const coverageAreas = [
  "HR operating model and service delivery structure",
  "Onboarding, offboarding, and employee lifecycle design",
  "HR process clarity, ownership, and governance",
  "HR technology alignment and workflow design",
  "Knowledge management and self-service enablement",
  "Operational prioritisation and improvement roadmap",
];

const goodFit = [
  "Businesses where HR is currently handled across founders, finance, or operations",
  "Scaling organisations without senior HR leadership in place",
  "Organisations experiencing inconsistency in HR processes or delivery",
  "Post-acquisition or integration environments needing structure, integration, and harmonisation",
];

const notFit = [
  "Organisations primarily needing high-volume HR administration support",
  "Very early-stage businesses without meaningful HR complexity",
  "Fully mature HR functions with established senior leadership already in place",
  "Organisations looking for purely strategic input without involvement in execution",
];

function OutcomeStatement({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="border-t border-white/12 pt-8 lg:pt-10">
      <h3 className="min-h-[4.25rem] text-[1.35rem] font-semibold leading-[1.15] text-white lg:min-h-[4.75rem] lg:text-[1.55rem]">
        {title}
      </h3>

      <p className="mt-4 max-w-sm text-[0.98rem] leading-8 text-white/60">
        {text}
      </p>
    </div>
  );
}

export default function FractionalHRPage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-5xl">
            <div className="brand-stack-md pb-10 md:pb-12">
              <h1 className="brand-heading-xl max-w-5xl">
                Fractional HR advisory focused on how HR actually runs.
              </h1>

              <p className="brand-subheading brand-body-on-dark max-w-4xl">
                Senior HR operations and service delivery input for organisations
                that need more structure, clearer ownership, and stronger
                day-to-day execution, without committing to a full-time hire.
              </p>

              <p className="max-w-4xl text-base leading-8 text-[#C7D8EA]">
                Most relevant where HR responsibility is still spread across the
                business, or where an existing model is becoming harder to run
                cleanly as complexity increases.
              </p>
            </div>

            <div className="brand-actions">
              <a
                href="https://calendly.com/greg-vanesch/20min"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Book a 20-minute discussion
              </a>

              <Link
                href={fractionalContactHref}
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Request a tailored discussion
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RECOGNITION */}
      <section className="bg-white">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">
              When this model typically becomes relevant
            </p>

            <h2 className="brand-heading-lg text-slate-950">
              You usually recognise the pattern before you formalise the role.
            </h2>

            <p className="brand-body-lg">
              Fractional support is most relevant when HR has become too important
              to leave informal, but the organisation is not yet ready for a
              full-time senior hire.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-ruled-list">
              {recognitionItems.map((item) => (
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

      {/* WHAT THIS BRINGS */}
      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="max-w-5xl">
            <p className="brand-kicker">What this brings</p>

            <div className="pt-6 lg:pt-8">
              <h2 className="max-w-3xl text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.035em] text-white lg:text-[3.45rem]">
                The work is usually about bringing structure, control, and
                better operating judgement into the model.
              </h2>

              <p className="mt-6 max-w-3xl text-[1.05rem] leading-8 text-white/90">
                This is not administrative support or abstract strategic advice.
                It is senior HR operations and service delivery leadership applied
                on a part-time basis, with attention on the areas most likely to
                improve clarity, consistency, and execution.
              </p>
            </div>

            <div className="grid gap-10 pt-12 lg:grid-cols-3 lg:gap-10 lg:pt-16">
              {valuePoints.map((item) => (
                <OutcomeStatement
                  key={item.title}
                  title={item.title}
                  text={item.text}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / SCOPE */}
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">How this typically works</p>

            <h2 className="brand-heading-lg text-slate-950">
              Structured support, with clear priorities and practical coverage.
            </h2>

            <p className="brand-body-lg">
              The exact shape depends on the business, but the model is usually
              designed to strengthen how HR operates overall while focusing
              effort on the areas most likely to improve execution.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              {deliveryAreas.map((item) => (
                <div key={item.title} className="brand-rule-col">
                  <h3 className="brand-heading-sm text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-4 brand-body">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="brand-section-body-xl border-t border-slate-200 pt-10">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-16">
              <h3 className="text-[1.1rem] font-semibold leading-[1.3] text-slate-950 lg:text-[1.2rem]">
                What this can cover
              </h3>

              <ul className="grid gap-3 md:grid-cols-2">
                {coverageAreas.map((item) => (
                  <li
                    key={item}
                    className="relative pl-4 text-[0.98rem] leading-7 text-slate-600"
                  >
                    <span className="absolute left-0 top-[0.95rem] h-px w-2 bg-slate-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FIT */}
      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Fit</p>

            <h2 className="brand-heading-lg text-slate-950">
              This works best where the business needs senior capability without
              committing too early to permanent headcount.
            </h2>

            <p className="brand-body-lg">
              It is a practical model for organisations that need experienced
              support close enough to execution to improve how HR runs, rather
              than simply advise from a distance.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-case-split">
              <div>
                <h3 className="brand-heading-sm text-slate-950">
                  Good fit
                </h3>

                <ul className="mt-5 space-y-3">
                  {goodFit.map((item) => (
                    <li
                      key={item}
                      className="relative pl-4 text-[0.98rem] leading-7 text-slate-600"
                    >
                      <span className="absolute left-0 top-[0.95rem] h-px w-2 bg-slate-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="brand-heading-sm text-slate-950">
                  A different model may suit better
                </h3>

                <ul className="mt-5 space-y-3">
                  {notFit.map((item) => (
                    <li
                      key={item}
                      className="relative pl-4 text-[0.98rem] leading-7 text-slate-600"
                    >
                      <span className="absolute left-0 top-[0.95rem] h-px w-2 bg-slate-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>

                <h2 className="brand-heading-lg">
                  Decide whether this is the right level of support.
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Book a short discussion now, or request a tailored discussion if
                  you want your context reviewed in advance.
                </p>
              </div>

              <div className="brand-actions">
                <a
                  href="https://calendly.com/greg-vanesch/20min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Book a 20-minute discussion
                </a>

                <Link
                  href={fractionalContactHref}
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
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