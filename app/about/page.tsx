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
    text: "Hands-on work across HR operating models, process design, SOPs, controls, governance structures, ISO27001, SOC2 and statutory reporting. The focus is on creating clarity, consistency, and operational discipline that holds up as organisations scale.",
  },
  {
    title: "HR Technology & Workflow Automation",
    text: "Practical experience improving HR systems and reducing manual work through better workflow design. This includes ServiceNow and HRIS automation, process redesign, and making systems genuinely useful in day-to-day operations.",
  },
  {
    title: "M&A, Integration & Organisational Change",
    text: "Operational delivery through acquisitions, integration planning, TUPE-related change, benefits and employment conditions harmonisation. This includes aligning processes, policies, and structures across multiple entities and regions.",
  },
];

const credibility = [
  "17+ years in HR operations and service delivery",
  "Global experience across 30+ countries",
  "Leadership roles in complex and scaled organisations",
  "Deep experience in ServiceNow HRIS automation and HR technology",
  "Delivered across growth, scale, and post-acquisition environments",
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
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-5xl brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">About Van Esch Advisory Ltd</p>

              <h1 className="brand-heading-lg">
                HR operations, designed to work, not just exist.
              </h1>

              <p className="brand-subheading brand-body-on-dark max-w-3xl">
                Practical HR Operations, Service Delivery, and Transformation
                Advisory grounded in real operating experience.
              </p>

              <p className="brand-subheading brand-body-on-dark max-w-3xl">
                The focus is on making HR function more cleanly in practice,
                through clearer processes, stronger ownership, and operating
                models that hold up as organisations grow.
              </p>

              <p className="brand-body-on-dark max-w-3xl">
                Most HR challenges are not isolated issues. They are symptoms of
                how the function is structured and how work flows through the
                organisation.
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
                Take the Health Check
              </Link>
            </div>
          </div>
        </div>
      </section>

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
                simplifying where needed, creating structure where it is
                missing, and making sure the operating model holds up as the
                organisation grows.
              </p>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Core perspective</p>

                <h3 className="brand-heading-md text-slate-950">
                  Stronger HR usually starts with stronger operations.
                </h3>

                <p className="brand-body">
                  When HR becomes reactive, the issue is rarely effort alone. It
                  is usually a lack of structure around how work flows through
                  the organisation.
                </p>

                <p className="brand-body">
                  Improving HR therefore starts with operating design. Once that
                  is in place, consistency improves and pressure on the team
                  reduces.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="max-w-3xl brand-stack-sm">
            <p className="brand-section-kicker">Relevant experience</p>

            <h2 className="brand-heading-lg text-slate-950">
              Experience that translates into practical advisory value.
            </h2>

            <p className="brand-subheading text-slate-700">
              The value of experience is not the title. It is the ability to
              recognise patterns quickly and understand what will work in a real
              operating environment.
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

      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">About the Founder</p>

              <h2 className="brand-heading-lg text-slate-950">
                Built on operating experience, not advisory theory.
              </h2>

              <p className="brand-subheading text-slate-700">
                Van Esch Advisory is led by Greg van Esch, an HR Operations and
                Transformation leader with over 17 years of experience operating
                inside complex organisations.
              </p>

              <p className="brand-body">
                His background is not in advisory alone, but in building,
                running, and improving HR operations in practice. This includes
                leading global People Operations and shared services
                environments, delivering HR transformation programmes, and
                designing operating models that hold up under real organisational
                pressure.
              </p>

              <p className="brand-body">
                Much of this work has involved simplifying complexity, whether
                through process redesign, service delivery improvement, or
                better use of HR integration technology such as ServiceNow HRSD and key absence management platforms like e-days.
              </p>

              <p className="brand-body">
                This experience shapes the approach taken at Van Esch Advisory.
                The focus is not on theory or generic best practice, but on
                creating operational clarity that works in the context of the
                business.
              </p>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-6 py-5">
                <p className="text-base font-semibold text-slate-950">
                  The perspective throughout this work is simple:
                </p>
                <p className="mt-2 text-base leading-7 text-slate-700">
                  HR improves when its operations are designed deliberately, not
                  allowed to evolve by default.
                </p>
              </div>

              <p className="brand-body">
                Delivered across organisations supporting 4,000+ employees
                across 30+ countries, including through periods of growth,
                transformation, and acquisition.
              </p>
            </div>

            <div className="brand-surface-card p-8">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">What clients should expect</p>

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
                  business and can be implemented without unnecessary
                  complexity.
                </p>

                <div className="mt-6 space-y-3 text-base text-slate-700">
                  {credibility.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg bg-slate-50 px-4 py-3"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                  Take the Health Check
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}