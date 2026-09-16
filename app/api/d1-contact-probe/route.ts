import { NextResponse } from "next/server";
import { getD1Database } from "../../../lib/d1/database";
import {
  insertD1ContactSubmission,
  insertD1HealthCheckSubmission,
  updateD1ContactSubmission,
} from "../../../lib/d1/diagnostic-submissions";

type ProbeRow = {
  submission_id: string;
  submission_source: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_source: string | null;
  score: number | null;
  answer_one: number | null;
  advisor_headline: string | null;
  public_token: string | null;
};

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;

  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "::1"
  );
}

async function cleanupProbeRows(
  database: D1Database,
  submissionIds: [string, string],
): Promise<boolean> {
  const result = await database
    .prepare(
      `DELETE FROM diagnostic_submissions
      WHERE submission_id IN (?, ?)`,
    )
    .bind(...submissionIds)
    .run();

  return result.success && result.meta.changes === 2;
}

export async function POST(request: Request) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const database = getD1Database();
  const probeId = crypto.randomUUID();
  const contactSubmissionId = `d1-contact-create-probe-${probeId}`;
  const healthCheckSubmissionId = `d1-contact-update-probe-${probeId}`;
  const healthCheckPublicToken = `d1-contact-probe-token-${probeId}`;
  const submissionIds: [string, string] = [
    contactSubmissionId,
    healthCheckSubmissionId,
  ];
  const now = new Date().toISOString();

  try {
    await insertD1ContactSubmission({
      id: crypto.randomUUID(),
      createdAt: now,
      submissionId: contactSubmissionId,
      submissionSource: "website-contact",
      contactName: "D1 Contact Create Probe",
      contactEmail: "d1-contact-create@example.invalid",
      contactCompany: "Van Esch Probe",
      contactTopic: "D1 contact create test",
      contactMessage: "Temporary local D1 contact creation probe.",
      contactSource: "local-probe",
      companySize: "1-10",
      industry: "Testing",
      role: "Probe",
      countryRegion: "GB",
      answers: { 1: 4 },
      score: 64,
      band: "Probe band",
      advisorBrief: { headline: "Contact create probe" },
      contactSubmittedAt: now,
    });

    await insertD1HealthCheckSubmission({
      id: crypto.randomUUID(),
      createdAt: now,
      companySize: "11-50",
      industry: "Testing",
      role: "Probe",
      countryRegion: "GB",
      email: "d1-health-check@example.invalid",
      score: 50,
      band: "Probe health band",
      processClarityScore: 3,
      consistencyScore: 3,
      serviceAccessScore: 3,
      ownershipScore: 3,
      onboardingScore: 3,
      technologyAlignmentScore: 3,
      knowledgeSelfServiceScore: 3,
      operationalCapacityScore: 3,
      dataHandoffsScore: 3,
      changeResilienceScore: 3,
      answers: { 1: 3 },
      submissionId: healthCheckSubmissionId,
      advisorBrief: { headline: "Health Check seed probe" },
      completedAt: now,
      submissionSource: "health-check",
      completionVersion: "local-probe",
      publicToken: healthCheckPublicToken,
    });

    const updated = await updateD1ContactSubmission({
      submissionId: healthCheckSubmissionId,
      contactName: "D1 Contact Update Probe",
      contactEmail: "d1-contact-update@example.invalid",
      contactCompany: "Van Esch Probe",
      contactTopic: "D1 contact update test",
      contactMessage: "Temporary local D1 contact update probe.",
      contactSource: "local-probe",
      companySize: "51-200",
      industry: "Updated testing",
      role: "Updated probe",
      countryRegion: "UK",
      answers: { 1: 5 },
      score: 72,
      band: "Updated probe band",
      advisorBrief: { headline: "Contact update probe" },
      contactSubmittedAt: now,
    });

    if (!updated) {
      throw new Error("The D1 contact update did not match its seeded row.");
    }

    const queryResult = await database
      .prepare(
        `SELECT
          submission_id,
          submission_source,
          contact_name,
          contact_email,
          contact_source,
          score,
          json_extract(answers, '$.1') AS answer_one,
          json_extract(advisor_brief, '$.headline') AS advisor_headline,
          public_token
        FROM diagnostic_submissions
        WHERE submission_id IN (?, ?)
        ORDER BY submission_id`,
      )
      .bind(...submissionIds)
      .all<ProbeRow>();

    if (!queryResult.success || queryResult.results.length !== 2) {
      throw new Error("The D1 contact probe rows could not be read back.");
    }

    const contactRow = queryResult.results.find(
      (row) => row.submission_id === contactSubmissionId,
    );
    const updatedHealthCheckRow = queryResult.results.find(
      (row) => row.submission_id === healthCheckSubmissionId,
    );

    const contactInsertPassed =
      contactRow?.submission_source === "website-contact" &&
      contactRow.contact_name === "D1 Contact Create Probe" &&
      contactRow.contact_email === "d1-contact-create@example.invalid" &&
      contactRow.contact_source === "local-probe" &&
      contactRow.score === 64;

    const contactUpdatePassed =
      updatedHealthCheckRow?.submission_source === "health-check" &&
      updatedHealthCheckRow.contact_name === "D1 Contact Update Probe" &&
      updatedHealthCheckRow.contact_email ===
        "d1-contact-update@example.invalid" &&
      updatedHealthCheckRow.contact_source === "local-probe" &&
      updatedHealthCheckRow.score === 72 &&
      updatedHealthCheckRow.public_token === healthCheckPublicToken;

    const jsonPassed =
      contactRow?.answer_one === 4 &&
      contactRow.advisor_headline === "Contact create probe" &&
      updatedHealthCheckRow?.answer_one === 5 &&
      updatedHealthCheckRow.advisor_headline === "Contact update probe";

    if (!contactInsertPassed || !contactUpdatePassed || !jsonPassed) {
      throw new Error("The D1 contact probe verification did not pass.");
    }

    const cleanupPassed = await cleanupProbeRows(database, submissionIds);

    if (!cleanupPassed) {
      throw new Error("The D1 contact probe cleanup did not pass.");
    }

    return NextResponse.json({
      status: "ok",
      d1: {
        contactInsert: "passed",
        contactUpdate: "passed",
        json: "passed",
        cleanup: "passed",
      },
    });
  } catch (error) {
    let cleanup = "failed";

    try {
      const cleanupResult = await database
        .prepare(
          `DELETE FROM diagnostic_submissions
          WHERE submission_id IN (?, ?)`,
        )
        .bind(...submissionIds)
        .run();

      cleanup = cleanupResult.success ? "attempted" : "failed";
    } catch {
      cleanup = "failed";
    }

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        cleanup,
      },
      { status: 500 },
    );
  }
}
