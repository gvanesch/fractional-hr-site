import { getD1Database } from "./database";

export type D1AdvisorProspectRow = {
  prospectId: string;
  name: string | null;
  company: string | null;
  role: string | null;
  source: "linkedin" | "referral" | "website" | "saas" | "other";
  segment: "smb" | "mid" | "enterprise" | null;
  diagnosticStatus:
    | "not_invited"
    | "invited"
    | "started"
    | "completed"
    | "assessment_candidate"
    | "in_conversation"
    | "converted";
  lastContactDate: string | null;
  nextActionDate: string | null;
  observedSignals: string[] | null;
  notes: string | null;
  linkedSubmissionId: string | null;
  createdAt: string;
  updatedAt: string;
  relationshipStrength: "unknown" | "weak" | "medium" | "strong";
  dealStage:
    | "new"
    | "contacted"
    | "replied"
    | "meeting_booked"
    | "in_conversation"
    | "health_check_completed"
    | "diagnostic_assessment_candidate"
    | "proposal_discussed"
    | "converted"
    | "lost"
    | "nurture";
  leadTemperature: "cold" | "warm" | "hot";
  nextStep: string | null;
  lostReason: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  companyWebsite: string | null;
  billingContactName: string | null;
  billingContactEmail: string | null;
  linkedinUrl: string | null;
};

export type D1AdvisorProspectActivityRow = {
  activityId: string;
  prospectId: string;
  linkedSubmissionId: string | null;
  activityType: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  changedBy: string | null;
  createdAt: string;
  noteType: "call" | "meeting" | "email" | "linkedin" | "internal" | null;
};

export type D1HealthCheckProspectRow = {
  prospectId: string;
  submissionId: string;
  name: string | null;
  company: string | null;
  relationship: "weak" | "medium" | "strong";
  status:
    | "not_contacted"
    | "contacted"
    | "replied"
    | "call_booked"
    | "opportunity"
    | "won"
    | "lost";
  lastContactDate: string | null;
  nextActionDate: string | null;
  source: "network" | "referral" | "website" | "other";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type D1HealthCheckProspectActivityRow = {
  activityId: string;
  prospectId: string;
  submissionId: string;
  activityType: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  changedBy: string | null;
  createdAt: string;
};

function requireRecord(
  input: unknown,
  rowName: string,
): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`Supabase returned an invalid ${rowName} row.`);
  }

  return input as Record<string, unknown>;
}

function requireString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string" || !value) {
    throw new Error(`Supabase returned an invalid ${fieldName}.`);
  }

  return value;
}

function nullableString(
  value: unknown,
  fieldName: string,
): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`Supabase returned an invalid ${fieldName}.`);
  }

  return value;
}

function nullableStringArray(
  value: unknown,
  fieldName: string,
): string[] | null {
  if (value === null) {
    return null;
  }

  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string")
  ) {
    throw new Error(`Supabase returned an invalid ${fieldName}.`);
  }

  return value;
}

function requireEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string,
): T {
  if (
    typeof value !== "string" ||
    !allowedValues.includes(value as T)
  ) {
    throw new Error(`Supabase returned an invalid ${fieldName}.`);
  }

  return value as T;
}

function nullableEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string,
): T | null {
  if (value === null) {
    return null;
  }

  return requireEnum(value, allowedValues, fieldName);
}

