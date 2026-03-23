import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Van Esch Advisory Ltd",
  description:
    "Van Esch Advisory Ltd provides practical HR operations, service delivery, and transformation advisory for growing and complex organisations.",
};

const experienceThemes = [
  {
    title: "Global HR Operations & Shared Services",
    text: "Experience leading and restructuring People Operations and shared services in complex international environments. This includes accountability across employee lifecycle operations, service delivery, and operational execution.",
  },
  {
    title: "HR Transformation, Process & Governance",
    text: "Hands-on work across HR operating models, process design, SOPs, controls, and governance structures. The focus is on creating clarity, consistency, and operational discipline that holds up as organisations scale.",
  },
  {
    title: "HR Technology & Workflow Automation",
    text: "Practical experience improving HR systems and reducing manual work through better workflow design. This includes ServiceNow HRIS automation, process redesign, and making systems genuinely useful in day-to-day operations.",
  },
  {
    title: "M&A, Integration & Organisational Change",
    text: "Operational delivery through acquisitions, integration planning, TUPE-related change, and harmonisation. This includes aligning processes, policies, and structures across multiple entities and regions.",
  },
];

const credibility = [
  "17+ years in HR operations and service delivery",
  "Global experience across 30+ countries",
  "Leadership roles in complex and scaled organisations",
  "Deep experience in ServiceNow HRIS automation and HR technology",
  "Delivered across growth, scale, and post-acquisition environments",
];

const workingPrinciples = [
  "Practical rather than theoretical",
  "Designed around real operating constraints",
  "Focused on clarity, consistency, and usable execution",
  "Combines HR, systems, process, and service delivery thinking",
  "Built to leave the organisation stronger after the work is done",
];

const organisationFit = [
  {
    title: "Growing organisations",
    text: "Businesses that have reached the point where HR can no longer run informally. They now need stronger foundations, clearer ownership, and more consistent execution.",
  },
  {
    title: "Complex organisations",
    text: "Businesses dealing with international operations, shared services, multiple systems, or regulatory requirements. These environments need more deliberate operating structure.",
  },
  {
    title: "Change moments",
    text: "Organisations navigating growth, transformation, restructuring, or systems change. HR operations need to keep pace with how the business is evolving.",
  },
];

export default function AboutPage() {
  return (
    <main>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-5xl brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">About Van Esch Advisory Ltd</p>

              <h1 className="brand-heading-lg">
                Practical HR operations, service delivery, and transformation
                advisory shaped by real operating experience.
              </h1>

              <p className="brand-subheading brand-body-on-dark max-w-3xl">
                Van Esch Advisory Ltd was built on a simple idea. HR works best
                when it is operationally clear, commercially grounded, and
                designed to support the business as it grows and becomes more
                complex.
              </p>

              <p className="brand-subheading brand-body-on-dark max-w-3xl">
                The work focuses on making HR function more cleanly in practice.
                This means better processes, clearer ownership, stronger service
                delivery, more usable systems, and operating structures that fit
                how the business actually runs.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/contact"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Contact
              </Link>

              <Link
                href="/diagnostic"
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Take the Diagnostic
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT THIS FIRM DOES */}
      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">
                What this firm is built to do
              </p>

              <h2 className="brand-heading-lg text-slate-950">
                Turning HR complexity into clearer operating structure.
              </h2>

              <p className="brand-subheading text-slate-700">
                Many organisations do not need more HR theory. They need help
                making the function work more cleanly in practice. This usually
                shows up as inconsistent processes, unclear ownership, service
                friction, and systems that do not fully support how the business
                operates.
              </p>

              <p className="brand-body">
                The focus here is on solving those problems properly. That means
                simplifying where needed, creating structure where it is missing,
                and making sure the operating model holds up as the organisation
                grows.
              </p>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Core perspective</p>

                <h3 className="brand-heading-md text-slate-950">
                  Stronger HR usually starts with stronger operations.
                </h3>

                <p className="brand-body">
                  When HR becomes reactive, the issue is rarely effort alone.
                  It is usually a lack of structure around how work flows through
                  the organisation.
                </p>

                <p className="brand-body">
                  Improving HR therefore starts with operating design. Once that
                  is in place, consistency improves and the pressure on the team
                  reduces.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="border-y border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">Relevant experience</p>

            <h2 className="brand-heading-lg text-slate-950">
              Experience that translates into practical advisory value.
            </h2>

            <p className="brand-subheading text-slate-700">
              The value of experience is not the title. It is the ability to
              recognise patterns quickly and understand what will work in a
              real operating environment.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {experienceThemes.map((theme) => (
              <div key={theme.title} className="brand-surface-card p-8">
                <div className="brand-stack-sm">
                  <h3 className="brand-heading-md text-slate-950">
                    {theme.title}
                  </h3>
                  <p className="brand-body">{theme.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CREDIBILITY */}
      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">Credibility</p>

              <h2 className="brand-heading-lg text-slate-950">
                Experience grounded in real operating environments.
              </h2>

              <p className="brand-subheading text-slate-700">
                This work is built on direct experience operating inside HR
                functions, not observing them from the outside.
              </p>

              <div className="mt-8 space-y-3 text-base text-slate-700">
                {credibility.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg bg-white px-4 py-3"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="brand-surface-card p-8">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">
                  What clients should expect
                </p>

                <h3 className="brand-heading-md text-slate-950">
                  Clear thinking, honest diagnosis, and usable outputs.
                </h3>

                <p className="brand-body">
                  The work is intended to help organisations make better
                  decisions and reduce operational friction. It does not rely on
                  generic recommendations or abstract frameworks.
                </p>

                <p className="brand-body">
                  The focus is on creating solutions that fit the reality of the
                  business and can be implemented without unnecessary complexity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FIT */}
      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">Best fit</p>

            <h2 className="brand-heading-lg text-slate-950">
              The organisations this work is best suited to.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {organisationFit.map((item) => (
              <div key={item.title} className="brand-surface-card p-8">
                <div className="brand-stack-sm">
                  <h3 className="brand-heading-md text-slate-950">
                    {item.title}
                  </h3>
                  <p className="brand-body">{item.text}</p>
                </div>
              </div>
            ))}
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
                  If HR operations need to become clearer, more consistent, or
                  more scalable, the next step is straightforward.
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  You can take the HR Operations Health Check for an immediate
                  self-assessment, or start with a short conversation about your
                  current challenges.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/contact"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Contact
                </Link>

                <Link
                  href="/diagnostic"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Take the Diagnostic
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}