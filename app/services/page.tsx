import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services | Greg van Esch",
  description:
    "HR operations advisory for growing companies, mid-market organisations, and enterprise businesses navigating transformation, service delivery, and HR technology change.",
};

const audiences = [
  {
    title: "Growing Companies & Mid-Market",
    text: "Support for scaling businesses that need stronger HR infrastructure, clearer processes, better onboarding, and practical systems that fit the realities of the business.",
    bullets: [
      "HR foundations and process clarity",
      "Onboarding and employee lifecycle design",
      "Policies, playbooks, and manager guidance",
      "HR systems improvement and practical automation",
    ],
    href: "/services/growing-companies",
    cta: "Explore Growing Companies Support",
  },
  {
    title: "Enterprise & Complex Organisations",
    text: "Support for organisations navigating global operations, shared services, HR technology programmes, regulatory complexity, and large-scale transformation.",
    bullets: [
      "HR operations transformation",
      "Service delivery and shared services",
      "ServiceNow HRSD and workflow redesign",
      "M&A integration and harmonisation",
    ],
    href: "/services/enterprise",
    cta: "Explore Enterprise Support",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="bg-[#0A1628] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8AAAC8]">
              Services
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Different organisations need different kinds of HR support.
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              A growing business building its HR foundations has very different needs from a global
              organisation redesigning shared services or navigating complex transformation. Choose
              the path that best reflects where your organisation is today.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          {audiences.map((audience) => (
            <div
              key={audience.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm"
            >
              <h2 className="text-2xl font-semibold text-slate-950">{audience.title}</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">{audience.text}</p>
              <ul className="mt-6 space-y-3 text-base text-slate-700">
                {audience.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-lg bg-slate-50 px-4 py-3">
                    {bullet}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href={audience.href}
                  className="inline-flex rounded-xl bg-[#0D1F3C] px-5 py-3 text-base font-medium text-white transition hover:bg-[#0A1628]"
                >
                  {audience.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 px-8 py-12">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
                Popular starting point
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                HR Foundations Sprint
              </h2>
              <p className="mt-4 max-w-3xl text-xl leading-9 text-slate-700">
                Many growing organisations begin with a short HR Foundations Sprint — a focused
                engagement designed to identify operational gaps, prioritise improvements, and give
                the business a clear plan for building stronger HR foundations.
              </p>
              <div className="mt-8">
                <Link
                  href="/services/hr-foundations-sprint"
                  className="inline-flex rounded-xl bg-[#1E6FD9] px-6 py-3 text-base font-medium text-white transition hover:bg-[#2979FF]"
                >
                  Learn About the Sprint
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}