export function parseD1AdvisorProspectRow(
  input: unknown,
): D1AdvisorProspectRow {
  const row = requireRecord(input, "advisor prospect");

  return {
    prospectId: requireString(row.prospect_id, "prospect_id"),
    name: nullableString(row.name, "name"),
    company: nullableString(row.company, "company"),
    role: nullableString(row.role, "role"),
    source: requireEnum(
      row.source,
      ["linkedin", "referral", "website", "saas", "other"] as const,
      "source",
    ),
    segment: nullableEnum(
      row.segment,
      ["smb", "mid", "enterprise"] as const,
      "segment",
    ),
    diagnosticStatus: requireEnum(
      row.diagnostic_status,
      [
        "not_invited",
        "invited",
        "started",
        "completed",
        "assessment_candidate",
        "in_conversation",
        "converted",
      ] as const,
      "diagnostic_status",
    ),
    lastContactDate: nullableString(
      row.last_contact_date,
      "last_contact_date",
    ),
    nextActionDate: nullableString(
      row.next_action_date,
      "next_action_date",
    ),
    observedSignals: nullableStringArray(
      row.observed_signals,
      "observed_signals",
    ),
    notes: nullableString(row.notes, "notes"),
    linkedSubmissionId: nullableString(
      row.linked_submission_id,
      "linked_submission_id",
    ),
    createdAt: requireString(row.created_at, "created_at"),
    updatedAt: requireString(row.updated_at, "updated_at"),
    relationshipStrength: requireEnum(
      row.relationship_strength,
      ["unknown", "weak", "medium", "strong"] as const,
      "relationship_strength",
    ),
    dealStage: requireEnum(
      row.deal_stage,
      [
        "new",
        "contacted",
        "replied",
        "meeting_booked",
        "in_conversation",
        "health_check_completed",
        "diagnostic_assessment_candidate",
        "proposal_discussed",
        "converted",
        "lost",
        "nurture",
      ] as const,
      "deal_stage",
    ),
    leadTemperature: requireEnum(
      row.lead_temperature,
      ["cold", "warm", "hot"] as const,
      "lead_temperature",
    ),
    nextStep: nullableString(row.next_step, "next_step"),
    lostReason: nullableString(row.lost_reason, "lost_reason"),
    contactEmail: nullableString(row.contact_email, "contact_email"),
    contactPhone: nullableString(row.contact_phone, "contact_phone"),
    companyWebsite: nullableString(
      row.company_website,
      "company_website",
    ),
    billingContactName: nullableString(
      row.billing_contact_name,
      "billing_contact_name",
    ),
    billingContactEmail: nullableString(
      row.billing_contact_email,
      "billing_contact_email",
    ),
    linkedinUrl: nullableString(row.linkedin_url, "linkedin_url"),
  };
}

export function parseD1AdvisorProspectActivityRow(
  input: unknown,
): D1AdvisorProspectActivityRow {
  const row = requireRecord(input, "advisor prospect activity");

  return {
    activityId: requireString(row.activity_id, "activity_id"),
    prospectId: requireString(row.prospect_id, "prospect_id"),
    linkedSubmissionId: nullableString(
      row.linked_submission_id,
      "linked_submission_id",
    ),
    activityType: requireString(row.activity_type, "activity_type"),
    fieldName: nullableString(row.field_name, "field_name"),
    oldValue: nullableString(row.old_value, "old_value"),
    newValue: nullableString(row.new_value, "new_value"),
    note: nullableString(row.note, "note"),
    changedBy: nullableString(row.changed_by, "changed_by"),
    createdAt: requireString(row.created_at, "created_at"),
    noteType: nullableEnum(
      row.note_type,
      ["call", "meeting", "email", "linkedin", "internal"] as const,
      "note_type",
    ),
  };
}

export function parseD1HealthCheckProspectRow(
  input: unknown,
): D1HealthCheckProspectRow {
  const row = requireRecord(input, "Health Check prospect");

  return {
    prospectId: requireString(row.prospect_id, "prospect_id"),
    submissionId: requireString(row.submission_id, "submission_id"),
    name: nullableString(row.name, "name"),
    company: nullableString(row.company, "company"),
    relationship: requireEnum(
      row.relationship,
      ["weak", "medium", "strong"] as const,
      "relationship",
    ),
    status: requireEnum(
      row.status,
      [
        "not_contacted",
        "contacted",
        "replied",
        "call_booked",
        "opportunity",
        "won",
        "lost",
      ] as const,
      "status",
    ),
    lastContactDate: nullableString(
      row.last_contact_date,
      "last_contact_date",
    ),
    nextActionDate: nullableString(
      row.next_action_date,
      "next_action_date",
    ),
    source: requireEnum(
      row.source,
      ["network", "referral", "website", "other"] as const,
      "source",
    ),
    notes: nullableString(row.notes, "notes"),
    createdAt: requireString(row.created_at, "created_at"),
    updatedAt: requireString(row.updated_at, "updated_at"),
  };
}

export function parseD1HealthCheckProspectActivityRow(
  input: unknown,
): D1HealthCheckProspectActivityRow {
  const row = requireRecord(input, "Health Check prospect activity");

  return {
    activityId: requireString(row.activity_id, "activity_id"),
    prospectId: requireString(row.prospect_id, "prospect_id"),
    submissionId: requireString(row.submission_id, "submission_id"),
    activityType: requireString(row.activity_type, "activity_type"),
    fieldName: nullableString(row.field_name, "field_name"),
    oldValue: nullableString(row.old_value, "old_value"),
    newValue: nullableString(row.new_value, "new_value"),
    note: nullableString(row.note, "note"),
    changedBy: nullableString(row.changed_by, "changed_by"),
    createdAt: requireString(row.created_at, "created_at"),
  };
}

