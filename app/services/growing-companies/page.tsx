import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HR Foundations for Growing Companies | Greg van Esch",
  description:
    "Practical HR foundations for growing companies and mid-market organisations — onboarding, lifecycle processes, HR infrastructure, and operational clarity that supports growth.",
};

const commonSigns = [
  "Managers are creating their own hiring or onboarding processes",
  "Policies and documentation exist but are inconsistent or unclear",
  "Employee questions repeatedly land in HR's inbox",
  "HR is mostly reactive rather than operational",
  "New joiners have very different onboarding experiences",
  "Leadership senses HR processes are starting to creak under growth",
];

export default function GrowingCompaniesPage() {
  return (
    <>
      {/* HERO */}

      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-24 lg:py-28">
          <div className="max-w-4xl">

            <p className="brand-kicker">
              Growing Companies & Mid-Market
            </p>

            <h1 className="brand-heading-xl mt-3">
              HR foundations that support growth — without unnecessary bureaucracy.
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Growing organisations often reach a point where informal people
              practices stop working. Hiring accelerates, managers create their
              own processes, and HR becomes reactive rather than operational.
              I help scaling businesses build practical HR infrastructure that
              fits the reality of the business and supports sustainable growth.
            </p>

            {/* HERO BUTTONS */}

            <div className="mt-8 flex flex-wrap gap-4">

              <Link
                href="/services/hr-chaos-signals"
                className="rounded-xl border border-white/25 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
              >
                Recognise the Signs
              </Link>

              <Link
                href="/services/hr-foundations-sprint"
                className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
              >
                See the HR Foundations Sprint
              </Link>

              <Link
                href="/contact"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                Discuss Your Situation
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* COMMON SIGNS */}

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-6 py-20">

          <div className="max-w-3xl">

            <p className="brand-section-kicker">
              Common Signs
            </p>

            <h2 className="brand-heading-lg mt-3 text-slate-950">
              Signals that HR foundations may need strengthening
            </h2>

            <p className="brand-subheading mt-4 text-slate-700">
              Many growing companies start to notice operational friction before
              they formally decide to invest in HR infrastructure.
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

      {/* HR FOUNDATIONS EXPLANATION */}

      <section className="border-y border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-6 py-20">

          <div className="max-w-4xl">

            <p className="brand-section-kicker">
              What HR Foundations Means
            </p>

            <h2 className="brand-heading-lg mt-3 text-slate-950">
              Building HR structure without slowing the business down.
            </h2>

            <div className="brand-body brand-body-lg mt-4 space-y-4">

              <p>
                HR foundations are not about creating large HR departments or
                adding unnecessary process. They are about ensuring the core
                employee lifecycle is structured, consistent, and scalable as
                the organisation grows.
              </p>

              <p>
                When these foundations are in place, managers spend less time
                reinventing processes, employees experience greater clarity,
                and leadership gains better visibility and control over how the
                organisation operates.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* CTA SECTION */}

      <section className="brand-dark-section py-20">

        <div className="mx-auto max-w-7xl px-6">

          <div className="brand-card-dark max-w-4xl rounded-[2rem] p-10 shadow-2xl shadow-black/20">

            <p className="brand-kicker">
              Next Step
            </p>

            <h2 className="brand-heading-lg mt-3">
              Want to stabilise HR operations before growth creates bigger problems?
            </h2>

            <p className="brand-subheading brand-body-on-dark mt-4 max-w-3xl">
              The HR Foundations Sprint is a focused engagement designed to
              quickly identify operational gaps and create a practical plan
              for strengthening HR infrastructure in growing organisations.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <Link
                href="/services/hr-foundations-sprint"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                Explore the HR Foundations Sprint
              </Link>

              <Link
                href="/contact"
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