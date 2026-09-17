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