function serializeNullableStringArray(
  value: string[] | null,
  fieldName: string,
): string | null {
  if (value === null) {
    return null;
  }

  const serialized = JSON.stringify(value);

  if (typeof serialized !== "string") {
    throw new Error(`Unable to serialize ${fieldName} for D1.`);
  }

  return serialized;
}

function prepareAdvisorProspectUpsert(
  database: D1Database,
  row: D1AdvisorProspectRow,
): D1PreparedStatement {
  const observedSignals = serializeNullableStringArray(
    row.observedSignals,
    "observed signals",
  );

  return database
    .prepare(
      `INSERT INTO advisor_prospects (
        prospect_id,
        name,
        company,
        role,
        source,
        segment,
        diagnostic_status,
        last_contact_date,
        next_action_date,
        observed_signals,
        notes,
        linked_submission_id,
        created_at,
        updated_at,
        relationship_strength,
        deal_stage,
        lead_temperature,
        next_step,
        lost_reason,
        contact_email,
        contact_phone,
        company_website,
        billing_contact_name,
        billing_contact_email,
        linkedin_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
      ON CONFLICT (prospect_id) DO UPDATE SET
        name = excluded.name,
        company = excluded.company,
        role = excluded.role,
        source = excluded.source,
        segment = excluded.segment,
        diagnostic_status = excluded.diagnostic_status,
        last_contact_date = excluded.last_contact_date,
        next_action_date = excluded.next_action_date,
        observed_signals = excluded.observed_signals,
        notes = excluded.notes,
        linked_submission_id = excluded.linked_submission_id,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        relationship_strength = excluded.relationship_strength,
        deal_stage = excluded.deal_stage,
        lead_temperature = excluded.lead_temperature,
        next_step = excluded.next_step,
        lost_reason = excluded.lost_reason,
        contact_email = excluded.contact_email,
        contact_phone = excluded.contact_phone,
        company_website = excluded.company_website,
        billing_contact_name = excluded.billing_contact_name,
        billing_contact_email = excluded.billing_contact_email,
        linkedin_url = excluded.linkedin_url`,
    )
    .bind(
      row.prospectId,
      row.name,
      row.company,
      row.role,
      row.source,
      row.segment,
      row.diagnosticStatus,
      row.lastContactDate,
      row.nextActionDate,
      observedSignals,
      row.notes,
      row.linkedSubmissionId,
      row.createdAt,
      row.updatedAt,
      row.relationshipStrength,
      row.dealStage,
      row.leadTemperature,
      row.nextStep,
      row.lostReason,
      row.contactEmail,
      row.contactPhone,
      row.companyWebsite,
      row.billingContactName,
      row.billingContactEmail,
      row.linkedinUrl,
    );
}

