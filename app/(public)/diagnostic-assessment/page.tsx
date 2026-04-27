import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HR Operations Diagnostic Assessment",
  description:
    "A structured, multi-perspective diagnostic of how HR operates across leadership, managers, and HR.",
};

const contactHref =
  "/contact?topic=HR%20Operations%20Diagnostic%20Assessment";

const recognitionItems = [
  {
    number: "01",
    title: "The Health Check gives a signal, but not enough evidence",
    text: "You can see that something is not running as cleanly as it should, but not where the issue sits or how widely it is experienced across the organisation.",
  },
  {
    number: "02",
    title: "HR, managers, and leadership see different parts of the picture",
    text: "Each group experiences processes, ownership, and support differently. Without bringing those views together, the full pattern remains unclear.",
  },
  {
    number: "03",
    title: "The issue needs to be separated from the noise",
    text: "Variation across teams, systems, and ways of working makes it difficult to tell whether the problem is isolated or part of a broader operating pattern.",
  },
];

const participantGroups = [
  {
    title: "HR",
    text: "Shows how processes, ownership, and service delivery work day to day, including where things run smoothly and where workarounds are carrying too much.",
  },
  {
    title: "Managers",
    text: "Shows how HR processes are experienced in practice, where guidance is clear, where support is easy to access, and where delivery becomes harder to manage.",
  },
  {
    title: "Leadership",
    text: "Shows whether HR operations are supporting execution effectively, where alignment is strong, and where greater clarity or consistency would strengthen performance.",
  },
];

const outputAreas = [
  {
    title: "Cross-role comparison",
    text: "You can see how HR, managers, and leadership experience the same processes, and where those experiences begin to diverge.",
  },
  {
    title: "Clear priorities",
    text: "The assessment highlights where attention is most likely to improve consistency, service delivery, and day-to-day execution.",
  },
  {
    title: "Decision-ready output",
    text: "You receive a structured report with scored insight, narrative interpretation, and clear guidance on where to focus next.",
  },
];

function RecognitionItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[4.25rem_1fr] gap-5 border-t border-slate-200 py-10 lg:grid-cols-[5.5rem_minmax(0,1fr)] lg:gap-8 lg:py-12">
      <div className="pt-1">
        <p className="text-[3rem] font-semibold leading-none tracking-[-0.04em] text-slate-300 lg:text-[4.5rem]">
          {number}
        </p>
      </div>

      <div className="max-w-2xl">
        <h3 className="text-[1.35rem] font-semibold leading-[1.2] text-slate-950 lg:text-[1.55rem]">
          {title}
        </h3>

        <p className="mt-3 text-base leading-8 text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function OutcomeStatement({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="border-t border-white/12 pt-6 lg:pt-8">
      <h3 className="text-[1.25rem] font-semibold leading-[1.2] text-white lg:text-[1.45rem]">
        {title}
      </h3>

      <p className="mt-3 max-w-md text-[0.98rem] leading-7 text-white/70">
        {text}
      </p>
    </div>
  );
}

export default function DiagnosticAssessmentPage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">HR Operations Diagnostic Assessment</p>

              <h1 className="brand-heading-xl">
                A structured diagnostic of how HR operates across the organisation.
              </h1>
            </div>

            <p className="brand-subheading brand-body-on-dark max-w-3xl">
              The Health Check gives an initial signal. The Diagnostic Assessment builds a clearer view of how HR is operating across the organisation.
            </p>

            <p className="max-w-3xl text-base leading-8 text-[#C7D8EA]">
              It brings together structured input from HR, managers, and leadership to show where delivery is consistent, where it starts to vary, and where greater clarity or control would make the biggest difference.
            </p>

            <div className="brand-actions">
              <Link
                href="/diagnostic"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Take the Health Check
              </Link>

              <Link
                href={contactHref}
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Start a conversation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION A */}
      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">When this becomes useful</p>

            <h2 className="brand-heading-lg text-slate-950">
              You reach this point when the question is no longer whether there is a signal, but what it means.
            </h2>

            <p className="brand-body-lg">
              The Diagnostic Assessment is used when a quick read is no longer enough. It helps you understand what is driving the pattern, how widely it is experienced, and where it is most important to focus.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="border-b border-slate-200">
              {recognitionItems.map((item) => (
                <RecognitionItem
                  key={item.number}
                  number={item.number}
                  title={item.title}
                  text={item.text}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B */}
      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-kicker">How the assessment works</p>

            <h2 className="max-w-3xl text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.035em] text-white lg:text-[3.45rem]">
              A structured comparison across the roles that experience HR operations differently.
            </h2>

            <p className="max-w-3xl text-[1.05rem] leading-8 text-white/90">
              The assessment is built around how HR operates day to day. It compares how processes, ownership, and service delivery are experienced across roles, rather than relying on a single view.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
              {participantGroups.map((group) => (
                <OutcomeStatement
                  key={group.title}
                  title={group.title}
                  text={group.text}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C */}
      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">What the output gives you</p>

            <h2 className="brand-heading-lg text-slate-950">
              A clearer view of where to focus, and why.
            </h2>

            <p className="brand-body-lg">
              The value is not just in a score. It is in understanding where delivery is working well, where it becomes inconsistent, and where clearer ownership or stronger process discipline would improve how HR operates.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              {outputAreas.map((item) => (
                <div key={item.title} className="brand-rule-col">
                  <h3 className="brand-heading-sm text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-4 brand-body">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INVESTMENT */}
      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Investment</p>

            <h2 className="brand-heading-lg text-slate-950">
              A defined diagnostic with a clear commercial shape.
            </h2>

            <p className="brand-body-lg">
              This is a structured diagnostic step with a clear output. It provides enough depth to move from observation to decision, with a grounded view of what is working, what is not, and what to do next.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-case-split">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Diagnostic Assessment
                </p>

                <p className="mt-3 text-[2.5rem] font-semibold leading-none tracking-[-0.035em] text-slate-950">
                  £3,000 + VAT
                </p>

                <p className="mt-5 brand-body">
                  Fully credited against the HR Foundations Sprint if you proceed.
                </p>
              </div>

              <div>
                <h3 className="brand-heading-sm text-slate-950">
                  What this includes
                </h3>

                <div className="mt-5 brand-stack-sm">
                  <p className="brand-body">
                    Structured input across HR, managers, and leadership, covering how processes, ownership, and service delivery work in practice.
                  </p>

                  <p className="brand-body">
                    Scored insight with narrative interpretation, highlighting where delivery is consistent and where it begins to break down.
                  </p>

                  <p className="brand-body">
                    A client-ready report that supports clear decisions on priorities, sequencing, and next steps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
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
                  Start with the Health Check if you need an initial view, or move straight to a conversation if you are already looking for a more structured diagnostic.
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
                  href={contactHref}
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