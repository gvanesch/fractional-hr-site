import { getD1Database } from "./database";

export type D1AdminQuestionnaireType =
  | "hr"
  | "manager"
  | "leadership"
  | "client_fact_pack"
  | "payroll";

export type D1AdminParticipant = {
  participant_id: string;
  project_id: string;
  questionnaire_type: D1AdminQuestionnaireType;
  role_label: string;
  name: string | null;
  email: string | null;
  segmentation_values: Record<string, string | null> | null;
  participant_status: "invited" | "started" | "completed" | "archived";
  completed_at: string | null;
  invite_token: string;
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
  project_status: string;
  project_name: string | null;
  company_name: string;
  segmentation_schema: unknown | null;
};

export type D1AdminProject = {
  project_id: string;
  project_name: string | null;
  company_name: string;
  project_status: string;
  segmentation_schema: unknown | null;
};

type D1AdminParticipantRow = Omit<
  D1AdminParticipant,
  "segmentation_values" | "segmentation_schema"
> & {
  segmentation_values: string | null;
  segmentation_schema: string | null;
};

function parseJson<T>(value: string | null): T | null {
  if (value === null) return null;
  return JSON.parse(value) as T;
}

function mapParticipant(row: D1AdminParticipantRow): D1AdminParticipant {
  return {
    ...row,
    segmentation_values: parseJson<Record<string, string | null>>(
      row.segmentation_values,
    ),
    segmentation_schema: parseJson<unknown>(row.segmentation_schema),
  };
}

const participantSelect = `SELECT
  participant.participant_id,
  participant.project_id,
  participant.questionnaire_type,
  participant.role_label,
  participant.name,
  participant.email,
  participant.segmentation_values,
  participant.participant_status,
  participant.completed_at,
  participant.invite_token,
  participant.invite_expires_at,
  participant.invite_revoked_at,
  project.project_status,
  project.project_name,
  project.company_name,
  project.segmentation_schema
FROM client_participants AS participant
INNER JOIN client_projects AS project
  ON project.project_id = participant.project_id`;

export async function getD1AdminParticipant(
  participantId: string,
): Promise<D1AdminParticipant | null> {
  const row = await getD1Database()
    .prepare(`${participantSelect} WHERE participant.participant_id = ?`)
    .bind(participantId)
    .first<D1AdminParticipantRow>();

  return row ? mapParticipant(row) : null;
}

export async function getD1AdminProject(
  projectId: string,
): Promise<D1AdminProject | null> {
  const row = await getD1Database()
    .prepare(
      `SELECT project_id, project_name, company_name, project_status,
        segmentation_schema
       FROM client_projects
       WHERE project_id = ?`,
    )
    .bind(projectId)
    .first<Omit<D1AdminProject, "segmentation_schema"> & {
      segmentation_schema: string | null;
    }>();

  return row
    ? {
        ...row,
        segmentation_schema: parseJson<unknown>(row.segmentation_schema),
      }
    : null;
}

export async function findD1ParticipantsByEmail(
  projectId: string,
  email: string,
): Promise<Array<{ participant_id: string; questionnaire_type: string }>> {
  const result = await getD1Database()
    .prepare(
      `SELECT participant_id, questionnaire_type
       FROM client_participants
       WHERE project_id = ? AND lower(email) = lower(?)`,
    )
    .bind(projectId, email)
    .all<{ participant_id: string; questionnaire_type: string }>();

  return result.results;
}

export async function insertD1AdminParticipant(input: {
  participantId: string;
  projectId: string;
  questionnaireType: D1AdminQuestionnaireType;
  roleLabel: string;
  name: string | null;
  email: string;
  segmentationValues: unknown | null;
  inviteToken: string;
  inviteExpiresAt: string;
  now: string;
}): Promise<D1AdminParticipant | null> {
  await getD1Database()
    .prepare(
      `INSERT INTO client_participants (
        participant_id, project_id, questionnaire_type, role_label,
        invite_token, participant_status, name, email, status, invited_at,
        segmentation_values, invite_expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'invited', ?, ?, 'invited', ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.participantId,
      input.projectId,
      input.questionnaireType,
      input.roleLabel,
      input.inviteToken,
      input.name,
      input.email,
      input.now,
      input.segmentationValues === null
        ? null
        : JSON.stringify(input.segmentationValues),
      input.inviteExpiresAt,
      input.now,
      input.now,
    )
    .run();

  return getD1AdminParticipant(input.participantId);
}

export async function updateD1AdminParticipant(
  participantId: string,
  fields: {
    name?: string;
    email?: string;
    roleLabel?: string;
    questionnaireType?: D1AdminQuestionnaireType;
    segmentationValues?: unknown | null;
    participantStatus?: "invited" | "archived";
    inviteToken?: string;
    inviteExpiresAt?: string | null;
    inviteRevokedAt?: string | null;
    withdrawReason?: string | null;
    withdrawNote?: string | null;
    withdrawnAt?: string | null;
    reinstateReason?: string | null;
    reinstateNote?: string | null;
    reinstatedAt?: string | null;
    updatedAt: string;
  },
): Promise<D1AdminParticipant | null> {
  const assignments: string[] = [];
  const values: unknown[] = [];
  const add = (column: string, value: unknown) => {
    assignments.push(`${column} = ?`);
    values.push(value);
  };

  if (fields.name !== undefined) add("name", fields.name);
  if (fields.email !== undefined) add("email", fields.email);
  if (fields.roleLabel !== undefined) add("role_label", fields.roleLabel);
  if (fields.questionnaireType !== undefined)
    add("questionnaire_type", fields.questionnaireType);
  if (fields.segmentationValues !== undefined)
    add(
      "segmentation_values",
      fields.segmentationValues === null
        ? null
        : JSON.stringify(fields.segmentationValues),
    );
  if (fields.participantStatus !== undefined) {
    add("participant_status", fields.participantStatus);
    add("status", fields.participantStatus);
  }
  if (fields.inviteToken !== undefined) add("invite_token", fields.inviteToken);
  if (fields.inviteExpiresAt !== undefined)
    add("invite_expires_at", fields.inviteExpiresAt);
  if (fields.inviteRevokedAt !== undefined)
    add("invite_revoked_at", fields.inviteRevokedAt);
  if (fields.withdrawReason !== undefined)
    add("withdraw_reason", fields.withdrawReason);
  if (fields.withdrawNote !== undefined) add("withdraw_note", fields.withdrawNote);
  if (fields.withdrawnAt !== undefined) add("withdrawn_at", fields.withdrawnAt);
  if (fields.reinstateReason !== undefined)
    add("reinstate_reason", fields.reinstateReason);
  if (fields.reinstateNote !== undefined)
    add("reinstate_note", fields.reinstateNote);
  if (fields.reinstatedAt !== undefined)
    add("reinstated_at", fields.reinstatedAt);
  add("updated_at", fields.updatedAt);

  await getD1Database()
    .prepare(
      `UPDATE client_participants SET ${assignments.join(", ")}
       WHERE participant_id = ?`,
    )
    .bind(...values, participantId)
    .run();

  return getD1AdminParticipant(participantId);
}
