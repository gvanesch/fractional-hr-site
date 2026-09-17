import { NextResponse } from "next/server";
import {
  syncD1AdvisorProspectMutation,
  syncD1HealthCheckProspectMutation,
  type D1AdvisorProspectRow,
  type D1HealthCheckProspectRow,
} from "../../../lib/d1/crm-prospects";
import { getD1Database } from "../../../lib/d1/database";

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;

  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "::1"
  );
}

export async function POST(request: Request) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const database = getD1Database();
  const probeId = crypto.randomUUID();
  const advisorSubmissionId = `d1-crm-tx-advisor-submission-${probeId}`;
  const healthSubmissionId = `d1-crm-tx-health-submission-${probeId}`;
  const advisorDiagnosticId = `d1-crm-tx-advisor-diagnostic-${probeId}`;
  const healthDiagnosticId = `d1-crm-tx-health-diagnostic-${probeId}`;
  const advisorProspectId = `d1-crm-tx-advisor-prospect-${probeId}`;
  const healthProspectId = `d1-crm-tx-health-prospect-${probeId}`;
  const advisorActivityId = `d1-crm-tx-advisor-activity-${probeId}`;
  const healthActivityId = `d1-crm-tx-health-activity-${probeId}`;
  const createdAt = new Date().toISOString();
  const updatedAt = new Date(Date.now() + 1_000).toISOString();

  try {
    const seedResults = await database.batch([
      database
        .prepare(
          `INSERT INTO diagnostic_submissions (
            id,
            submission_id,
            submission_source
          ) VALUES (?, ?, ?)`,
        )
        .bind(
          advisorDiagnosticId,
          advisorSubmissionId,
          "d1-crm-transaction-probe",
        ),
      database
        .prepare(
          `INSERT INTO diagnostic_submissions (
            id,
            submission_id,
            submission_source
          ) VALUES (?, ?, ?)`,
        )
        .bind(
          healthDiagnosticId,
          healthSubmissionId,
          "d1-crm-transaction-probe",
        ),
    ]);

    if (
      seedResults.length !== 2 ||
      seedResults.some(
        (result) => !result.success || result.meta.changes !== 1,
      )
    ) {
      throw new Error("The D1 CRM transaction probe seed did not succeed.");
    }

    const advisorProspect: D1AdvisorProspectRow = {
      prospectId: advisorProspectId,
      name: "D1 Advisor Transaction Probe",
      company: "Van Esch QA",
      role: "Probe",
      source: "other",
      segment: "smb",
      diagnosticStatus: "completed",
      lastContactDate: null,
      nextActionDate: null,
      observedSignals: ["transaction-test"],
      notes: "Temporary local probe.",
      linkedSubmissionId: advisorSubmissionId,
      createdAt,
      updatedAt: createdAt,
      relationshipStrength: "medium",
      dealStage: "in_conversation",
      leadTemperature: "warm",
      nextStep: "Verify D1 transaction",
      lostReason: null,
      contactEmail: "d1-advisor-transaction@example.invalid",
      contactPhone: null,
      companyWebsite: null,
      billingContactName: null,
      billingContactEmail: null,
      linkedinUrl: null,
    };

    await syncD1AdvisorProspectMutation({
      prospect: advisorProspect,
      activities: [
        {
          activityId: advisorActivityId,
          prospectId: advisorProspectId,
          linkedSubmissionId: advisorSubmissionId,
          activityType: "transaction_probe_created",
          fieldName: null,
          oldValue: null,
          newValue: null,
          note: "Temporary local transaction probe.",
          changedBy: "d1-probe@example.invalid",
          createdAt,
          noteType: "internal",
        },
      ],
    });

    const healthProspect: D1HealthCheckProspectRow = {
      prospectId: healthProspectId,
      submissionId: healthSubmissionId,
      name: "D1 Health Transaction Probe",
      company: "Van Esch QA",
      relationship: "weak",
      status: "contacted",
      lastContactDate: null,
      nextActionDate: null,
      source: "website",
      notes: "Temporary local probe.",
      createdAt,
      updatedAt,
    };

    await syncD1HealthCheckProspectMutation({
      prospect: healthProspect,
      activities: [
        {
          activityId: healthActivityId,
          prospectId: healthProspectId,
          submissionId: healthSubmissionId,
          activityType: "transaction_probe_created",
          fieldName: null,
          oldValue: null,
          newValue: null,
          note: "Temporary local transaction probe.",
          changedBy: "d1-probe@example.invalid",
          createdAt,
        },
      ],
    });

    let rollbackTriggered = false;

    try {
      await syncD1AdvisorProspectMutation({
        prospect: {
          ...advisorProspect,
          name: "This update must roll back",
          updatedAt,
        },
        activities: [
          {
            activityId: advisorActivityId,
            prospectId: advisorProspectId,
            linkedSubmissionId: advisorSubmissionId,
            activityType: "duplicate_activity_id",
            fieldName: "name",
            oldValue: advisorProspect.name,
            newValue: "This update must roll back",
            note: null,
            changedBy: "d1-probe@example.invalid",
            createdAt: updatedAt,
            noteType: null,
          },
        ],
      });
    } catch {
      rollbackTriggered = true;
    }

    const advisorRow = await database
      .prepare(
        `SELECT
          name,
          json_extract(observed_signals, '$[0]') AS first_signal
        FROM advisor_prospects
        WHERE prospect_id = ?`,
      )
      .bind(advisorProspectId)
      .first<{ name: string | null; first_signal: string | null }>();

    const advisorActivityCount = await database
      .prepare(
        `SELECT COUNT(*) AS count
        FROM advisor_prospect_activity
        WHERE prospect_id = ?`,
      )
      .bind(advisorProspectId)
      .first<{ count: number }>();

    const healthRow = await database
      .prepare(
        `SELECT status, updated_at
        FROM health_check_prospects
        WHERE prospect_id = ?`,
      )
      .bind(healthProspectId)
      .first<{ status: string; updated_at: string }>();

    const healthActivityCount = await database
      .prepare(
        `SELECT COUNT(*) AS count
        FROM health_check_prospect_activity
        WHERE prospect_id = ?`,
      )
      .bind(healthProspectId)
      .first<{ count: number }>();

    const advisorBatchPassed =
      advisorRow?.name === advisorProspect.name &&
      advisorRow.first_signal === "transaction-test" &&
      advisorActivityCount?.count === 1;

    const healthBatchPassed =
      healthRow?.status === "contacted" &&
      healthRow.updated_at === updatedAt &&
      healthActivityCount?.count === 1;

    const rollbackPassed =
      rollbackTriggered &&
      advisorRow?.name === advisorProspect.name &&
      advisorActivityCount?.count === 1;

    if (!advisorBatchPassed || !healthBatchPassed || !rollbackPassed) {
      throw new Error("The D1 CRM transaction verification did not pass.");
    }

    await database.batch([
      database
        .prepare("DELETE FROM advisor_prospects WHERE prospect_id = ?")
        .bind(advisorProspectId),
      database
        .prepare(
          `DELETE FROM diagnostic_submissions
          WHERE submission_id IN (?, ?)`,
        )
        .bind(advisorSubmissionId, healthSubmissionId),
    ]);

    const remaining = await database
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM advisor_prospects WHERE prospect_id = ?) +
          (SELECT COUNT(*) FROM advisor_prospect_activity WHERE prospect_id = ?) +
          (SELECT COUNT(*) FROM health_check_prospects WHERE prospect_id = ?) +
          (SELECT COUNT(*) FROM health_check_prospect_activity WHERE prospect_id = ?) +
          (SELECT COUNT(*) FROM diagnostic_submissions
            WHERE submission_id IN (?, ?)) AS count`,
      )
      .bind(
        advisorProspectId,
        advisorProspectId,
        healthProspectId,
        healthProspectId,
        advisorSubmissionId,
        healthSubmissionId,
      )
      .first<{ count: number }>();

    if (remaining?.count !== 0) {
      throw new Error("The D1 CRM transaction probe cleanup did not pass.");
    }

    return NextResponse.json({
      status: "ok",
      d1: {
        advisorBatch: "passed",
        healthCheckBatch: "passed",
        rollback: "passed",
        cleanup: "passed",
      },
    });
  } catch (error) {
    try {
      await database.batch([
        database
          .prepare("DELETE FROM advisor_prospects WHERE prospect_id = ?")
          .bind(advisorProspectId),
        database
          .prepare(
            `DELETE FROM diagnostic_submissions
            WHERE submission_id IN (?, ?)`,
          )
          .bind(advisorSubmissionId, healthSubmissionId),
      ]);
    } catch {
      // Best-effort cleanup after a failed local-only probe.
    }

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        cleanup: "attempted",
      },
      { status: 500 },
    );
  }
}
