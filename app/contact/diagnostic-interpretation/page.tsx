"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SavedDiagnosticState } from "../../../lib/diagnostic";
import { loadDiagnosticState } from "../../../lib/diagnostic-storage";

type AdvisoryNarrative = {
  interpretation: string[];
  implications: string[];
  whatUsuallyHappensNext: string[];
  diagnosticClarifies: string[];
};

function formatLabelList(labels: string[]): string {
  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function getDimensionTheme(label: string): string {
  switch (label) {
    case "Process clarity":
      return "core HR processes may not yet be clear enough to support consistent execution";
    case "Consistency":
      return "similar people issues may be handled differently across teams or managers";
    case "Service access":
      return "routes into HR support may be too mixed or informal";
    case "Ownership":
      return "ownership for decisions, approvals, or escalations may not be explicit enough";
    case "Onboarding":
      return "onboarding may still depend too heavily on local manager practice";
    case "Technology alignment":
      return "systems and workflows may not fully match how work actually happens";
    case "Knowledge and self-service":
      return "people may still rely too heavily on HR for clarification of routine issues";
    case "Operational capacity":
      return "the team may be spending too much time reacting to day-to-day demand";
    case "Data and handoffs":
      return "handoffs and transitions may be creating rework, delay, or correction effort";
    case "Change resilience":
      return "the current operating model may be showing strain under growth or change";
    default:
      return `${label.toLowerCase()} may be contributing to operational friction`;
  }
}

function getBandNarrative(bandLabel: string) {
  switch (bandLabel) {
    case "Operationally Chaotic":
    case "Emerging Foundations":
      return "At this stage, HR operations often rely heavily on individual knowledge, informal workarounds, and manual coordination. Processes may exist in parts, but they are not yet embedded strongly enough to create consistent execution across the organisation.";
    case "Friction Building":
    case "Developing Structure":
      return "At this stage, organisations often have some useful structure in place, but not yet enough consistency to make delivery feel dependable across teams, managers, or workflows. The model is functioning, but still carrying hidden friction.";
    case "Partially Structured":
    case "Structured but Improving":
      return "At this stage, the organisation usually has a reasonably solid operating base, with more targeted weaknesses than broad instability. The opportunity is typically to tighten weaker areas before they create more visible drag.";
    case "Operationally Strong":
    case "Operationally Mature":
      return "At this stage, HR operations appear to have a relatively mature structural base. The main opportunity is usually refinement, optimisation, and reducing hidden friction in more complex or cross-functional areas.";
    default:
      return "This result provides a directional view of how HR operations may currently be functioning in practice, including where friction may be building and where a deeper read may be useful.";
  }
}

function getFrictionNarrative(dimensions: { label: string; score: number }[]) {
  if (!dimensions.length) return [];

  return dimensions.map((d) => {
    switch (d.label) {
      case "Process clarity":
        return "Processes may exist but are not always clearly defined, leading to variation in how work is executed across teams.";
      case "Consistency":
        return "Employees and managers may experience HR processes differently depending on function, team, or location.";
      case "Service access":
        return "It may not always be clear where employees or managers should go for HR support, increasing reliance on informal routes.";
      case "Knowledge and self-service":
        return "Information may be harder to find than it should be, increasing dependence on HR for routine questions or clarification.";
      case "Operational capacity":
        return "The HR team may be operating reactively, with too little space for process improvement or operational strengthening.";
      case "Ownership":
        return "Responsibilities across HR, managers, and escalation routes may not always be clearly defined in practice.";
      case "Onboarding":
        return "Onboarding may still depend too heavily on local manager practice rather than a reliably structured operating model.";
      case "Technology alignment":
        return "Systems and workflows may not yet reflect how work actually happens, creating workaround behaviour or duplicate effort.";
      case "Data and handoffs":
        return "Workflow transitions, handoffs, or data movement may be creating avoidable delay, correction effort, or rework.";
      case "Change resilience":
        return "The current model may be more fragile than it first appears when the organisation grows, restructures, or changes pace.";
      default:
        return `${d.label} may benefit from closer review and stronger operating discipline.`;
    }
  });
}

function buildAdvisoryNarrative(params: {
  bandLabel: string;
  score: number;
  lowestDimensions: Array<{ label: string; score: number }>;
}): AdvisoryNarrative {
  const { bandLabel, score, lowestDimensions } = params;
  const lowestLabels = lowestDimensions
    .slice(0, 3)
    .map((dimension) => dimension.label);
  const joinedLabels = formatLabelList(lowestLabels);
  const weakestTheme = lowestLabels[0] ? getDimensionTheme(lowestLabels[0]) : "";
  const secondTheme = lowestLabels[1] ? getDimensionTheme(lowestLabels[1]) : "";

  let interpretation: string[] = [];
  let implications: string[] = [];
  let whatUsuallyHappensNext: string[] = [];
  let diagnosticClarifies: string[] = [];

  if (
    bandLabel === "Operationally Chaotic" ||
    bandLabel === "Emerging Foundations"
  ) {
    interpretation = [
      `This result suggests that several important HR operational foundations are still forming. The pattern across ${joinedLabels} points to an operating model that may still depend heavily on individual judgement, informal coordination, or manager-led workaround behaviour.`,
      `In practical terms, this usually means ${weakestTheme}. It can also mean ${secondTheme || "other parts of the model are not yet fully embedded"}, which makes execution harder to keep consistent as the organisation grows.`,
      `This does not necessarily mean the HR team is underperforming. More often, it means the operating structure around HR has not yet caught up with the pace or complexity of the business.`,
    ];

    implications = [
      "Managers may handle similar issues differently, creating inconsistent employee experience.",
      "HR may absorb too much coordination work because the model relies more on people than on structure.",
      "Manual workarounds can become normal before the organisation fully notices the operational cost.",
      "Periods of hiring, restructuring, or policy change are likely to expose these gaps more clearly.",
    ];

    whatUsuallyHappensNext = [
      "More exceptions start appearing because the standard route is not clear enough.",
      "Managers rely more heavily on HR for judgement calls that should be easier to handle consistently.",
      "Onboarding, approvals, and day-to-day employee processes begin to feel more uneven.",
      "The organisation often reaches a point where friction becomes visible faster than improvement work can keep up.",
    ];

    diagnosticClarifies = [
      "Whether these issues are being experienced consistently across HR, managers, and leadership.",
      "Which weak areas are structural, and which are more local or role-specific.",
      "Where ownership, service access, and process design are creating the greatest drag.",
      "What should be prioritised first before the organisation adds more complexity.",
    ];
  } else if (
    bandLabel === "Friction Building" ||
    bandLabel === "Developing Structure"
  ) {
    interpretation = [
      `This result suggests that some useful HR foundations are in place, but not yet strongly enough embedded to make delivery feel consistently reliable. The pattern across ${joinedLabels} points to partial structure rather than full operational confidence.`,
      `The current picture usually reflects an organisation that has added process over time, but still has areas where ${weakestTheme}. In practice, that often means HR can feel broadly functional while still carrying hidden inconsistency or avoidable drag.`,
      `The next stage is usually not wholesale redesign. It is clarifying where the existing model is falling short and tightening the parts that matter most.`,
    ];

    implications = [
      "Execution quality may vary more by team or manager than leadership realises.",
      "Some processes may look established on paper but still rely on local interpretation in practice.",
      "HR may remain more reactive than intended because too much demand is still avoidable.",
      "Operational drag can build quietly before it becomes a larger business issue.",
    ];

    whatUsuallyHappensNext = [
      "The organisation sees more visible inconsistency as it scales or changes shape.",
      "Leadership begins to notice that processes exist, but are not landing evenly.",
      "HR teams spend time correcting, clarifying, or re-routing work that should move more cleanly.",
      "Improvement priorities remain unclear because the business can see symptoms, but not root causes.",
    ];

    diagnosticClarifies = [
      "Where the current model is genuinely working and where it is only partially embedded.",
      "How HR, managers, and leadership are experiencing the same processes differently.",
      "Which areas are creating the most operational drag relative to effort.",
      "How to prioritise targeted changes rather than spreading effort too widely.",
    ];
  } else if (
    bandLabel === "Partially Structured" ||
    bandLabel === "Structured but Improving"
  ) {
    interpretation = [
      `This result suggests a reasonably solid HR operating base, with identifiable pressure points rather than broad instability. The pattern across ${joinedLabels} points to areas where a relatively mature model may still be carrying friction, inconsistency, or unnecessary complexity.`,
      `This usually means the foundations are present, but not yet fully optimised. In practice, ${weakestTheme}, and that can reduce confidence in an otherwise capable operating model.`,
      `At this stage, the opportunity is usually not foundational repair. It is smarter prioritisation, tighter operating discipline, and reducing hidden drag before it becomes more visible under growth or change.`,
    ];

    implications = [
      "The organisation may be stronger operationally than it feels in its weakest moments.",
      "Friction may now sit more in handoffs, exceptions, or role-to-role experience than in total process absence.",
      "Leadership may see a generally capable HR function, while managers still experience uneven execution in specific areas.",
      "Targeted improvements could materially improve confidence, resilience, and efficiency.",
    ];

    whatUsuallyHappensNext = [
      "The same small set of weak points continue to absorb disproportionate effort.",
      "The organisation remains broadly functional, but certain workflows continue to frustrate managers or HR.",
      "Growth or change starts to expose where the model is less robust than expected.",
      "The business benefits most when it moves from general improvement intent to focused operational prioritisation.",
    ];

    diagnosticClarifies = [
      "Where the strongest opportunities for optimisation actually sit.",
      "Whether current friction is shared across roles or concentrated in specific parts of the organisation.",
      "Which gaps are meaningful enough to prioritise now, versus later.",
      "What a focused improvement sequence should look like.",
    ];
  } else {
    interpretation = [
      `This result suggests a relatively mature HR operating model overall, with the main opportunity sitting in refinement rather than foundational repair. The pattern across ${joinedLabels} points to specific areas where the model may still be carrying inefficiency, inconsistency, or hidden fragility.`,
      `At this level, the interesting question is rarely whether HR has structure. It is whether that structure is working as cleanly as it could, and whether ${weakestTheme} is constraining scale, confidence, or efficiency more than it should.`,
      `This usually calls for a more focused read on optimisation, cross-functional friction, and the places where a mature model still has avoidable drag.`,
    ];

    implications = [
      "The organisation may already have strong fundamentals, but still be carrying hidden inefficiency.",
      "Weaknesses are more likely to appear in nuanced areas such as handoffs, exception handling, or cross-role alignment.",
      "The cost of friction may be less visible, but still meaningful over time.",
      "A more detailed diagnostic can help distinguish normal variation from genuine improvement opportunity.",
    ];

    whatUsuallyHappensNext = [
      "The business continues to operate capably, but certain friction points remain unresolved.",
      "Growth, restructuring, or systems change begins to expose less obvious fragility.",
      "Operational maturity can plateau if optimisation work is never prioritised.",
      "Leadership often benefits from a clearer view of where refinement would unlock the most value.",
    ];

    diagnosticClarifies = [
      "Which pressure points are worth solving now versus simply monitoring.",
      "Where mature performance is masking hidden complexity or avoidable drag.",
      "How HR, managers, and leadership see the same operating model differently.",
      "Which targeted changes would improve resilience, efficiency, or confidence most materially.",
    ];
  }

  if (score < 35) {
    implications = [
      ...implications,
      "There is a meaningful risk that operational strain is already affecting manager confidence and service consistency.",
    ];
  }

  if (score > 70) {
    diagnosticClarifies = [
      ...diagnosticClarifies,
      "Whether the strongest perceived areas are experienced equally well across the organisation, or only from one viewpoint.",
    ];
  }

  return {
    interpretation,
    implications,
    whatUsuallyHappensNext,
    diagnosticClarifies,
  };
}

export default function DiagnosticInterpretationPage() {
  const [diagnosticState, setDiagnosticState] =
    useState<SavedDiagnosticState | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedState = loadDiagnosticState();
      setDiagnosticState(savedState);
    } catch (error) {
      console.error("Failed to load diagnostic interpretation state:", error);
      setDiagnosticState(null);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  const result = diagnosticState?.result ?? null;
  const lowestDimensions = result?.lowestDimensions ?? [];

  const advisoryNarrative = useMemo(() => {
    if (!result || !lowestDimensions.length) {
      return null;
    }

    return buildAdvisoryNarrative({
      bandLabel: result.band.label,
      score: result.score,
      lowestDimensions,
    });
  }, [result, lowestDimensions]);

  const contactHref = result
    ? `/contact?topic=HR%20Health%20Check%20Interpretation&source=diagnostic-interpretation&score=${result.score}&band=${encodeURIComponent(
        result.band.label,
      )}`
    : "/contact?topic=HR%20Health%20Check%20Interpretation&source=diagnostic-interpretation";

  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Detailed interpretation</p>

              <h1 className="brand-heading-xl">
                Your HR Health Check interpretation
              </h1>

              <p className="brand-subheading brand-body-on-dark max-w-3xl">
                This page provides a more developed interpretation of your
                result, including what the score pattern is likely to mean in
                practice, where friction may be building, and what a deeper
                diagnostic would clarify.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          {!hasLoaded ? (
            <div className="brand-surface-card p-8">
              <p className="text-slate-600">
                Loading your diagnostic interpretation...
              </p>
            </div>
          ) : result && advisoryNarrative ? (
            <div className="brand-stack-md">
              <div className="brand-surface-card p-8">
                <p className="brand-section-kicker">Overall profile</p>
                <h2 className="brand-heading-lg mt-3 text-slate-950">
                  A more developed read on your result
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Score
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {result.score} / 100
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Profile
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {result.band.label}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Lowest areas
                    </p>
                    <p className="mt-2 text-base font-medium leading-7 text-slate-950">
                      {formatLabelList(
                        lowestDimensions.map((dimension) => dimension.label),
                      )}
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-base leading-8 text-slate-700">
                  {getBandNarrative(result.band.label)}
                </p>
              </div>

              <div className="brand-surface-card p-8">
                <p className="brand-section-kicker">Advisory interpretation</p>
                <h2 className="brand-heading-lg mt-3 text-slate-950">
                  What this pattern is likely telling you
                </h2>

                <div className="mt-6 space-y-4 text-base leading-8 text-slate-700">
                  {advisoryNarrative.interpretation.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {lowestDimensions.length > 0 ? (
                <div className="brand-surface-card p-8">
                  <p className="brand-section-kicker">Likely friction points</p>
                  <h2 className="brand-heading-lg mt-3 text-slate-950">
                    Areas most likely to be creating operational drag
                  </h2>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {lowestDimensions.map((dimension) => (
                      <div
                        key={dimension.label}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5"
                      >
                        <p className="text-base font-semibold text-slate-950">
                          {dimension.label}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-600">
                          {dimension.score} / 5
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {getFrictionNarrative([dimension])[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="brand-surface-card p-8">
                  <p className="brand-section-kicker">Likely implications</p>
                  <h2 className="brand-heading-md mt-3 text-slate-950">
                    What this often means in practice
                  </h2>

                  <div className="mt-6 space-y-3">
                    {advisoryNarrative.implications.map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="brand-surface-card p-8">
                  <p className="brand-section-kicker">
                    What usually happens next
                  </p>
                  <h2 className="brand-heading-md mt-3 text-slate-950">
                    How this pattern tends to develop
                  </h2>

                  <div className="mt-6 space-y-3">
                    {advisoryNarrative.whatUsuallyHappensNext.map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="brand-surface-soft rounded-[2rem] p-8">
                <div className="max-w-4xl brand-stack-sm">
                  <p className="brand-section-kicker">Next step</p>
                  <h2 className="brand-heading-lg text-slate-950">
                    Turn this into a focused conversation
                  </h2>

                  <p className="brand-subheading text-slate-700">
                    This interpretation provides a stronger read on what your
                    result is likely to mean in practice. The next step is to
                    discuss where friction may be building, what is most likely
                    driving it, and what should be prioritised first.
                  </p>

                  <p className="brand-body">
                    The enquiry will be linked to your Health Check result so it
                    can be reviewed in context. From there, a short feedback
                    conversation can be arranged to discuss the result and,
                    where useful, whether a deeper diagnostic or focused Sprint
                    would be the right next step.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <Link
                      href={contactHref}
                      className="brand-button-primary px-6 py-3 text-base font-medium"
                    >
                      Discuss Your Results
                    </Link>
                  </div>
                  
                </div>
              </div>

              <div className="brand-surface-soft rounded-[2rem] p-8">
                <div className="max-w-4xl brand-stack-sm">
                  <p className="brand-section-kicker">
                    What the deeper diagnostic would clarify
                  </p>
                  <h2 className="brand-heading-lg text-slate-950">
                    The next step if you need a more complete picture
                  </h2>

                  <p className="brand-subheading text-slate-700">
                    The HR Health Check gives a structured first read. The HR
                    Operations Diagnostic Assessment goes further by testing how
                    the same issues are experienced across HR, managers, and
                    leadership.
                  </p>

                  <div className="grid gap-4 pt-2 sm:grid-cols-2">
                    {advisoryNarrative.diagnosticClarifies.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-5 text-sm leading-7 text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <Link
                      href="/diagnostic-assessment"
                      className="brand-button-dark px-6 py-3 text-base font-medium"
                    >
                      View Diagnostic Assessment
                    </Link>

                    <Link
                      href="/diagnostic"
                      className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                    >
                      Back to Health Check
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="brand-stack-md">
              <div className="brand-surface-card p-8">
                <h2 className="text-lg font-semibold text-slate-900">
                  No saved diagnostic result found
                </h2>

                <p className="mt-3 text-slate-700">
                  You can return to the Health Check and complete it to
                  generate a personalised interpretation.
                </p>
              </div>

              <div className="brand-surface-soft rounded-[2rem] p-8">
                <div className="max-w-3xl brand-stack-sm">
                  <p className="brand-section-kicker">
                    Start with the Health Check
                  </p>
                  <h2 className="brand-heading-lg text-slate-950">
                    Generate your first result
                  </h2>

                  <p className="brand-subheading text-slate-700">
                    The Health Check gives a quick first read on where HR
                    operations may be starting to strain and whether a deeper
                    diagnostic is likely to be worthwhile.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <Link
                      href="/diagnostic"
                      className="brand-button-primary px-6 py-3 text-base font-medium"
                    >
                      Go to Health Check
                    </Link>

                    <Link
                      href="/contact"
                      className="brand-button-dark px-6 py-3 text-base font-medium"
                    >
                      Contact
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}