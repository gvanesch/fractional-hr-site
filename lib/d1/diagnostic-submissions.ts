import { getD1Database } from "./database";

export type D1HealthCheckSubmissionRow = {
  id: string;
  createdAt: string;
  companySize: string | null;
  industry: string | null;
  role: string | null;
  countryRegion: string | null;
  email: string | null;
  score: number;
  band: string;
  processClarityScore: number | null;
  consistencyScore: number | null;
  serviceAccessScore: number | null;
  ownershipScore: number | null;
  onboardingScore: number | null;
  technologyAlignmentScore: number | null;
  knowledgeSelfServiceScore: number | null;
  operationalCapacityScore: number | null;
  dataHandoffsScore: number | null;
  changeResilienceScore: number | null;
  answers: Record<number, number | undefined>;
  submissionId: string;
  advisorBrief: unknown;
  completedAt: string;
  submissionSource: "health-check";
  completionVersion: string;
  publicToken: string;
};

export async function insertD1HealthCheckSubmission(
  row: D1HealthCheckSubmissionRow,
): Promise<void> {
  const result = await getD1Database()
    .prepare(
      `INSERT INTO diagnostic_submissions (
        id,
        created_at,
        company_size,
        industry,
        role,
        country_region,
        email,
        score,
        band,
        process_clarity_score,
        consistency_score,
        service_access_score,
        ownership_score,
        onboarding_score,
        technology_alignment_score,
        knowledge_self_service_score,
        operational_capacity_score,
        data_handoffs_score,
        change_resilience_score,
        answers,
        submission_id,
        advisor_brief,
        completed_at,
        submission_source,
        completion_version,
        public_token
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )`,
    )
    .bind(
      row.id,
      row.createdAt,
      row.companySize,
      row.industry,
      row.role,
      row.countryRegion,
      row.email,
      row.score,
      row.band,
      row.processClarityScore,
      row.consistencyScore,
      row.serviceAccessScore,
      row.ownershipScore,
      row.onboardingScore,
      row.technologyAlignmentScore,
      row.knowledgeSelfServiceScore,
      row.operationalCapacityScore,
      row.dataHandoffsScore,
      row.changeResilienceScore,
      JSON.stringify(row.answers),
      row.submissionId,
      JSON.stringify(row.advisorBrief),
      row.completedAt,
      row.submissionSource,
      row.completionVersion,
      row.publicToken,
    )
    .run();

  if (!result.success) {
    throw new Error("D1 Health Check submission insert did not succeed.");
  }
}
