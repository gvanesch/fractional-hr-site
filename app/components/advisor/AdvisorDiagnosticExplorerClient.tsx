"use client";

import Link from "next/link";
import type { ProjectSummaryResponse } from "@/lib/client-diagnostic/build-project-summary";

type AdvisorDiagnosticExplorerClientProps = {
  summary: ProjectSummaryResponse;
};

type DimensionAnalysis = ProjectSummaryResponse["analyses"]["dimensions"][number];

type DimensionQualitative =
  ProjectSummaryResponse["qualitative"]["dimensions"][number];

export default function AdvisorDiagnosticExplorerClient({
  summary,
}: AdvisorDiagnosticExplorerClientProps) {
  const completedGroups = summary.completion.respondentGroups.filter(
    (group) => group.completed > 0,
  ).length;

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
              Advisor confidential. Not for client distribution.
            </p>
            <p className="mt-1">
              This workspace may contain sensitive evidence and results that
              are not permitted for client reporting. Advisor visibility does
              not imply that a result can be shared with the client.
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
                Project-defined filters will update the analytical workspace.
                Interactive filtering is the next Explorer increment.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-900">View by</p>

              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="radio" name="viewBy" defaultChecked disabled />
                  Overall
                </label>

                {summary.segmentation.availableKeys.map((dimension) => (
                  <label
                    key={dimension.key}
                    className="flex items-center gap-3 text-sm text-slate-500"
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
              <p className="mt-2 text-xs leading-5 text-slate-500">
                This threshold governs client reporting granularity. It does
                not determine whether evidence can contribute to advisor
                interpretation.
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
                  <StatusPill>{completedGroups}/3 scored groups</StatusPill>
                  <StatusPill>
                    {summary.segmentation.availableKeys.length} segmentation
                    dimensions
                  </StatusPill>
                </div>
              </div>
            </div>

            <ExplorerSection
              title="Dimension analytics"
              description="Canonical scored evidence across the ten diagnostic dimensions. Group differences are descriptive and should be interpreted alongside evidence strength and context."
            >
              <div className="grid gap-4 xl:grid-cols-2">
                {summary.analyses.dimensions.map((dimension) => (
                  <DimensionAnalyticsCard
                    key={dimension.dimensionKey}
                    dimension={dimension}
                  />
                ))}
              </div>
            </ExplorerSection>

            <ExplorerSection
              title="Qualitative evidence"
              description="Written-response evidence provides context for the scored diagnostic. It should enrich or challenge interpretation, not recalculate the scores."
            >
              <OverallQualitativeCard summary={summary} />

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {summary.qualitative.dimensions.map((dimension) => (
                  <QualitativeDimensionCard
                    key={dimension.dimensionKey}
                    dimension={dimension}
                  />
                ))}
              </div>
            </ExplorerSection>

            <ExplorerSection
              title="Segment comparison"
              description="Project-defined segmentation evidence is available in the canonical analysis layer. Interactive selection and comparison will be added in the next Explorer increment."
            >
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-900">
                  {summary.segmentation.availableKeys.length > 0
                    ? `${summary.segmentation.availableKeys.length} segmentation dimensions available`
                    : "No segmentation dimensions configured"}
                </p>
                {summary.segmentation.availableKeys.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {summary.segmentation.availableKeys.map((dimension) => (
                      <Badge key={dimension.key}>
                        {formatLabel(dimension.key)} · {dimension.values.length}{" "}
                        values
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </ExplorerSection>
          </section>
        </div>
      </div>
    </main>
  );
}

function ExplorerSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="max-w-4xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function DimensionAnalyticsCard({
  dimension,
}: {
  dimension: DimensionAnalysis;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            {dimension.dimensionLabel}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {dimension.dimensionDescription}
          </p>
        </div>
        <Badge>{formatLabel(dimension.strength)}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Overall" value={formatMetricValue(dimension.averageScore)} />
        <Metric label="HR" value={formatMetricValue(dimension.scores.hr)} />
        <Metric
          label="Manager"
          value={formatMetricValue(dimension.scores.manager)}
        />
        <Metric
          label="Leadership"
          value={formatMetricValue(dimension.scores.leadership)}
        />
        <Metric label="Gap" value={formatMetricValue(dimension.gap)} />
        <Metric label="Alignment" value={formatLabel(dimension.alignment)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <SubtlePill>Evidence: {formatLabel(dimension.completeness)}</SubtlePill>
        <SubtlePill>Confidence: {formatLabel(dimension.confidence)}</SubtlePill>
      </div>
    </article>
  );
}

function OverallQualitativeCard({
  summary,
}: {
  summary: ProjectSummaryResponse;
}) {
  const qualitative = summary.qualitative.overall;

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            Overall qualitative read
          </h3>
          {qualitative.summary ? (
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
              {qualitative.summary}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              No overall qualitative summary is available.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <StatusPill>{qualitative.totalCommentCount} comments</StatusPill>
          <StatusPill>
            {qualitative.respondentGroupsWithComments.length} groups
          </StatusPill>
        </div>
      </div>

      {qualitative.crossCuttingThemes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {qualitative.crossCuttingThemes.map((theme) => (
            <Badge key={theme.key}>
              {theme.label} ({theme.count})
            </Badge>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function QualitativeDimensionCard({
  dimension,
}: {
  dimension: DimensionQualitative;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="font-semibold text-slate-900">
          {dimension.dimensionLabel}
        </h3>
        <Badge>{formatLabel(dimension.confidence)} confidence</Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <SubtlePill>{dimension.commentCount} comments</SubtlePill>
        <SubtlePill>
          {dimension.respondentGroupsWithComments.length} groups
        </SubtlePill>
        <SubtlePill>{dimension.keyThemes.length} themes</SubtlePill>
      </div>

      {dimension.advisoryRead ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Advisory read
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {dimension.advisoryRead}
          </p>
        </div>
      ) : null}

      {dimension.keyThemes.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Key themes
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dimension.keyThemes.map((theme) => (
              <Badge key={theme.key}>
                {theme.label} ({theme.count})
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {dimension.illustrativeSignals.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Illustrative signals
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {dimension.illustrativeSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function FilterPlaceholder({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-500">
      <input type="checkbox" defaultChecked disabled />
      {label}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
      {children}
    </span>
  );
}

function SubtlePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
      {children}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function formatMetricValue(value: number | null): string {
  if (typeof value !== "number") {
    return "-";
  }

  const rounded = Math.round(value * 100) / 100;
  const normalized = Object.is(rounded, -0) ? 0 : rounded;

  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(2);
}

function formatLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
