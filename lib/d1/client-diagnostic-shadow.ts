import { writeD1ClientProjectSnapshot } from "./client-diagnostic";
import { isD1ClientDiagnosticShadowWriteEnabled } from "./database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SUPABASE_PAGE_SIZE = 1000;

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

type ShadowResponseRow = {
  response_id: string;
  project_id: string;
  participant_id: string;
  questionnaire_type: "hr" | "manager" | "leadership" | "payroll";
  dimension_key: string;
  question_key: string;
  answer_value: number | null;
  comment_text: string | null;
  created_at: string;
  updated_at: string;
  responses: unknown | null;
  submitted_at: string | null;
};

type ShadowDimensionScoreRow = {
  score_id: string;
  project_id: string;
  questionnaire_type: "hr" | "manager" | "leadership" | "payroll";
  dimension_key: string;
  average_score: number;
  response_count: number;
  updated_at: string;
  participant_id: string | null;
  score: number | null;
};

type ShadowFactPackRow = {
  fact_pack_id: string;
  project_id: string;
  participant_id: string;
  invite_token: string | null;
  response_json: unknown;
  status: "in_progress" | "completed";
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

type ShadowFunctionalSignalRequestRow = {
  signal_request_id: string;
  project_id: string;
  module_type: "it" | "payroll" | "finance" | "other";
  module_label: string | null;
  recipient_name: string;
  recipient_email: string;
  invite_token: string;
  signal_status: "invited" | "started" | "completed" | "archived";
  response_data: unknown | null;
  invited_at: string | null;
  invite_expires_at: string | null;
  invite_last_used_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  archived_at: string | null;
  archive_reason: string | null;
  archive_note: string | null;
  created_at: string;
  updated_at: string;
};

type ShadowServiceAccessContextRow = {
  context_id: string;
  project_id: string;
  participant_id: string;
  questionnaire_type: "hr" | "manager";
  routes_used: string[];
  usual_route: string | null;
  usual_route_effectiveness: number | null;
  intended_primary_route: string | null;
  specific_route_detail: string | null;
  created_at: string;
  updated_at: string;
  intended_access_model: string | null;
};

async function loadProjectRows<T>(
  table: string,
  projectId: string,
): Promise<T[]> {
  const supabase = createSupabaseAdminClient();
  const rows: T[] = [];

  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("project_id", projectId)
      .range(from, from + SUPABASE_PAGE_SIZE - 1)
      .returns<T[]>();

    if (error || !data) {
      throw new Error(`Unable to reload ${table} for D1 shadowing.`);
    }

    rows.push(...data);

    if (data.length < SUPABASE_PAGE_SIZE) {
      return rows;
    }
  }
}

export async function shadowClientProjectFromSupabase(
  projectId: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const [
    { data: project, error: projectError },
    participants,
    responses,
    dimensionScores,
    factPacks,
    functionalSignalRequests,
    serviceAccessContexts,
  ] = await Promise.all([
    supabase
      .from("client_projects")
      .select("*")
      .eq("project_id", projectId)
      .single<ShadowProjectRow>(),
    loadProjectRows<ShadowParticipantRow>("client_participants", projectId),
    loadProjectRows<ShadowResponseRow>("client_responses", projectId),
    loadProjectRows<ShadowDimensionScoreRow>(
      "client_dimension_scores",
      projectId,
    ),
    loadProjectRows<ShadowFactPackRow>("client_fact_packs", projectId),
    loadProjectRows<ShadowFunctionalSignalRequestRow>(
      "client_functional_signal_requests",
      projectId,
    ),
    loadProjectRows<ShadowServiceAccessContextRow>(
      "client_service_access_context",
      projectId,
    ),
  ]);

  if (projectError || !project) {
    throw new Error(
      "Unable to reload the Supabase project for D1 shadowing.",
    );
  }

  await writeD1ClientProjectSnapshot({
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
    responses: responses.map((response) => ({
      responseId: response.response_id,
      projectId: response.project_id,
      participantId: response.participant_id,
      questionnaireType: response.questionnaire_type,
      dimensionKey: response.dimension_key,
      questionKey: response.question_key,
      answerValue: response.answer_value,
      commentText: response.comment_text,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      responses: response.responses,
      submittedAt: response.submitted_at,
    })),
    dimensionScores: dimensionScores.map((dimensionScore) => ({
      scoreId: dimensionScore.score_id,
      projectId: dimensionScore.project_id,
      questionnaireType: dimensionScore.questionnaire_type,
      dimensionKey: dimensionScore.dimension_key,
      averageScore: dimensionScore.average_score,
      responseCount: dimensionScore.response_count,
      updatedAt: dimensionScore.updated_at,
      participantId: dimensionScore.participant_id,
      score: dimensionScore.score,
    })),
    factPacks: factPacks.map((factPack) => ({
      factPackId: factPack.fact_pack_id,
      projectId: factPack.project_id,
      participantId: factPack.participant_id,
      inviteToken: factPack.invite_token,
      responseJson: factPack.response_json,
      status: factPack.status,
      submittedAt: factPack.submitted_at,
      createdAt: factPack.created_at,
      updatedAt: factPack.updated_at,
    })),
    functionalSignalRequests: functionalSignalRequests.map((signalRequest) => ({
      signalRequestId: signalRequest.signal_request_id,
      projectId: signalRequest.project_id,
      moduleType: signalRequest.module_type,
      moduleLabel: signalRequest.module_label,
      recipientName: signalRequest.recipient_name,
      recipientEmail: signalRequest.recipient_email,
      inviteToken: signalRequest.invite_token,
      signalStatus: signalRequest.signal_status,
      responseData: signalRequest.response_data,
      invitedAt: signalRequest.invited_at,
      inviteExpiresAt: signalRequest.invite_expires_at,
      inviteLastUsedAt: signalRequest.invite_last_used_at,
      startedAt: signalRequest.started_at,
      submittedAt: signalRequest.submitted_at,
      completedAt: signalRequest.completed_at,
      archivedAt: signalRequest.archived_at,
      archiveReason: signalRequest.archive_reason,
      archiveNote: signalRequest.archive_note,
      createdAt: signalRequest.created_at,
      updatedAt: signalRequest.updated_at,
    })),
    serviceAccessContexts: serviceAccessContexts.map((context) => ({
      contextId: context.context_id,
      projectId: context.project_id,
      participantId: context.participant_id,
      questionnaireType: context.questionnaire_type,
      routesUsed: context.routes_used,
      usualRoute: context.usual_route,
      usualRouteEffectiveness: context.usual_route_effectiveness,
      intendedPrimaryRoute: context.intended_primary_route,
      specificRouteDetail: context.specific_route_detail,
      createdAt: context.created_at,
      updatedAt: context.updated_at,
      intendedAccessModel: context.intended_access_model,
    })),
  });
}

export async function shadowClientProjectAfterSupabaseMutation(
  projectId: string,
  source: string,
): Promise<void> {
  if (!isD1ClientDiagnosticShadowWriteEnabled()) {
    return;
  }

  try {
    await shadowClientProjectFromSupabase(projectId);
  } catch (error) {
    console.error(`[${source}] D1 shadow write failed`, error);
  }
}
