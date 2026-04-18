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
    title: "Senior capability limited cost",
    text: "Experienced HR operations and service delivery leadership, without committing too early to a full-time senior hire. The model gives the business capability at the level it needs now.",
  },
  {
    title: "A clearer operating model",
    text: "More consistency across ownership, service delivery, onboarding, manager support, and the day-to-day mechanics of how HR runs. The aim is to make the function easier to operate cleanly.",
  },
  {
    title: "Focused operational progress",
    text: "Effort concentrated on the improvements most likely to strengthen clarity, consistency, and scalability. Priority goes to what will make the greatest operational difference.",
  },
];

const goodFit = [
  "HR responsibility sits across founders, finance, or operations.",
  "The organisation is growing but not yet ready for a full-time senior hire.",
  "An existing HR model is in place but no longer running consistently.",
  "Leadership wants clearer priorities and stronger execution.",
];

const notFit = [
  "The need is primarily for high-volume HR administration.",
  "The business is too early to benefit from structured HR input.",
  "A fully mature HR leadership team is already in place.",
  "The requirement is purely strategic with no involvement in execution.",
];

function OutcomeStatement({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const [firstSentence, ...rest] = text.split(". ");
  const secondSentence = rest.join(". ");

  return (
    <div className="border-t border-white/12 pt-8 lg:pt-10">
      <h3 className="min-h-[4.25rem] text-[1.35rem] font-semibold leading-[1.15] text-white lg:min-h-[4.75rem] lg:text-[1.55rem]">
        {title}
      </h3>

      <div className="mt-4 max-w-md space-y-4 text-[0.98rem] leading-8 text-white/60">
        <p>{firstSentence.trim()}.</p>
        {secondSentence ? <p>{secondSentence.trim()}</p> : null}
      </div>
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

      {/* WHAT THIS DOES */}
      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="max-w-6xl">
            <p className="brand-kicker">Role</p>

            <div className="pt-6 lg:pt-8">
              <h2 className="max-w-4xl text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.035em] text-white lg:text-[3.45rem]">
                Brings structure, control, and experienced judgement into how HR
                operates.
              </h2>

              <div className="mt-6 max-w-4xl space-y-4 text-[1.05rem] leading-8 text-white/90">
                <p>
                  This is not additional activity. It is applied senior capability.
                </p>

                <p>
                  The focus is on improving how HR runs day to day, where the
                  model is under strain or no longer holding consistently.
                </p>
              </div>
            </div>

            <div className="grid gap-10 pt-12 lg:grid-cols-3 lg:gap-12 lg:pt-16">
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

      {/* HOW THIS IS APPLIED */}
      <section className="bg-white">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Application</p>

            <h2 className="brand-heading-lg text-slate-950">
              Structured support, focused on the parts of HR that most affect how
              the function runs.
            </h2>

            <div className="max-w-4xl space-y-4">
              <p className="brand-body-lg">
                The model is typically delivered on a part-time basis, with
                priorities shaped by where the organisation is experiencing the
                most strain.
              </p>

              <p className="brand-body-lg">
                The focus is on improving execution. It is not about adding
                complexity.
              </p>
            </div>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              <div className="brand-rule-col">
                <h3 className="min-h-[3.6rem] text-[1.25rem] font-semibold leading-[1.15] text-slate-950">
                  Operating model and structure
                </h3>

                <div className="mt-4 max-w-md space-y-4">
                  <p className="text-[1rem] leading-8 text-slate-600">
                    How HR is organised and how service delivery is structured.
                  </p>

                  <p className="text-[1rem] leading-8 text-slate-600">
                    It also covers how ownership, escalation, and governance
                    operate in practice.
                  </p>
                </div>
              </div>

              <div className="brand-rule-col">
                <h3 className="min-h-[3.6rem] text-[1.25rem] font-semibold leading-[1.15] text-slate-950">
                  Process and workflow discipline
                </h3>

                <div className="mt-4 max-w-md space-y-4">
                  <p className="text-[1rem] leading-8 text-slate-600">
                    Onboarding, lifecycle processes, approvals, and handoffs.
                  </p>

                  <p className="text-[1rem] leading-8 text-slate-600">
                    It also looks at how work flows across teams, systems, and
                    managers.
                  </p>
                </div>
              </div>

              <div className="brand-rule-col">
                <h3 className="min-h-[3.6rem] text-[1.25rem] font-semibold leading-[1.15] text-slate-950">
                  Technology and operational clarity
                </h3>

                <div className="mt-4 max-w-md space-y-4">
                  <p className="text-[1rem] leading-8 text-slate-600">
                    Alignment between HR technology, knowledge, and day-to-day
                    execution.
                  </p>

                  <p className="text-[1rem] leading-8 text-slate-600">
                    That includes prioritising improvements that strengthen
                    consistency and reduce reliance on workarounds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FIT */}
      <section className="bg-[#f4f6fa]">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Fit</p>

            <h2 className="brand-heading-lg text-slate-950">
              The model works best where the business needs senior capability,
              but permanent headcount is not yet the right move.
            </h2>

            <p className="brand-body-lg">
              It is most effective where support needs to sit close enough to
              execution to improve how HR runs, rather than simply advise from a
              distance.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-case-split">
              <div>
                <h3 className="brand-heading-sm text-slate-950">
                  Where this works well
                </h3>

                <div className="mt-5 brand-stack-sm">
                  {goodFit.map((item) => (
                    <p key={item} className="brand-body">
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="brand-heading-sm text-slate-950">
                  Where another route may be better
                </h3>

                <div className="mt-5 brand-stack-sm">
                  {notFit.map((item) => (
                    <p key={item} className="brand-body">
                      {item}
                    </p>
                  ))}
                </div>
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

            </div>
          </div>
        </div>
      </section>
    </>
  );
}