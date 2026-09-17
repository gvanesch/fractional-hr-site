import { writeD1ClientProjectWithParticipants } from "./client-diagnostic";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ShadowProjectRow = {
  project_id: string;
  company_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  project_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  project_name: string | null;
  status: string | null;
  segmentation_schema: unknown | null;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  company_website: string | null;
  purchase_order_number: string | null;
  msa_status: string | null;
  dpa_status: string | null;
};

type ShadowParticipantRow = {
  participant_id: string;
  project_id: string;
  questionnaire_type:
    | "hr"
    | "manager"
    | "leadership"
    | "client_fact_pack"
    | "payroll";
  role_label: string;
  invite_token: string;
  participant_status: "invited" | "started" | "completed" | "archived";
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  status: string | null;
  invited_at: string | null;
  segmentation_values: unknown | null;
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
  invite_last_used_at: string | null;
  withdraw_reason: string | null;
  withdraw_note: string | null;
  withdrawn_at: string | null;
  reinstate_reason: string | null;
  reinstate_note: string | null;
  reinstated_at: string | null;
};

export async function shadowClientProjectFromSupabase(
  projectId: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const [
    { data: project, error: projectError },
    { data: participants, error: participantsError },
  ] = await Promise.all([
    supabase
      .from("client_projects")
      .select("*")
      .eq("project_id", projectId)
      .single<ShadowProjectRow>(),
    supabase
      .from("client_participants")
      .select("*")
      .eq("project_id", projectId)
      .returns<ShadowParticipantRow[]>(),
  ]);

  if (projectError || participantsError || !project || !participants) {
    throw new Error(
      "Unable to reload the Supabase project for D1 shadowing.",
    );
  }

  await writeD1ClientProjectWithParticipants({
    project: {
      projectId: project.project_id,
      companyName: project.company_name,
      primaryContactName: project.primary_contact_name,
      primaryContactEmail: project.primary_contact_email,
      projectStatus: project.project_status,
      notes: project.notes,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      projectName: project.project_name,
      status: project.status,
      segmentationSchema: project.segmentation_schema,
      billingContactName: project.billing_contact_name,
      billingContactEmail: project.billing_contact_email,
      companyWebsite: project.company_website,
      purchaseOrderNumber: project.purchase_order_number,
      msaStatus: project.msa_status,
      dpaStatus: project.dpa_status,
    },
    participants: participants.map((participant) => ({
      participantId: participant.participant_id,
      projectId: participant.project_id,
      questionnaireType: participant.questionnaire_type,
      roleLabel: participant.role_label,
      inviteToken: participant.invite_token,
      participantStatus: participant.participant_status,
      startedAt: participant.started_at,
      completedAt: participant.completed_at,
      createdAt: participant.created_at,
      updatedAt: participant.updated_at,
      name: participant.name,
      email: participant.email,
      status: participant.status,
      invitedAt: participant.invited_at,
      segmentationValues: participant.segmentation_values,
      inviteExpiresAt: participant.invite_expires_at,
      inviteRevokedAt: participant.invite_revoked_at,
      inviteLastUsedAt: participant.invite_last_used_at,
      withdrawReason: participant.withdraw_reason,
      withdrawNote: participant.withdraw_note,
      withdrawnAt: participant.withdrawn_at,
      reinstateReason: participant.reinstate_reason,
      reinstateNote: participant.reinstate_note,
      reinstatedAt: participant.reinstated_at,
    })),
  });
}
