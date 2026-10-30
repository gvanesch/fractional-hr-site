import { getD1Database } from "@/lib/d1/database";
import type { QuestionnaireType } from "@/lib/client-diagnostic/question-bank";
import type { ServiceAccessContext } from "@/lib/client-diagnostic/service-access-context";

type ResponseRow = {
  dimension_key: string;
  question_key: string;
  answer_value: number | null;
  comment_text: string | null;
};

type DimensionScoreRow = {
  dimension_key: string;
  average_score: number;
  response_count: number;
};

type ParticipantState = {
  project_status: string | null;
  questionnaire_type: string;
  invite_token: string;
  invite_revoked_at: string | null;
  invite_expires_at: string | null;
  participant_status: string;
  completed_at: string | null;
};

export class D1ClientDiagnosticMutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "D1ClientDiagnosticMutationError";
  }
}

const diagnosticGuard = `EXISTS (
  SELECT 1
  FROM client_participants AS participant
  INNER JOIN client_projects AS project
    ON project.project_id = participant.project_id
  WHERE participant.participant_id = ?
    AND participant.project_id = ?
    AND participant.invite_token = ?
    AND participant.questionnaire_type = ?
    AND participant.invite_revoked_at IS NULL
    AND (
      participant.invite_expires_at IS NULL
      OR participant.invite_expires_at >= ?
    )
    AND participant.participant_status IN ('invited', 'started')
    AND participant.completed_at IS NULL
    AND project.project_status = 'active'
)`;

const factPackGuard = `EXISTS (
  SELECT 1
  FROM client_participants AS participant
  INNER JOIN client_projects AS project
    ON project.project_id = participant.project_id
  WHERE participant.participant_id = ?
    AND participant.project_id = ?
    AND participant.invite_token = ?
    AND participant.questionnaire_type = 'client_fact_pack'
    AND participant.invite_revoked_at IS NULL
    AND (
      participant.invite_expires_at IS NULL
      OR participant.invite_expires_at >= ?
    )
    AND participant.participant_status <> 'archived'
    AND (? = 'draft' OR (
      participant.participant_status <> 'completed'
      AND participant.completed_at IS NULL
    ))
    AND project.project_status = 'active'
)`;

async function loadParticipantState(
  projectId: string,
  participantId: string,
): Promise<ParticipantState | null> {
  return getD1Database()
    .prepare(
      `SELECT
        project.project_status,
        participant.questionnaire_type,
        participant.invite_token,
        participant.invite_revoked_at,
        participant.invite_expires_at,
        participant.participant_status,
        participant.completed_at
      FROM client_participants AS participant
      LEFT JOIN client_projects AS project
        ON project.project_id = participant.project_id
      WHERE participant.participant_id = ?
        AND participant.project_id = ?`,
    )
    .bind(participantId, projectId)
    .first<ParticipantState>();
}

async function projectExists(projectId: string): Promise<boolean> {
  const row = await getD1Database()
    .prepare("SELECT 1 AS found FROM client_projects WHERE project_id = ?")
    .bind(projectId)
    .first<{ found: number }>();

  return row?.found === 1;
}

