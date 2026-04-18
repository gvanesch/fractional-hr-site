import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HR Chaos Signals | Van Esch Advisory Ltd",
  description:
    "Common signs that HR operations are becoming messy, reactive, or inconsistent in growing companies, and how to move from early signal to clearer diagnosis.",
};

const signals = [
  {
    number: "01",
    title: "Managers handle similar HR situations differently",
    text: "Two managers deal with the same situation and approach it in completely different ways. That usually means the underlying process is unclear, lightly held, or never properly embedded.",
  },
  {
    number: "02",
    title: "Employees are not sure where to go for support",
    text: "Requests arrive through different channels, different people, and different workarounds. Without a clear service model, HR work becomes harder to track, prioritise, and handle consistently.",
  },
  {
    number: "03",
    title: "HR spends more time coordinating than improving",
    text: "Too much energy goes into chasing approvals, clarifying responsibilities, or manually coordinating routine activity. The team stays busy, but its capacity to improve how HR runs becomes increasingly constrained.",
  },
  {
    number: "04",
    title: "Onboarding experiences vary between teams",
    text: "Some employees receive a structured start and others receive very little. When onboarding depends more on the manager than on a clear organisational process, inconsistency becomes much more visible as the business grows.",
  },
  {
    number: "05",
    title: "Systems exist, but the model still relies on workarounds",
    text: "The platform is there, but spreadsheets, email coordination, and manual fixes still carry too much of the work. That usually means the surrounding operating structure has never been designed cleanly enough for the technology to deliver properly.",
  },
  {
    number: "06",
    title: "HR answers the same questions repeatedly",
    text: "Policies and guidance may exist somewhere, but people still come directly to HR for clarification. When HR becomes the organisation’s memory rather than the facilitator of knowledge, operational pressure rises quickly.",
  },
  {
    number: "07",
    title: "Growth moments expose underlying weakness",
    text: "Rapid hiring, restructuring, new locations, or investor pressure often reveal what the day-to-day model has been masking. What worked informally at one stage starts to break when the organisation asks more of it.",
  },
];

export default function HRChaosSignalsPage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">HR Chaos Signals</p>

              <h1 className="brand-heading-xl">
                Seven signs HR operations are starting to strain.
              </h1>
            </div>

            <p className="brand-subheading brand-body-on-dark max-w-4xl">
              HR rarely becomes messy all at once. The pattern usually appears
              gradually through inconsistent decisions, unclear ownership,
              manual workarounds, and more time spent coordinating than
              improving.
            </p>

            <p className="max-w-4xl text-base leading-8 text-[#C7D8EA]">
              These signals are often the first indication that growth has
              outpaced the operational structure around HR.
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

      {/* SIGNALS */}
      <section className="bg-white">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">What this often looks like</p>

            <h2 className="brand-heading-lg text-slate-950">
              You usually recognise the pattern before you formally diagnose it.
            </h2>

            <p className="brand-body-lg">
              These signs rarely appear in isolation. Once several start showing
              up together, the issue is usually no longer effort. It is that the
              operating model around HR is no longer holding cleanly.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-ruled-list">
              {signals.map((signal) => (
                <div key={signal.number} className="brand-ruled-item">
                  <p className="brand-ruled-item-num">{signal.number}</p>

                  <div>
                    <h3 className="brand-ruled-item-title">{signal.title}</h3>
                    <p className="brand-ruled-item-body">{signal.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT THIS USUALLY MEANS */}
      <section className="brand-dark-section-plain">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-kicker">What this usually means</p>

            <h2 className="brand-heading-lg">
              From early signals to structured improvement.
            </h2>

            <p className="brand-subheading brand-body-on-dark">
              These signals rarely exist in isolation. Once they begin to
              cluster, the issue is usually not effort, it is that the
              operating model around HR is no longer holding cleanly as the
              organisation grows.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns-dark">
              {[
                {
                  number: "01",
                  title: "Early signal",
                  text: "Inconsistency, rework, and manual coordination begin to show up across onboarding, employee support, and day-to-day HR activity.",
                },
                {
                  number: "02",
                  title: "Underlying issue",
                  text: "HR operations have evolved organically rather than being deliberately designed. Ownership, workflow, and service delivery no longer operate consistently.",
                },
                {
                  number: "03",
                  title: "Next step",
                  text: "Clarity is needed before action. A structured diagnostic view shows where friction is rooted and what should be prioritised first.",
                },
              ].map((item) => (
                <div key={item.number} className="brand-rule-col-dark">
                  <p className="text-[3rem] font-semibold leading-none tracking-[-0.04em] text-white/14">
                    {item.number}
                  </p>

                  <h3 className="mt-5 text-[1.25rem] font-semibold leading-[1.15] text-white">
                    {item.title}
                  </h3>

                  <p className="mt-4 max-w-sm text-[1rem] leading-8 text-[#d6e2f0]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
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
                  Start with the Health Check for an immediate view, or start a
                  conversation if the pattern is already clear.
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