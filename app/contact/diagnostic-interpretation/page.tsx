"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SavedDiagnosticState } from "../../../lib/diagnostic";
import { loadDiagnosticState } from "../../../lib/diagnostic-storage";

function getBandNarrative(bandLabel: string) {
  switch (bandLabel) {
    case "Developing":
      return "At this stage, HR operations often rely heavily on individual knowledge and manual coordination. Processes may exist, but are not always consistently applied, which can create variability in employee and manager experience.";
    case "Emerging":
      return "HR operations are generally functioning well, with a reasonable level of structure in place. As the organisation grows, some processes may begin to show strain, particularly where consistency, ownership, or system support are not yet fully embedded.";
    case "Advanced":
      return "HR operations have a strong structural foundation. The focus typically shifts toward optimisation, scalability, and reducing friction in more complex or cross-functional processes.";
    default:
      return "";
  }
}

function getFrictionNarrative(dimensions: { label: string; score: number }[]) {
  if (!dimensions.length) return [];

  return dimensions.map((d) => {
    switch (d.label) {
      case "Process clarity":
        return "Processes may exist but are not always clearly defined, leading to variation in how tasks are executed across teams.";
      case "Consistency":
        return "Employees and managers may experience HR processes differently depending on team or location.";
      case "Service access":
        return "It may not always be clear where employees or managers should go for HR support.";
      case "Knowledge and self-service":
        return "Information may be difficult to find, increasing reliance on HR for routine queries.";
      case "Operational capacity":
        return "The HR team may be operating reactively, with limited capacity for improvement work.";
      case "Case management":
        return "Requests may be handled through informal channels rather than structured workflows.";
      case "Systems enablement":
        return "Systems may not fully support workflows, resulting in manual workarounds.";
      case "Ownership":
        return "Responsibilities across HR and managers may not always be clearly defined.";
      case "Scalability":
        return "The current model may begin to show strain as the organisation grows.";
      case "Continuous improvement":
        return "Opportunities for review and improvement may not yet be systematically built into operations.";
      default:
        return `${d.label} may benefit from further review and refinement.`;
    }
  });
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

  if (!hasLoaded) {
    return (
      <main className="bg-[#F4F6FA] py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-[1.5rem] bg-white p-8 shadow-sm">
            <p className="text-slate-600">Loading your diagnostic interpretation...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F4F6FA] py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="rounded-[1.5rem] bg-white p-8 shadow-sm">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#1E6FD9]">
            Diagnostic interpretation
          </p>

          <h1 className="mb-4 text-4xl font-bold text-[#0A1628]">
            Your HR Operations diagnostic summary
          </h1>

          <p className="mb-6 text-lg text-slate-700">
            This summary provides a structured interpretation of your diagnostic result,
            highlighting potential sources of operational friction and areas that may
            benefit from further attention.
          </p>

          {result ? (
            <>
              <div className="mb-8 rounded-xl bg-slate-50 p-5">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">
                  Overall profile
                </h2>

                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">
                    HR Operations Maturity Score:
                  </span>{" "}
                  {result.score} / 100
                </p>

                <p className="mt-1 text-slate-700">
                  <span className="font-semibold text-slate-900">Profile:</span>{" "}
                  {result.band.label}
                </p>

                <p className="mt-3 text-slate-700">
                  {getBandNarrative(result.band.label)}
                </p>
              </div>

              <div className="mb-8 rounded-xl border border-slate-200 p-5">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">
                  How this typically shows up
                </h2>

                <p className="text-slate-700">
                  Organisations with a similar profile often experience a mix of
                  structured processes and areas where execution relies more heavily on
                  individual judgement. As scale increases, this can begin to create
                  operational friction, particularly across teams or locations.
                </p>
              </div>

              {lowestDimensions.length > 0 && (
                <div className="mb-8 rounded-xl border border-slate-200 p-5">
                  <h2 className="mb-3 text-lg font-semibold text-slate-900">
                    Areas likely to be creating friction
                  </h2>

                  <div className="space-y-4">
                    {lowestDimensions.map((d) => (
                      <div key={d.label}>
                        <p className="font-medium text-slate-900">
                          {d.label} ({d.score} / 5)
                        </p>
                        <p className="text-sm text-slate-700">
                          {getFrictionNarrative([d])[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8 rounded-xl bg-slate-50 p-5">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">
                  Potential focus areas
                </h2>

                <p className="text-slate-700">
                  At this stage, organisations typically benefit from focusing on
                  strengthening process clarity, improving consistency of execution,
                  and reducing reliance on manual workarounds.
                </p>

                <p className="mt-3 text-sm text-slate-600">
                  The most effective next steps will depend on how these areas interact
                  within your broader HR operating model.
                </p>
              </div>
            </>
          ) : (
            <div className="mb-8 rounded-xl bg-amber-50 p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                No saved diagnostic result found
              </h2>

              <p className="text-slate-700">
                You can return to the diagnostic and complete it to generate a
                personalised summary.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Discuss your result
            </h2>

            <p className="mb-4 text-slate-700">
              If helpful, we can walk through your diagnostic result together and
              explore what it may mean in the context of your organisation.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact?topic=health-check&source=diagnostic"
                className="inline-block rounded-lg bg-[#1E6FD9] px-6 py-3 text-white"
              >
                Book a 20-minute interpretation
              </Link>

              <Link
                href="/diagnostic"
                className="inline-block rounded-lg border border-slate-300 px-6 py-3 text-slate-800"
              >
                Back to diagnostic
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}