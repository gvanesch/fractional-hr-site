import fs from "node:fs";

function replaceOnce(path, oldText, newText, label) {
  const source = fs.readFileSync(path, "utf8");
  const matches = source.split(oldText).length - 1;

  if (matches !== 1) {
    throw new Error(`${label}: expected exactly one match in ${path}, found ${matches}.`);
  }

  fs.writeFileSync(path, source.replace(oldText, newText));
  console.log(`patched: ${label}`);
}

function replaceAllExpected(path, oldText, newText, expected, label) {
  const source = fs.readFileSync(path, "utf8");
  const matches = source.split(oldText).length - 1;

  if (matches !== expected) {
    throw new Error(`${label}: expected ${expected} matches in ${path}, found ${matches}.`);
  }

  fs.writeFileSync(path, source.split(oldText).join(newText));
  console.log(`patched: ${label}`);
}

const operationalGapOld = `    const numericScores = Object.values(scores).filter(
      (value): value is number => typeof value === "number",
    );

    const maxScore =
      numericScores.length > 0 ? roundToTwo(Math.max(...numericScores)) : null;
    const minScore =
      numericScores.length > 0 ? roundToTwo(Math.min(...numericScores)) : null;
    const gap =
      maxScore !== null && minScore !== null
        ? roundToTwo(maxScore - minScore)
        : null;`;

const operationalGapNew = `    const hrScore = typeof scores.hr === "number" ? scores.hr : null;
    const managerScore =
      typeof scores.manager === "number" ? scores.manager : null;
    const operationalScores = [hrScore, managerScore].filter(
      (value): value is number => typeof value === "number",
    );

    const maxScore =
      operationalScores.length > 0
        ? roundToTwo(Math.max(...operationalScores))
        : null;
    const minScore =
      operationalScores.length > 0
        ? roundToTwo(Math.min(...operationalScores))
        : null;
    const gap =
      hrScore !== null && managerScore !== null
        ? roundToTwo(Math.abs(hrScore - managerScore))
        : null;`;

for (const path of [
  "lib/client-diagnostic/build-project-summary.ts",
  "lib/client-diagnostic/get-project-summary.ts",
]) {
  replaceOnce(
    path,
    operationalGapOld,
    operationalGapNew,
    `${path}: operational HR/Manager gap`,
  );
}

const respondentWeightedInsightsOld = `  const dimensionInsights = buildDimensionInsights(dimensions);`;
const respondentWeightedInsightsNew = `  const dimensionInsights = buildDimensionInsights(
    dimensions.map((dimension) => ({
      ...dimension,
      respondentCounts: {
        hr: new Set(
          dimensionScoreRows
            .filter(
              (row) =>
                row.dimension_key === dimension.dimensionKey &&
                row.questionnaire_type === "hr",
            )
            .map((row) => row.participant_id)
            .filter(
              (participantId): participantId is string =>
                participantId !== null,
            ),
        ).size,
        manager: new Set(
          dimensionScoreRows
            .filter(
              (row) =>
                row.dimension_key === dimension.dimensionKey &&
                row.questionnaire_type === "manager",
            )
            .map((row) => row.participant_id)
            .filter(
              (participantId): participantId is string =>
                participantId !== null,
            ),
        ).size,
        leadership: new Set(
          dimensionScoreRows
            .filter(
              (row) =>
                row.dimension_key === dimension.dimensionKey &&
                row.questionnaire_type === "leadership",
            )
            .map((row) => row.participant_id)
            .filter(
              (participantId): participantId is string =>
                participantId !== null,
            ),
        ).size,
      },
    })),
  );`;

for (const path of [
  "lib/client-diagnostic/build-project-summary.ts",
  "lib/client-diagnostic/get-project-summary.ts",
]) {
  replaceOnce(
    path,
    respondentWeightedInsightsOld,
    respondentWeightedInsightsNew,
    `${path}: respondent-weighted insight inputs`,
  );
}

replaceOnce(
  "lib/client-diagnostic/get-project-summary.ts",
  `import { createClient } from "@supabase/supabase-js";`,
  `import { createSupabaseAdminClient } from "@/lib/supabase/admin";`,
  "get-project-summary: shared guarded Supabase import",
);

replaceOnce(
  "lib/client-diagnostic/get-project-summary.ts",
  `function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

`,
  ``,
  "get-project-summary: remove local Supabase factory",
);

replaceAllExpected(
  "lib/client-diagnostic/get-project-summary.ts",
  `getSupabaseAdminClient()`,
  `createSupabaseAdminClient()`,
  1,
  "get-project-summary: use guarded Supabase factory",
);

replaceOnce(
  "app/api/advisor-daily-action-digest/route.ts",
  `import { createClient } from "@supabase/supabase-js";`,
  `import { createSupabaseAdminClient } from "@/lib/supabase/admin";`,
  "advisor digest: shared guarded Supabase import",
);

replaceOnce(
  "app/api/advisor-daily-action-digest/route.ts",
  `function getSupabaseAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Missing Supabase environment variables.");
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey);
}

`,
  ``,
  "advisor digest: remove local Supabase factory",
);

