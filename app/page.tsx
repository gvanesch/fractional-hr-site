import Link from "next/link";
import SiteShell from "@/components/SiteShell";

const stats = [
  { value: "17+", label: "Years in HR Operations" },
  { value: "27", label: "Countries Supported" },
  { value: "4,000+", label: "Employees Supported" },
  { value: "40%", label: "Reduction in Manual HR Admin" },
];

const services = [
  {
    title: "HR Operations Advisory",
    text: "Design, stabilise, and optimise HR operations across complex and scaling organisations.",
  },
  {
    title: "HR Technology Transformation",
    text: "Support HR platform implementation, workflow orchestration, and service delivery tooling.",
  },
  {
    title: "Knowledge & Service Design",
    text: "Improve knowledge architecture, self-service, and operational clarity across HR teams.",
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

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200">
              Advisory • HR Operations • Service Delivery • Transformation
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Building HR operations that scale with complexity, growth, and change.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              I help organisations design and strengthen HR operations, service delivery,
              knowledge frameworks, and HR technology platforms so they can scale with more
              clarity, control, and efficiency.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/services"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                View Services
              </Link>
              <Link
                href="/case-studies"
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium transition hover:bg-white/10"
              >
                View Case Studies
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm">
              <div className="text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</div>
              <div className="mt-2 text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Services</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Specialist advisory across HR operations, service delivery, and transformation.
          </h2>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-slate-950">{service.title}</h3>
              <p className="mt-4 leading-7 text-slate-600">{service.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/services"
            className="inline-flex rounded-xl bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Explore all services
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}