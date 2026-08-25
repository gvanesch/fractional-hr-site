"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectSummaryResponse } from "@/lib/client-diagnostic/build-project-summary";

type AdvisorDiagnosticExplorerClientProps = {
  summary: ProjectSummaryResponse;
};

type DimensionAnalysis = ProjectSummaryResponse["analyses"]["dimensions"][number];
type DimensionQualitative =
  ProjectSummaryResponse["qualitative"]["dimensions"][number];
type Segment = ProjectSummaryResponse["segmentation"]["segments"][number];
type SegmentDimension = Segment["dimensions"][number];
type Perspective = "hr" | "manager" | "leadership";

const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  hr: "HR",
  manager: "Managers",
  leadership: "Leadership",
};

export default function AdvisorDiagnosticExplorerClient({
  summary,
}: AdvisorDiagnosticExplorerClientProps) {
  const [viewBy, setViewBy] = useState("overall");
  const [segmentValue, setSegmentValue] = useState("");
  const [dimensionKey, setDimensionKey] = useState("all");
  const [perspectives, setPerspectives] = useState<Record<Perspective, boolean>>({
    hr: true,
    manager: true,
    leadership: true,
  });

  const completedGroups = Object.values(summary.evidenceBase.respondentGroups).filter(
    (group) => group.completed > 0,
  ).length;

  const selectedKey = summary.segmentation.availableKeys.find(
    (item) => item.key === viewBy,
  );

  const selectedSegment =
    viewBy === "overall"
      ? null
      : summary.segmentation.segments.find(
          (segment) => segment.key === viewBy && segment.value === segmentValue,
        ) ?? null;

  const selectedPerspectives = (Object.keys(perspectives) as Perspective[]).filter(
    (perspective) => perspectives[perspective],
  );

  const selectedPerspectiveLabel =
    selectedPerspectives.length === 3
      ? "All respondent perspectives"
      : selectedPerspectives.map((item) => PERSPECTIVE_LABELS[item]).join(" + ");

  const selectedDimension =
    dimensionKey === "all"
      ? null
      : summary.dimensions.find((dimension) => dimension.dimensionKey === dimensionKey) ??
        null;

  const selectedRespondentCount = selectedSegment
    ? selectedPerspectives.reduce(
        (total, perspective) => total + selectedSegment.respondentGroups[perspective],
        0,
      )
    : selectedPerspectives.reduce(
        (total, perspective) =>
          total + summary.evidenceBase.respondentGroups[perspective].completed,
        0,
      );

  const contextLabel = [
    selectedSegment
      ? `${formatLabel(selectedSegment.key)}: ${selectedSegment.value}`
      : "Overall diagnostic",
    selectedPerspectiveLabel,
    selectedDimension?.dimensionLabel ?? "All dimensions",
  ].join(" · ");

  const factPackAvailable = Boolean(summary.context.factPack.response);

  const visibleOverallDimensions = summary.analyses.dimensions.filter(
    (dimension) =>
      dimensionKey === "all" || dimension.dimensionKey === dimensionKey,
  );

  const visibleSegmentDimensions = (selectedSegment?.dimensions ?? []).filter(
    (dimension) =>
      dimensionKey === "all" || dimension.dimensionKey === dimensionKey,
  );

  const visibleQualitativeDimensions = summary.qualitative.dimensions.filter(
    (dimension) =>
      dimensionKey === "all" || dimension.dimensionKey === dimensionKey,
  );

  function handleViewByChange(nextViewBy: string) {
    setViewBy(nextViewBy);

    if (nextViewBy === "overall") {
      setSegmentValue("");
      return;
    }

    const nextKey = summary.segmentation.availableKeys.find(
      (item) => item.key === nextViewBy,
    );
    setSegmentValue(nextKey?.values[0] ?? "");
  }

  function togglePerspective(perspective: Perspective) {
    const activeCount = selectedPerspectives.length;

    if (perspectives[perspective] && activeCount === 1) {
      return;
    }

    setPerspectives((current) => ({
      ...current,
      [perspective]: !current[perspective],
    }));
  }

  function resetFilters() {
    setViewBy("overall");
    setSegmentValue("");
    setDimensionKey("all");
    setPerspectives({ hr: true, manager: true, leadership: true });
  }

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
                Filter scored evidence by project-defined segment, respondent
                perspective visibility, and diagnostic dimension.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-900">View by</p>
              <div className="mt-3 space-y-2">
                <RadioFilter
                  label="Overall"
                  checked={viewBy === "overall"}
                  onChange={() => handleViewByChange("overall")}
                />
                {summary.segmentation.availableKeys.map((dimension) => (
                  <RadioFilter
                    key={dimension.key}
                    label={formatLabel(dimension.key)}
                    checked={viewBy === dimension.key}
                    onChange={() => handleViewByChange(dimension.key)}
                  />
                ))}
              </div>
            </div>

            {viewBy !== "overall" && selectedKey ? (
              <div className="mt-6">
                <label className="text-sm font-semibold text-slate-900" htmlFor="segment-value">
                  Segment
                </label>
                <select
                  id="segment-value"
                  value={segmentValue}
                  onChange={(event) => setSegmentValue(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800"
                >
                  {selectedKey.values.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="mt-7 border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold text-slate-900">
                Respondent perspectives shown
              </p>
              <div className="mt-3 space-y-2">
                {(Object.keys(PERSPECTIVE_LABELS) as Perspective[]).map(
                  (perspective) => (
                    <CheckboxFilter
                      key={perspective}
                      label={PERSPECTIVE_LABELS[perspective]}
                      checked={perspectives[perspective]}
                      disabled={
                        perspectives[perspective] && selectedPerspectives.length === 1
                      }
                      onChange={() => togglePerspective(perspective)}
                    />
                  ),
                )}
              </div>
            </div>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <label className="text-sm font-semibold text-slate-900" htmlFor="dimension-filter">
                Dimension
              </label>
              <select
                id="dimension-filter"
                value={dimensionKey}
                onChange={(event) => setDimensionKey(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800"
              >
                <option value="all">All dimensions</option>
                {summary.dimensions.map((dimension) => (
                  <option key={dimension.dimensionKey} value={dimension.dimensionKey}>
                    {dimension.dimensionLabel}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 text-sm font-medium text-[#1E6FD9] hover:text-[#1859ad]"
            >
              Reset filters
            </button>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-1.5 text-xs leading-5 text-slate-500">
                <span>
                  Client reporting threshold: <strong className="font-semibold text-slate-700">n={summary.reportingPolicy.segmentReportingMinN}</strong>
                </span>
                <InfoTooltip label="Client reporting threshold">
                  This threshold controls client-facing reporting granularity and
                  confidentiality. Evidence below the threshold may still inform
                  advisor interpretation, subject to appropriate caution.
                </InfoTooltip>
              </div>
            </div>
          </aside>

          <section className="min-w-0 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Current analysis context
                  </p>
                  <p className="mt-2 font-medium text-slate-900">{contextLabel}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <StatusPill>{selectedRespondentCount} scored respondents</StatusPill>
                  <StatusPill>{completedGroups}/3 scored perspectives</StatusPill>
                  <StatusPill>
                    {factPackAvailable ? "Fact Pack complete" : "Fact Pack not available"}
                  </StatusPill>
                  <StatusPill>
                    {summary.segmentation.availableKeys.length} segmentation dimensions
                  </StatusPill>
                </div>
              </div>
            </div>

            <ExplorerSection
              title="Dimension analytics"
              description="Canonical scored evidence. Segment selection changes the scored segment evidence shown; respondent perspective controls which group scores are visible."
            >
              {selectedSegment ? (
                <>
                  <SegmentContextCard segment={selectedSegment} />
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {visibleSegmentDimensions.map((dimension) => (
                      <SegmentDimensionCard
                        key={dimension.dimensionKey}
                        dimension={dimension}
                        summary={summary}
                        perspectives={perspectives}
                      />
                    ))}
                  </div>
                </>
              ) : viewBy === "overall" ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {visibleOverallDimensions.map((dimension) => (
                    <DimensionAnalyticsCard
                      key={dimension.dimensionKey}
                      dimension={dimension}
                      perspectives={perspectives}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No scored evidence is available for the selected segment." />
              )}
            </ExplorerSection>

            <ExplorerSection
              title="Qualitative evidence"
              description="Written-response evidence provides context for the scored diagnostic. It should enrich or challenge interpretation, not recalculate the scores."
            >
              {selectedSegment ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
                  The canonical summary does not currently expose qualitative
                  evidence by segment. Whole-project comments are therefore not
                  presented as though they were specific to {selectedSegment.value}.
                </div>
              ) : (
                <>
                  {selectedPerspectives.length < 3 ? (
                    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      Respondent perspective visibility currently applies to
                      scored analytics only. Qualitative summaries remain
                      whole-project evidence and are not presented as though
                      they were filtered to {selectedPerspectiveLabel}.
                    </div>
                  ) : null}
                  <OverallQualitativeCard summary={summary} />
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {visibleQualitativeDimensions.map((dimension) => (
                      <QualitativeDimensionCard
                        key={dimension.dimensionKey}
                        dimension={dimension}
                      />
                    ))}
                  </div>
                </>
              )}
            </ExplorerSection>

            <ExplorerSection
              title="Segment comparison"
              description="Project-defined segmentation evidence is available for advisor analysis. Use View by to inspect individual segment evidence; direct multi-segment comparison remains the next Explorer increment."
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
                        {formatLabel(dimension.key)} · {dimension.values.length} values
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

function SegmentContextCard({ segment }: { segment: Segment }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{segment.respondentCount} respondents in segment</Badge>
        <Badge>{formatLabel(segment.analyticalStrength)} analytical strength</Badge>
        <Badge>{formatLabel(segment.compositionStatus)} composition</Badge>
        <Badge>{formatLabel(segment.confidentialityStatus)} client confidentiality</Badge>
        {segment.confidentialityStatus === "suppressed" ? (
          <InfoTooltip label="Client reporting suppressed">
            Exact segment results are visible here for advisor analysis but are
            not permitted for client reporting under the current project policy.
          </InfoTooltip>
        ) : null}
      </div>
    </div>
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
  perspectives,
}: {
  dimension: DimensionAnalysis;
  perspectives: Record<Perspective, boolean>;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{dimension.dimensionLabel}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {dimension.dimensionDescription}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge>{formatLabel(dimension.strength)}</Badge>
          <InfoTooltip label={`${dimension.dimensionLabel} strength`}>
            Strength is based on the deterministic overall dimension score:
            Weak below 3.0, Moderate from 3.0 to below 4.0, and Strong from 4.0.
            Current overall score: {formatMetricValue(dimension.averageScore)}.
          </InfoTooltip>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Overall" value={formatMetricValue(dimension.averageScore)} />
        {perspectives.hr ? (
          <Metric label="HR" value={formatMetricValue(dimension.scores.hr)} />
        ) : null}
        {perspectives.manager ? (
          <Metric label="Manager" value={formatMetricValue(dimension.scores.manager)} />
        ) : null}
        {perspectives.leadership ? (
          <Metric label="Leadership" value={formatMetricValue(dimension.scores.leadership)} />
        ) : null}
        <Metric label="Gap" value={formatMetricValue(dimension.gap)} />
        <MetricWithInfo
          label="Alignment"
          value={formatLabel(dimension.alignment)}
          infoLabel={`${dimension.dimensionLabel} alignment`}
        >
          Alignment uses the observed respondent-group gap. Below 0.40 is
          Aligned, 0.40 to below 0.75 is Emerging gap, and 0.75 or above is
          Significant gap. Current gap: {formatMetricValue(dimension.gap)}.
        </MetricWithInfo>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <PillWithInfo
          label={`Evidence: ${formatLabel(dimension.completeness)}`}
          infoLabel={`${dimension.dimensionLabel} evidence completeness`}
        >
          Completeness reflects coverage of the three scored perspectives: HR,
          Manager and Leadership. Sufficient means all three are represented,
          Partial means two, and Insufficient means one or none.
        </PillWithInfo>
        <PillWithInfo
          label={`Confidence: ${formatLabel(dimension.confidence)}`}
          infoLabel={`${dimension.dimensionLabel} confidence`}
        >
          This deterministic analysis confidence follows evidence completeness.
          {` ${formatLabel(dimension.completeness)} completeness produces ${formatLabel(dimension.confidence)} confidence.`}
        </PillWithInfo>
      </div>
    </article>
  );
}

function SegmentDimensionCard({
  dimension,
  summary,
  perspectives,
}: {
  dimension: SegmentDimension;
  summary: ProjectSummaryResponse;
  perspectives: Record<Perspective, boolean>;
}) {
  const metadata = summary.dimensions.find(
    (item) => item.dimensionKey === dimension.dimensionKey,
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            {metadata?.dimensionLabel ?? formatLabel(dimension.dimensionKey)}
          </h3>
          {metadata?.dimensionDescription ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {metadata.dimensionDescription}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge>{formatLabel(dimension.clientReporting.status)}</Badge>
          <InfoTooltip label="Client reporting status">
            {dimension.clientReporting.status === "reportable"
              ? "This segment dimension aggregate meets the current client-reporting rule."
              : "This exact aggregate is advisor-visible but suppressed for client reporting because a contributing respondent group is below the reporting threshold."}
          </InfoTooltip>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Segment average" value={formatMetricValue(dimension.averageScore)} />
        {perspectives.hr ? (
          <Metric
            label={`HR · n=${dimension.groups.hr.n}`}
            value={formatMetricValue(dimension.groups.hr.mean)}
          />
        ) : null}
        {perspectives.manager ? (
          <Metric
            label={`Manager · n=${dimension.groups.manager.n}`}
            value={formatMetricValue(dimension.groups.manager.mean)}
          />
        ) : null}
        {perspectives.leadership ? (
          <Metric
            label={`Leadership · n=${dimension.groups.leadership.n}`}
            value={formatMetricValue(dimension.groups.leadership.mean)}
          />
        ) : null}
        <Metric label="Respondents" value={String(dimension.respondentCount)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(PERSPECTIVE_LABELS) as Perspective[])
          .filter((perspective) => perspectives[perspective])
          .map((perspective) => {
            const reporting = dimension.groups[perspective].clientReporting;
            return reporting.status === "suppressed" ? (
              <PillWithInfo
                key={perspective}
                label={`${PERSPECTIVE_LABELS[perspective]}: advisor only`}
                infoLabel={`${PERSPECTIVE_LABELS[perspective]} client reporting`}
              >
                This exact subgroup result is available to the advisor but is
                suppressed for client reporting because the subgroup is below
                the current threshold.
              </PillWithInfo>
            ) : null;
          })}
      </div>
    </article>
  );
}

function OverallQualitativeCard({ summary }: { summary: ProjectSummaryResponse }) {
  const qualitative = summary.qualitative.overall;

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Overall qualitative read</h3>
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
          <StatusPill>{qualitative.respondentGroupsWithComments.length} groups</StatusPill>
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
        <h3 className="font-semibold text-slate-900">{dimension.dimensionLabel}</h3>
        <div className="flex items-center gap-1.5">
          <Badge>{formatLabel(dimension.confidence)} confidence</Badge>
          <InfoTooltip label={`${dimension.dimensionLabel} qualitative confidence`}>
            This dimension currently has {dimension.commentCount} written
            {dimension.commentCount === 1 ? " comment" : " comments"} across {dimension.respondentGroupsWithComments.length} respondent
            {dimension.respondentGroupsWithComments.length === 1 ? " perspective" : " perspectives"}. The current model classifies that evidence as {dimension.confidence} qualitative confidence. Treat the comments as contextual evidence, not scored evidence.
          </InfoTooltip>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <SubtlePill>{dimension.commentCount} comments</SubtlePill>
        <SubtlePill>{dimension.respondentGroupsWithComments.length} groups</SubtlePill>
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

function RadioFilter({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
      <input type="radio" name="viewBy" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function CheckboxFilter({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <label className={`flex items-center gap-3 text-sm ${disabled ? "cursor-not-allowed text-slate-400" : "cursor-pointer text-slate-700"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
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

function MetricWithInfo({
  label,
  value,
  infoLabel,
  children,
}: {
  label: string;
  value: string;
  infoLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <InfoTooltip label={infoLabel}>{children}</InfoTooltip>
      </div>
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

function PillWithInfo({
  label,
  infoLabel,
  children,
}: {
  label: string;
  infoLabel: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
      {label}
      <InfoTooltip label={infoLabel}>{children}</InfoTooltip>
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

function InfoTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`About ${label}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-semibold leading-none text-slate-500 hover:border-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E6FD9]/30"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-6 z-30 w-72 rounded-xl bg-slate-950 px-3 py-2.5 text-left text-xs font-normal leading-5 text-white opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
      {message}
    </div>
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

function formatLabel(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
