import { notFound } from "next/navigation";
import CopyBriefingButton from "./CopyBriefingButton";
import { isUuid } from "@/lib/client-diagnostic/build-project-summary";
import {
  buildClientDiagnosticReport,
  type ClientDiagnosticReport,
  type ReportIssueType,
} from "@/lib/client-diagnostic/build-client-diagnostic-report";


export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type ScoredQuestionnaireType = "hr" | "manager" | "leadership";

type DimensionInsight = ClientDiagnosticReport["insights"]["dimensions"][number];
type DimensionNarrative = ClientDiagnosticReport["narratives"]["dimensions"][number];
type DimensionAnalysis = ClientDiagnosticReport["analyses"]["dimensions"][number];
type ClientSafeDimensionSummary = ClientDiagnosticReport["dimensions"][number];
type QualitativeThemeSummary =
  ClientDiagnosticReport["qualitative"]["overall"]["crossCuttingThemes"][number];
type ReportPriorityArea = ClientDiagnosticReport["analytics"]["priorityAreas"][number];
type ReportAnalyticsDimension =
  ClientDiagnosticReport["analytics"]["dimensions"][number];

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatScore(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "null";
  }

  return value.toFixed(1);
}

function formatGap(value: number | null): string {
  if (typeof value !== "number") {
    return "null";
  }

  return value.toFixed(2);
}

function formatIssueType(issueType: ReportIssueType): string {
  switch (issueType) {
    case "structural":
      return "structural";
    case "behavioural":
      return "behavioural_inconsistency";
    case "fragile":
      return "fragile_uneven";
    case "optimisation":
      return "optimisation";
    case "insufficient-data":
      return "insufficient_data";
    default:
      return issueType;
  }
}

function formatAlignmentLabel(
  alignment: DimensionInsight["alignment"],
): string {
  switch (alignment) {
    case "aligned":
      return "aligned";
    case "emerging_gap":
      return "emerging_gap";
    case "significant_gap":
      return "significant_gap";
    default:
      return "unknown";
  }
}

function formatStatusLabel(status: DimensionInsight["status"]): string {
  switch (status) {
    case "strong":
      return "strong";
    case "moderate":
      return "moderate";
    case "weak":
      return "weak";
    default:
      return "unknown";
  }
}

function formatCompletenessLabel(
  completeness: DimensionInsight["completeness"],
): string {
  switch (completeness) {
    case "sufficient":
      return "sufficient";
    case "partial":
      return "partial";
    case "insufficient":
      return "insufficient";
    default:
      return completeness;
  }
}

function formatConfidenceLabel(
  confidence: "high" | "medium" | "low",
): string {
  switch (confidence) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return confidence;
  }
}

function formatGapPatternLabel(value: string): string {
  switch (value) {
    case "none":
      return "none";
    case "hr_lower_than_leadership":
      return "hr_lower_than_leadership";
    case "manager_lower_than_others":
      return "manager_lower_than_others";
    case "leadership_lower_than_others":
      return "leadership_lower_than_others";
    case "general_spread":
      return "general_spread";
    default:
      return value;
  }
}

function formatThemeList(themes: QualitativeThemeSummary[]): string {
  if (themes.length === 0) {
    return "none";
  }

  return themes.map((theme) => `${theme.label} (${theme.count})`).join(", ");
}

function formatSignalList(signals: string[]): string {
  return signals.length > 0 ? signals.join(" | ") : "none";
}

function formatDimensionLabelList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}

function getLikelyOperatingModelPattern(
  report: ClientDiagnosticReport,
): string {
  const analyses = report.analyses.dimensions;
  const managerExecutionGaps = analyses.filter(
    (item) => item.primaryPattern?.code === "MANAGER_EXECUTION_GAP",
  ).length;
  const uniformWeaknesses = analyses.filter(
    (item) => item.primaryPattern?.code === "UNIFORM_WEAKNESS",
  ).length;
  const structuralCount = report.analytics.priorityClusters.structural.length;
  const behaviouralCount = report.analytics.priorityClusters.behavioural.length;

  if (managerExecutionGaps >= 3) {
    return "design_to_execution_translation_gap";
  }

  if (uniformWeaknesses >= 3 && structuralCount >= behaviouralCount) {
    return "broad_structural_operating_weakness";
  }

  if (behaviouralCount > structuralCount) {
    return "high_variation_in_application_across_groups";
  }

  return "mixed_operating_model_weakness";
}

