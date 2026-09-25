import { getD1Database } from "./database";

export type D1ClientProjectWrite = {
  projectId: string;
  companyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  projectStatus: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  projectName: string | null;
  status: string | null;
  segmentationSchema: unknown | null;
  billingContactName: string | null;
  billingContactEmail: string | null;
  companyWebsite: string | null;
  purchaseOrderNumber: string | null;
  msaStatus: string | null;
  dpaStatus: string | null;
};

export type D1ClientParticipantWrite = {
  participantId: string;
  projectId: string;
  questionnaireType:
    | "hr"
    | "manager"
    | "leadership"
    | "client_fact_pack"
    | "payroll";
  roleLabel: string;
  inviteToken: string;
  participantStatus: "invited" | "started" | "completed" | "archived";
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  name: string | null;
  email: string | null;
  status: string | null;
  invitedAt: string | null;
  segmentationValues: unknown | null;
  inviteExpiresAt: string | null;
  inviteRevokedAt: string | null;
  inviteLastUsedAt: string | null;
  withdrawReason: string | null;
  withdrawNote: string | null;
  withdrawnAt: string | null;
  reinstateReason: string | null;
  reinstateNote: string | null;
  reinstatedAt: string | null;
};

export type D1ClientResponseWrite = {
  responseId: string;
  projectId: string;
  participantId: string;
  questionnaireType: "hr" | "manager" | "leadership" | "payroll";
  dimensionKey: string;
  questionKey: string;
  answerValue: number | null;
  commentText: string | null;
  createdAt: string;
  updatedAt: string;
  responses: unknown | null;
  submittedAt: string | null;
};

export type D1ClientDimensionScoreWrite = {
  scoreId: string;
  projectId: string;
  questionnaireType: "hr" | "manager" | "leadership" | "payroll";
  dimensionKey: string;
  averageScore: number;
  responseCount: number;
  updatedAt: string;
  participantId: string | null;
  score: number | null;
};