async function validateDiagnosticState(input: {
  projectId: string;
  participantId: string;
  inviteToken: string;
  questionnaireType: QuestionnaireType;
  now: string;
}): Promise<void> {
  if (!(await projectExists(input.projectId))) {
    throw new D1ClientDiagnosticMutationError(
      "Participant record not found for this project.",
    );
  }

  const participant = await loadParticipantState(
    input.projectId,
    input.participantId,
  );

  if (!participant) {
    throw new D1ClientDiagnosticMutationError(
      "Participant record not found for this project.",
    );
  }

  if (participant.project_status !== "active") {
    throw new D1ClientDiagnosticMutationError(
      "Project is not in a valid state for submission.",
    );
  }

  if (participant.invite_token !== input.inviteToken) {
    throw new D1ClientDiagnosticMutationError(
      "This diagnostic link is invalid for the selected participant.",
    );
  }

  if (participant.invite_revoked_at !== null) {
    throw new D1ClientDiagnosticMutationError(
      "This diagnostic link is no longer active.",
    );
  }

  if (
    participant.invite_expires_at !== null &&
    participant.invite_expires_at < input.now
  ) {
    throw new D1ClientDiagnosticMutationError(
      "This diagnostic link has expired.",
    );
  }

  if (participant.questionnaire_type !== input.questionnaireType) {
    throw new D1ClientDiagnosticMutationError(
      "Submitted questionnaire type does not match the participant record.",
    );
  }

  if (
    participant.participant_status === "completed" ||
    participant.completed_at !== null
  ) {
    throw new D1ClientDiagnosticMutationError(
      "This questionnaire has already been submitted.",
    );
  }

  if (!['invited', 'started'].includes(participant.participant_status)) {
    throw new D1ClientDiagnosticMutationError(
      "Participant is not in a valid state for submission.",
    );
  }
}

async function validateFactPackState(input: {
  projectId: string;
  participantId: string;
  inviteToken: string;
  mode: "draft" | "submit";
  now: string;
}): Promise<void> {
  if (!(await projectExists(input.projectId))) {
    throw new D1ClientDiagnosticMutationError(
      "Participant record not found for this project.",
    );
  }

  const participant = await loadParticipantState(
    input.projectId,
    input.participantId,
  );

  if (!participant) {
    throw new D1ClientDiagnosticMutationError(
      "Participant record not found for this project.",
    );
  }

  if (participant.project_status !== "active") {
    throw new D1ClientDiagnosticMutationError(
      "Project is not in a valid state for fact pack access.",
    );
  }

  if (participant.questionnaire_type !== "client_fact_pack") {
    throw new D1ClientDiagnosticMutationError(
      "Participant is not a client fact pack recipient.",
    );
  }

  if (participant.invite_token !== input.inviteToken) {
    throw new D1ClientDiagnosticMutationError(
      "Invite token does not match this participant.",
    );
  }

  if (participant.invite_revoked_at !== null) {
    throw new D1ClientDiagnosticMutationError(
      "This fact pack link is no longer active.",
    );
  }

  if (
    participant.invite_expires_at !== null &&
    participant.invite_expires_at < input.now
  ) {
    throw new D1ClientDiagnosticMutationError(
      "This fact pack link has expired.",
    );
  }

  if (participant.participant_status === "archived") {
    throw new D1ClientDiagnosticMutationError(
      "Participant is not in a valid state for fact pack access.",
    );
  }

  if (
    input.mode === "submit" &&
    (participant.participant_status === "completed" ||
      participant.completed_at !== null)
  ) {
    throw new D1ClientDiagnosticMutationError(
      "This fact pack has already been submitted.",
    );
  }
}

function diagnosticGuardBindings(input: {
  participantId: string;
  projectId: string;
  inviteToken: string;
  questionnaireType: QuestionnaireType;
  now: string;
}) {
  return [
    input.participantId,
    input.projectId,
    input.inviteToken,
    input.questionnaireType,
    input.now,
  ] as const;
}

