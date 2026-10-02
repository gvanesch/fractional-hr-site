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

export type D1ContactSubmissionFields = {
  contactName: string;
  contactEmail: string;
  contactCompany: string | null;
  contactTopic: string | null;
  contactMessage: string;
  contactSource: string;
  companySize: string | null;
  industry: string | null;
  role: string | null;
  countryRegion: string | null;
  answers: unknown | null;
  score: number | null;
  band: string | null;
  advisorBrief: unknown | null;
  contactSubmittedAt: string;
};

export type D1ContactSubmissionRow = D1ContactSubmissionFields & {
  id: string;
  createdAt: string;
  submissionId: string;
  submissionSource: string;
};

export type D1ContactSubmissionUpdate = D1ContactSubmissionFields & {
  submissionId: string;
};

export type D1PublicDiagnosticSubmission = {
  submissionId: string;
  answers: unknown;
  companySize: string | null;
  industry: string | null;
  role: string | null;
  email: string | null;
};

function serializeJson(value: unknown, fieldName: string): string {
  const serialized = JSON.stringify(value);

  if (typeof serialized !== "string") {
    throw new Error(`Unable to serialize ${fieldName} for D1.`);
  }

  return serialized;
}

function serializeNullableJson(
  value: unknown | null,
  fieldName: string,
): string | null {
  if (value === null) {
    return null;
  }

  return serializeJson(value, fieldName);
}

export async function insertD1HealthCheckSubmission(
  row: D1HealthCheckSubmissionRow,
): Promise<void> {
  const answers = serializeJson(row.answers, "answers");
  const advisorBrief = serializeJson(row.advisorBrief, "advisor brief");

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
      answers,
      row.submissionId,
      advisorBrief,
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

export async function insertD1ContactSubmission(
  row: D1ContactSubmissionRow,
): Promise<void> {
  const answers = serializeNullableJson(row.answers, "answers");
  const advisorBrief = serializeNullableJson(
    row.advisorBrief,
    "advisor brief",
  );

  const result = await getD1Database()
    .prepare(
      `INSERT INTO diagnostic_submissions (
        id,
        created_at,
        company_size,
        industry,
        role,
        country_region,
        score,
        band,
        answers,
        submission_id,
        contact_name,
        contact_email,
        contact_company,
        contact_topic,
        contact_message,
        contact_source,
        advisor_brief,
        contact_submitted_at,
        submission_source
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
    )
    .bind(
      row.id,
      row.createdAt,
      row.companySize,
      row.industry,
      row.role,
      row.countryRegion,
      row.score,
      row.band,
      answers,
      row.submissionId,
      row.contactName,
      row.contactEmail,
      row.contactCompany,
      row.contactTopic,
      row.contactMessage,
      row.contactSource,
      advisorBrief,
      row.contactSubmittedAt,
      row.submissionSource,
    )
    .run();

  if (!result.success) {
    throw new Error("D1 contact submission insert did not succeed.");
  }
}

export async function updateD1ContactSubmission(
  row: D1ContactSubmissionUpdate,
): Promise<boolean> {
  const answers = serializeNullableJson(row.answers, "answers");
  const advisorBrief = serializeNullableJson(
    row.advisorBrief,
    "advisor brief",
  );

  const result = await getD1Database()
    .prepare(
      `UPDATE diagnostic_submissions
      SET
        contact_name = ?,
        contact_email = ?,
        contact_company = ?,
        contact_topic = ?,
        contact_message = ?,
        contact_source = ?,
        company_size = ?,
        industry = ?,
        role = ?,
        country_region = ?,
        answers = ?,
        score = ?,
        band = ?,
        advisor_brief = ?,
        contact_submitted_at = ?
      WHERE submission_id = ?`,
    )
    .bind(
      row.contactName,
      row.contactEmail,
      row.contactCompany,
      row.contactTopic,
      row.contactMessage,
      row.contactSource,
      row.companySize,
      row.industry,
      row.role,
      row.countryRegion,
      answers,
      row.score,
      row.band,
      advisorBrief,
      row.contactSubmittedAt,
      row.submissionId,
    )
    .run();

  if (!result.success) {
    throw new Error("D1 contact submission update did not succeed.");
  }

  return result.meta.changes === 1;
}

export async function getD1PublicDiagnosticSubmission(
  publicToken: string,
): Promise<D1PublicDiagnosticSubmission | null> {
  const row = await getD1Database()
    .prepare(
      `SELECT
        submission_id,
        answers,
        company_size,
        industry,
        role,
        email
      FROM diagnostic_submissions
      WHERE public_token = ?
      LIMIT 1`,
    )
    .bind(publicToken)
    .first<{
      submission_id: string;
      answers: string | null;
      company_size: string | null;
      industry: string | null;
      role: string | null;
      email: string | null;
    }>();

  if (!row) {
    return null;
  }

  let answers: unknown = null;

  if (row.answers !== null) {
    try {
      answers = JSON.parse(row.answers);
    } catch {
      throw new Error("D1 returned invalid diagnostic answers JSON.");
    }
  }

  return {
    submissionId: row.submission_id,
    answers,
    companySize: row.company_size,
    industry: row.industry,
    role: row.role,
    email: row.email,
  };
}

export async function updateD1PublicDiagnosticEmail(
  publicToken: string,
  email: string,
): Promise<boolean> {
  const result = await getD1Database()
    .prepare(
      `UPDATE diagnostic_submissions
      SET email = ?
      WHERE public_token = ?`,
    )
    .bind(email, publicToken)
    .run();

  if (!result.success) {
    throw new Error("D1 public diagnostic email update did not succeed.");
  }

  return result.meta.changes === 1;
}