function prepareAdvisorActivityInsert(
  database: D1Database,
  row: D1AdvisorProspectActivityRow,
): D1PreparedStatement {
  return database
    .prepare(
      `INSERT INTO advisor_prospect_activity (
        activity_id,
        prospect_id,
        linked_submission_id,
        activity_type,
        field_name,
        old_value,
        new_value,
        note,
        changed_by,
        created_at,
        note_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.activityId,
      row.prospectId,
      row.linkedSubmissionId,
      row.activityType,
      row.fieldName,
      row.oldValue,
      row.newValue,
      row.note,
      row.changedBy,
      row.createdAt,
      row.noteType,
    );
}

function prepareHealthCheckProspectByIdUpsert(
  database: D1Database,
  row: D1HealthCheckProspectRow,
): D1PreparedStatement {
  return database
    .prepare(
      `INSERT INTO health_check_prospects (
        prospect_id,
        submission_id,
        name,
        company,
        relationship,
        status,
        last_contact_date,
        next_action_date,
        source,
        notes,
        created_at,
        updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT (prospect_id) DO UPDATE SET
        submission_id = excluded.submission_id,
        name = excluded.name,
        company = excluded.company,
        relationship = excluded.relationship,
        status = excluded.status,
        last_contact_date = excluded.last_contact_date,
        next_action_date = excluded.next_action_date,
        source = excluded.source,
        notes = excluded.notes,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at`,
    )
    .bind(
      row.prospectId,
      row.submissionId,
      row.name,
      row.company,
      row.relationship,
      row.status,
      row.lastContactDate,
      row.nextActionDate,
      row.source,
      row.notes,
      row.createdAt,
      row.updatedAt,
    );
}

function prepareHealthCheckProspectBySubmissionUpsert(
  database: D1Database,
  row: D1HealthCheckProspectRow,
): D1PreparedStatement {
  return database
    .prepare(
      `INSERT INTO health_check_prospects (
        prospect_id,
        submission_id,
        name,
        company,
        relationship,
        status,
        last_contact_date,
        next_action_date,
        source,
        notes,
        created_at,
        updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT (submission_id) DO UPDATE SET
        name = excluded.name,
        company = excluded.company,
        relationship = excluded.relationship,
        status = excluded.status,
        last_contact_date = excluded.last_contact_date,
        next_action_date = excluded.next_action_date,
        source = excluded.source,
        notes = excluded.notes,
        updated_at = excluded.updated_at
      WHERE
        health_check_prospects.prospect_id = excluded.prospect_id
        AND health_check_prospects.created_at = excluded.created_at`,
    )
    .bind(
      row.prospectId,
      row.submissionId,
      row.name,
      row.company,
      row.relationship,
      row.status,
      row.lastContactDate,
      row.nextActionDate,
      row.source,
      row.notes,
      row.createdAt,
      row.updatedAt,
    );
}

function prepareHealthCheckActivityInsert(
  database: D1Database,
  row: D1HealthCheckProspectActivityRow,
): D1PreparedStatement {
  return database
    .prepare(
      `INSERT INTO health_check_prospect_activity (
        activity_id,
        prospect_id,
        submission_id,
        activity_type,
        field_name,
        old_value,
        new_value,
        note,
        changed_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.activityId,
      row.prospectId,
      row.submissionId,
      row.activityType,
      row.fieldName,
      row.oldValue,
      row.newValue,
      row.note,
      row.changedBy,
      row.createdAt,
    );
}

function assertSuccessfulMutationResults(
  results: D1Result<unknown>[],
  expectedResults: number,
  operationName: string,
): void {
  if (results.length !== expectedResults) {
    throw new Error(`D1 ${operationName} returned an unexpected result count.`);
  }

  for (const result of results) {
    if (!result.success || result.meta.changes !== 1) {
      throw new Error(`D1 ${operationName} did not change exactly one row.`);
    }
  }
}

export async function upsertD1HealthCheckProspect(
  row: D1HealthCheckProspectRow,
): Promise<void> {
  const database = getD1Database();
  const result = await prepareHealthCheckProspectBySubmissionUpsert(
    database,
    row,
  ).run();

  if (!result.success) {
    throw new Error("D1 Health Check prospect upsert did not succeed.");
  }

  if (result.meta.changes !== 1) {
    throw new Error(
      "D1 Health Check prospect identity does not match Supabase.",
    );
  }
}

export async function syncD1AdvisorProspectMutation(params: {
  prospect: D1AdvisorProspectRow;
  activities?: D1AdvisorProspectActivityRow[];
}): Promise<void> {
  const { prospect, activities = [] } = params;
  const database = getD1Database();
  const statements = [
    prepareAdvisorProspectUpsert(database, prospect),
    ...activities.map((activity) =>
      prepareAdvisorActivityInsert(database, activity),
    ),
  ];
  const results = await database.batch(statements);

  assertSuccessfulMutationResults(
    results,
    statements.length,
    "advisor prospect mutation",
  );
}

export async function syncD1HealthCheckProspectMutation(params: {
  prospect: D1HealthCheckProspectRow;
  activities?: D1HealthCheckProspectActivityRow[];
}): Promise<void> {
  const { prospect, activities = [] } = params;
  const database = getD1Database();
  const statements = [
    prepareHealthCheckProspectByIdUpsert(database, prospect),
    ...activities.map((activity) =>
      prepareHealthCheckActivityInsert(database, activity),
    ),
  ];
  const results = await database.batch(statements);

  assertSuccessfulMutationResults(
    results,
    statements.length,
    "Health Check prospect mutation",
  );
}
