import { getD1Database } from "./database";

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

export async function upsertD1HealthCheckProspect(
  row: D1HealthCheckProspectRow,
): Promise<void> {
  const result = await getD1Database()
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
    )
    .run();

  if (!result.success) {
    throw new Error("D1 Health Check prospect upsert did not succeed.");
  }

  if (result.meta.changes !== 1) {
    throw new Error(
      "D1 Health Check prospect identity does not match Supabase.",
    );
  }
}