export type D1ClientFactPackWrite = {
  factPackId: string;
  projectId: string;
  participantId: string;
  inviteToken: string | null;
  responseJson: unknown;
  status: "in_progress" | "completed";
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type D1ClientFunctionalSignalRequestWrite = {
  signalRequestId: string;
  projectId: string;
  moduleType: "it" | "payroll" | "finance" | "other";
  moduleLabel: string | null;
  recipientName: string;
  recipientEmail: string;
  inviteToken: string;
  signalStatus: "invited" | "started" | "completed" | "archived";
  responseData: unknown | null;
  invitedAt: string | null;
  inviteExpiresAt: string | null;
  inviteLastUsedAt: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  archiveReason: string | null;
  archiveNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type D1ClientServiceAccessContextWrite = {
  contextId: string;
  projectId: string;
  participantId: string;
  questionnaireType: "hr" | "manager";
  routesUsed: string[];
  usualRoute: string | null;
  usualRouteEffectiveness: number | null;
  intendedPrimaryRoute: string | null;
  specificRouteDetail: string | null;
  createdAt: string;
  updatedAt: string;
  intendedAccessModel: string | null;
};

export type D1ClientProjectSnapshot = {
  project: D1ClientProjectWrite;
  participants: D1ClientParticipantWrite[];
  responses: D1ClientResponseWrite[];
  dimensionScores: D1ClientDimensionScoreWrite[];
  factPacks: D1ClientFactPackWrite[];
  functionalSignalRequests: D1ClientFunctionalSignalRequestWrite[];
  serviceAccessContexts: D1ClientServiceAccessContextWrite[];
};

export type D1ClientProjectDetailsUpdate = {
  projectId: string;
  billingContactName: string | null;
  billingContactEmail: string | null;
  companyWebsite: string | null;
  purchaseOrderNumber: string | null;
  msaStatus: string | null;
  dpaStatus: string | null;
  notes: string | null;
  updatedAt: string;
};

function jsonText(value: unknown | null): string | null {
  return value === null ? null : JSON.stringify(value);
}

function prepareProject(
  db: D1Database,
  project: D1ClientProjectWrite,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO client_projects (
        project_id,
        company_name,
        primary_contact_name,
        primary_contact_email,
        project_status,
        notes,
        created_at,
        updated_at,
        project_name,
        status,
        segmentation_schema,
        billing_contact_name,
        billing_contact_email,
        company_website,
        purchase_order_number,
        msa_status,
        dpa_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET
        company_name = excluded.company_name,
        primary_contact_name = excluded.primary_contact_name,
        primary_contact_email = excluded.primary_contact_email,
        project_status = excluded.project_status,
        notes = excluded.notes,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        project_name = excluded.project_name,
        status = excluded.status,
        segmentation_schema = excluded.segmentation_schema,
        billing_contact_name = excluded.billing_contact_name,
        billing_contact_email = excluded.billing_contact_email,
        company_website = excluded.company_website,
        purchase_order_number = excluded.purchase_order_number,
        msa_status = excluded.msa_status,
        dpa_status = excluded.dpa_status`,
    )
    .bind(
      project.projectId,
      project.companyName,
      project.primaryContactName,
      project.primaryContactEmail,
      project.projectStatus,
      project.notes,
      project.createdAt,
      project.updatedAt,
      project.projectName,
      project.status,
      jsonText(project.segmentationSchema),
      project.billingContactName,
      project.billingContactEmail,
      project.companyWebsite,
      project.purchaseOrderNumber,
      project.msaStatus,
      project.dpaStatus,
    );
}

function prepareParticipant(
  db: D1Database,
  participant: D1ClientParticipantWrite,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO client_participants (
        participant_id,
        project_id,
        questionnaire_type,
        role_label,
        invite_token,
        participant_status,
        started_at,
        completed_at,
        created_at,
        updated_at,
        name,
        email,
        status,
        invited_at,
        segmentation_values,
        invite_expires_at,
        invite_revoked_at,
        invite_last_used_at,
        withdraw_reason,
        withdraw_note,
        withdrawn_at,
        reinstate_reason,
        reinstate_note,
        reinstated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(participant_id) DO UPDATE SET
        project_id = excluded.project_id,
        questionnaire_type = excluded.questionnaire_type,
        role_label = excluded.role_label,
        invite_token = excluded.invite_token,
        participant_status = excluded.participant_status,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        name = excluded.name,
        email = excluded.email,
        status = excluded.status,
        invited_at = excluded.invited_at,
        segmentation_values = excluded.segmentation_values,
        invite_expires_at = excluded.invite_expires_at,
        invite_revoked_at = excluded.invite_revoked_at,
        invite_last_used_at = excluded.invite_last_used_at,
        withdraw_reason = excluded.withdraw_reason,
        withdraw_note = excluded.withdraw_note,
        withdrawn_at = excluded.withdrawn_at,
        reinstate_reason = excluded.reinstate_reason,
        reinstate_note = excluded.reinstate_note,
        reinstated_at = excluded.reinstated_at`,
    )
    .bind(
      participant.participantId,
      participant.projectId,
      participant.questionnaireType,
      participant.roleLabel,
      participant.inviteToken,
      participant.participantStatus,
      participant.startedAt,
      participant.completedAt,
      participant.createdAt,
      participant.updatedAt,
      participant.name,
      participant.email,
      participant.status,
      participant.invitedAt,
      jsonText(participant.segmentationValues),
      participant.inviteExpiresAt,
      participant.inviteRevokedAt,
      participant.inviteLastUsedAt,
      participant.withdrawReason,
      participant.withdrawNote,
      participant.withdrawnAt,
      participant.reinstateReason,
      participant.reinstateNote,
      participant.reinstatedAt,
    );
}

function prepareResponse(
  db: D1Database,
  response: D1ClientResponseWrite,
): D1PreparedStatement {
  return db
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
        responses,
        submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      response.responseId,
      response.projectId,
      response.participantId,
      response.questionnaireType,
      response.dimensionKey,
      response.questionKey,
      response.answerValue,
      response.commentText,
      response.createdAt,
      response.updatedAt,
      jsonText(response.responses),
      response.submittedAt,
    );
}

function prepareDimensionScore(
  db: D1Database,
  dimensionScore: D1ClientDimensionScoreWrite,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO client_dimension_scores (
        score_id,
        project_id,
        questionnaire_type,
        dimension_key,
        average_score,
        response_count,
        updated_at,
        participant_id,
        score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      dimensionScore.scoreId,
      dimensionScore.projectId,
      dimensionScore.questionnaireType,
      dimensionScore.dimensionKey,
      dimensionScore.averageScore,
      dimensionScore.responseCount,
      dimensionScore.updatedAt,
      dimensionScore.participantId,
      dimensionScore.score,
    );
}

function prepareFactPack(
  db: D1Database,
  factPack: D1ClientFactPackWrite,
): D1PreparedStatement {
  return db
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      factPack.factPackId,
      factPack.projectId,
      factPack.participantId,
      factPack.inviteToken,
      jsonText(factPack.responseJson),
      factPack.status,
      factPack.submittedAt,
      factPack.createdAt,
      factPack.updatedAt,
    );
}