export async function submitD1ClientDiagnostic(input: {
  projectId: string;
  participantId: string;
  inviteToken: string;
  questionnaireType: QuestionnaireType;
  responseRows: ResponseRow[];
  dimensionScoreRows: DimensionScoreRow[];
  serviceAccessContext?: ServiceAccessContext;
  now?: Date;
}) {
  const db = getD1Database();
  const now = (input.now ?? new Date()).toISOString();
  const stateInput = { ...input, now };

  await validateDiagnosticState(stateInput);

  const guardBindings = diagnosticGuardBindings(stateInput);
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `DELETE FROM client_responses
        WHERE project_id = ?
          AND participant_id = ?
          AND questionnaire_type = ?
          AND ${diagnosticGuard}`,
      )
      .bind(
        input.projectId,
        input.participantId,
        input.questionnaireType,
        ...guardBindings,
      ),
    db
      .prepare(
        `DELETE FROM client_dimension_scores
        WHERE project_id = ?
          AND participant_id = ?
          AND questionnaire_type = ?
          AND ${diagnosticGuard}`,
      )
      .bind(
        input.projectId,
        input.participantId,
        input.questionnaireType,
        ...guardBindings,
      ),
  ];

  for (const row of input.responseRows) {
    statements.push(
      db
        .prepare(
          `INSERT INTO client_responses (
            response_id,
            project_id,
            participant_id,
            questionnaire_type,
            dimension_key,
            question_key,
            answer_value,
            comment_text,
            created_at,
            updated_at,
            submitted_at
          )
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE ${diagnosticGuard}`,
        )
        .bind(
          crypto.randomUUID(),
          input.projectId,
          input.participantId,
          input.questionnaireType,
          row.dimension_key,
          row.question_key,
          row.answer_value,
          row.comment_text,
          now,
          now,
          now,
          ...guardBindings,
        ),
    );
  }

  for (const row of input.dimensionScoreRows) {
    statements.push(
      db
        .prepare(
          `INSERT INTO client_dimension_scores (
            score_id,
            project_id,
            participant_id,
            questionnaire_type,
            dimension_key,
            average_score,
            response_count,
            updated_at
          )
          SELECT ?, ?, ?, ?, ?, ?, ?, ?
          WHERE ${diagnosticGuard}`,
        )
        .bind(
          crypto.randomUUID(),
          input.projectId,
          input.participantId,
          input.questionnaireType,
          row.dimension_key,
          row.average_score,
          row.response_count,
          now,
          ...guardBindings,
        ),
    );
  }

  if (input.serviceAccessContext) {
    const context = input.serviceAccessContext;
    statements.push(
      db
        .prepare(
          `INSERT INTO client_service_access_context (
            context_id,
            project_id,
            participant_id,
            questionnaire_type,
            routes_used,
            usual_route,
            usual_route_effectiveness,
            intended_access_model,
            intended_primary_route,
            specific_route_detail,
            created_at,
            updated_at
          )
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE ${diagnosticGuard}
          ON CONFLICT (participant_id) DO UPDATE SET
            project_id = excluded.project_id,
            questionnaire_type = excluded.questionnaire_type,
            routes_used = excluded.routes_used,
            usual_route = excluded.usual_route,
            usual_route_effectiveness = excluded.usual_route_effectiveness,
            intended_access_model = excluded.intended_access_model,
            intended_primary_route = excluded.intended_primary_route,
            specific_route_detail = excluded.specific_route_detail,
            updated_at = excluded.updated_at`,
        )
        .bind(
          crypto.randomUUID(),
          input.projectId,
          input.participantId,
          input.questionnaireType,
          JSON.stringify(context.routesUsed ?? []),
          context.usualRoute ?? null,
          context.usualRouteEffectiveness ?? null,
          context.intendedAccessModel ?? null,
          context.intendedPrimaryRoute ?? null,
          context.specificRouteDetail?.trim() || null,
          now,
          now,
          ...guardBindings,
        ),
    );
  }

  statements.push(
    db
      .prepare(
        `UPDATE client_participants
        SET
          participant_status = 'completed',
          started_at = coalesce(started_at, ?),
          completed_at = ?,
          invite_last_used_at = ?,
          updated_at = ?
        WHERE participant_id = ?
          AND project_id = ?
          AND invite_token = ?
          AND questionnaire_type = ?
          AND invite_revoked_at IS NULL
          AND (invite_expires_at IS NULL OR invite_expires_at >= ?)
          AND participant_status IN ('invited', 'started')
          AND completed_at IS NULL
          AND EXISTS (
            SELECT 1 FROM client_projects
            WHERE project_id = ? AND project_status = 'active'
          )`,
      )
      .bind(
        now,
        now,
        now,
        now,
        input.participantId,
        input.projectId,
        input.inviteToken,
        input.questionnaireType,
        now,
        input.projectId,
      ),
  );

  const results = await db.batch(statements);
  const participantUpdate = results.at(-1);

  if (!participantUpdate?.success || participantUpdate.meta.changes !== 1) {
    await validateDiagnosticState(stateInput);
    throw new D1ClientDiagnosticMutationError(
      "Participant is not in a valid state for submission.",
    );
  }

  return {
    success: true as const,
    projectId: input.projectId,
    participantId: input.participantId,
    questionnaireType: input.questionnaireType,
    savedResponseCount: input.responseRows.length,
    dimensionScoresCreated: input.dimensionScoreRows.length,
    serviceAccessContextSaved: input.serviceAccessContext !== undefined,
    message: "Client diagnostic submission saved successfully.",
  };
}

