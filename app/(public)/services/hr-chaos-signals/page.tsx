import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HR Chaos Signals | Van Esch Advisory Ltd",
  description:
    "Common signs that HR operations are becoming messy, reactive, or inconsistent in growing companies, and how the HR Health Check, HR Operations Diagnostic Assessment, or HR Foundations Sprint can help restore clarity.",
};

const signals = [
  {
    title: "Signal 1",
    heading: "Managers handle HR situations differently",
    text: [
      "Two managers deal with the same situation, performance concerns, employee requests, onboarding decisions, and approach it in completely different ways.",
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

const nextStepOptions = [
  {
    kicker: "Quick signal",
    title: "HR Health Check",
    text: "A short self-assessment to identify whether operational strain may be building and whether the issue appears isolated or more systemic.",
    href: "/diagnostic",
    cta: "Take the Health Check",
  },
  {
    kicker: "Structured diagnostic",
    title: "HR Operations Diagnostic Assessment",
    text: "A deeper, multi-perspective diagnostic across HR, managers, and leadership to show where friction is rooted and what should be prioritised first.",
    href: "/diagnostic-assessment",
    cta: "Explore the Diagnostic Assessment",
  },
  {
    kicker: "Focused action",
    title: "HR Foundations Sprint",
    text: "A four-week engagement for organisations where the pattern is already clear and structured action is needed to improve the highest-impact gaps.",
    href: "/services/hr-foundations-sprint",
    cta: "View the Sprint",
  },
];

export default function HRChaosSignalsPage() {
  return (
    <main>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">HR Chaos Signals</p>
              <h1 className="brand-heading-lg">
                Seven signs HR operations are starting to strain
              </h1>
            </div>

            <div className="max-w-3xl brand-stack-sm">
              <p className="brand-subheading brand-body-on-dark">
                HR rarely becomes messy all at once.
              </p>
              <p className="brand-subheading brand-body-on-dark">
                The usual pattern is gradual: inconsistent decisions, unclear
                ownership, manual workarounds, and more time spent coordinating
                than improving.
              </p>
              <p className="brand-subheading brand-body-on-dark">
                These signals are often the first indication that growth has
                outpaced the operational structure around HR.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/diagnostic"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Take the HR Health Check
              </Link>
              <Link
                href="/diagnostic-assessment"
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                View the Diagnostic Assessment
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="space-y-8">
            {signals.map((signal) => (
              <div key={signal.title} className="brand-surface-card p-8">
                <p className="brand-section-kicker">{signal.title}</p>
                <h2 className="brand-heading-md mt-3 text-slate-950">
                  {signal.heading}
                </h2>

                <div className="mt-4 space-y-4 text-lg leading-8 text-slate-700">
                  {signal.text.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {signal.bullets ? (
                    <ul className="space-y-2 pl-5">
                      {signal.bullets.map((bullet) => (
                        <li key={bullet} className="list-disc">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {signal.closing ? <p>{signal.closing}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="brand-stack-sm">
            <p className="brand-section-kicker">
              What these signals usually mean
            </p>
            <h2 className="brand-heading-lg text-slate-950">
              Growth has outpaced HR operational structure.
            </h2>
            <p className="brand-subheading text-slate-700">
              These signals rarely indicate a failing HR team.
            </p>
            <p className="brand-body">
              More often, they show that the organisation has grown faster than
              the operational structure supporting its people processes. This is
              when inconsistency, rework, and day-to-day friction start to
              become normal.
            </p>
            <p className="brand-body">
              In practical terms, HR operations have evolved organically rather
              than been designed deliberately.
            </p>
          </div>

          <div className="mt-12 brand-stack-sm">
            <p className="brand-section-kicker">Choose the right next step</p>
            <h2 className="brand-heading-lg text-slate-950">
              Move from signal to clarity, then into action if needed.
            </h2>
            <p className="brand-subheading text-slate-700">
              The right next step depends on how much clarity you already have.
              Some organisations need a quick read. Others need a deeper
              diagnostic before deciding what should happen next. Where the
              pattern is already clear, the priority is structured action.
            </p>
            <p className="brand-body">
              For organisations that need more than a quick signal, the HR
              Operations Diagnostic Assessment provides structured insight across
              leadership, managers, and HR to show where these issues are
              rooted.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {nextStepOptions.map((option) => (
              <div
                key={option.title}
                className="brand-surface-card flex h-full flex-col p-8"
              >
                <div className="flex-1 brand-stack-sm">
                  <p className="brand-section-kicker">{option.kicker}</p>
                  <h3 className="brand-heading-md text-slate-950">
                    {option.title}
                  </h3>
                  <p className="brand-body">{option.text}</p>
                </div>

                <div className="pt-6">
                  <Link
                    href={option.href}
                    className="brand-button-dark px-5 py-3 text-base font-medium"
                  >
                    {option.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-6 py-5">
            <p className="text-sm leading-7 text-slate-700">
              Some organisations start with the Health Check. Others move
              directly into the Diagnostic Assessment when the pattern is
              already clear. The Sprint is the right next step where structured
              action is needed.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">
                  Start with the right level of clarity
                </p>
                <h2 className="brand-heading-lg">
                  If some of these signals feel familiar, the next step is
                  straightforward.
                </h2>
                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  You can start with the HR Health Check for an immediate
                  self-assessment, move into the Diagnostic Assessment for a
                  deeper view, or start with a short conversation if you already
                  know that structured improvement support is likely to be
                  needed.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/diagnostic"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Take the Health Check
                </Link>
                <Link
                  href="/diagnostic-assessment"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  View the Diagnostic Assessment
                </Link>
                <Link
                  href="/contact"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}