import { NextResponse } from "next/server";
import {
  upsertD1HealthCheckProspect,
  type D1HealthCheckProspectRow,
} from "../../../lib/d1/crm-prospects";
import { getD1Database } from "../../../lib/d1/database";

type ProspectProbeRow = {
  prospect_id: string;
  submission_id: string;
  name: string | null;
  company: string | null;
  relationship: string;
  status: string;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;

  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "::1"
  );
}

async function cleanupProbe(
  database: D1Database,
  submissionId: string,
): Promise<boolean> {
  const deleteResult = await database
    .prepare(
      `DELETE FROM diagnostic_submissions
      WHERE submission_id = ?`,
    )
    .bind(submissionId)
    .run();

  if (!deleteResult.success || deleteResult.meta.changes < 1) {
    return false;
  }

  const remaining = await database
    .prepare(
      `SELECT COUNT(*) AS count
      FROM health_check_prospects
      WHERE submission_id = ?`,
    )
    .bind(submissionId)
    .first<{ count: number }>();

  return remaining?.count === 0;
}

export async function POST(request: Request) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const database = getD1Database();
  const probeId = crypto.randomUUID();
  const submissionId = `d1-crm-probe-submission-${probeId}`;
  const prospectId = `d1-crm-probe-prospect-${probeId}`;
  const diagnosticId = `d1-crm-probe-diagnostic-${probeId}`;
  const createdAt = new Date().toISOString();
  const updatedAt = new Date(Date.now() + 1_000).toISOString();

  try {
    const seedResult = await database
      .prepare(
        `INSERT INTO diagnostic_submissions (
          id,
          submission_id,
          submission_source
        ) VALUES (?, ?, ?)`,
      )
      .bind(diagnosticId, submissionId, "d1-crm-local-probe")
      .run();

    if (!seedResult.success || seedResult.meta.changes !== 1) {
      throw new Error("The D1 CRM probe submission seed did not succeed.");
    }

    const initialRow: D1HealthCheckProspectRow = {
      prospectId,
      submissionId,
      name: "D1 CRM Probe",
      company: "Van Esch QA",
      relationship: "weak",
      status: "not_contacted",
      lastContactDate: null,
      nextActionDate: null,
      source: "website",
      notes: null,
      createdAt,
      updatedAt: createdAt,
    };

    await upsertD1HealthCheckProspect(initialRow);

    await upsertD1HealthCheckProspect({
      ...initialRow,
      name: "D1 CRM Probe Updated",
      company: "Van Esch QA Updated",
      relationship: "medium",
      status: "contacted",
      notes: "Temporary local application-writer probe.",
      updatedAt,
    });

    let identityConflictRejected = false;

    try {
      await upsertD1HealthCheckProspect({
        ...initialRow,
        prospectId: crypto.randomUUID(),
        updatedAt,
      });
    } catch (error) {
      identityConflictRejected =
        error instanceof Error &&
        error.message ===
          "D1 Health Check prospect identity does not match Supabase.";
    }

    if (!identityConflictRejected) {
      throw new Error("The D1 CRM identity conflict was not rejected.");
    }

    const row = await database
      .prepare(
        `SELECT
          prospect_id,
          submission_id,
          name,
          company,
          relationship,
          status,
          source,
          notes,
          created_at,
          updated_at
        FROM health_check_prospects
        WHERE submission_id = ?`,
      )
      .bind(submissionId)
      .first<ProspectProbeRow>();

    const insertPassed =
      row?.prospect_id === prospectId &&
      row.submission_id === submissionId &&
      row.created_at === createdAt;

    const updatePassed =
      row?.name === "D1 CRM Probe Updated" &&
      row.company === "Van Esch QA Updated" &&
      row.relationship === "medium" &&
      row.status === "contacted" &&
      row.source === "website" &&
      row.notes === "Temporary local application-writer probe." &&
      row.updated_at === updatedAt;

    if (!insertPassed || !updatePassed) {
      throw new Error("The D1 CRM application-writer verification failed.");
    }

    const cleanupPassed = await cleanupProbe(database, submissionId);

    if (!cleanupPassed) {
      throw new Error("The D1 CRM probe cleanup did not pass.");
    }

    return NextResponse.json({
      status: "ok",
      d1: {
        applicationInsert: "passed",
        applicationUpdate: "passed",
        identityConflict: "passed",
        cascadeCleanup: "passed",
      },
    });
  } catch (error) {
    let cleanup = "failed";

    try {
      const cleanupResult = await database
        .prepare(
          `DELETE FROM diagnostic_submissions
          WHERE submission_id = ?`,
        )
        .bind(submissionId)
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
