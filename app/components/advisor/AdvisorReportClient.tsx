"use client";

import { useState } from "react";
import type {
  ClientDiagnosticReport,
  ReportAnalyticsDimension,
  ReportPriorityArea,
} from "@/lib/client-diagnostic/build-client-diagnostic-report";

type AdvisorReportClientProps = {
  report: ClientDiagnosticReport;
};

export default function AdvisorReportClient({
  report,
}: AdvisorReportClientProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const llmEvidencePack = buildLlmEvidencePack(report);

  async function handleCopyEvidencePack() {
    try {
      await navigator.clipboard.writeText(llmEvidencePack);
      setCopyState("copied");

      window.setTimeout(() => {
        setCopyState("idle");
      }, 3000);
    } catch {
      setCopyState("error");
    }
  }

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Diagnostic evidence pack
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6">
              {report.project.companyName}
            </p>

            <p className="brand-body-on-dark mt-4 max-w-3xl">
              Advisor-facing diagnostic output for analysis, report drafting,
              and LLM refinement. This is intentionally evidence-rich rather
              than client-polished.
            </p>

            <div className="mt-6 max-w-3xl rounded-2xl border border-amber-300/50 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
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
        </div>
      </section>

      <div className="brand-container space-y-10 py-10">
        <ReportSection title="Reporting evidence pack">
          <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-slate-900">
                Canonical advisor evidence pack
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Copy the structured advisor-only evidence used for LLM-assisted
                report generation, executive narrative, recommendations, ROI
                logic, and report storyline development.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2">
              <button
                type="button"
                onClick={() => void handleCopyEvidencePack()}
                className="inline-flex items-center justify-center rounded-xl bg-[#1E6FD9] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1859ad]"
              >
                Copy reporting evidence
              </button>

              {copyState === "copied" ? (
                <p className="text-sm font-medium text-emerald-700">
                  Copied to clipboard.
                </p>
              ) : null}

              {copyState === "error" ? (
                <p className="text-sm font-medium text-rose-700">
                  Copy failed. Please try again.
                </p>
              ) : null}
            </div>
          </div>
        </ReportSection>

        <ReportSection title="Diagnostic status">
          <p className="max-w-4xl text-sm leading-7 text-slate-600">
            High-level completion and scoring checks for advisor review before
            using the diagnostic evidence for report generation.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Completion"
              value={`${report.executiveSummary.completionPercentage}%`}
            />
            <Metric
              label="Respondent groups"
              value={`${report.executiveSummary.completedRespondentGroups}/${report.executiveSummary.totalRespondentGroups}`}
            />
            <Metric
              label="Overall score"
              value={formatMetricValue(report.analytics.overallScore)}
            />
            <Metric
              label="Alignment score"
              value={formatMetricValue(report.analytics.alignmentScore)}
            />
          </div>
        </ReportSection>

        <ReportSection title="Contextual evidence">
          <p className="max-w-4xl text-sm leading-7 text-slate-600">
            These inputs provide operating context only. They do not contribute
            to diagnostic scores, group gaps, priority scores, or analysis
            classifications.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Fact Pack"
              value={report.context.factPack.response ? "Available" : "Not available"}
            />
            <Metric
              label="Service access responses"
              value={String(report.context.serviceAccess.length)}
            />
            <Metric
              label="HR access responses"
              value={String(
                report.context.serviceAccess.filter(
                  (row) => row.questionnaire_type === "hr",
                ).length,
              )}
            />
            <Metric
              label="Manager access responses"
              value={String(
                report.context.serviceAccess.filter(
                  (row) => row.questionnaire_type === "manager",
                ).length,
              )}
            />
          </div>

        </ReportSection>

        <ReportSection title="Priority areas">
          <div className="space-y-4">
            {report.analytics.priorityAreas.length > 0 ? (
              report.analytics.priorityAreas.map((area) => (
                <PriorityAreaCard key={area.dimensionKey} area={area} />
              ))
            ) : (
              <EmptyState message="No priority areas could be identified from the current scored data set." />
            )}
          </div>
        </ReportSection>

        <ReportSection title="Dimension analytics and score signals">
          <div className="space-y-4">
            {report.analytics.dimensions.map((dimension) => (
              <DimensionAnalyticsCard
                key={dimension.dimensionKey}
                dimension={dimension}
              />
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Qualitative evidence">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-900">
              Overall qualitative read
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Metric
                label="Comment count"
                value={String(report.qualitative.overall.totalCommentCount)}
              />
              <Metric
                label="Groups with comments"
                value={
                  report.qualitative.overall.respondentGroupsWithComments.join(
                    ", ",
                  ) || "-"
                }
              />
              <Metric
                label="Cross-cutting themes"
                value={String(report.qualitative.overall.crossCuttingThemes.length)}
              />
            </div>

            {report.qualitative.overall.summary ? (
              <p className="mt-5 leading-7 text-slate-700">
                {report.qualitative.overall.summary}
              </p>
            ) : (
              <p className="mt-5 text-sm text-slate-600">
                No overall qualitative summary is available.
              </p>
            )}

            {report.qualitative.overall.crossCuttingThemes.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {report.qualitative.overall.crossCuttingThemes.map((theme) => (
                  <Badge key={theme.key}>
                    {theme.label} ({theme.count})
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            {report.qualitative.dimensions.map((dimension) => (
              <article
                key={dimension.dimensionKey}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    {dimension.dimensionLabel}
                  </h3>
                  <Badge>{dimension.confidence} qualitative confidence</Badge>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Metric
                    label="Comments"
                    value={String(dimension.commentCount)}
                  />
                  <Metric
                    label="Groups"
                    value={dimension.respondentGroupsWithComments.join(", ") || "-"}
                  />
                  <Metric
                    label="Themes"
                    value={String(dimension.keyThemes.length)}
                  />
                </div>

                {dimension.advisoryRead ? (
                  <EvidenceBlock
                    label="Advisory read"
                    value={dimension.advisoryRead}
                  />
                ) : null}

                {dimension.keyThemes.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
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
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Methodology and guardrails">
          <div className="grid gap-4 lg:grid-cols-3">
            <Metric
              label="Scored groups"
              value={report.methodology.scoredQuestionnaireTypes.join(", ")}
            />
            <Metric
              label="Excluded contextual inputs"
              value={report.methodology.contextualQuestionnaireTypesExcluded.join(
                ", ",
              )}
            />
            <Metric
              label="Confidence"
              value={report.analytics.confidenceLevel}
            />
          </div>

          <p className="mt-5 leading-7 text-slate-700">
            {report.methodology.note}
          </p>
        </ReportSection>
      </div>
    </main>
  );
}

function buildLlmEvidencePack(report: ClientDiagnosticReport): string {
  const itemLabelsByDimension: Record<string, string[]> = {
    process_clarity: [
      "End-to-end process sequence",
      "Routine process clarity",
      "Handoff action and ownership clarity",
      "Non-standard and complex scenario clarity",
      "Confident navigation with minimal HR clarification",
    ],
    consistency: [
      "Consistent principles for similar situations",
      "Manager application of policies and decision criteria",
      "Consistency of HR experience across the organisation",
      "Consistent application of standard HR processes",
      "Consistent handling of exceptions",
    ],
    service_access: [
      "Clarity about where to start",
      "Clarity of routes for different request types",
      "Ease of navigating support routes",
      "Confidence using intended support channels",
      "Trust that the chosen route reaches the right help",
    ],
    ownership: [
      "Clarity of responsibilities across roles",
      "Clarity of decision authority",
      "Transfer of responsibility at handoffs",
      "Accountability for progress to completion",
      "Ownership in complex or cross-functional matters",
    ],
    systems_enablement: [
      "Alignment of systems with the intended operating model",
      "Efficiency and usability of common HR activities",
      "Workflow and approval enablement",
      "Integration and avoidance of duplicate entry",
      "Status visibility and operational information",
    ],
    knowledge_self_service: [
      "Ease of finding guidance",
      "Clarity about the authoritative source",
      "Practical usability of guidance",
      "Trust that guidance is accurate and current",
      "Ability to resolve routine needs with minimal HR intervention",
    ],
    operational_capacity: [
      "Capacity to meet current demand",
      "Timeliness and backlog control",
      "Ability to absorb urgent or reactive demand",
      "Efficiency of routine demand management",
      "Capacity for improvement alongside day-to-day delivery",
    ],
    case_management: [
      "Structured capture of requests and issues",
      "Efficient routing",
      "Clarity of ownership through the case lifecycle",
      "Visibility of status and next action",
      "Process control and traceability",
    ],
    data_handoffs: [
      "Clarity of information required before transfer",
      "Completeness of information at handoff",
      "Accuracy and reliability of transferred information",
      "Confidence of the receiving team to continue",
      "First-time quality at handoff",
    ],
    change_resilience: [
      "Clarity of change communication",
      "Support for adoption",
      "Consistency of adoption",
      "Reinforcement after launch",
      "Sustained adoption as normal operating practice",
    ],
  };

  const priorityAreas = report.analytics.priorityAreas
    .map(
      (area, index) =>
        `${index + 1}. ${area.dimensionLabel}
   Average score: ${formatMetricValue(area.overallAverage)}
   Group gap: ${formatMetricValue(area.gap)}
   Priority score: ${formatMetricValue(area.priorityScore)}`,
    )
    .join("\n\n");

  const dimensionEvidence = report.dimensions
    .map((dimension) => {
      const analytics = report.analytics.dimensions.find(
        (item) => item.dimensionKey === dimension.dimensionKey,
      );

      const insight = report.insights.dimensions.find(
        (item) => item.dimensionKey === dimension.dimensionKey,
      );

      const itemEvidence = report.itemEvidence.dimensions.find(
        (item) => item.dimensionKey === dimension.dimensionKey,
      );

      const qualitative = report.qualitative.dimensions.find(
        (item) => item.dimensionKey === dimension.dimensionKey,
      );

      const itemLabels = itemLabelsByDimension[dimension.dimensionKey] ?? [];

      const itemLines = [1, 2, 3, 4, 5]
        .map((position) => {
          const key = `score_${position}` as keyof NonNullable<
            typeof itemEvidence
          >["items"];

          const label = itemLabels[position - 1] ?? `Item ${position}`;
          const value = itemEvidence?.items[key];

          if (!value) {
            return `${position}. ${label}: Not available`;
          }

          return `${position}. ${label}
   Combined: ${formatMetricValue(value.combined)}
   HR: ${formatMetricValue(value.groups.hr.mean)} (n=${value.groups.hr.n})
   Manager: ${formatMetricValue(value.groups.manager.mean)} (n=${value.groups.manager.n})
   Leadership: ${formatMetricValue(value.groups.leadership.mean)} (n=${value.groups.leadership.n})`;
        })
        .join("\n");

      return `## ${dimension.dimensionLabel}

Definition:
${dimension.dimensionDescription}

Scored evidence:
- Overall average: ${formatMetricValue(analytics?.overallAverage ?? null)}
- HR: ${formatMetricValue(dimension.scores.hr ?? null)}
- Manager: ${formatMetricValue(dimension.scores.manager ?? null)}
- Leadership: ${formatMetricValue(dimension.scores.leadership ?? null)}
- Group gap: ${formatMetricValue(dimension.gap)}
- Alignment classification: ${insight?.alignment ?? "Not available"}
- Strength classification: ${insight?.status ?? "Not available"}
- Evidence completeness: ${insight?.completeness ?? "Not available"}

Item-level evidence:
${itemLines}

Qualitative evidence:
- Comment count: ${qualitative?.commentCount ?? 0}
- Groups with comments: ${
        qualitative?.respondentGroupsWithComments.join(", ") || "None"
      }
- Theme counts: ${
        qualitative?.keyThemes.length
          ? qualitative.keyThemes
              .map((theme) => `${theme.label} (${theme.count})`)
              .join("; ")
          : "None"
      }
- Illustrative comments:
${
  qualitative?.illustrativeSignals.length
    ? qualitative.illustrativeSignals
        .map((signal) => `  - ${signal}`)
        .join("\n")
    : "  - None"
}`;
    })
    .join("\n\n");

  const qualitativeSummary = report.qualitative.overall.crossCuttingThemes
    .map((theme) => `- ${theme.label} (${theme.count})`)
    .join("\n");

  const segmentationInterpretationGuardrails = `## Segmentation interpretation guardrails

- Segment deltas are descriptive comparisons, not tests of statistical significance.
- Magnitude labels describe the size of the observed score difference only. They do not by themselves determine importance, confidence or causality.
- Interpretive use, analytical strength, confidentiality status and segment composition must be considered alongside any reported delta.
- Small samples reduce precision and may reduce publishable granularity. They do not automatically remove a perspective from the diagnostic.
- Leadership is a protected strategic perspective and may remain interpretively relevant even where the Leadership cohort is small. Where interpretive_use=caution, use the evidence as a qualified signal rather than a standalone conclusion.
- Do not infer causality from segment differences alone.
- Do not treat constrained comparisons as equivalent to independently reportable segment contrasts.
- Positive delta means the left segment or respondent group scored higher than the right. Negative delta means the right scored higher than the left.`;

  const segmentationComparisonEvidence = report.segmentation.comparisons
    .map((comparison) => {
      const dimensionLines =
        comparison.availability === "unavailable"
          ? ""
          : comparison.dimensions
              .map(
                (dimension) =>
                  `  - ${dimension.dimensionKey}: left=${formatMetricValue(
                    dimension.leftAverageScore,
                  )} | right=${formatMetricValue(
                    dimension.rightAverageScore,
                  )} | delta=${formatMetricValue(
                    dimension.delta,
                  )} | magnitude=${dimension.magnitude ?? "not_available"}`,
              )
              .join("\n");

      return `- ${comparison.key}: ${comparison.leftValue} vs ${comparison.rightValue} | availability=${comparison.availability} | analytical_strength=${comparison.analyticalStrength}${
        dimensionLines ? `\n${dimensionLines}` : ""
      }`;
    })
    .join("\n");

  const segmentationEvidence = report.segmentation.segments
    .map((segment) => {
      const dimensionLines =
        segment.confidentialityStatus === "suppressed"
          ? "Suppressed due to confidentiality threshold."
          : segment.dimensions
              .map((dimension) => {
                const groupComparisonLines = dimension.groupComparisons
                  .map(
                    (comparison) =>
                      `    ${comparison.leftGroup} vs ${comparison.rightGroup}: left=${formatMetricValue(
                        comparison.leftAverageScore,
                      )} (n=${comparison.leftN}) | right=${formatMetricValue(
                        comparison.rightAverageScore,
                      )} (n=${comparison.rightN}) | delta=${formatMetricValue(
                        comparison.delta,
                      )} | magnitude=${comparison.magnitude} | interpretive_use=${comparison.interpretiveUse} | client_reporting=${comparison.clientReporting.status} | reason=${comparison.clientReporting.reason}`,
                  )
                  .join("\n");

                return `  - ${dimension.dimensionKey}: ${formatMetricValue(
                  dimension.averageScore,
                )} (n=${dimension.respondentCount}) | client_reporting=${dimension.clientReporting.status} | reason=${dimension.clientReporting.reason}
    HR: ${formatMetricValue(dimension.groups.hr.mean)} (n=${dimension.groups.hr.n}) | client_reporting=${dimension.groups.hr.clientReporting.status} | reason=${dimension.groups.hr.clientReporting.reason}
    Manager: ${formatMetricValue(dimension.groups.manager.mean)} (n=${dimension.groups.manager.n}) | client_reporting=${dimension.groups.manager.clientReporting.status} | reason=${dimension.groups.manager.clientReporting.reason}
    Leadership: ${formatMetricValue(dimension.groups.leadership.mean)} (n=${dimension.groups.leadership.n}) | client_reporting=${dimension.groups.leadership.clientReporting.status} | reason=${dimension.groups.leadership.clientReporting.reason}${
                  groupComparisonLines ? `\n${groupComparisonLines}` : ""
                }`;
              })
              .join("\n");

      return `### ${segment.key}: ${segment.value}
Respondents: ${segment.respondentCount} | client_reporting=${segment.respondentCountClientReporting.status} | reason=${segment.respondentCountClientReporting.reason}
Respondent composition:
- HR: ${segment.respondentGroups.hr} | client_reporting=${segment.respondentGroupClientReporting.hr.status} | reason=${segment.respondentGroupClientReporting.hr.reason}
- Manager: ${segment.respondentGroups.manager} | client_reporting=${segment.respondentGroupClientReporting.manager.status} | reason=${segment.respondentGroupClientReporting.manager.reason}
- Leadership: ${segment.respondentGroups.leadership} | client_reporting=${segment.respondentGroupClientReporting.leadership.status} | reason=${segment.respondentGroupClientReporting.leadership.reason}

Deterministic segment classifications:
- Confidentiality: ${segment.confidentialityStatus}
- Analytical strength: ${segment.analyticalStrength}
- Composition: ${segment.compositionStatus}
- Independent segment interpretation: ${segment.independentSegmentInterpretation}
- Leadership evidence n: ${segment.leadershipEvidence.n}
- Leadership presence: ${segment.leadershipEvidence.presence}
- Leadership interpretive use: ${segment.leadershipEvidence.interpretiveUse}

Dimension averages:
${dimensionLines || "  - None"}`;
    })
    .join("\n\n");

  return `# Diagnostic Advisory Evidence Pack

## Purpose
This is the canonical evidence pack for advisory interpretation of the diagnostic for ${report.project.companyName}.

The downstream model must interpret the evidence. It must not treat any previous deterministic narrative, pattern label, or recommendation as authoritative because those are intentionally excluded from this pack.

## Evidence hierarchy and methodology guardrails

Scored evidence is the primary quantitative evidence.

Scored respondent groups:
${report.methodology.scoredQuestionnaireTypes.join(", ")}

Client Fact Pack and structured Service access information are contextual evidence. They may explain, corroborate, qualify or challenge an interpretation, but they must never be used to recalculate scored results, group gaps, alignment classifications or priority scores.

Do not infer causality from a score difference alone.
Do not interpret close agreement between respondent groups as evidence that the underlying capability is strong.
Do not interpret a lower score from one respondent group as evidence that the group itself is causing the problem.
Treat root causes as hypotheses unless supported by multiple forms of evidence.
Distinguish clearly between observed evidence, interpretation and hypothesis.
Where evidence conflicts, surface the contradiction rather than forcing a single conclusion.

## Project
Company: ${report.project.companyName}
Project ID: ${report.project.projectId}
Primary contact: ${report.project.primaryContactName}
Project status: ${report.project.projectStatus}

## Coverage
Completion: ${report.executiveSummary.completionPercentage}%
Completed respondent groups: ${report.executiveSummary.completedRespondentGroups}/${report.executiveSummary.totalRespondentGroups}

Respondent base:
- HR: ${report.evidenceBase.respondentGroups.hr.completed} completed / ${report.evidenceBase.respondentGroups.hr.invited} invited
- Manager: ${report.evidenceBase.respondentGroups.manager.completed} completed / ${report.evidenceBase.respondentGroups.manager.invited} invited
- Leadership: ${report.evidenceBase.respondentGroups.leadership.completed} completed / ${report.evidenceBase.respondentGroups.leadership.invited} invited

Overall score: ${formatMetricValue(report.analytics.overallScore)}
Perception alignment score: ${formatMetricValue(report.analytics.alignmentScore)}
Evidence confidence: ${report.analytics.confidenceLevel}

Important interpretation note:
The perception alignment score describes how close respondent-group scores are overall. A high alignment score means groups tend to report similar experiences. It does not mean the underlying HR operating model is strong or consistently executed.

## Deterministic priority ranking
The following ranking is calculated from the diagnostic scoring model. Preserve the supplied ranking and scores. Contextual evidence may enrich the interpretation of a priority but must not silently replace or recalculate this ordering.

${priorityAreas || "No priority areas identified."}

## Overall qualitative evidence
Total comments: ${report.qualitative.overall.totalCommentCount}
Respondent groups with comments: ${
    report.qualitative.overall.respondentGroupsWithComments.join(", ") || "None"
  }

Cross-cutting theme counts:
${qualitativeSummary || "- None"}

## Segmentation evidence
Segmentation dimensions are project-defined categorical attributes. Do not assume a key such as "location" represents countries, regions or any fixed geographic hierarchy unless the project configuration explicitly establishes that meaning.

Available segmentation dimensions:
${
  report.segmentation.availableKeys.length
    ? report.segmentation.availableKeys
        .map(
          (item) =>
            `- ${item.key}: ${item.values.join(", ")}`,
        )
        .join("\n")
    : "- None"
}

Single-segment summaries:
${segmentationInterpretationGuardrails}

${segmentationEvidence || "No scored segmentation evidence available."}

Comparison availability:
${segmentationComparisonEvidence || "- None"}

## Dimension evidence
${dimensionEvidence}

## Contextual evidence
The material below is contextual only and is outside the scored diagnostic.

### Structured Service access context
${buildServiceAccessEvidence(report.context.serviceAccess)}

### Client Fact Pack
Status: ${report.context.factPack.status ?? "Not available"}
Submitted: ${report.context.factPack.submittedAt ?? "Not available"}

${
  report.context.factPack.response
    ? JSON.stringify(report.context.factPack.response, null, 2)
    : "No Fact Pack response is available."
}

## Advisory interpretation instructions

Using only the evidence supplied above:

1. Identify the most important operating-model findings and explain why they matter.
2. Triangulate scored evidence, item-level evidence, group differences, qualitative comments and contextual evidence.
3. Use item-level scores to identify where within a dimension the evidence is concentrated. Do not assume the lowest item alone is the root cause.
4. Identify meaningful contradictions, such as leadership seeing a capability differently from managers, or formal design differing from reported day-to-day behaviour.
5. Distinguish broad organisational weakness from localised respondent-experience differences.
6. Treat contextual evidence as explanatory and corroborative, never as scored evidence.
7. Label causal explanations as hypotheses unless multiple independent evidence sources support them.
8. Do not invent evidence, statistics, respondent comments, systems, processes or organisational facts.
9. Do not alter supplied scores, gaps, classifications, priority scores or priority ordering.
10. Avoid blame language and avoid attributing operating-model weaknesses to a respondent group merely because that group scored lower.
11. Recommend actions that address the evidence rather than defaulting automatically to technology, policy, training or additional headcount.
12. Produce commercially useful senior-advisory language, not survey commentary.

The intended outputs are an executive narrative, principal findings, priority interpretation, recommended sequencing, practical actions, value or ROI hypotheses, and material risks or dependencies.`;
}



function buildServiceAccessEvidence(
  rows: ClientDiagnosticReport["context"]["serviceAccess"],
): string {
  if (rows.length === 0) {
    return "No structured Service access context is available.";
  }

  const hrRows = rows.filter((row) => row.questionnaire_type === "hr");
  const managerRows = rows.filter(
    (row) => row.questionnaire_type === "manager",
  );

  const countValues = (values: Array<string | null | undefined>) => {
    const counts = new Map<string, number>();

    for (const value of values) {
      if (!value) {
        continue;
      }

      counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value, count]) => `- ${value}: ${count}`)
      .join("\n");
  };

  const countRoutes = (sourceRows: typeof rows) => {
    const counts = new Map<string, number>();

    for (const row of sourceRows) {
      for (const route of row.routes_used ?? []) {
        counts.set(route, (counts.get(route) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([route, count]) => `- ${route}: ${count}`)
      .join("\n");
  };

  const effectivenessValues = managerRows
    .map((row) => row.usual_route_effectiveness)
    .filter((value): value is number => typeof value === "number");

  const averageEffectiveness =
    effectivenessValues.length > 0
      ? (
          effectivenessValues.reduce((sum, value) => sum + value, 0) /
          effectivenessValues.length
        ).toFixed(2)
      : "Not available";

  const hrIntendedModels = countValues(
    hrRows.map((row) => row.intended_access_model),
  );

  const hrPrimaryRoutes = countValues(
    hrRows.map((row) => row.intended_primary_route),
  );

  const managerUsualRoutes = countValues(
    managerRows.map((row) => row.usual_route),
  );

  const specificDetails = rows
    .map((row) => row.specific_route_detail?.trim())
    .filter((value): value is string => Boolean(value));

  return `Respondents: ${rows.length}
HR respondents: ${hrRows.length}
Manager respondents: ${managerRows.length}

HR intended access models:
${hrIntendedModels || "- None recorded"}

HR intended primary routes:
${hrPrimaryRoutes || "- None recorded"}

Routes HR reports are used:
${countRoutes(hrRows) || "- None recorded"}

Routes Managers report using:
${countRoutes(managerRows) || "- None recorded"}

Managers' usual routes:
${managerUsualRoutes || "- None recorded"}

Average Manager usual-route effectiveness:
${averageEffectiveness} / 5

Specific route detail:
${specificDetails.length
      ? specificDetails.map((detail) => `- ${detail}`).join("\n")
      : "- None recorded"
    }`;
}

function formatMetricValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    const normalizedValue =
      Math.round(value * 100) === 0 ? 0 : value;

    return Number.isInteger(normalizedValue)
      ? String(normalizedValue)
      : normalizedValue.toFixed(2);
  }

  return String(value);
}

function formatIssueType(value: string): string {
  switch (value) {
    case "behavioural":
      return "Execution variation";
    case "structural":
      return "Structural";
    case "fragile":
      return "Fragile";
    case "optimisation":
      return "Optimisation";
    case "insufficient-data":
      return "Insufficient data";
    default:
      return value;
  }
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="brand-surface-card p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-semibold text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
      {children}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}

function EvidenceBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-700">{value}</p>
    </div>
  );
}

function PriorityAreaCard({
  area,
}: {
  area: ReportPriorityArea;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="font-semibold text-slate-900">{area.dimensionLabel}</p>
        <Badge>{formatIssueType(area.issueType)}</Badge>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Metric
          label="Average score"
          value={formatMetricValue(area.overallAverage)}
        />
        <Metric label="Gap" value={formatMetricValue(area.gap)} />
        <Metric
          label="Priority score"
          value={formatMetricValue(area.priorityScore)}
        />
      </div>
    </div>
  );
}

function DimensionAnalyticsCard({
  dimension,
}: {
  dimension: ReportAnalyticsDimension;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          {dimension.dimensionLabel}
        </h3>
        <Badge>{formatIssueType(dimension.issueType)}</Badge>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Metric
          label="Overall"
          value={formatMetricValue(dimension.overallAverage)}
        />
        <Metric label="HR" value={formatMetricValue(dimension.hrScore)} />
        <Metric
          label="Manager"
          value={formatMetricValue(dimension.managerScore)}
        />
        <Metric
          label="Leadership"
          value={formatMetricValue(dimension.leadershipScore)}
        />
        <Metric label="Gap" value={formatMetricValue(dimension.gap)} />
        <Metric
          label="Priority"
          value={formatMetricValue(dimension.priorityScore)}
        />
      </div>
    </article>
  );
}