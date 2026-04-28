import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Van Esch Advisory provides practical HR operations, service delivery, and transformation advisory grounded in real operating experience.",
};

const experienceThemes = [
  {
    title: "Global HR operations and shared services",
    text: "Experience leading and improving People Operations and shared services in complex international environments. This includes employee lifecycle operations, service delivery, and day-to-day execution.",
  },
  {
    title: "HR transformation, process, and governance",
    text: "Work across operating models, process design, controls, and governance. The focus is on creating clarity and consistency that holds under pressure.",
  },
  {
    title: "HR technology and workflow design",
    text: "Improving HR systems and reducing manual work through better workflow design. This includes ServiceNow HR Service Delivery, system integration, and process redesign.",
  },
  {
    title: "M&A and organisational integration",
    text: "Operational delivery through acquisitions and integration. This includes due diligence, TUPE-related change, and aligning processes across entities and regions.",
  },
];

const credibility = [
  "17+ years in HR operations and service delivery",
  "Global experience across 30+ countries",
  "Leadership roles in complex and scaled organisations",
  "Deep experience in ServiceNow HR technology and workflow design",
  "Delivered across growth, scale, and post-acquisition environments",
];

const organisationFit = [
  {
    title: "Growing organisations",
    text: "Where HR can no longer run informally and needs clearer ownership, structure, and consistency.",
  },
  {
    title: "Complex environments",
    text: "Where shared services, systems, or global operations require more deliberate structure and control.",
  },
  {
    title: "Change moments",
    text: "Where growth, transformation, or systems change requires HR operations to adapt quickly and cleanly.",
  },
];

function ExperienceRow({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="border-t border-slate-200 py-8 lg:py-10">
      <h3 className="text-[1.25rem] font-semibold leading-[1.25] text-slate-950 lg:text-[1.4rem]">
        {title}
      </h3>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        {text}
      </p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">About</p>

              <h1 className="brand-heading-xl">
                HR operations designed to work in practice.
              </h1>
            </div>

            <p className="brand-subheading brand-body-on-dark max-w-3xl">
              Van Esch Advisory focuses on making HR function more cleanly,
              through clearer processes, stronger ownership, and operating
              models that hold up as organisations grow.
            </p>

            <p className="max-w-3xl text-base leading-8 text-[#C7D8EA]">
              Most HR challenges are not isolated issues. They are symptoms of
              how work flows through the organisation.
            </p>

            <div className="brand-actions">
              <Link
                href="/diagnostic"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Take the Health Check
              </Link>

              <Link
                href="/contact"
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Start a conversation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT THIS FIRM DOES */}
      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">
              What this firm is built to do
            </p>

            <h2 className="brand-heading-lg text-slate-950">
              Turning HR complexity into clearer operating structure.
            </h2>

            <p className="brand-body-lg">
              Many organisations do not need more theory. They need help making
              HR work more cleanly in practice.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              <div className="brand-rule-col">
                <h3 className="brand-heading-sm text-slate-950">
                  Clarify ownership
                </h3>
                <p className="mt-4 brand-body">
                  So HR work does not sit loosely across teams and decisions are
                  made more consistently.
                </p>
              </div>

              <div className="brand-rule-col">
                <h3 className="brand-heading-sm text-slate-950">
                  Strengthen processes
                </h3>
                <p className="mt-4 brand-body">
                  So the basics hold under pressure rather than changing by team
                  or urgency.
                </p>
              </div>

              <div className="brand-rule-col">
                <h3 className="brand-heading-sm text-slate-950">
                  Improve service delivery
                </h3>
                <p className="mt-4 brand-body">
                  So HR becomes more predictable, usable, and easier to operate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Relevant experience</p>

            <h2 className="brand-heading-lg text-slate-950">
              Experience that translates into practical advisory value.
            </h2>

            <p className="brand-body-lg">
              The value of experience is not the title. It is recognising
              patterns quickly and understanding what will work in practice.
            </p>
          </div>

          <div className="brand-section-body-xl border-b border-slate-200">
            {experienceThemes.map((item) => (
              <ExperienceRow
                key={item.title}
                title={item.title}
                text={item.text}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">Founder</p>

              <h2 className="brand-heading-lg text-slate-950">
                Built on operating experience.
              </h2>

              <p className="brand-body">
                Van Esch Advisory is led by Greg van Esch, an HR Operations and
                Transformation leader with over 17 years of experience.
              </p>

              <p className="brand-body">
                His background is in building and running HR operations inside
                complex organisations. This includes global People Operations,
                shared services, HR transformation, and operational integration.
              </p>

              <p className="brand-body">
                The focus is not on theory or generic frameworks. It is on
                creating operational clarity that works in the context of the
                business.
              </p>
            </div>

            <div className="brand-stack-sm">
              <p className="brand-section-kicker">
                What clients should expect
              </p>

              <h3 className="brand-heading-md text-slate-950">
                Clear thinking and usable outputs.
              </h3>

              <div className="mt-6 space-y-3">
                {credibility.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg bg-white px-4 py-3 text-base text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BEST FIT */}
      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Best fit</p>

            <h2 className="brand-heading-lg text-slate-950">
              Where this work tends to add the most value.
            </h2>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              {organisationFit.map((item) => (
                <div key={item.title} className="brand-rule-col">
                  <h3 className="brand-heading-sm text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-4 brand-body">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="brand-dark-section-plain">
        <div className="brand-container brand-section-tight">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>

                <h2 className="brand-heading-lg">
                  Get a clearer view of how your HR model is running.
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Use the Health Check for an initial read, or start a
                  conversation if the situation is already clear.
                </p>
              </div>

              <div className="brand-actions">
                <Link
                  href="/diagnostic"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Take the Health Check
                </Link>

                <Link
                  href="/contact"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
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