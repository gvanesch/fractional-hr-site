import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HR Foundations for Growing Companies | Van Esch Advisory Ltd",
  description:
    "Practical HR foundations for growing companies and mid-market organisations, including stronger onboarding, clearer ownership, better process discipline, and a structured path from HR Health Check to HR Operations Diagnostic Assessment to HR Foundations Sprint.",
};

const commonSigns = [
  "Managers are creating their own hiring or onboarding processes",
  "Policies and documentation exist but are inconsistent or unclear",
  "Employee questions repeatedly land in HR's inbox",
  "HR is mostly reactive rather than operational",
  "New joiners have very different onboarding experiences",
  "Leadership senses HR processes are starting to creak under growth",
];

const startPath = [
  {
    title: "HR Health Check",
    text: "A useful first step where you want a quick signal on whether operational strain may be building.",
    href: "/diagnostic",
    cta: "Take the Health Check",
  },
  {
    title: "HR Operations Diagnostic Assessment",
    text: "The better next step when the signs of friction are already clear and a deeper, structured view is needed across HR, managers, and leadership.",
    href: "/diagnostic-assessment",
    cta: "View Diagnostic Assessment",
  },
  {
    title: "HR Foundations Sprint",
    text: "The right next step when there is enough clarity to move into focused action and improve the highest-impact gaps.",
    href: "/services/hr-foundations-sprint",
    cta: "See the HR Foundations Sprint",
  },
];

export default function GrowingCompaniesPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-24 lg:py-28">
          <div className="max-w-4xl">
            <p className="brand-kicker">Growing Companies & Mid-Market</p>

            <h1 className="brand-heading-xl mt-3">
              HR foundations that support growth without unnecessary bureaucracy.
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Growing organisations often reach a point where informal people
              practices stop working. Hiring accelerates, managers create their
              own processes, and HR becomes reactive rather than operational.
            </p>

            <p className="brand-subheading brand-body-on-dark mt-4 max-w-3xl">
              The focus here is on building practical HR infrastructure that
              fits the reality of the business: clearer ownership, stronger
              onboarding, better process discipline, and structure that can hold
              up as the organisation grows.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/services/hr-chaos-signals"
                className="rounded-xl border border-white/25 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
              >
                Recognise the Signs
              </Link>

              <Link
                href="/diagnostic"
                className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
              >
                Take the Health Check
              </Link>

              <Link
                href="/contact?topic=HR%20Foundations%20for%20Growing%20Companies"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                Discuss Your Situation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="brand-section-kicker">Common Signs</p>

            <h2 className="brand-heading-lg mt-3 text-slate-950">
              Signals that HR foundations may need strengthening
            </h2>

            <p className="brand-subheading mt-4 text-slate-700">
              Many growing companies notice operational friction before they
              formally decide to invest in stronger HR infrastructure.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {commonSigns.map((sign) => (
              <div
                key={sign}
                className="brand-surface-soft rounded-2xl p-5 text-lg leading-8 text-slate-700"
              >
                {sign}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <p className="brand-section-kicker">What HR foundations means</p>

            <h2 className="brand-heading-lg mt-3 text-slate-950">
              Building HR structure without slowing the business down.
            </h2>

            <div className="brand-body brand-body-lg mt-4 space-y-4">
              <p>
                HR foundations are not about creating large HR departments or
                adding unnecessary process. They are about making the core
                employee lifecycle more structured, consistent, and scalable as
                the organisation grows.
              </p>

              <p>
                When these foundations are in place, managers spend less time
                reinventing processes, employees experience greater clarity, and
                leadership gains better visibility and control over how the
                organisation operates.
              </p>

              <p>
                In practical terms, this usually means improving process
                clarity, ownership, onboarding, documentation, service access,
                and the operational discipline around how HR work actually
                flows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <p className="brand-section-kicker">How organisations usually begin</p>

            <h2 className="brand-heading-lg mt-3 text-slate-950">
              Start with the right level of clarity.
            </h2>

            <p className="brand-subheading mt-4 text-slate-700">
              Some organisations start with the Health Check. Others move
              directly into the Diagnostic Assessment when the signs of friction
              are already clear. The Sprint then turns that clarity into
              structured action where focused improvement support is needed.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {startPath.map((step) => (
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
                    className="brand-button-dark rounded-xl px-5 py-3 text-base font-medium"
                  >
                    {step.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-dark-section py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="brand-card-dark max-w-4xl rounded-[2rem] p-10 shadow-2xl shadow-black/20">
            <p className="brand-kicker">Next step</p>

            <h2 className="brand-heading-lg mt-3">
              Want to strengthen HR operations before growth creates bigger
              problems?
            </h2>

            <p className="brand-subheading brand-body-on-dark mt-4 max-w-3xl">
              The best starting point depends on how clear the pattern already
              is. You can begin with the HR Health Check, move into the
              Diagnostic Assessment for deeper clarity, or discuss whether the
              HR Foundations Sprint is the right next step.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/diagnostic"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                Take the Health Check
              </Link>

              <Link
                href="/diagnostic-assessment"
                className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
              >
                View Diagnostic Assessment
              </Link>

              <Link
                href="/contact?topic=HR%20Foundations%20for%20Growing%20Companies"
                className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
              >
                Discuss Your Situation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}