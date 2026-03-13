import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Greg van Esch",
  description:
    "Learn more about Greg van Esch, an HR Operations & Transformation Advisor with 17+ years of experience across global People Operations, shared services, HR systems, M&A, compliance, and operational transformation.",
};

const highlights = [
  "17+ years in HR operations, HR systems, and operational transformation",
  "Led Global People Operations & Shared Services supporting 4,000+ employees, contractors, and consultants across 27 countries",
  "Built and scaled shared services capability across EMEA and through multiple acquisitions",
  "Led HR operational TUPE integrations, entity consolidation, and benefit harmonisation across multiple M&A programmes",
  "Championed ServiceNow HR module implementation and broader HR process automation",
  "Extensive experience across compliance, controls, audits, vendor governance, and HR operating model design",
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-[#0A1628] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8AAAC8]">
              About
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Practical HR operations leadership shaped by global experience.
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              I am an HR Operations & Transformation Advisor with more than 17 years of experience
              across HR operations, HR systems, service delivery, compliance, shared services, and
              organisational change. My background combines strategic thinking with a hands-on
              operational mindset, with a strong focus on building HR structures that work in
              practice and scale effectively over time.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
              Professional background
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              From operational HR delivery to global transformation leadership.
            </h2>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              Most recently, I served as Director, Global People Operations at Cornerstone
              OnDemand, where I led Global People Operations & Shared Services supporting more than
              4,000 employees, contractors, and consultants across 27 countries. The role covered
              HR operations, compliance, controls, HR policy, M&A due diligence and integration,
              HR systems, global mobility, vendor governance, and service delivery improvement.
            </p>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              Earlier in my career, I held senior HR leadership roles at Bravo Group Manufacturing
              and Unitrans Supply Chain Solutions, building experience across industrial relations,
              restructuring, executive support, talent processes, HRIS, and workforce change in
              complex operating environments.
            </p>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              Across these roles, the common thread has been helping organisations create more
              structured, scalable, and resilient people operations — whether through process
              redesign, systems improvement, governance, integration work, or operational clarity.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
              Highlights
            </p>
            <div className="mt-6 space-y-3 text-base text-slate-700">
              {highlights.map((highlight) => (
                <div key={highlight} className="rounded-lg bg-white px-4 py-3">
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
              How I work
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Strategic thinking, operational detail, and a hands-on approach.
            </h2>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              I am at my best where structure, systems, service delivery, and business reality
              intersect. That means understanding the big picture while also paying close attention
              to the details that make HR operations actually work — controls, ownership, data,
              handoffs, manager experience, documentation, and operational consistency.
            </p>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              My approach is collaborative and practical. I work closely with leadership teams,
              stakeholders, and HR functions to design changes that are not only well thought
              through, but also realistic and sustainable for the organisation implementing them.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0D1F3C] py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8AAAC8]">
              Next step
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Need help strengthening HR operations in your organisation?
            </h2>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              Whether you are a growing business building stronger HR foundations or a larger
              organisation navigating transformation and complexity, I would be happy to discuss
              your situation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="rounded-xl bg-[#1E6FD9] px-6 py-3 text-base font-medium text-white transition hover:bg-[#2979FF]"
              >
                Contact Me
              </Link>
              <Link
                href="/approach"
                className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium transition hover:bg-white/10"
              >
                View Approach
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}