replaceAllExpected(
  "app/api/advisor-daily-action-digest/route.ts",
  `getSupabaseAdminClient()`,
  `createSupabaseAdminClient()`,
  3,
  "advisor digest: use guarded Supabase factory",
);

replaceOnce(
  "lib/client-diagnostic/insight-engine.ts",
  `  respondentCounts?: QuestionnaireTypeRespondentCounts;`,
  `  respondentCounts: QuestionnaireTypeRespondentCounts;`,
  "insight engine: require respondent counts",
);

replaceOnce(
  "lib/client-diagnostic/insight-engine.ts",
  `const HR_OPERATIONAL_WEIGHT = 0.55;
const MANAGER_OPERATIONAL_WEIGHT = 0.45;

`,
  ``,
  "insight engine: remove superseded fixed weights",
);

replaceOnce(
  "lib/client-diagnostic/insight-engine.ts",
  `/**
 * Canonical overall diagnostic maturity is the respondent-weighted mean across
 * all scored respondent perspectives: HR, Manager and Leadership.
 *
 * Each respondent therefore contributes equally to the aggregate irrespective
 * of stakeholder group. Group means remain separate interpretive evidence and
 * Leadership retains its distinct strategic/sponsor interpretation.
 *
 * The optional respondentCounts property is transitional while the two summary
 * builders are migrated. Once supplied, it is the canonical calculation path.
 * Existing callers without counts retain the previous HR/Manager calculation so
 * this methodology migration can be wired safely without an intermediate break.
 */
function getOverallAverageScore(
  scores: QuestionnaireTypeScores,
  respondentCounts?: QuestionnaireTypeRespondentCounts,
): number | null {
  if (respondentCounts) {
    let weightedScoreTotal = 0;
    let respondentTotal = 0;

    for (const questionnaireType of SCORED_QUESTIONNAIRE_TYPES) {
      const score = scores[questionnaireType];
      const respondentCount = respondentCounts[questionnaireType] ?? 0;

      if (
        typeof score !== "number" ||
        !Number.isFinite(score) ||
        !Number.isFinite(respondentCount) ||
        respondentCount <= 0
      ) {
        continue;
      }

      weightedScoreTotal += score * respondentCount;
      respondentTotal += respondentCount;
    }

    return respondentTotal > 0
      ? roundToTwoDecimals(weightedScoreTotal / respondentTotal)
      : null;
  }

  const hr = typeof scores.hr === "number" ? scores.hr : null;
  const manager = typeof scores.manager === "number" ? scores.manager : null;

  if (hr !== null && manager !== null) {
    return roundToTwoDecimals(
      hr * HR_OPERATIONAL_WEIGHT + manager * MANAGER_OPERATIONAL_WEIGHT,
    );
  }

  if (hr !== null) {
    return roundToTwoDecimals(hr);
  }

  if (manager !== null) {
    return roundToTwoDecimals(manager);
  }

  return null;
}`,
  `/**
 * Canonical overall diagnostic maturity is the respondent-weighted mean across
 * all scored respondent perspectives: HR, Manager and Leadership.
 *
 * Each completed scored respondent therefore contributes equally to the
 * aggregate through their respondent-level dimension score. Group means remain
 * separate interpretive evidence and Leadership retains its distinct
 * strategic/sponsor interpretation.
 */
function getOverallAverageScore(
  scores: QuestionnaireTypeScores,
  respondentCounts: QuestionnaireTypeRespondentCounts,
): number | null {
  let weightedScoreTotal = 0;
  let respondentTotal = 0;

  for (const questionnaireType of SCORED_QUESTIONNAIRE_TYPES) {
    const score = scores[questionnaireType];
    const respondentCount = respondentCounts[questionnaireType] ?? 0;

    if (
      typeof score !== "number" ||
      !Number.isFinite(score) ||
      !Number.isFinite(respondentCount) ||
      respondentCount <= 0
    ) {
      continue;
    }

    weightedScoreTotal += score * respondentCount;
    respondentTotal += respondentCount;
  }

  return respondentTotal > 0
    ? roundToTwoDecimals(weightedScoreTotal / respondentTotal)
    : null;
}`,
  "insight engine: remove transitional 55/45 fallback",
);

replaceOnce(
  "lib/client-diagnostic/build-client-diagnostic-report.ts",
  `  const numericScores = Object.values(scores).filter(
    (value): value is number => typeof value === "number",
  );

  const maxScore =
    numericScores.length > 0 ? Number(Math.max(...numericScores).toFixed(2)) : null;

  const minScore =
    numericScores.length > 0 ? Number(Math.min(...numericScores).toFixed(2)) : null;

  const gap =
    maxScore !== null && minScore !== null
      ? Number((maxScore - minScore).toFixed(2))
      : null;`,
  `  const hrScore = typeof scores.hr === "number" ? scores.hr : null;
  const managerScore =
    typeof scores.manager === "number" ? scores.manager : null;
  const operationalScores = [hrScore, managerScore].filter(
    (value): value is number => typeof value === "number",
  );

  const maxScore =
    operationalScores.length > 0
      ? Number(Math.max(...operationalScores).toFixed(2))
      : null;

  const minScore =
    operationalScores.length > 0
      ? Number(Math.min(...operationalScores).toFixed(2))
      : null;

  const gap =
    hrScore !== null && managerScore !== null
      ? Number(Math.abs(hrScore - managerScore).toFixed(2))
      : null;`,
  "client report: operational HR/Manager gap",
);

