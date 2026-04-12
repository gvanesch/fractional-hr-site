"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SavedDiagnosticState } from "@/lib/diagnostic";
import { loadDiagnosticState } from "@/lib/diagnostic-storage";

type AdvisoryNarrative = {
  interpretation: string[];
  implications: string[];
  whatUsuallyHappensNext: string[];
  diagnosticClarifies: string[];
};

const HEALTH_CHECK_SUBMISSION_ID_STORAGE_KEY = "health-check-submission-id";

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
      return "core HR processes may benefit from greater clarity to support more consistent execution";
    case "Consistency":
      return "similar people issues may be handled differently across teams or managers";
    case "Service access":
      return "routes into HR support may be more mixed or informal than intended";
    case "Ownership":
      return "ownership for decisions, approvals, or escalations may not always be fully explicit in practice";
    case "Onboarding":
      return "onboarding may still depend too heavily on local manager practice";
    case "Technology alignment":
      return "systems and workflows may not yet fully match how work actually happens";
    case "Knowledge and self-service":
      return "people may still rely more heavily on HR for routine clarification than intended";
    case "Operational capacity":
      return "the team may be spending a high proportion of time responding to day-to-day demand";
    case "Data and handoffs":
      return "handoffs and transitions may be creating avoidable delay or extra effort";
    case "Change resilience":
      return "the current operating model may be under more pressure during growth or change than it first appears";
    default:
      return `${label.toLowerCase()} may be one of the areas shaping current operational experience`;
  }
}

function getBandNarrative(bandLabel: string) {
  switch (bandLabel) {
    case "Operationally Chaotic":
    case "Emerging Foundations":
      return "At this stage, HR operations often still rely heavily on individual knowledge, informal coordination, and manual follow-through. Processes may exist in parts, but they are not yet embedded strongly enough to create dependable delivery across the organisation.";
    case "Friction Building":
    case "Developing Structure":
      return "At this stage, organisations often have useful structure in place, but not yet enough consistency to make delivery feel dependable across teams, managers, or workflows. The model is functioning, but still carrying areas that would benefit from closer attention.";
    case "Partially Structured":
    case "Structured but Improving":
      return "At this stage, the organisation usually has a reasonably solid operating base, with more targeted weaknesses than broad instability. The opportunity is typically to strengthen a smaller number of areas before they create more visible inefficiency or inconsistency.";
    case "Operationally Strong":
    case "Operationally Mature":
      return "At this stage, HR operations appear to have a relatively mature structural base. The main opportunity is usually refinement, optimisation, and reducing hidden complexity in more cross-functional or fast-moving areas.";
    default:
      return "This result provides a directional view of how HR operations may currently be functioning in practice, including where a deeper read may be useful.";
  }
}

