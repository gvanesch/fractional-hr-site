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
          </div>
        </div>
      </section>

      <div className="brand-container space-y-10 py-10">
        <ReportSection title="LLM evidence pack">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              Copy this structured source pack into an LLM to generate an
              executive summary, board narrative, PowerPoint storyline, ROI
              logic, recommendations, and next-step plan. It preserves the
              scoring guardrails and separates evidence from client-facing
              language.
            </p>

            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={() => void handleCopyEvidencePack()}
                className="inline-flex items-center justify-center rounded-xl bg-[#1E6FD9] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1859ad]"
              >
                Copy LLM evidence pack
              </button>

              {copyState === "copied" ? (
                <p className="text-sm font-medium text-emerald-700">
                  Copied to clipboard.
                </p>
              ) : null}

              {copyState === "error" ? (
                <p className="text-sm font-medium text-rose-700">
                  Copy failed. Select the text manually.
                </p>
              ) : null}
            </div>
          </div>

          <textarea
            readOnly
            value={llmEvidencePack}
            className="mt-5 min-h-[520px] w-full rounded-2xl border border-slate-300 bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-50 shadow-sm outline-none"
          />
        </ReportSection>

        <ReportSection title="Executive synthesis">
          <p className="leading-7 text-slate-700">
            {report.executiveSummary.overview}
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

        <ReportSection title="Priority clusters">
          <div className="grid gap-4 lg:grid-cols-2">
            <ClusterCard
              title="Structural"
              areas={report.analytics.priorityClusters.structural}
            />
            <ClusterCard
              title="Execution variation"
              areas={report.analytics.priorityClusters.behavioural}
            />
            <ClusterCard
              title="Fragile"
              areas={report.analytics.priorityClusters.fragile}
            />
            <ClusterCard
              title="Optimisation"
              areas={report.analytics.priorityClusters.optimisation}
            />
          </div>
        </ReportSection>

        <ReportSection title="Dimension narratives">
          <div className="space-y-5">
            {report.narratives.dimensions.map((narrative) => (
              <article
                key={narrative.dimensionKey}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    {narrative.dimensionLabel}
                  </h3>
                  <Badge>{narrative.confidence} confidence</Badge>
                </div>

                <EvidenceBlock label="Observation" value={narrative.observation} />
                <EvidenceBlock label="Implication" value={narrative.implication} />
                <EvidenceBlock
                  label="Recommended next step"
                  value={narrative.recommendedNextStep}
                />
              </article>
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Analysis patterns">
          <div className="space-y-4">
            {report.analyses.dimensions.map((analysis) => (
              <article
                key={analysis.dimensionKey}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    {analysis.dimensionLabel}
                  </h3>
                  <Badge>{analysis.confidence} confidence</Badge>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric
                    label="Primary pattern"
                    value={analysis.primaryPattern?.label ?? "-"}
                  />
                  <Metric
                    label="Secondary pattern"
                    value={analysis.secondaryPattern?.label ?? "-"}
                  />
                  <Metric label="Gap pattern" value={analysis.gapPattern} />
                  <Metric
                    label="Flags"
                    value={analysis.flags.length ? analysis.flags.join(", ") : "-"}
                  />
                </div>

                {analysis.primaryPattern ? (
                  <EvidenceBlock
                    label="Primary pattern description"
                    value={analysis.primaryPattern.description}
                  />
                ) : null}

                {analysis.secondaryPattern ? (
                  <EvidenceBlock
                    label="Secondary pattern description"
                    value={analysis.secondaryPattern.description}
                  />
                ) : null}
              </article>
            ))}
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
  const priorityAreas = report.analytics.priorityAreas
    .map(
      (area, index) =>
        `${index + 1}. ${area.dimensionLabel}
   Issue type: ${formatIssueType(area.issueType)}
   Average score: ${formatMetricValue(area.overallAverage)}
   Gap: ${formatMetricValue(area.gap)}
   Priority score: ${formatMetricValue(area.priorityScore)}`,
    )
    .join("\n\n");

  const dimensionNarratives = report.narratives.dimensions
    .map((narrative) => {
      const analysis = report.analyses.dimensions.find(
        (item) => item.dimensionKey === narrative.dimensionKey,
      );

      const qualitative = report.qualitative.dimensions.find(
        (item) => item.dimensionKey === narrative.dimensionKey,
      );

      return `## ${narrative.dimensionLabel}

Observation:
${narrative.observation}

Implication:
${narrative.implication}

Recommended next step:
${narrative.recommendedNextStep}

Analysis patterns:
- Primary pattern: ${analysis?.primaryPattern?.label ?? "Not identified"}
- Primary pattern description: ${analysis?.primaryPattern?.description ?? "Not available"}
- Secondary pattern: ${analysis?.secondaryPattern?.label ?? "Not identified"}
- Gap pattern: ${analysis?.gapPattern ?? "Not available"}
- Flags: ${analysis?.flags.length ? analysis.flags.join(", ") : "None"}

Qualitative evidence:
- Comment count: ${qualitative?.commentCount ?? 0}
- Groups with comments: ${qualitative?.respondentGroupsWithComments.join(", ") || "None"
        }
- Key themes: ${qualitative?.keyThemes.length
          ? qualitative.keyThemes
            .map((theme) => `${theme.label} (${theme.count})`)
            .join("; ")
          : "None"
        }
- Advisory read: ${qualitative?.advisoryRead ?? "Not available"}
- Illustrative signals:
${qualitative?.illustrativeSignals.length
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

  return `# Diagnostic Evidence Pack

## Project
Company: ${report.project.companyName}
Project ID: ${report.project.projectId}
Primary contact: ${report.project.primaryContactName}
Project status: ${report.project.projectStatus}

## Purpose
This is an advisor-facing source pack. It is not intended to be client-ready language. Use it to generate a client-facing executive summary, PowerPoint storyline, recommendations, ROI logic, implementation priorities, and next-step plan.

## Methodology guardrails
${report.methodology.note}

Scored respondent groups:
${report.methodology.scoredQuestionnaireTypes.join(", ")}

Contextual inputs excluded from scoring:
${report.methodology.contextualQuestionnaireTypesExcluded.join(", ")}

## Coverage and confidence
Completion: ${report.executiveSummary.completionPercentage}%
Completed respondent groups: ${report.executiveSummary.completedRespondentGroups}/${report.executiveSummary.totalRespondentGroups}
Overall score: ${formatMetricValue(report.analytics.overallScore)}
Alignment score: ${formatMetricValue(report.analytics.alignmentScore)}
Confidence level: ${report.analytics.confidenceLevel}

## Executive synthesis
${report.executiveSummary.overview}

## Priority areas
${priorityAreas || "No priority areas identified."}

## Overall qualitative evidence
Total comments: ${report.qualitative.overall.totalCommentCount}
Respondent groups with comments: ${report.qualitative.overall.respondentGroupsWithComments.join(", ") || "None"
    }

Summary:
${report.qualitative.overall.summary ?? "No qualitative summary available."}

Cross-cutting themes:
${qualitativeSummary || "- None"}

## Dimension evidence
${dimensionNarratives}

## Instructions for downstream report generation
Generate a client-facing report that:
1. Keeps the scored diagnostic separate from contextual inputs.
2. Does not claim statistical certainty beyond the response coverage and confidence level.
3. Uses the evidence above to produce an executive narrative, recommended priorities, suggested sequencing, ROI hypothesis, and practical next steps.
4. Avoids blame language. Position findings as opportunities to strengthen the operating model and make leaders more effective.
5. Converts evidence into clear, commercially useful advisory language.`;
}

function formatMetricValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
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

function ClusterCard({
  title,
  areas,
}: {
  title: string;
  areas: ReportPriorityArea[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>

      {areas.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {areas.map((area) => (
            <li key={area.dimensionKey}>
              <strong>{area.dimensionLabel}</strong>: score{" "}
              {formatMetricValue(area.overallAverage)}, gap{" "}
              {formatMetricValue(area.gap)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          No priority area currently falls into this cluster.
        </p>
      )}
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