export async function saveD1ClientFactPack(input: {
  projectId: string;
  participantId: string;
  inviteToken: string;
  responseJson: Record<string, unknown>;
  mode: "draft" | "submit";
  now?: Date;
}) {
  const db = getD1Database();
  const now = (input.now ?? new Date()).toISOString();
  const stateInput = { ...input, now };

  await validateFactPackState(stateInput);

  const status = input.mode === "submit" ? "completed" : "in_progress";
  const guardBindings = [
    input.participantId,
    input.projectId,
    input.inviteToken,
    now,
    input.mode,
  ] as const;

  const results = await db.batch([
    db
      .prepare(
        `INSERT INTO client_fact_packs (
          fact_pack_id,
          project_id,
          participant_id,
          invite_token,
          response_json,
          status,
          submitted_at,
          created_at,
          updated_at
        )
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
        WHERE ${factPackGuard}
        ON CONFLICT (participant_id) DO UPDATE SET
          invite_token = excluded.invite_token,
          response_json = excluded.response_json,
          status = excluded.status,
          submitted_at = excluded.submitted_at,
          updated_at = excluded.updated_at`,
      )
      .bind(
        crypto.randomUUID(),
        input.projectId,
        input.participantId,
        input.inviteToken,
        JSON.stringify(input.responseJson),
        status,
        input.mode === "submit" ? now : null,
        now,
        now,
        ...guardBindings,
      ),
    db
      .prepare(
        `UPDATE client_participants
        SET
          participant_status = CASE
            WHEN ? = 'submit' THEN 'completed'
            WHEN participant_status = 'invited' THEN 'started'
            ELSE participant_status
          END,
          started_at = coalesce(started_at, ?),
          completed_at = CASE WHEN ? = 'submit' THEN ? ELSE completed_at END,
          invite_last_used_at = ?,
          updated_at = ?
        WHERE participant_id = ?
          AND project_id = ?
          AND invite_token = ?
          AND questionnaire_type = 'client_fact_pack'
          AND invite_revoked_at IS NULL
          AND (invite_expires_at IS NULL OR invite_expires_at >= ?)
          AND participant_status <> 'archived'
          AND (? = 'draft' OR (
            participant_status <> 'completed' AND completed_at IS NULL
          ))
          AND EXISTS (
            SELECT 1 FROM client_projects
            WHERE project_id = ? AND project_status = 'active'
          )`,
      )
      .bind(
        input.mode,
        now,
        input.mode,
        now,
        now,
        now,
        input.participantId,
        input.projectId,
        input.inviteToken,
        now,
        input.mode,
        input.projectId,
      ),
  ]);

  const participantUpdate = results.at(-1);

  if (!participantUpdate?.success || participantUpdate.meta.changes !== 1) {
    await validateFactPackState(stateInput);
    throw new D1ClientDiagnosticMutationError(
      "Participant is not in a valid state for fact pack access.",
    );
  }

  return {
    success: true as const,
    mode: input.mode,
    status,
    message:
      input.mode === "submit"
        ? "Client fact pack submitted successfully."
        : "Client fact pack draft saved successfully.",
  };
}
