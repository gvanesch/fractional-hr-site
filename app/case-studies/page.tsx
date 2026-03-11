import Link from "next/link";
import SiteShell from "../../components/SiteShell";

const stats = [
  { value: "17+", label: "Years in HR Operations" },
  { value: "27", label: "Countries Supported" },
  { value: "4,000+", label: "Employees Supported" },
  { value: "40%", label: "Reduction in Manual HR Admin" },
];

const servicePaths = [
  {
    title: "Enterprise & Complex Environments",
    text: "Support for organisations navigating global scale, shared services, HR technology programmes, regulatory complexity, and transformation.",
    bullets: [
      "HR operations transformation",
      "Service delivery and shared services",
      "HR technology and workflow redesign",
      "M&A integration and harmonisation",
    ],
    href: "/services",
  },
  {
    title: "Growing Companies & HR Foundations",
    text: "Support for scaling businesses that need stronger HR infrastructure, cleaner processes, better systems, and more operational consistency.",
    bullets: [
      "Core HR policies and process design",
      "Onboarding and employee lifecycle foundations",
      "HR systems setup and improvement",
      "Knowledge, SOPs, and manager guidance",
    ],
    href: "/services",
  },
];

const caseStudyPreviews = [
  {
    title: "Global onboarding automation",
    text: "Redesigned onboarding using ServiceNow HRSD and HRIS integration to reduce manual effort, improve control, and create a scalable operating model.",
    href: "/case-studies",
  },
  {
    title: "Scaling HR operations across 27 countries",
    text: "Restructured People Operations and Shared Services to support a global workforce with stronger governance, consistency, and service delivery.",
    href: "/case-studies",
  },
];

export default function HomePage() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950" />
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80"
            alt="Modern boardroom"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-32">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200">
              HR Operations • Service Delivery • Transformation Advisory
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Building HR operations that scale with growth, complexity, and change.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              I help organisations strengthen HR operations, service delivery, knowledge
              frameworks, and HR technology so they can scale with more clarity, control,
              and efficiency.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/services"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Explore Services
              </Link>
              <Link
                href="/case-studies"
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium transition hover:bg-white/10"
              >
                View Case Studies
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Where I typically help
            </p>

            <div className="mt-6 space-y-4 text-slate-200">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                Global HR operating models and shared services
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                HR technology, workflow automation, and ServiceNow HRSD
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                Knowledge management and employee self-service
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                Governance, controls, and audit-ready operations
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                HR foundations for scaling businesses and mid-market organisations
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm"
            >
              <div className="text-3xl font-semibold tracking-tight text-slate-950">
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Two ways I typically support clients
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Advisory for both complex organisations and growing businesses.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            Some clients need support with large-scale operational transformation. Others need
            strong HR foundations before complexity starts to cost them time, money, and control.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {servicePaths.map((path) => (
            <div
              key={path.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm"
            >
              <h3 className="text-2xl font-semibold text-slate-950">{path.title}</h3>
              <p className="mt-4 leading-7 text-slate-600">{path.text}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {path.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-lg bg-slate-50 px-4 py-3">
                    {bullet}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href={path.href}
                  className="inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Learn More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Selected Case Studies
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Operational transformation in practice.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              A few examples of the kind of work I have led across global People Operations,
              service delivery, workflow design, and HR technology transformation.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {caseStudyPreviews.map((study) => (
              <div
                key={study.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 shadow-sm"
              >
                <h3 className="text-2xl font-semibold text-slate-950">{study.title}</h3>
                <p className="mt-4 leading-7 text-slate-600">{study.text}</p>
                <div className="mt-6">
                  <Link
                    href={study.href}
                    className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-white"
                  >
                    Read Case Studies
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Start here
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Need stronger HR operations, better service delivery, or more scalable infrastructure?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
              Whether the challenge is enterprise transformation or simply getting the basics
              right in a growing business, the best place to start is a short conversation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Contact Me
              </Link>
              <a
                href="mailto:info@vanesch.uk"
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium transition hover:bg-white/10"
              >
                info@vanesch.uk
              </a>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}