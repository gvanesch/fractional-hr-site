import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  questionnaireTypes,
  type QuestionnaireType,
} from "@/lib/client-diagnostic/question-bank";

export const runtime = "edge";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{
    inviteToken: string;
  }>;
};

type ParticipantInviteLookupRow = {
  participant_id: string;
  project_id: string;
  questionnaire_type: string;
  participant_status: string;
  completed_at: string | null;
};

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSupabaseAdminClient() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function isQuestionnaireType(value: string): value is QuestionnaireType {
  return questionnaireTypes.includes(value as QuestionnaireType);
}

function isReasonableInviteToken(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length >= 16;
}

function isUuid(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default async function ClientDiagnosticRespondPage({
  params,
}: PageProps) {
  const { inviteToken } = await params;

  if (!isReasonableInviteToken(inviteToken)) {
    notFound();
  }

  const supabase = getSupabaseAdminClient();

  const { data: participant, error } = await supabase
    .from("client_participants")
    .select(
      "participant_id, project_id, questionnaire_type, participant_status, completed_at",
    )
    .eq("invite_token", inviteToken)
    .maybeSingle<ParticipantInviteLookupRow>();

  if (error || !participant) {
    notFound();
  }

  if (!isUuid(participant.participant_id) || !isUuid(participant.project_id)) {
    notFound();
  }

  if (!isQuestionnaireType(participant.questionnaire_type)) {
    notFound();
  }

  const targetUrl =
    `/client-diagnostic/${participant.questionnaire_type}` +
    `?projectId=${encodeURIComponent(participant.project_id)}` +
    `&participantId=${encodeURIComponent(participant.participant_id)}` +
    `&inviteToken=${encodeURIComponent(inviteToken)}`;

  redirect(targetUrl);
}