function getOperationalNarrative(dimensions: { label: string; score: number }[]) {
  if (!dimensions.length) return [];

  return dimensions.map((d) => {
    switch (d.label) {
      case "Process clarity":
        return "Processes may exist but are not always clear enough to support consistent execution across teams.";
      case "Consistency":
        return "Employees and managers may experience HR processes differently depending on function, team, or location.";
      case "Service access":
        return "It may not always be fully clear where employees or managers should go for HR support, increasing reliance on informal routes.";
      case "Knowledge and self-service":
        return "Information may be harder to find or use than it should be, increasing dependence on HR for routine questions or clarification.";
      case "Operational capacity":
        return "The HR team may be operating with limited headroom, reducing space for process improvement or operational strengthening.";
      case "Ownership":
        return "Responsibilities across HR, managers, and escalation routes may not always be clearly defined in practice.";
      case "Onboarding":
        return "Onboarding may still depend too heavily on local manager practice rather than a reliably structured operating model.";
      case "Technology alignment":
        return "Systems and workflows may not yet reflect how work actually happens, encouraging workaround behaviour or duplicate effort.";
      case "Data and handoffs":
        return "Workflow transitions, handoffs, or data movement may be creating avoidable delay, extra effort, or correction work.";
      case "Change resilience":
        return "The current model may require stronger operating discipline to remain effective through growth, restructuring, or change.";
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

  const lowestLabels = lowestDimensions.slice(0, 3).map((d) => d.label);
  const joinedLabels = formatLabelList(lowestLabels);

  const weakestTheme = lowestLabels[0]
    ? getDimensionTheme(lowestLabels[0])
    : "";

  const secondTheme = lowestLabels[1]
    ? getDimensionTheme(lowestLabels[1])
    : "";

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
      `In practice, this often shows up as ${weakestTheme}. It can also mean ${
        secondTheme || "other parts of the model are not yet fully embedded"
      }, which makes consistent execution harder as the organisation grows.`,
      `This does not usually point to capability gaps within the HR team itself. More often, it reflects that the operating structure around HR has not yet caught up with the pace or complexity of the business.`,
    ];

    implications = [
      "Managers may handle similar issues differently, creating uneven experience.",
      "HR may absorb more coordination work than intended because structure is not yet doing enough of the work.",
      "Manual workarounds can become embedded before the organisation fully recognises the cost.",
      "Growth or change is likely to make these themes more visible.",
    ];

    whatUsuallyHappensNext = [
      "More exceptions appear because standard routes are not yet clear enough.",
      "Managers rely more heavily on HR for judgement calls and clarification.",
      "Operational consistency becomes harder to maintain as complexity increases.",
    ];

    diagnosticClarifies = [
      "Where structure is missing versus where execution varies.",
      "Which areas are creating the most inconsistency across roles.",
      "What should be stabilised first before adding further complexity.",
    ];
  } else if (
    bandLabel === "Friction Building" ||
    bandLabel === "Developing Structure"
  ) {
    interpretation = [
      `This result suggests that useful HR foundations are in place, but not yet consistently embedded. The pattern across ${joinedLabels} points to a model that is functioning, but still carrying avoidable inefficiency or unevenness.`,
      `In practice, this often reflects a situation where ${weakestTheme}. The organisation may feel broadly operational, but with variable experience depending on team, manager, or workflow.`,
      `The opportunity at this stage is not to redesign everything. It is to strengthen consistency, clarify ownership, and improve the areas that matter most.`,
    ];

    implications = [
      "Execution quality may vary more than leadership expects.",
      "Some processes may exist but are not consistently followed in practice.",
      "HR may still be more reactive than intended.",
      "Operational inefficiency can build quietly before becoming more visible.",
    ];

    whatUsuallyHappensNext = [
      "Inconsistency becomes more noticeable as the organisation grows.",
      "HR spends time correcting or clarifying rather than improving.",
      "The same issues recur without clear prioritisation.",
    ];

    diagnosticClarifies = [
      "Where structure exists but is not fully embedded.",
      "How experience differs across HR, managers, and leadership.",
      "Which areas will unlock the most value if improved first.",
    ];
  } else if (
    bandLabel === "Partially Structured" ||
    bandLabel === "Structured but Improving"
  ) {
    interpretation = [
      `This result suggests a solid HR operating base overall, with targeted areas for refinement rather than fundamental gaps. The pattern across ${joinedLabels} points to specific pressure points rather than broad structural weakness.`,
      `In practice, this typically means the core model is working, but ${weakestTheme}. These are the kinds of issues that do not prevent delivery, but can reduce efficiency, consistency, or confidence over time.`,
      `At this stage, the opportunity is to sharpen what already exists. Focused improvements in a small number of areas can have a disproportionate impact on overall performance.`,
    ];

    implications = [
      "The organisation is likely more capable than it sometimes feels.",
      "Inefficiency may sit in specific workflows rather than across the whole model.",
      "Small improvements can materially improve consistency and confidence.",
      "The biggest risk is not weakness, but leaving known issues unaddressed for too long.",
    ];

    whatUsuallyHappensNext = [
      "The same few areas continue to absorb disproportionate effort.",
      "The model works, but certain workflows remain harder than they need to be.",
      "Growth or change exposes where refinement is still needed.",
    ];

    diagnosticClarifies = [
      "Which areas are worth prioritising now versus later.",
      "Where the issue is structural versus situational.",
      "How to sequence targeted improvements effectively.",
    ];
  } else {
    interpretation = [
      `This result suggests a well-developed HR operating model overall. The pattern across ${joinedLabels} points to areas of refinement rather than structural weakness.`,
      `At this level, the question is not whether HR operations are working, but how efficiently and consistently they are working. Even in strong models, ${weakestTheme} can create subtle complexity that becomes more visible over time.`,
      `The opportunity is to optimise, not rebuild. Targeted improvements in specific areas can further strengthen scalability, resilience, and overall confidence in the model.`,
    ];

    implications = [
      "The organisation likely has strong operational foundations in place.",
      "Remaining inefficiency is likely more subtle and localised.",
      "Improvements at this stage tend to be targeted and high-impact.",
      "The focus shifts from building structure to refining performance.",
    ];

    whatUsuallyHappensNext = [
      "The organisation continues to perform well, but certain inefficiencies persist.",
      "Growth or change highlights areas where optimisation would help.",
      "Operational maturity can plateau without focused refinement.",
    ];

    diagnosticClarifies = [
      "Where optimisation will deliver the most value.",
      "Which areas are already strong versus simply perceived as strong.",
      "How to refine the model without overcomplicating it.",
    ];
  }

  if (score < 35) {
    implications = [
      ...implications,
      "There is a meaningful chance that current operating pressure is already affecting delivery quality and manager experience.",
    ];
  }

  if (score > 70) {
    interpretation.push(
      "Overall, this is a strong position. The focus now is on maintaining quality while refining specific areas that will support continued scale and consistency.",
    );
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
  const [healthCheckSubmissionId, setHealthCheckSubmissionId] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedState = loadDiagnosticState();
      setDiagnosticState(savedState);

      const storedSubmissionId =
        window.localStorage.getItem(HEALTH_CHECK_SUBMISSION_ID_STORAGE_KEY) ?? "";
      setHealthCheckSubmissionId(storedSubmissionId);
    } catch (error) {
      console.error("Failed to load diagnostic interpretation state:", error);
      setDiagnosticState(null);
      setHealthCheckSubmissionId("");
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

  const contactHref = useMemo(() => {
    const params = new URLSearchParams();

    params.set("topic", "HR Health Check Interpretation");
    params.set("source", "diagnostic-interpretation");

    if (result) {
      params.set("score", String(result.score));
      params.set("band", result.band.label);
    }

    if (healthCheckSubmissionId) {
      params.set("submissionId", healthCheckSubmissionId);
    }

    return `/contact?${params.toString()}`;
  }, [result, healthCheckSubmissionId]);

  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Health Check interpretation</p>

              <h1 className="brand-heading-xl">
                Your HR Health Check interpretation
              </h1>

              <p className="brand-subheading brand-body-on-dark max-w-3xl">
                This page provides a more developed interpretation of your
                result, including what the score pattern is likely to mean in
                practice, where greater attention may be useful, and what a
                deeper diagnostic would clarify.
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
                Loading your Health Check interpretation...
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
                      Areas to watch
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
                  <p className="brand-section-kicker">Areas for closer attention</p>
                  <h2 className="brand-heading-lg mt-3 text-slate-950">
                    Where the current operating model may benefit most from focus
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
                          {getOperationalNarrative([dimension])[0]}
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
                    How this pattern tends to develop over time
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
                    discuss where greater attention may be useful, what is most
                    likely driving the pattern, and what should be prioritised
                    first.
                  </p>

                  <p className="brand-body">
                    The enquiry will be linked to your Health Check result so it
                    can be reviewed in context. From there, a short conversation
                    can be arranged to discuss the result and, where useful,
                    whether a deeper Diagnostic Assessment or a focused Sprint
                    would be the right next step.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <Link
                      href={contactHref}
                      className="brand-button-primary px-6 py-3 text-base font-medium"
                    >
                      Discuss your result
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
                  No saved Health Check result found
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
                    The Health Check gives a quick first read on how HR
                    operations appear to be functioning today and whether a
                    deeper diagnostic is likely to be worthwhile.
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