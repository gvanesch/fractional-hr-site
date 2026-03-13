import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Growing Companies & Mid-Market | Greg van Esch",
  description:
    "Practical HR operations support for growing companies and mid-market businesses building stronger onboarding, clearer processes, better systems, and scalable HR foundations.",
};

const signs = [
  "Onboarding looks different depending on the manager or team",
  "Policies exist but people are not always sure which version applies",
  "HR processes rely heavily on manual coordination and follow-up",
  "Employee data is spread across spreadsheets, inboxes, or disconnected systems",
  "Managers are uncertain about how to handle common people situations",
  "Hiring growth is starting to expose operational gaps",
];

const supportAreas = [
  {
    title: "HR Process Foundations",
    text: "Building the core structures that help HR operate consistently as the business grows.",
    bullets: [
      "Onboarding and employee lifecycle design",
      "Clear process ownership and handoffs",
      "Manager-friendly workflows",
    ],
  },
  {
    title: "Policies & Operational Clarity",
    text: "Creating the practical documentation and structure that reduce ambiguity and support better decision-making.",
    bullets: [
      "Core policy frameworks",
      "Employee documentation",
      "Approval structures and responsibilities",
    ],
  },
  {
    title: "HR Systems & Automation",
    text: "Improving the systems and workflows that support people operations without overengineering the solution.",
    bullets: [
      "HR system selection or improvement",
      "Reducing manual work and duplication",
      "Practical automation opportunities",
    ],
  },
  {
    title: "Knowledge & Manager Guidance",
    text: "Helping managers and employees navigate HR processes more consistently and with less dependency on tribal knowledge.",
    bullets: [
      "SOPs and playbooks",
      "Knowledge base design",
      "Manager guidance materials",
    ],
  },
];

export default function GrowingCompaniesPage() {
  return (
    <>
      <section className="bg-[#123a63] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Growing Companies & Mid-Market
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              HR foundations that support growth — without unnecessary bureaucracy.
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-100/90">
              Growing organisations often reach a point where informal people practices stop
              working. Hiring accelerates, managers create their own processes, and HR becomes
              reactive rather than operational. I help scaling businesses build practical HR
              infrastructure that fits the reality of the business and supports sustainable growth.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white transition hover:bg-blue-700"
              >
                Discuss Your Situation
              </Link>
              <Link
                href="/services/hr-foundations-sprint"
                className="rounded-xl border border-white/25 px-6 py-3 text-base font-medium transition hover:bg-white/10"
              >
                See the HR Foundations Sprint
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Common signs
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Signs your HR operations may be starting to struggle
          </h2>
          <p className="mt-4 text-xl leading-9 text-slate-700">
            Many growing businesses reach a point where people operations start to feel messy,
            inconsistent, or overly manual. These problems are common — and usually signal that
            the business has outgrown its current HR foundations.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {signs.map((sign) => (
            <div
              key={sign}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-lg leading-8 text-slate-700 shadow-sm"
            >
              {sign}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              A boutique advisory approach
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Tailored support, not recycled templates.
            </h2>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              Large consulting firms often begin with predefined frameworks and standard templates.
              While those approaches may work well in large enterprise programmes, growing
              organisations often need something different. My work starts by understanding how the
              business actually operates — how decisions are made, where friction shows up, what
              the organisation is trying to achieve, and what its practical constraints are.
            </p>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              From there, we design HR structures, processes, and systems that fit the business
              rather than forcing the business into a theoretical model. The aim is not to produce
              documents for the sake of it. The aim is to create HR operations that work day-to-day
              and remain stable as the organisation grows.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Where I typically help
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Practical support for growing businesses
          </h2>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {supportAreas.map((area) => (
            <div
              key={area.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm"
            >
              <h3 className="text-2xl font-semibold text-slate-950">{area.title}</h3>
              <p className="mt-4 text-lg leading-8 text-slate-600">{area.text}</p>
              <ul className="mt-6 space-y-3 text-base text-slate-700">
                {area.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-lg bg-slate-50 px-4 py-3">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              How engagements usually begin
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Start with clarity, not assumptions.
            </h2>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              Most engagements begin with a short discovery phase where we review the current
              operating environment, map existing HR processes, identify friction points, and
              prioritise practical improvement opportunities. Tools may include process mapping,
              Start / Stop / Continue reviews, future-state workshops, and leadership alignment
              discussions.
            </p>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              Many growing organisations begin with a structured{" "}
              <Link
                href="/services/hr-foundations-sprint"
                className="font-medium text-blue-700 underline underline-offset-4"
              >
                HR Foundations Sprint
              </Link>
              , which creates a clear and actionable plan for strengthening HR operations.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] bg-[#123a63] px-8 py-12 text-white shadow-xl">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Next step
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Building the right HR foundations early saves significant complexity later.
            </h2>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-slate-100/90">
              If your business is growing and HR operations are starting to feel reactive,
              inconsistent, or difficult to scale, the best place to start is a short
              conversation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white transition hover:bg-blue-700"
              >
                Contact Me
              </Link>
              <Link
                href="/services/hr-foundations-sprint"
                className="rounded-xl border border-white/25 px-6 py-3 text-base font-medium transition hover:bg-white/10"
              >
                Learn About the Sprint
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}