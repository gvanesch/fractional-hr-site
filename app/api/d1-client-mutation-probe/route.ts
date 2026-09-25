import { NextResponse } from "next/server";
import {
  D1ClientDiagnosticMutationError,
  saveD1ClientFactPack,
  submitD1ClientDiagnostic,
} from "@/lib/d1/client-diagnostic-mutations";
import { getD1Database } from "@/lib/d1/database";

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;

  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "::1"
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function POST(request: Request) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const db = getD1Database();
  const probeId = crypto.randomUUID();
  const projectId = `d1-mutation-runtime-project-${probeId}`;
  const diagnosticParticipantId = `d1-mutation-runtime-diagnostic-${probeId}`;
  const rollbackParticipantId = `d1-mutation-runtime-rollback-${probeId}`;
  const factPackParticipantId = `d1-mutation-runtime-fact-pack-${probeId}`;
  const diagnosticInvite = `d1-mutation-runtime-diagnostic-invite-${probeId}`;
  const rollbackInvite = `d1-mutation-runtime-rollback-invite-${probeId}`;
  const factPackInvite = `d1-mutation-runtime-fact-pack-invite-${probeId}`;
  const startedAt = new Date();
  const expiresAt = new Date(
    startedAt.getTime() + 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    const seedResults = await db.batch([
      db
        .prepare(
          `INSERT INTO client_projects (
            project_id,
            company_name,
            primary_contact_name,
            primary_contact_email,
            project_status
          ) VALUES (?, ?, ?, ?, 'active')`,
        )
        .bind(
          projectId,
          "D1 Mutation Runtime Probe Ltd",
          "Probe Contact",
          "probe@example.invalid",
        ),
      db
        .prepare(
          `INSERT INTO client_participants (
            participant_id,
            project_id,
            questionnaire_type,
            role_label,
            invite_token,
            participant_status,
            name,
            email,
            invite_expires_at
          ) VALUES (?, ?, 'hr', ?, ?, 'invited', ?, ?, ?)`,
        )
        .bind(
          diagnosticParticipantId,
          projectId,
          "HR lead",
          diagnosticInvite,
          "Diagnostic Probe",
          "diagnostic@example.invalid",
          expiresAt,
        ),
      db
        .prepare(
          `INSERT INTO client_participants (
            participant_id,
            project_id,
            questionnaire_type,
            role_label,
            invite_token,
            participant_status,
            name,
            email,
            invite_expires_at
          ) VALUES (?, ?, 'hr', ?, ?, 'invited', ?, ?, ?)`,
        )
        .bind(
          rollbackParticipantId,
          projectId,
          "Rollback probe",
          rollbackInvite,
          "Rollback Probe",
          "rollback@example.invalid",
          expiresAt,
        ),
      db
        .prepare(
          `INSERT INTO client_participants (
            participant_id,
            project_id,
            questionnaire_type,
            role_label,
            invite_token,
            participant_status,
            name,
            email,
            invite_expires_at
          ) VALUES (?, ?, 'client_fact_pack', ?, ?, 'invited', ?, ?, ?)`,
        )
        .bind(
          factPackParticipantId,
          projectId,
          "Client fact pack",
          factPackInvite,
          "Fact Pack Probe",
          "fact-pack@example.invalid",
          expiresAt,
        ),
    ]);

    assert(
      seedResults.length === 4 &&
        seedResults.every(
          (result) => result.success && result.meta.changes === 1,
        ),
      "D1 mutation runtime seed failed.",
    );

    const diagnosticResult = await submitD1ClientDiagnostic({
      projectId,
      participantId: diagnosticParticipantId,
      inviteToken: diagnosticInvite,
      questionnaireType: "hr",
      responseRows: [
        {
          dimension_key: "process_clarity",
          question_key: "probe-score-one",
          answer_value: 4,
          comment_text: null,
        },
        {
          dimension_key: "process_clarity",
          question_key: "probe-comment-one",
          answer_value: null,
          comment_text: "Runtime mutation probe",
        },
      ],
      dimensionScoreRows: [
        {
          dimension_key: "process_clarity",
          average_score: 4,
          response_count: 1,
        },
      ],
      serviceAccessContext: {
        routesUsed: ["shared_hr_email"],
        intendedAccessModel: "single_default_route",
        intendedPrimaryRoute: "shared_hr_email",
        specificRouteDetail: "Runtime probe route",
      },
      now: startedAt,
    });
    assert(
      diagnosticResult.savedResponseCount === 2 &&
        diagnosticResult.dimensionScoresCreated === 1 &&
        diagnosticResult.serviceAccessContextSaved,
      "D1 diagnostic mutation returned incorrect counts.",
    );

    const diagnosticState = await db
      .prepare(
        `SELECT
          participant.participant_status,
          participant.completed_at,
          (SELECT count(*) FROM client_responses
            WHERE participant_id = participant.participant_id) AS responses,
          (SELECT count(*) FROM client_dimension_scores
            WHERE participant_id = participant.participant_id) AS scores,
          (SELECT count(*) FROM client_service_access_context
            WHERE participant_id = participant.participant_id) AS contexts
        FROM client_participants AS participant
        WHERE participant.participant_id = ?`,
      )
      .bind(diagnosticParticipantId)
      .first<{
        participant_status: string;
        completed_at: string | null;
        responses: number;
        scores: number;
        contexts: number;
      }>();
    assert(
      diagnosticState?.participant_status === "completed" &&
        diagnosticState.completed_at === startedAt.toISOString() &&
        diagnosticState.responses === 2 &&
        diagnosticState.scores === 1 &&
        diagnosticState.contexts === 1,
      "D1 diagnostic mutation state was incomplete.",
    );

    let duplicateSubmissionRejected = false;
    try {
      await submitD1ClientDiagnostic({
        projectId,
        participantId: diagnosticParticipantId,
        inviteToken: diagnosticInvite,
        questionnaireType: "hr",
        responseRows: [],
        dimensionScoreRows: [],
        now: new Date(startedAt.getTime() + 1_000),
      });
    } catch (error) {
      duplicateSubmissionRejected =
        error instanceof D1ClientDiagnosticMutationError &&
        error.message === "This questionnaire has already been submitted.";
    }
    assert(
      duplicateSubmissionRejected,
      "A completed D1 diagnostic could be submitted twice.",
    );

    let rollbackTriggered = false;
    try {
      await submitD1ClientDiagnostic({
        projectId,
        participantId: rollbackParticipantId,
        inviteToken: rollbackInvite,
        questionnaireType: "hr",
        responseRows: [
          {
            dimension_key: "process_clarity",
            question_key: "duplicate-question",
            answer_value: 3,
            comment_text: null,
          },
          {
            dimension_key: "process_clarity",
            question_key: "duplicate-question",
            answer_value: 4,
            comment_text: null,
          },
        ],
        dimensionScoreRows: [],
        now: startedAt,
      });
    } catch {
      rollbackTriggered = true;
    }
    assert(rollbackTriggered, "The D1 diagnostic rollback probe did not fail.");

    const rollbackState = await db
      .prepare(
        `SELECT
          participant_status,
          completed_at,
          (SELECT count(*) FROM client_responses
            WHERE participant_id = ?) AS responses
        FROM client_participants
        WHERE participant_id = ?`,
      )
      .bind(rollbackParticipantId, rollbackParticipantId)
      .first<{
        participant_status: string;
        completed_at: string | null;
        responses: number;
      }>();
    assert(
      rollbackState?.participant_status === "invited" &&
        rollbackState.completed_at === null &&
        rollbackState.responses === 0,
      "The failed D1 diagnostic mutation did not roll back atomically.",
    );

    const draftResult = await saveD1ClientFactPack({
      projectId,
      participantId: factPackParticipantId,
      inviteToken: factPackInvite,
      responseJson: { company: "Probe Ltd", employeeCount: 25 },
      mode: "draft",
      now: startedAt,
    });
    assert(
      draftResult.status === "in_progress",
      "The D1 fact pack draft did not remain in progress.",
    );

    const submitTime = new Date(startedAt.getTime() + 1_000);
    const factPackResult = await saveD1ClientFactPack({
      projectId,
      participantId: factPackParticipantId,
      inviteToken: factPackInvite,
      responseJson: { company: "Probe Ltd", employeeCount: 30 },
      mode: "submit",
      now: submitTime,
    });
    assert(
      factPackResult.status === "completed",
      "The D1 fact pack submission did not complete.",
    );

    const factPackState = await db
      .prepare(
        `SELECT
          fact_pack.status,
          fact_pack.submitted_at,
          json_extract(fact_pack.response_json, '$.employeeCount') AS employee_count,
          participant.participant_status,
          participant.completed_at
        FROM client_fact_packs AS fact_pack
        INNER JOIN client_participants AS participant
          ON participant.participant_id = fact_pack.participant_id
        WHERE fact_pack.participant_id = ?`,
      )
      .bind(factPackParticipantId)
      .first<{
        status: string;
        submitted_at: string | null;
        employee_count: number;
        participant_status: string;
        completed_at: string | null;
      }>();
    assert(
      factPackState?.status === "completed" &&
        factPackState.submitted_at === submitTime.toISOString() &&
        factPackState.employee_count === 30 &&
        factPackState.participant_status === "completed" &&
        factPackState.completed_at === submitTime.toISOString(),
      "The D1 fact pack state was incomplete.",
    );

    let duplicateFactPackRejected = false;
    try {
      await saveD1ClientFactPack({
        projectId,
        participantId: factPackParticipantId,
        inviteToken: factPackInvite,
        responseJson: {},
        mode: "submit",
        now: new Date(startedAt.getTime() + 2_000),
      });
    } catch (error) {
      duplicateFactPackRejected =
        error instanceof D1ClientDiagnosticMutationError &&
        error.message === "This fact pack has already been submitted.";
    }
    assert(
      duplicateFactPackRejected,
      "A completed D1 fact pack could be submitted twice.",
    );

    await db
      .prepare("DELETE FROM client_projects WHERE project_id = ?")
      .bind(projectId)
      .run();

    const remaining = await db
      .prepare(
        `SELECT
          (SELECT count(*) FROM client_projects WHERE project_id = ?)
          + (SELECT count(*) FROM client_participants WHERE project_id = ?)
          + (SELECT count(*) FROM client_responses WHERE project_id = ?)
          + (SELECT count(*) FROM client_dimension_scores WHERE project_id = ?)
          + (SELECT count(*) FROM client_service_access_context WHERE project_id = ?)
          + (SELECT count(*) FROM client_fact_packs WHERE project_id = ?)
          AS count`,
      )
      .bind(projectId, projectId, projectId, projectId, projectId, projectId)
      .first<{ count: number }>();
    assert(remaining?.count === 0, "D1 mutation runtime cleanup failed.");

    return NextResponse.json({
      status: "ok",
      d1: {
        diagnosticSubmission: "passed",
        duplicateSubmission: "passed",
        transactionRollback: "passed",
        factPackDraft: "passed",
        factPackSubmission: "passed",
        duplicateFactPack: "passed",
        cascadeCleanup: "passed",
      },
    });
  } catch (error) {
    try {
      await db
        .prepare("DELETE FROM client_projects WHERE project_id = ?")
        .bind(projectId)
        .run();
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
