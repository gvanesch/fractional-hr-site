import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HR Chaos Signals | Greg van Esch",
  description:
    "Common signs that HR operations are becoming messy, reactive, or inconsistent in growing companies — and how an HR Operations Health Check or HR Foundations Sprint can help restore clarity.",
};

const signals = [
  {
    title: "Signal 1",
    heading: "Managers handle HR situations differently",
    text: [
      "Two managers deal with the same situation — performance concerns, employee requests, onboarding decisions — and approach it in completely different ways.",
      "This usually means the underlying HR processes are unclear or undocumented.",
      "When this happens repeatedly, HR teams spend increasing time mediating situations that should be handled consistently.",
    ],
  },
  {
    title: "Signal 2",
    heading: "Employees aren’t sure where to go for HR support",
    text: ["Questions arrive through multiple channels:"],
    bullets: [
      "Direct messages",
      "Emails to different HR team members",
      "Slack conversations",
      "Informal conversations with managers",
    ],
    closing:
      "Without a clear service model, requests bounce around the organisation and HR work becomes difficult to track or prioritise.",
  },
  {
    title: "Signal 3",
    heading: "HR spends most of its time coordinating rather than improving",
    text: [
      "Much of the HR team's energy goes into chasing approvals, clarifying responsibilities, or manually coordinating onboarding and employee changes.",
      "When this happens, HR becomes operationally busy but strategically constrained.",
      "The team has little time to improve systems or processes because they are constantly managing the operational load.",
    ],
  },
  {
    title: "Signal 4",
    heading: "Onboarding experiences vary widely between teams",
    text: [
      "Some employees receive structured onboarding.",
      "Others receive minimal guidance.",
      "In many organisations, onboarding is largely dependent on the manager’s individual approach rather than a clear organisational process.",
      "This inconsistency often becomes more visible as companies scale.",
    ],
  },
  {
    title: "Signal 5",
    heading: "HR systems exist but don’t fully support how the organisation works",
    text: [
      "Many organisations have invested in HR platforms, yet still rely heavily on spreadsheets, email coordination, and manual workarounds.",
      "The system technically exists, but the surrounding operational structure has never been designed properly.",
      "As a result, the technology never delivers its full value.",
    ],
  },
  {
    title: "Signal 6",
    heading: "HR answers the same questions repeatedly",
    text: [
      "Policies and HR guidance may exist somewhere, but employees still come directly to HR for clarification.",
      "When HR becomes the primary knowledge source rather than the facilitator of knowledge, operational pressure on the team increases rapidly.",
    ],
  },
  {
    title: "Signal 7",
    heading: "Operational friction becomes visible during growth moments",
    text: ["Periods of change often expose HR operational gaps:"],
    bullets: [
      "Rapid hiring",
      "Organisational restructuring",
      "New office locations",
      "Funding rounds or investor scrutiny",
    ],
    closing:
      "Processes that worked informally with 40 employees often begin to break down at 120.",
  },
];

const sprintFit = [
  "Have grown quickly to 50–500 employees",
  "Feel HR has become reactive or operationally messy",
  "Are preparing for funding, expansion, or operational change",
  "Want clearer HR processes and responsibilities",
];

