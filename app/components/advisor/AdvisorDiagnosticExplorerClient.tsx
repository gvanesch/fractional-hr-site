"use client";

import Link from "next/link";
import type { ProjectSummaryResponse } from "@/lib/client-diagnostic/build-project-summary";

type AdvisorDiagnosticExplorerClientProps = {
  summary: ProjectSummaryResponse;
};

export default function AdvisorDiagnosticExplorerClient({
  summary,
}: AdvisorDiagnosticExplorerClientProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="brand-container py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Advisor diagnostic explorer
              </p>

              <h1 className="mt-2 text-2xl font-semibold text-white">
                {summary.project.companyName}
              </h1>

              <p className="mt-2 text-sm text-slate-300">
                Full-fidelity diagnostic analysis workspace
              </p>
            </div>

            <Link
              href={`/advisor/report/${summary.project.projectId}`}
              className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-white transition hover:border-slate-400 hover:bg-slate-900"
            >
              Back to report workspace
            </Link>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-300/50 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
            <p className="font-semibold">
              Advisor confidential. Sensitive evidence may be visible.
            </p>
            <p className="mt-1">
              This workspace may expose exact scores, respondent counts, small
              cohorts, and other evidence that is not permitted for client
              reporting. Advisor visibility does not imply client
              shareability.
            </p>
          </div>
        </div>
      </section>

      <div className="brand-container py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Analysis filters
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Filters will update all analytical widgets in the workspace.
              </p>
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold text-slate-900">
                View by
              </label>

              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="radio" name="viewBy" defaultChecked disabled />
                  Overall
                </label>

                {summary.segmentation.availableKeys.map((dimension) => (
                  <label
                    key={dimension.key}
                    className="flex items-center gap-3 text-sm text-slate-700"
                  >
                    <input type="radio" name="viewBy" disabled />
                    {formatLabel(dimension.key)}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold text-slate-900">
                Respondent perspective
              </p>

              <div className="mt-3 space-y-2">
                <FilterPlaceholder label="HR" />
                <FilterPlaceholder label="Managers" />
                <FilterPlaceholder label="Leadership" />
              </div>
            </div>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <p className="text-xs leading-5 text-slate-500">
                Client reporting threshold for this project:{" "}
                <strong className="font-semibold text-slate-700">
                  n={summary.reportingPolicy.segmentReportingMinN}
                </strong>
              </p>
            </div>
          </aside>

          <section className="min-w-0 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Current analysis context
                  </p>
                  <p className="mt-2 font-medium text-slate-900">
                    Overall diagnostic · All respondent groups · All dimensions
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <StatusPill>
                    {summary.completion.completed} completed
                  </StatusPill>
                  <StatusPill>
                    {summary.segmentation.availableKeys.length} segmentation
                    dimensions
                  </StatusPill>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <ExplorerPlaceholder
                title="Diagnostic overview"
                description="Overall dimension profile and diagnostic health indicators."
                featured
              />
              <ExplorerPlaceholder
                title="Respondent perspectives"
                description="HR, Manager and Leadership comparison across the selected evidence."
              />
              <ExplorerPlaceholder
                title="Segment comparison"
                description="Comparison across project-defined segmentation values."
              />
              <ExplorerPlaceholder
                title="Evidence context"
                description="Qualitative, Service Access and Fact Pack evidence relevant to the selected view."
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function FilterPlaceholder({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input type="checkbox" defaultChecked disabled />
      {label}
    </label>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
      {children}
    </span>
  );
}

function ExplorerPlaceholder({
  title,
  description,
  featured = false,
}: {
  title: string;
  description: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border border-dashed border-slate-300 bg-white p-6 ${
        featured ? "xl:col-span-2" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Widget placeholder
      </p>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </article>
  );
}

function formatLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