function prepareFunctionalSignalRequest(
  db: D1Database,
  signalRequest: D1ClientFunctionalSignalRequestWrite,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO client_functional_signal_requests (
        signal_request_id,
        project_id,
        module_type,
        module_label,
        recipient_name,
        recipient_email,
        invite_token,
        signal_status,
        response_data,
        invited_at,
        invite_expires_at,
        invite_last_used_at,
        started_at,
        submitted_at,
        completed_at,
        archived_at,
        archive_reason,
        archive_note,
        created_at,
        updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
    )
    .bind(
      signalRequest.signalRequestId,
      signalRequest.projectId,
      signalRequest.moduleType,
      signalRequest.moduleLabel,
      signalRequest.recipientName,
      signalRequest.recipientEmail,
      signalRequest.inviteToken,
      signalRequest.signalStatus,
      jsonText(signalRequest.responseData),
      signalRequest.invitedAt,
      signalRequest.inviteExpiresAt,
      signalRequest.inviteLastUsedAt,
      signalRequest.startedAt,
      signalRequest.submittedAt,
      signalRequest.completedAt,
      signalRequest.archivedAt,
      signalRequest.archiveReason,
      signalRequest.archiveNote,
      signalRequest.createdAt,
      signalRequest.updatedAt,
    );
}

function prepareServiceAccessContext(
  db: D1Database,
  context: D1ClientServiceAccessContextWrite,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO client_service_access_context (
        context_id,
        project_id,
        participant_id,
        questionnaire_type,
        routes_used,
        usual_route,
        usual_route_effectiveness,
        intended_primary_route,
        specific_route_detail,
        created_at,
        updated_at,
        intended_access_model
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      context.contextId,
      context.projectId,
      context.participantId,
      context.questionnaireType,
      jsonText(context.routesUsed),
      context.usualRoute,
      context.usualRouteEffectiveness,
      context.intendedPrimaryRoute,
      context.specificRouteDetail,
      context.createdAt,
      context.updatedAt,
      context.intendedAccessModel,
    );
}

export async function writeD1ClientProjectSnapshot(
  snapshot: D1ClientProjectSnapshot,
): Promise<void> {
  const db = getD1Database();
  const projectId = snapshot.project.projectId;
  const statements = [
    db
      .prepare("DELETE FROM client_service_access_context WHERE project_id = ?")
      .bind(projectId),
    db
      .prepare("DELETE FROM client_fact_packs WHERE project_id = ?")
      .bind(projectId),
    db
      .prepare("DELETE FROM client_responses WHERE project_id = ?")
      .bind(projectId),
    db
      .prepare("DELETE FROM client_dimension_scores WHERE project_id = ?")
      .bind(projectId),
    db
      .prepare(
        "DELETE FROM client_functional_signal_requests WHERE project_id = ?",
      )
      .bind(projectId),
    db
      .prepare("DELETE FROM client_participants WHERE project_id = ?")
      .bind(projectId),
    prepareProject(db, snapshot.project),
    ...snapshot.participants.map((participant) =>
      prepareParticipant(db, participant),
    ),
    ...snapshot.responses.map((response) => prepareResponse(db, response)),
    ...snapshot.dimensionScores.map((dimensionScore) =>
      prepareDimensionScore(db, dimensionScore),
    ),
    ...snapshot.factPacks.map((factPack) => prepareFactPack(db, factPack)),
    ...snapshot.functionalSignalRequests.map((signalRequest) =>
      prepareFunctionalSignalRequest(db, signalRequest),
    ),
    ...snapshot.serviceAccessContexts.map((context) =>
      prepareServiceAccessContext(db, context),
    ),
  ];
  const results = await db.batch(statements);

  if (
    results.length !== statements.length ||
    results.some((result) => !result.success)
  ) {
    throw new Error("D1 client project snapshot batch failed.");
  }
}

export async function writeD1ClientProjectWithParticipants(input: {
  project: D1ClientProjectWrite;
  participants: D1ClientParticipantWrite[];
}): Promise<void> {
  const db = getD1Database();
  const statements = [
    prepareProject(db, input.project),
    ...input.participants.map((participant) =>
      prepareParticipant(db, participant),
    ),
  ];
  const results = await db.batch(statements);

  if (
    results.length !== statements.length ||
    results.some((result) => !result.success)
  ) {
    throw new Error("D1 client project shadow batch failed.");
  }
}

export async function writeD1ClientParticipant(
  participant: D1ClientParticipantWrite,
): Promise<void> {
  const result = await prepareParticipant(
    getD1Database(),
    participant,
  ).run();

  if (!result.success) {
    throw new Error("D1 client participant shadow write failed.");
  }
}

export async function updateD1ClientProjectDetails(
  update: D1ClientProjectDetailsUpdate,
): Promise<void> {
  const result = await getD1Database()
    .prepare(
      `UPDATE client_projects SET
        billing_contact_name = ?,
        billing_contact_email = ?,
        company_website = ?,
        purchase_order_number = ?,
        msa_status = ?,
        dpa_status = ?,
        notes = ?,
        updated_at = ?
      WHERE project_id = ?`,
    )
    .bind(
      update.billingContactName,
      update.billingContactEmail,
      update.companyWebsite,
      update.purchaseOrderNumber,
      update.msaStatus,
      update.dpaStatus,
      update.notes,
      update.updatedAt,
      update.projectId,
    )
    .run();

  if (!result.success || result.meta.changes !== 1) {
    throw new Error("D1 client project detail shadow update failed.");
  }
}