replaceOnce(
  "lib/client-diagnostic/build-client-diagnostic-report.ts",
  `function buildAnalyticsDimensions(
  dimensions: ClientSafeDimensionSummary[],
): ReportAnalyticsDimension[] {
  return dimensions.map((dimension) => {
    const hrScore = dimension.scores.hr ?? null;
    const managerScore = dimension.scores.manager ?? null;
    const leadershipScore = dimension.scores.leadership ?? null;

    const overallAverage = average(
      [hrScore, managerScore, leadershipScore].filter(
        (value): value is number => typeof value === "number",
      ),
    );

    const issueType = classifyIssueType({
      overallAverage,
      gap: dimension.gap,
    });

    const priorityScore = calculatePriorityScore({
      overallAverage,
      gap: dimension.gap,
    });

    return {
      dimensionKey: dimension.dimensionKey,
      dimensionLabel: dimension.dimensionLabel,
      overallAverage,
      hrScore,
      managerScore,
      leadershipScore,
      gap: dimension.gap,
      priorityScore,
      issueType,
    };
  });
}`,
  `function buildAnalyticsDimensions(
  dimensions: ClientSafeDimensionSummary[],
  insights: DimensionInsight[],
): ReportAnalyticsDimension[] {
  return dimensions.map((dimension) => {
    const hrScore = dimension.scores.hr ?? null;
    const managerScore = dimension.scores.manager ?? null;
    const leadershipScore = dimension.scores.leadership ?? null;
    const insight = insights.find(
      (candidate) => candidate.dimensionKey === dimension.dimensionKey,
    );
    const overallAverage = insight?.averageScore ?? null;
    const gap = insight?.gap ?? dimension.gap;

    const issueType = classifyIssueType({
      overallAverage,
      gap,
    });

    const priorityScore = calculatePriorityScore({
      overallAverage,
      gap,
    });

    return {
      dimensionKey: dimension.dimensionKey,
      dimensionLabel: dimension.dimensionLabel,
      overallAverage,
      hrScore,
      managerScore,
      leadershipScore,
      gap,
      priorityScore,
      issueType,
    };
  });
}`,
  "client report: use canonical insight average and gap",
);

replaceOnce(
  "lib/client-diagnostic/build-client-diagnostic-report.ts",
  `  const analyticsDimensions = buildAnalyticsDimensions(clientSafeDimensions);`,
  `  const analyticsDimensions = buildAnalyticsDimensions(
    clientSafeDimensions,
    summaryInsights,
  );`,
  "client report: pass canonical insights to analytics",
);

replaceOnce(
  "lib/client-diagnostic/build-client-diagnostic-report.ts",
  `      "There are meaningful differences in how HR, managers, and leadership experience people operations, suggesting that the current model is not being experienced consistently across the organisation.";`,
  `      "There are meaningful differences between HR and Manager experience of people operations, suggesting that important parts of the current model are not being experienced consistently in day-to-day operation. Leadership should be interpreted separately as a strategic perspective.";`,
  "client report: low alignment narrative",
);

replaceOnce(
  "lib/client-diagnostic/build-client-diagnostic-report.ts",
  `      "There are clear differences in how HR, managers, and leadership experience people operations, suggesting inconsistency in how processes are understood or applied.";`,
  `      "There are clear differences between HR and Manager experience of people operations, suggesting inconsistency in how processes are understood or applied in day-to-day operation. Leadership remains a separate strategic perspective.";`,
  "client report: significant gap narrative",
);

replaceOnce(
  "lib/client-diagnostic/build-client-diagnostic-report.ts",
  `      "Several dimensions show meaningful differences in how HR, managers, and leadership experience the operating model. The pattern is not organisation-wide disagreement, but it does indicate that important parts of the model are landing differently across respondent groups.";`,
  `      "Several dimensions show meaningful differences between HR and Manager experience of the operating model. The pattern is not organisation-wide disagreement, but it does indicate that important parts of the model are landing differently in operational experience. Leadership should be read separately as a strategic perspective.";`,
  "client report: emerging gap narrative",
);

replaceOnce(
  "lib/client-diagnostic/build-client-diagnostic-report.ts",
  `      "Perceptions across HR, managers, and leadership are broadly aligned, suggesting that processes are generally understood and applied consistently.";`,
  `      "HR and Manager perceptions are broadly aligned on the operational experience. This indicates similar views of how the model is working, not that the underlying capabilities are necessarily strong. Leadership remains a separate strategic perspective.";`,
  "client report: aligned narrative",
);

console.log("All diagnostic finalization patches applied successfully.");
