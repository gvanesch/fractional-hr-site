"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SavedDiagnosticState } from "../../../lib/diagnostic";
import { loadDiagnosticState } from "../../../lib/diagnostic-storage";

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
            Book a free 20-minute diagnostic interpretation
          </h1>

          <p className="mb-6 text-lg text-slate-700">
            Thank you for completing the HR Operations Health Check. This short
            conversation is designed to help interpret your result, highlight
            potential sources of operational friction, and discuss practical
            next steps for strengthening HR operations.
          </p>

          {result ? (
            <div className="mb-8 rounded-xl bg-slate-50 p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Your current result
              </h2>

              <div className="space-y-3 text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">
                    HR Operations Maturity Score:
                  </span>{" "}
                  {result.score} / 100
                </p>

                <p>
                  <span className="font-semibold text-slate-900">Profile:</span>{" "}
                  {result.band.label}
                </p>

                <p>{result.band.summary}</p>
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-xl bg-amber-50 p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                No saved diagnostic result found
              </h2>

              <p className="text-slate-700">
                It looks like there is no saved diagnostic result available in this
                browser session right now. You can return to the diagnostic and complete
                it again if needed.
              </p>
            </div>
          )}

          <div className="mb-8 rounded-xl bg-slate-50 p-5">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              What this conversation is for
            </h2>

            <ul className="space-y-2 text-slate-700">
              <li>• Clarify what your score may indicate in practice</li>
              <li>• Explore the themes behind your lowest-scoring areas</li>
              <li>• Identify practical next steps for strengthening HR operations</li>
              <li>• Decide whether any further support would be useful</li>
            </ul>

            <p className="mt-4 text-sm text-slate-600">
              This is a free conversation with no obligation to proceed beyond it.
            </p>
          </div>

          {lowestDimensions.length > 0 && (
            <div className="mb-8 rounded-xl border border-slate-200 p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Lowest-scoring areas
              </h2>

              <p className="mb-4 text-slate-700">
                These are likely to be the most useful themes to explore in a short
                interpretation conversation.
              </p>

              <div className="space-y-2">
                {lowestDimensions.map((dimension) => (
                  <div
                    key={dimension.label}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-slate-700"
                  >
                    <span>{dimension.label}</span>
                    <span className="font-medium">{dimension.score} / 5</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8 rounded-xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Continue your enquiry
            </h2>

            <p className="mb-4 text-slate-700">
              Continue to the enquiry form and we will arrange a short call to
              walk through your diagnostic results and discuss possible next steps.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact?topic=health-check&source=diagnostic"
                className="inline-block rounded-lg bg-[#1E6FD9] px-6 py-3 text-white"
              >
                Continue to enquiry form
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