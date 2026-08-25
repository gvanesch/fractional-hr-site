import type { ProjectSummaryResponse } from "@/lib/client-diagnostic/build-project-summary";

type Segment = ProjectSummaryResponse["segmentation"]["segments"][number];
type SegmentDimension = Segment["dimensions"][number];

export type ExplorerPerspective = "hr" | "manager" | "leadership";

export type ExplorerSegmentSelection = {
  key: string;
  values: string[];
  respondentCount: number;
  respondentGroups: Record<ExplorerPerspective, number>;
  analyticalStrength: Segment["analyticalStrength"];
  compositionStatus: Segment["compositionStatus"];
  confidentialityStatus: Segment["confidentialityStatus"];
  dimensions: SegmentDimension[];
};

const PERSPECTIVES: ExplorerPerspective[] = [
  "hr",
  "manager",
  "leadership",
];

/**
 * Builds one deterministic union of mutually exclusive values from a single
 * project-defined segmentation dimension. The source segment means are
 * respondent-level means with respondent counts, so the union is recombined
 * using respondent weighting rather than averaging segment averages equally.
 *
 * This function deliberately does not support intersections across different
 * segmentation dimensions. Those require participant-level intersection
 * analysis and should be built as a separate canonical projection.
 */
export function buildExplorerSegmentSelection({
  segmentation,
  key,
  values,
  reportingMinN,
}: {
  segmentation: ProjectSummaryResponse["segmentation"];
  key: string;
  values: string[];
  reportingMinN: number;
}): ExplorerSegmentSelection | null {
  const uniqueValues = Array.from(new Set(values));
  const segments = segmentation.segments.filter(
    (segment) => segment.key === key && uniqueValues.includes(segment.value),
  );

  if (segments.length === 0) {
    return null;
  }

  const orderedSegments = uniqueValues
    .map((value) => segments.find((segment) => segment.value === value))
    .filter((segment): segment is Segment => Boolean(segment));

  const respondentGroups: Record<ExplorerPerspective, number> = {
    hr: 0,
    manager: 0,
    leadership: 0,
  };

  for (const segment of orderedSegments) {
    respondentGroups.hr += segment.respondentGroups.hr;
    respondentGroups.manager += segment.respondentGroups.manager;
    respondentGroups.leadership += segment.respondentGroups.leadership;
  }

  const respondentCount = PERSPECTIVES.reduce(
    (total, perspective) => total + respondentGroups[perspective],
    0,
  );

  const nonZeroGroups = PERSPECTIVES.filter(
    (perspective) => respondentGroups[perspective] > 0,
  );
  const largestGroup = Math.max(
    respondentGroups.hr,
    respondentGroups.manager,
    respondentGroups.leadership,
  );

  const compositionStatus: Segment["compositionStatus"] =
    nonZeroGroups.length <= 1
      ? "single_group"
      : respondentCount > 0 && largestGroup / respondentCount >= 0.75
        ? "group_dominated"
        : "mixed";

  const analyticalStrength: Segment["analyticalStrength"] =
    respondentCount < 5
      ? "insufficient"
      : respondentCount < 10
        ? "directional"
        : respondentCount < 20
          ? "moderate"
          : "strong";

  const confidentialityStatus: Segment["confidentialityStatus"] =
    respondentCount >= reportingMinN ? "reportable" : "suppressed";

  const dimensionKeys = Array.from(
    new Set(
      orderedSegments.flatMap((segment) =>
        segment.dimensions.map((dimension) => dimension.dimensionKey),
      ),
    ),
  );

  const dimensions = dimensionKeys.map((dimensionKey) => {
    const parts = orderedSegments
      .map((segment) =>
        segment.dimensions.find(
          (dimension) => dimension.dimensionKey === dimensionKey,
        ),
      )
      .filter((dimension): dimension is SegmentDimension => Boolean(dimension));

    const groups = {
      hr: combineSegmentGroup(parts, "hr", reportingMinN),
      manager: combineSegmentGroup(parts, "manager", reportingMinN),
      leadership: combineSegmentGroup(parts, "leadership", reportingMinN),
    };

    const dimensionRespondentCount = PERSPECTIVES.reduce(
      (total, perspective) => total + groups[perspective].n,
      0,
    );

    const weightedAverageTotal = parts.reduce((total, part) => {
      if (typeof part.averageScore !== "number" || part.respondentCount === 0) {
        return total;
      }

      return total + part.averageScore * part.respondentCount;
    }, 0);

    const averageScore =
      dimensionRespondentCount > 0
        ? weightedAverageTotal / dimensionRespondentCount
        : null;

    const contributingGroups = PERSPECTIVES.filter(
      (perspective) => groups[perspective].n > 0,
    );
    const allContributingGroupsReportable = contributingGroups.every(
      (perspective) => groups[perspective].n >= reportingMinN,
    );

    return {
      dimensionKey,
      respondentCount: dimensionRespondentCount,
      averageScore,
      clientReporting: {
        status: allContributingGroupsReportable ? "reportable" : "suppressed",
        reason: allContributingGroupsReportable
          ? "all_contributing_groups_reportable"
          : "suppressed_group_contributes",
      },
      groups,
      groupComparisons: [],
    } satisfies SegmentDimension;
  });

  return {
    key,
    values: orderedSegments.map((segment) => segment.value),
    respondentCount,
    respondentGroups,
    analyticalStrength,
    compositionStatus,
    confidentialityStatus,
    dimensions,
  };
}

function combineSegmentGroup(
  parts: SegmentDimension[],
  perspective: ExplorerPerspective,
  reportingMinN: number,
): SegmentDimension["groups"][ExplorerPerspective] {
  const n = parts.reduce(
    (total, part) => total + part.groups[perspective].n,
    0,
  );

  const weightedTotal = parts.reduce((total, part) => {
    const group = part.groups[perspective];

    return typeof group.mean === "number" && group.n > 0
      ? total + group.mean * group.n
      : total;
  }, 0);

  return {
    n,
    mean: n > 0 ? weightedTotal / n : null,
    clientReporting: {
      status: n >= reportingMinN ? "reportable" : "suppressed",
      reason: n >= reportingMinN ? "meets_threshold" : "below_threshold",
    },
  };
}