export default function HRChaosSignalsPage() {
  return (
    <>
      <section className="bg-[#0A1628] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8AAAC8]">
              HR Chaos Signals
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              When growing companies start to feel HR friction
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              Most organisations don’t decide one day that they need “HR transformation.”
            </p>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              What actually happens is more subtle.
            </p>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              As companies grow, HR processes evolve informally. Systems are introduced gradually,
              managers develop their own ways of handling people situations, and operational work
              increases faster than the structure around it.
            </p>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              For a while this works.
            </p>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              Then small operational cracks begin to appear.
            </p>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              Below are some of the most common signals that HR operations are starting to become
              messy, reactive, or inconsistent.
            </p>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              Recognising these signals early makes it far easier to stabilise HR operations before
              they become a significant organisational constraint.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/diagnostic"
                className="rounded-xl bg-[#1E6FD9] px-6 py-3 text-base font-medium text-white transition hover:bg-[#2979FF]"
              >
                Take the HR Operations Health Check
              </Link>
              <Link
                href="/services/hr-foundations-sprint"
                className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium transition hover:bg-white/10"
              >
                View the Sprint
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="space-y-8">
          {signals.map((signal) => (
            <div
              key={signal.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
                {signal.title}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                {signal.heading}
              </h2>

              <div className="mt-4 space-y-4 text-lg leading-8 text-slate-700">
                {signal.text.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {signal.bullets && (
                  <ul className="space-y-2 pl-5">
                    {signal.bullets.map((bullet) => (
                      <li key={bullet} className="list-disc">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}

                {signal.closing && <p>{signal.closing}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
                What these signals usually mean
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Growth has outpaced the operational infrastructure around HR.
              </h2>
              <p className="mt-4 text-xl leading-9 text-slate-700">
                These signals rarely indicate a failing HR team.
              </p>
              <p className="mt-4 text-xl leading-9 text-slate-700">
                More often, they show that the organisation has simply grown faster than the
                operational infrastructure supporting its people processes.
              </p>
              <p className="mt-4 text-xl leading-9 text-slate-700">
                In other words, HR operations have evolved organically rather than being
                intentionally designed.
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-700">
                If you want a quick sense of how much operational strain may have built up,
                the HR Operations Health Check provides a practical self-assessment before
                moving into deeper support.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/diagnostic"
                  className="rounded-xl bg-[#1E6FD9] px-6 py-3 text-base font-medium text-white transition hover:bg-[#2979FF]"
                >
                  Take the Diagnostic
                </Link>
                <Link
                  href="/contact"
                  className="rounded-xl border border-slate-300 px-6 py-3 text-base font-medium text-slate-800 transition hover:bg-slate-50"
                >
                  Contact
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
                A practical next step
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Use the diagnostic to gauge the level of operational friction.
              </h3>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                The HR Operations Health Check gives you:
              </p>
              <ul className="mt-4 space-y-2 text-lg leading-8 text-slate-700">
                <li className="list-disc ml-5">A simple HR Operations Score</li>
                <li className="list-disc ml-5">An immediate maturity-style result band</li>
                <li className="list-disc ml-5">A quick sense of where friction may be building</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
              A practical way to reset HR foundations
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              HR Foundations Sprint
            </h2>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              The HR Foundations Sprint is a focused 4 week engagement designed for
              organisations that are starting to experience these signals.
            </p>

            <p className="mt-6 text-lg font-medium text-slate-900">During the sprint we:</p>
            <ul className="mt-4 space-y-2 text-lg leading-8 text-slate-700">
              <li className="list-disc ml-5">Understand how HR currently operates</li>
              <li className="list-disc ml-5">Map key employee lifecycle processes</li>
              <li className="list-disc ml-5">Identify operational friction and gaps</li>
              <li className="list-disc ml-5">Prioritise improvements</li>
              <li className="list-disc ml-5">
                Deliver practical recommendations and a clear roadmap
              </li>
            </ul>

            <p className="mt-6 text-xl leading-9 text-slate-700">
              The goal is simple: to establish the operational structure that allows HR to support
              the organisation consistently and effectively as it grows.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/services/hr-foundations-sprint"
                className="rounded-xl bg-[#1E6FD9] px-6 py-3 text-base font-medium text-white transition hover:bg-[#2979FF]"
              >
                View the Sprint
              </Link>
              <Link
                href="/diagnostic"
                className="rounded-xl border border-slate-300 px-6 py-3 text-base font-medium text-slate-800 transition hover:bg-white"
              >
                Take the Diagnostic First
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E6FD9]">
              When organisations typically use the sprint
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              A structured starting point for growing organisations
            </h2>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              The sprint is particularly useful for organisations that:
            </p>

            <div className="mt-8 space-y-3 text-base text-slate-700">
              {sprintFit.map((item) => (
                <div key={item} className="rounded-lg bg-slate-50 px-4 py-3">
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-8 text-xl leading-9 text-slate-700">
              Some organisations use the sprint to create clarity and implement improvements
              internally.
            </p>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              Others continue into deeper operational transformation work.
            </p>
            <p className="mt-4 text-xl leading-9 text-slate-700">
              Either way, the sprint provides a clear and credible starting point for strengthening
              HR operations.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0D1F3C] py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8AAAC8]">
              Start with the right level of clarity
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              If some of these signals feel familiar, the next step is straightforward.
            </h2>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-[#8AAAC8]">
              You can take the HR Operations Health Check for an immediate self-assessment,
              or start with a short conversation to discuss whether the sprint would be useful
              for your organisation.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/diagnostic"
                className="rounded-xl bg-[#1E6FD9] px-6 py-3 text-base font-medium text-white transition hover:bg-[#2979FF]"
              >
                Take the Diagnostic
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium transition hover:bg-white/10"
              >
                Contact
              </Link>
              <Link
                href="/services/hr-foundations-sprint"
                className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium transition hover:bg-white/10"
              >
                View the Sprint
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}