function buildBriefingDocument(report: ClientDiagnosticReport): string {
  const insightMap = new Map(
    report.insights.dimensions.map((insight) => [insight.dimensionKey, insight]),
  );

  const analysisMap = new Map(
    report.analyses.dimensions.map((analysis) => [
      analysis.dimensionKey,
      analysis,
    ]),
  );

  const narrativeMap = new Map(
    report.narratives.dimensions.map((narrative) => [
      narrative.dimensionKey,
      narrative,
    ]),
  );

  const qualitativeMap = new Map(
    report.qualitative.dimensions.map((dimension) => [
      dimension.dimensionKey,
      dimension,
    ]),
  );

  const analyticsMap = new Map(
    report.analytics.dimensions.map((dimension) => [
      dimension.dimensionKey,
      dimension,
    ]),
  );

  const managerExecutionGapDimensions = report.analyses.dimensions
    .filter((item) => item.primaryPattern?.code === "MANAGER_EXECUTION_GAP")
    .map((item) => item.dimensionLabel);

  const uniformWeaknessDimensions = report.analyses.dimensions
    .filter((item) => item.primaryPattern?.code === "UNIFORM_WEAKNESS")
    .map((item) => item.dimensionLabel);

  const highGapDimensions = report.analytics.dimensions
    .filter((item) => typeof item.gap === "number" && item.gap >= 1.0)
    .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))
    .map((item) => item.dimensionLabel);

  const lowAverageDimensions = report.analytics.dimensions
    .filter(
      (item) =>
        typeof item.overallAverage === "number" && item.overallAverage <= 2.3,
    )
    .sort((a, b) => (a.overallAverage ?? 99) - (b.overallAverage ?? 99))
    .map((item) => item.dimensionLabel);

  const topPriorityDimensionLabels = report.analytics.priorityAreas.map(
    (item) => item.dimensionLabel,
  );

  const lines: string[] = [];

  lines.push("ROLE");
  lines.push(
    "You are an expert HR Operations and Transformation advisor. Use the structured diagnostic data below to produce a high-quality consulting narrative.",
  );
  lines.push("");

  lines.push("TASK");
  lines.push(
    "Produce: 1) executive summary, 2) key cross-dimensional themes, 3) sequenced priority actions, 4) risks if unaddressed, 5) optional 30-60-90 day focus plan.",
  );
  lines.push("");

  lines.push("CONSTRAINTS");
  lines.push(
    "Focus on interpretation, operating model implications, and sequencing. Do not just restate scores. Avoid generic HR language. Use the structure and evidence provided. Treat synthesis_hints as high-value pattern signals.",
  );
  lines.push("");

  lines.push("DOCUMENT_STATUS");
  lines.push(
    "This information is proprietary and confidential. All rights reserved. Van Esch Advisory Ltd.",
  );
  lines.push("");

  lines.push("PROJECT");
  lines.push(`company_name: ${report.project.companyName}`);
  lines.push(`project_id: ${report.project.projectId}`);
  lines.push(`primary_contact_name: ${report.project.primaryContactName}`);
  lines.push(`project_status: ${report.project.projectStatus}`);
  lines.push("");

  lines.push("TOP_LEVEL_SUMMARY");
  lines.push(`executive_overview: ${report.executiveSummary.overview}`);
  lines.push(`overall_score: ${formatScore(report.analytics.overallScore)}`);
  lines.push(`alignment_score: ${formatScore(report.analytics.alignmentScore)}`);
  lines.push(`confidence_level: ${report.analytics.confidenceLevel}`);
  lines.push(
    `completion_percentage: ${report.executiveSummary.completionPercentage}`,
  );
  lines.push(
    `completed_respondent_groups: ${report.executiveSummary.completedRespondentGroups}`,
  );
  lines.push(
    `total_respondent_groups: ${report.executiveSummary.totalRespondentGroups}`,
  );
  lines.push("");

  lines.push("SUMMARY_COUNTS");
  lines.push(`status_strong: ${report.insightSummary.status.strong}`);
  lines.push(`status_moderate: ${report.insightSummary.status.moderate}`);
  lines.push(`status_weak: ${report.insightSummary.status.weak}`);
  lines.push(`alignment_aligned: ${report.insightSummary.alignment.aligned}`);
  lines.push(
    `alignment_emerging_gap: ${report.insightSummary.alignment.emergingGap}`,
  );
  lines.push(
    `alignment_significant_gap: ${report.insightSummary.alignment.significantGap}`,
  );
  lines.push(
    `completeness_sufficient: ${report.insightSummary.completeness.sufficient}`,
  );
  lines.push(
    `completeness_partial: ${report.insightSummary.completeness.partial}`,
  );
  lines.push(
    `completeness_insufficient: ${report.insightSummary.completeness.insufficient}`,
  );
  lines.push("");

  lines.push("SYNTHESIS_HINTS");
  lines.push(
    `top_priority_dimensions: ${formatDimensionLabelList(
      topPriorityDimensionLabels,
    )}`,
  );
  lines.push(
    `dimensions_with_manager_execution_gap: ${formatDimensionLabelList(
      managerExecutionGapDimensions,
    )}`,
  );
  lines.push(
    `dimensions_with_uniform_weakness: ${formatDimensionLabelList(
      uniformWeaknessDimensions,
    )}`,
  );
  lines.push(
    `dimensions_with_high_gap: ${formatDimensionLabelList(highGapDimensions)}`,
  );
  lines.push(
    `dimensions_with_low_average_score: ${formatDimensionLabelList(
      lowAverageDimensions,
    )}`,
  );
  lines.push(
    `recurring_qualitative_themes: ${formatThemeList(
      report.qualitative.overall.crossCuttingThemes,
    )}`,
  );
  lines.push(
    `likely_operating_model_pattern: ${getLikelyOperatingModelPattern(report)}`,
  );
  lines.push("");

  lines.push("TOP_PRIORITY_DIMENSIONS");
  if (report.analytics.priorityAreas.length === 0) {
    lines.push("none");
  } else {
    for (const area of report.analytics.priorityAreas) {
      lines.push(
        `- ${area.dimensionLabel} | average=${formatScore(
          area.overallAverage,
        )} | gap=${formatGap(area.gap)} | issue_type=${formatIssueType(
          area.issueType,
        )} | priority_score=${area.priorityScore.toFixed(2)}`,
      );
    }
  }
  lines.push("");

  lines.push("CROSS_CUTTING_QUALITATIVE");
  lines.push(
    `overall_qualitative_summary: ${
      report.qualitative.overall.summary ?? "none"
    }`,
  );
  lines.push(
    `cross_cutting_themes: ${formatThemeList(
      report.qualitative.overall.crossCuttingThemes,
    )}`,
  );
  lines.push("");

  lines.push("PRIORITY_CLUSTERS");
  lines.push(
    `structural: ${
      report.analytics.priorityClusters.structural.length > 0
        ? report.analytics.priorityClusters.structural
            .map((item) => item.dimensionLabel)
            .join(", ")
        : "none"
    }`,
  );
  lines.push(
    `behavioural_inconsistency: ${
      report.analytics.priorityClusters.behavioural.length > 0
        ? report.analytics.priorityClusters.behavioural
            .map((item) => item.dimensionLabel)
            .join(", ")
        : "none"
    }`,
  );
  lines.push(
    `fragile_uneven: ${
      report.analytics.priorityClusters.fragile.length > 0
        ? report.analytics.priorityClusters.fragile
            .map((item) => item.dimensionLabel)
            .join(", ")
        : "none"
    }`,
  );
  lines.push(
    `optimisation: ${
      report.analytics.priorityClusters.optimisation.length > 0
        ? report.analytics.priorityClusters.optimisation
            .map((item) => item.dimensionLabel)
            .join(", ")
        : "none"
    }`,
  );
  lines.push("");

  lines.push("DIMENSION_DATA");

  for (const dimension of report.dimensions) {
    const insight = insightMap.get(dimension.dimensionKey);
    const analysis = analysisMap.get(dimension.dimensionKey);
    const narrative = narrativeMap.get(dimension.dimensionKey);
    const qualitative = qualitativeMap.get(dimension.dimensionKey);
    const analytics = analyticsMap.get(dimension.dimensionKey);

    lines.push("");
    lines.push(`dimension_key: ${dimension.dimensionKey}`);
    lines.push(`dimension_label: ${dimension.dimensionLabel}`);
    lines.push(`dimension_description: ${dimension.dimensionDescription}`);

    lines.push("quantitative:");
    lines.push(`  hr_score: ${formatScore(dimension.scores.hr)}`);
    lines.push(`  manager_score: ${formatScore(dimension.scores.manager)}`);
    lines.push(`  leadership_score: ${formatScore(dimension.scores.leadership)}`);
    lines.push(`  overall_average: ${formatScore(analytics?.overallAverage)}`);
    lines.push(`  gap: ${formatGap(dimension.gap)}`);
    lines.push(
      `  issue_type: ${formatIssueType(
        analytics?.issueType ?? "insufficient-data",
      )}`,
    );
    lines.push(
      `  priority_score: ${
        typeof analytics?.priorityScore === "number"
          ? analytics.priorityScore.toFixed(2)
          : "null"
      }`,
    );

    lines.push("diagnostic:");
    lines.push(
      `  status: ${insight ? formatStatusLabel(insight.status) : "null"}`,
    );
    lines.push(
      `  alignment: ${
        insight ? formatAlignmentLabel(insight.alignment) : "null"
      }`,
    );
    lines.push(
      `  completeness: ${
        insight ? formatCompletenessLabel(insight.completeness) : "null"
      }`,
    );
    lines.push(
      `  analysis_confidence: ${
        analysis ? formatConfidenceLabel(analysis.confidence) : "null"
      }`,
    );
    lines.push(
      `  primary_pattern_code: ${analysis?.primaryPattern?.code ?? "null"}`,
    );
    lines.push(
      `  primary_pattern_description: ${
        analysis?.primaryPattern?.description ?? "null"
      }`,
    );
    lines.push(
      `  primary_pattern_severity: ${
        analysis?.primaryPattern?.severity ?? "null"
      }`,
    );
    lines.push(
      `  secondary_pattern_code: ${analysis?.secondaryPattern?.code ?? "null"}`,
    );
    lines.push(
      `  secondary_pattern_description: ${
        analysis?.secondaryPattern?.description ?? "null"
      }`,
    );
    lines.push(
      `  gap_pattern: ${
        analysis ? formatGapPatternLabel(analysis.gapPattern) : "null"
      }`,
    );

    lines.push("implications:");
    lines.push(
      `  operational_implication: ${narrative?.implication ?? "null"}`,
    );
    lines.push(
      `  advised_next_step: ${narrative?.recommendedNextStep ?? "null"}`,
    );

    lines.push("qualitative_evidence:");
    lines.push(
      `  comment_count: ${qualitative ? String(qualitative.commentCount) : "0"}`,
    );
    lines.push(
      `  confidence: ${
        qualitative ? formatConfidenceLabel(qualitative.confidence) : "null"
      }`,
    );
    lines.push(
      `  themes: ${
        qualitative ? formatThemeList(qualitative.keyThemes) : "none"
      }`,
    );
    lines.push(
      `  illustrative_signals: ${
        qualitative ? formatSignalList(qualitative.illustrativeSignals) : "none"
      }`,
    );
  }

  lines.push("");
  lines.push("METHODOLOGY");
  lines.push(`methodology_note: ${report.methodology.note}`);
  lines.push(
    `included_groups: ${report.methodology.scoredQuestionnaireTypes.join(", ")}`,
  );
  lines.push(
    `excluded_contextual_groups: ${report.methodology.contextualQuestionnaireTypesExcluded.join(
      ", ",
    )}`,
  );

  return lines.join("\n");
}

export default async function ClientDiagnosticBriefingPage({
  params,
}: PageProps) {
  const { projectId } = await params;

  if (!isUuid(projectId)) {
    notFound();
  }

  let report: ClientDiagnosticReport;

  try {
    report = await buildClientDiagnosticReport(projectId);
  } catch (error) {
    console.error("Unable to render client diagnostic briefing page.", error);
    notFound();
  }

  const briefing = buildBriefingDocument(report);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                Client diagnostic briefing
              </h1>

              <p className="text-sm leading-7 text-slate-600">
                Plain structured output for manual copy and paste into an LLM.
                This information is proprietary and confidential. All rights
                reserved. Van Esch Advisory Ltd.
              </p>
            </div>

            <CopyBriefingButton text={briefing} />
          </div>

          <pre className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm leading-7 text-slate-800">
            {briefing}
          </pre>
        </div>
      </div>
    </main>
  );
}