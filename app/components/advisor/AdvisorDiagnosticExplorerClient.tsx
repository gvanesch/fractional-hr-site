"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ProjectSummaryResponse } from "@/lib/client-diagnostic/build-project-summary";
import type {
  ExplorerCohort,
  ExplorerCohortFilter,
  ExplorerPerspective,
} from "@/lib/client-diagnostic/build-explorer-cohort";

type AdvisorDiagnosticExplorerClientProps = {
  summary: ProjectSummaryResponse;
  explorerCohort: ExplorerCohort;
};

type DimensionAnalysis = ProjectSummaryResponse["analyses"]["dimensions"][number];
type DimensionQualitative =
  ProjectSummaryResponse["qualitative"]["dimensions"][number];
type CohortDimension = ExplorerCohort["dimensions"][number];
type CohortQualitativeDimension = ExplorerCohort["qualitative"]["dimensions"][number];
type Perspective = ExplorerPerspective;

const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  hr: "HR",
  manager: "Managers",
  leadership: "Leadership",
};

export default function AdvisorDiagnosticExplorerClient({
  summary,
  explorerCohort,
}: AdvisorDiagnosticExplorerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dimensionKey, setDimensionKey] = useState("all");
  const [perspectives, setPerspectives] = useState<Record<Perspective, boolean>>({
    hr: true,
    manager: true,
    leadership: true,
  });

  const activeFilters = explorerCohort.filters;
  const hasNarrowingFilters =
    activeFilters.length > 0 && !explorerCohort.isOverallEquivalent;
  const selectionMap = new Map(
    explorerCohort.selections.map((selection) => [selection.key, selection.values]),
  );

  const selectedPerspectives = (Object.keys(perspectives) as Perspective[]).filter(
    (perspective) => perspectives[perspective],
  );
  const selectedPerspectiveLabel = selectedPerspectives
    .map((item) => PERSPECTIVE_LABELS[item])
    .join(" + ");

  const presentPerspectives = (Object.keys(PERSPECTIVE_LABELS) as Perspective[]).filter(
    (perspective) => explorerCohort.respondentGroups[perspective] > 0,
  );
  const perspectiveContextLabel =
    selectedPerspectives.length < 3
      ? `${selectedPerspectiveLabel} shown`
      : hasNarrowingFilters
        ? `${presentPerspectives
            .map((item) => PERSPECTIVE_LABELS[item])
            .join(" + ")} present`
        : "All respondent perspectives";

  const selectedDimension =
    dimensionKey === "all"
      ? null
      : summary.dimensions.find(
          (dimension) => dimension.dimensionKey === dimensionKey,
        ) ?? null;

  const segmentationContextLabel = hasNarrowingFilters
    ? activeFilters
        .map(
          (filter) =>
            `${formatLabel(filter.key)}: ${filter.values.map(formatLabel).join(" + ")}`,
        )
        .join(" · ")
    : "Overall diagnostic";

  const contextLabel = [
    segmentationContextLabel,
    perspectiveContextLabel,
    selectedDimension?.dimensionLabel ?? "All dimensions",
  ].join(" · ");

  const factPackAvailable = Boolean(summary.context.factPack.response);

  const visibleOverallDimensions = summary.analyses.dimensions.filter(
    (dimension) =>
      dimensionKey === "all" || dimension.dimensionKey === dimensionKey,
  );
  const visibleCohortDimensions = explorerCohort.dimensions.filter(
    (dimension) =>
      dimensionKey === "all" || dimension.dimensionKey === dimensionKey,
  );
  const visibleQualitativeDimensions = summary.qualitative.dimensions.filter(
    (dimension) =>
      dimensionKey === "all" || dimension.dimensionKey === dimensionKey,
  );
  const visibleCohortQualitativeDimensions = explorerCohort.qualitative.dimensions.filter(
    (dimension) =>
      dimension.sourceCommentCount > 0 &&
      (dimensionKey === "all" || dimension.dimensionKey === dimensionKey),
  );

  function selectedValuesFor(key: string): string[] {
    return selectionMap.get(key) ?? [];
  }

  function navigateSelections(nextSelections: ExplorerCohortFilter[]) {
    const params = new URLSearchParams();
    const orderedSelections = summary.segmentation.availableKeys.flatMap(
      (availableKey) => {
        const selection = nextSelections.find(
          (item) => item.key === availableKey.key,
        );
        return selection ? [selection] : [];
      },
    );

    for (const selection of orderedSelections) {
      for (const value of selection.values) {
        params.append(`segment.${selection.key}`, value);
      }
    }

    const query = params.toString();
    const href = query
      ? `/advisor/explore/${summary.project.projectId}?${query}`
      : `/advisor/explore/${summary.project.projectId}`;

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  function toggleSegmentValue(key: string, value: string) {
    const availableKey = summary.segmentation.availableKeys.find(
      (item) => item.key === key,
    );

    if (!availableKey) {
      return;
    }

    const selectedValues = selectedValuesFor(key);
    const isSelected = selectedValues.includes(value);
    const nextSelectedValues = isSelected
      ? selectedValues.filter((item) => item !== value)
      : availableKey.values.filter(
          (item) => selectedValues.includes(item) || item === value,
        );
    const nextSelections = explorerCohort.selections.filter(
      (selection) => selection.key !== key,
    );

    if (nextSelectedValues.length > 0) {
      nextSelections.push({
        key,
        values: nextSelectedValues,
      });
    }

    navigateSelections(nextSelections);
  }

  function selectAllSegmentValues(key: string) {
    const availableKey = summary.segmentation.availableKeys.find(
      (item) => item.key === key,
    );

    if (!availableKey) {
      return;
    }

    navigateSelections([
      ...explorerCohort.selections.filter((selection) => selection.key !== key),
      {
        key,
        values: availableKey.values,
      },
    ]);
  }

  function clearSegmentFilter(key: string) {
    navigateSelections(
      explorerCohort.selections.filter((selection) => selection.key !== key),
    );
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
    setDimensionKey("all");
    setPerspectives({ hr: true, manager: true, leadership: true });
    navigateSelections([]);
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
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:w-72 lg:basis-72 lg:flex-none">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Analysis filters
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Choose values to narrow the cohort. Multiple values within one
                dimension use OR; selections across dimensions use AND. Leave a
                dimension blank for All.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {summary.segmentation.availableKeys.map((segmentationDimension) => {
                const selectedValues = selectedValuesFor(segmentationDimension.key);
                const hasSelection = selectedValues.length > 0;
                const allSelected =
                  selectedValues.length === segmentationDimension.values.length;

                return (
                  <details
                    key={segmentationDimension.key}
                    open={hasSelection}
                    className="rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <summary className="cursor-pointer list-none px-3 py-3 text-sm font-semibold text-slate-900">
                      <span className="flex items-center justify-between gap-3">
                        <span>{formatLabel(segmentationDimension.key)}</span>
                        <span className="text-xs font-medium text-slate-500">
                          {hasSelection
                            ? `${selectedValues.length}/${segmentationDimension.values.length}`
                            : "All"}
                        </span>
                      </span>
                    </summary>

                    <div className="border-t border-slate-200 px-3 pb-3 pt-3">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <p className="text-xs leading-5 text-slate-500">
                          Blank means all values.
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          {!allSelected ? (
                            <button
                              type="button"
                              onClick={() =>
                                selectAllSegmentValues(segmentationDimension.key)
                              }
                              disabled={isPending}
                              className="text-xs font-medium text-[#1E6FD9] hover:text-[#1859ad] disabled:cursor-wait disabled:text-slate-400"
                            >
                              Select all
                            </button>
                          ) : null}
                          {hasSelection ? (
                            <button
                              type="button"
                              onClick={() =>
                                clearSegmentFilter(segmentationDimension.key)
                              }
                              disabled={isPending}
                              className="text-xs font-medium text-[#1E6FD9] hover:text-[#1859ad] disabled:cursor-wait disabled:text-slate-400"
                            >
                              Clear
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                        {segmentationDimension.values.map((value) => (
                          <CheckboxFilter
                            key={value}
                            label={formatLabel(value)}
                            checked={selectedValues.includes(value)}
                            disabled={isPending}
                            onChange={() =>
                              toggleSegmentValue(segmentationDimension.key, value)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>

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
              <label
                className="text-sm font-semibold text-slate-900"
                htmlFor="dimension-filter"
              >
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
                  <option
                    key={dimension.dimensionKey}
                    value={dimension.dimensionKey}
                  >
                    {dimension.dimensionLabel}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              disabled={isPending}
              className="mt-6 text-sm font-medium text-[#1E6FD9] hover:text-[#1859ad] disabled:cursor-wait disabled:text-slate-400"
            >
              Reset filters
            </button>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-1.5 text-xs leading-5 text-slate-500">
                <span>
                  Client reporting threshold:{" "}
                  <strong className="font-semibold text-slate-700">
                    n={summary.reportingPolicy.segmentReportingMinN}
                  </strong>
                </span>
                <InfoTooltip label="Client reporting threshold">
                  This threshold controls one part of client-facing reporting
                  granularity and confidentiality. Evidence below the threshold
                  may still inform advisor interpretation. Meeting the threshold
                  does not by itself make a result safe to share with a client.
                </InfoTooltip>
              </div>
            </div>
          </aside>

          <section className="min-w-0 flex-1 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Current analysis context
                  </p>
                  <p className="mt-2 font-medium text-slate-900">{contextLabel}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  {isPending ? <StatusPill>Updating analysis...</StatusPill> : null}
                  <StatusPill>
                    {explorerCohort.respondentCount} scored respondents
                  </StatusPill>
                  <StatusPill>
                    {presentPerspectives.length}/3 scored perspectives present
                  </StatusPill>
                  <StatusPill>
                    {factPackAvailable
                      ? "Fact Pack complete"
                      : "Fact Pack not available"}
                  </StatusPill>
                  <StatusPill>
                    {summary.segmentation.availableKeys.length} segmentation dimensions
                  </StatusPill>
                </div>
              </div>
            </div>

            <ExplorerSection
              title="Dimension analytics"
              description="Canonical scored evidence. Segmentation filters use OR within each dimension and AND across dimensions; filtered cohorts are calculated from participant-level evidence on the server. Respondent perspective controls which group scores are visible."
            >
              {hasNarrowingFilters ? (
                <>
                  <CohortContextCard cohort={explorerCohort} />
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {visibleCohortDimensions.map((dimension) => (
                      <CohortDimensionCard
                        key={dimension.dimensionKey}
                        dimension={dimension}
                        summary={summary}
                        perspectives={perspectives}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {visibleOverallDimensions.map((dimension) => (
                    <DimensionAnalyticsCard
                      key={dimension.dimensionKey}
                      dimension={dimension}
                      perspectives={perspectives}
                    />
                  ))}
                </div>
              )}
            </ExplorerSection>

            <ExplorerSection
              title="Qualitative evidence"
              description="Written-response evidence provides context for the scored diagnostic. Filtered views apply additional disclosure controls before verbatim comments are shown; the overall view retains the deterministic thematic summary."
            >
              {hasNarrowingFilters ? (
                <FilteredQualitativeEvidence
                  summary={summary}
                  qualitative={explorerCohort.qualitative}
                  dimensions={visibleCohortQualitativeDimensions}
                  selectedPerspectiveLabel={selectedPerspectiveLabel}
                  perspectivesFiltered={selectedPerspectives.length < 3}
                />
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
              title="Cohort comparison"
              description="The Explorer now supports multidimensional cohort filtering. Direct side-by-side cohort comparison remains a separate future analytical view."
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

function CohortContextCard({ cohort }: { cohort: ExplorerCohort }) {
  const meetsCurrentThreshold = cohort.confidentialityStatus === "reportable";
  const highlyRestricted = cohort.respondentCount === 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{cohort.respondentCount} respondents</Badge>
        <Badge>
          {cohort.filters.length} active segmentation {cohort.filters.length === 1 ? "filter" : "filters"}
        </Badge>
        <Badge>{formatLabel(cohort.analyticalStrength)} analytical strength</Badge>
        {cohort.respondentCount > 0 ? (
          <Badge>{formatLabel(cohort.compositionStatus)} composition</Badge>
        ) : null}
        {highlyRestricted ? <Badge>Highly restricted: single respondent</Badge> : null}
        <Badge>
          {meetsCurrentThreshold
            ? "Meets current client threshold"
            : "Below current client threshold"}
        </Badge>
        <InfoTooltip label="Filtered cohort logic">
          Values selected within one segmentation dimension are combined with OR.
          Active segmentation dimensions are then combined with AND. The cohort is
          calculated from participant-level scored evidence on the server.
        </InfoTooltip>
        <InfoTooltip label="Current client reporting status">
          {meetsCurrentThreshold
            ? "This cohort meets the project's current minimum reporting threshold. Final client shareability remains subject to the separate client-reporting projection, including complementary suppression and anti-differencing controls."
            : "This cohort is below the project's current minimum reporting threshold. Exact results remain available here for advisor analysis but should not be treated as client-shareable."}
        </InfoTooltip>
        {highlyRestricted ? (
          <InfoTooltip label="Highly restricted evidence">
            This filtered cohort contains one scored respondent. Quantitative
            results therefore represent effectively individual-level evidence.
            Use them only as a qualified advisor signal. Verbatim written
            responses are withheld by the qualitative disclosure controls.
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
          <h3 className="font-semibold text-slate-900">
            {dimension.dimensionLabel}
          </h3>
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
          <Metric
            label="Manager"
            value={formatMetricValue(dimension.scores.manager)}
          />
        ) : null}
        {perspectives.leadership ? (
          <Metric
            label="Leadership"
            value={formatMetricValue(dimension.scores.leadership)}
          />
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

function CohortDimensionCard({
  dimension,
  summary,
  perspectives,
}: {
  dimension: CohortDimension;
  summary: ProjectSummaryResponse;
  perspectives: Record<Perspective, boolean>;
}) {
  const metadata = summary.dimensions.find(
    (item) => item.dimensionKey === dimension.dimensionKey,
  );
  const meetsCurrentThreshold = dimension.clientReporting.status === "reportable";

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
          <Badge>
            {meetsCurrentThreshold
              ? "Meets current client threshold"
              : "Current client rule: suppressed"}
          </Badge>
          <InfoTooltip label="Current client reporting status">
            {meetsCurrentThreshold
              ? "All non-empty respondent groups contributing to this aggregate meet the current project threshold. Final client shareability still depends on the separate client-reporting projection and its anti-differencing controls."
              : "This exact aggregate is advisor-visible but suppressed under the current rule because at least one contributing respondent group is below the project threshold."}
          </InfoTooltip>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label="Cohort average"
          value={formatMetricValue(dimension.averageScore)}
        />
        {perspectives.hr && dimension.groups.hr.n > 0 ? (
          <Metric
            label={`HR · n=${dimension.groups.hr.n}`}
            value={formatMetricValue(dimension.groups.hr.mean)}
          />
        ) : null}
        {perspectives.manager && dimension.groups.manager.n > 0 ? (
          <Metric
            label={`Manager · n=${dimension.groups.manager.n}`}
            value={formatMetricValue(dimension.groups.manager.mean)}
          />
        ) : null}
        {perspectives.leadership && dimension.groups.leadership.n > 0 ? (
          <Metric
            label={`Leadership · n=${dimension.groups.leadership.n}`}
            value={formatMetricValue(dimension.groups.leadership.mean)}
          />
        ) : null}
        <Metric label="Respondents" value={String(dimension.respondentCount)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(PERSPECTIVE_LABELS) as Perspective[])
          .filter(
            (perspective) =>
              perspectives[perspective] && dimension.groups[perspective].n > 0,
          )
          .map((perspective) => {
            const reporting = dimension.groups[perspective].clientReporting;
            return reporting.status === "suppressed" ? (
              <PillWithInfo
                key={perspective}
                label={`${PERSPECTIVE_LABELS[perspective]}: advisor only`}
                infoLabel={`${PERSPECTIVE_LABELS[perspective]} client reporting`}
              >
                This exact subgroup result is available to the advisor but is
                below the current client-reporting threshold. It should not be
                treated as client-shareable.
              </PillWithInfo>
            ) : null;
          })}
      </div>
    </article>
  );
}

function FilteredQualitativeEvidence({
  summary,
  qualitative,
  dimensions,
  selectedPerspectiveLabel,
  perspectivesFiltered,
}: {
  summary: ProjectSummaryResponse;
  qualitative: ExplorerCohort["qualitative"];
  dimensions: CohortQualitativeDimension[];
  selectedPerspectiveLabel: string;
  perspectivesFiltered: boolean;
}) {
  const sourceCommentCount = dimensions.reduce(
    (total, dimension) => total + dimension.sourceCommentCount,
    0,
  );
  const visibleCommentCount = dimensions.reduce(
    (total, dimension) => total + dimension.commentCount,
    0,
  );
  const withheldCommentCount = dimensions.reduce(
    (total, dimension) => total + dimension.withheldCommentCount,
    0,
  );
  const sourcePerspectives = new Set(
    dimensions.flatMap((dimension) => [
      ...dimension.respondentGroupsWithComments,
      ...dimension.withheldRespondentGroups,
    ]),
  );
  const threshold = qualitative.disclosureControl.threshold;
  const hasWithheldEvidence = withheldCommentCount > 0;

  const withheldExplanation =
    qualitative.disclosureControl.reason === "cohort_below_threshold"
      ? `The filtered cohort is below the current privacy threshold of n=${threshold}.`
      : `At least one respondent perspective represented in the comments is below the current privacy threshold of n=${threshold}.`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Filtered qualitative evidence</span>
          <Badge>{sourceCommentCount} submitted</Badge>
          <Badge>{visibleCommentCount} visible</Badge>
          {withheldCommentCount > 0 ? (
            <Badge>{withheldCommentCount} withheld</Badge>
          ) : null}
          <Badge>{sourcePerspectives.size} perspectives</Badge>
        </div>
        <p className="mt-2">
          Written responses are contextual evidence, not scored evidence. In a
          filtered view, verbatim text is only displayed when both the filtered
          cohort and the relevant respondent perspective meet the current privacy
          threshold.
        </p>
        {hasWithheldEvidence ? (
          <p className="mt-2 font-medium text-amber-950">
            {withheldCommentCount} written {withheldCommentCount === 1 ? "response exists" : "responses exist"}
            {" "}in this filtered view but {withheldCommentCount === 1 ? "is" : "are"}
            {" "}not displayed because the disclosure controls limit identifiable
            qualitative evidence. {withheldExplanation}
          </p>
        ) : null}
        {perspectivesFiltered ? (
          <p className="mt-2 text-amber-900">
            Respondent perspective visibility currently applies to scored
            analytics only. Qualitative disclosure controls are evaluated against
            the full filtered cohort rather than only {selectedPerspectiveLabel}.
          </p>
        ) : null}
      </div>

      {sourceCommentCount === 0 || dimensions.length === 0 ? (
        <EmptyState message="No written responses were submitted for this filtered cohort and selected diagnostic dimension." />
      ) : visibleCommentCount === 0 ? (
        <EmptyState
          message={`${sourceCommentCount} written ${sourceCommentCount === 1 ? "response exists" : "responses exist"} for this filtered cohort and selected diagnostic dimension, but ${withheldCommentCount === 1 ? "it is" : "they are"} withheld by the qualitative disclosure controls. No verbatim text is shown because the cohort or relevant respondent perspective is below the current privacy threshold of n=${threshold}.`}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {dimensions.map((dimension) => (
            <FilteredQualitativeDimensionCard
              key={dimension.dimensionKey}
              dimension={dimension}
              summary={summary}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilteredQualitativeDimensionCard({
  dimension,
  summary,
}: {
  dimension: CohortQualitativeDimension;
  summary: ProjectSummaryResponse;
}) {
  const metadata = summary.dimensions.find(
    (item) => item.dimensionKey === dimension.dimensionKey,
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="font-semibold text-slate-900">
          {metadata?.dimensionLabel ?? formatLabel(dimension.dimensionKey)}
        </h3>
        <div className="flex flex-wrap gap-2">
          <SubtlePill>{dimension.sourceCommentCount} submitted</SubtlePill>
          <SubtlePill>{dimension.commentCount} visible</SubtlePill>
          {dimension.withheldCommentCount > 0 ? (
            <SubtlePill>{dimension.withheldCommentCount} withheld</SubtlePill>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {dimension.comments.map((comment, index) => (
          <div
            key={`${comment.questionnaireType}-${index}`}
            className="rounded-xl bg-slate-50 p-4"
          >
            <Badge>{PERSPECTIVE_LABELS[comment.questionnaireType]}</Badge>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {comment.commentText}
            </p>
          </div>
        ))}

        {dimension.withheldCommentCount > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            {dimension.withheldCommentCount} written {dimension.withheldCommentCount === 1 ? "response is" : "responses are"}
            {" "}withheld for this dimension because the applicable privacy
            threshold is not met. The existence and count of the evidence are
            shown, but the verbatim text is not returned to the Explorer client.
          </div>
        ) : null}
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
        <div className="flex items-center gap-1.5">
          <Badge>{formatLabel(dimension.confidence)} confidence</Badge>
          <InfoTooltip label={`${dimension.dimensionLabel} qualitative confidence`}>
            This dimension currently has {dimension.commentCount} written
            {dimension.commentCount === 1 ? " comment" : " comments"} across{" "}
            {dimension.respondentGroupsWithComments.length} respondent
            {dimension.respondentGroupsWithComments.length === 1
              ? " perspective"
              : " perspectives"}
            . The current model classifies that evidence as {dimension.confidence}{" "}
            qualitative confidence. Treat the comments as contextual evidence,
            not scored evidence.
          </InfoTooltip>
        </div>
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
    <label
      className={`flex items-center gap-3 text-sm ${
        disabled
          ? "cursor-not-allowed text-slate-400"
          : "cursor-pointer text-slate-700"
      }`}
    >
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-semibold leading-none text-slate-500 hover:border-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E6FD9]/30"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-0 top-6 z-50 w-72 rounded-xl bg-slate-950 px-3 py-2.5 text-left text-xs font-normal leading-5 text-white shadow-xl transition ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
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

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatMetricValue(value: number | null): string {
  if (typeof value !== "number") {
    return "-";
  }

  const rounded = roundMetric(value);
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
