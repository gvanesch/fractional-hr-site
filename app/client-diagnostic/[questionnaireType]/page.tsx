export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ClientDiagnosticQuestionnaire from "@/app/components/client-diagnostic/ClientDiagnosticQuestionnaire";
import {
  questionnaireTypes,
  type QuestionnaireType,
} from "@/lib/client-diagnostic/question-bank";

export const runtime = "edge";

type PageProps = {
  params: Promise<{
    questionnaireType: string;
  }>;
  searchParams?: Promise<{
    projectId?: string | string[];
    participantId?: string | string[];
    inviteToken?: string | string[];
  }>;
};

type ParticipantLookupRow = {
  participant_id: string;
  project_id: string;
  questionnaire_type: string;
  participant_status: string;
  completed_at: string | null;
  invite_token: string | null;
};

function isQuestionnaireType(value: string): value is QuestionnaireType {
  return questionnaireTypes.includes(value as QuestionnaireType);
}

function getSingleValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function isUuid(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isReasonableInviteToken(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length >= 16;
}

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

function getQuestionnaireTitle(questionnaireType: QuestionnaireType): string {
  switch (questionnaireType) {
    case "hr":
      return "HR Team Diagnostic";
    case "manager":
      return "Manager Diagnostic";
    case "leadership":
      return "Leadership Diagnostic";
    default:
      return "Client Diagnostic";
  }
}

function getQuestionnaireIntro(questionnaireType: QuestionnaireType): string {
  switch (questionnaireType) {
    case "hr":
      return "Please answer based on how HR operations work today in practice, rather than how they are intended to work on paper.";
    case "manager":
      return "Please answer based on your day-to-day experience of navigating people processes, support, and guidance as a manager.";
    case "leadership":
      return "Please answer from your perspective on how effectively people operations support organisational execution, consistency, and scale.";
    default:
      return "Please answer based on your direct experience and current understanding of how people operations work today.";
  }
}

function CompletedQuestionnairePage() {
  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Client diagnostic</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Questionnaire already submitted
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This questionnaire has already been completed. Thank you for your
              response.
            </p>

            <div className="brand-card-dark mt-8 max-w-3xl p-6 sm:p-7">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                  What happens next
                </p>

                <p className="text-base leading-7 text-slate-200">
                  Your responses have been recorded and will be used in the
                  wider diagnostic analysis alongside other perspectives across
                  the organisation.
                </p>

                <p className="text-base leading-7 text-slate-300">
                  This helps build a clearer, evidence-based view of how people
                  operations are working in practice and where the main areas of
                  friction, inconsistency, or improvement sit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function ClientDiagnosticQuestionnairePage({
  params,
  searchParams,
}: PageProps) {
  const { questionnaireType } = await params;

  if (!isQuestionnaireType(questionnaireType)) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const projectId = getSingleValue(resolvedSearchParams.projectId);
  const participantId = getSingleValue(resolvedSearchParams.participantId);
  const inviteToken = getSingleValue(resolvedSearchParams.inviteToken);

  if (
    !isUuid(projectId) ||
    !isUuid(participantId) ||
    !isReasonableInviteToken(inviteToken)
  ) {
    notFound();
  }

  const supabase = getSupabaseAdminClient();

  const { data: participant, error } = await supabase
    .from("client_participants")
    .select(
      "participant_id, project_id, questionnaire_type, participant_status, completed_at, invite_token",
    )
    .eq("participant_id", participantId)
    .eq("project_id", projectId)
    .single<ParticipantLookupRow>();

  if (error || !participant) {
    notFound();
  }

  if (participant.questionnaire_type !== questionnaireType) {
    notFound();
  }

  if (!participant.invite_token || participant.invite_token !== inviteToken) {
    notFound();
  }

  if (
    participant.participant_status === "completed" ||
    participant.completed_at !== null
  ) {
    return <CompletedQuestionnairePage />;
  }

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Client diagnostic</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              {getQuestionnaireTitle(questionnaireType)}
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This diagnostic is designed to build a rounded view of how people
              operations are working today across different roles and
              perspectives.
            </p>

            <div className="brand-card-dark mt-8 max-w-3xl p-6 sm:p-7">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                  Guidance
                </p>

                <p className="text-base leading-7 text-slate-200">
                  {getQuestionnaireIntro(questionnaireType)}
                </p>

                <p className="text-base leading-7 text-slate-300">
                  Please answer candidly and based on current experience. The
                  most useful insight comes from reflecting how work operates in
                  reality, including where processes feel clear, well supported,
                  inconsistent, or difficult to navigate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClientDiagnosticQuestionnaire
          questionnaireType={questionnaireType}
          projectId={projectId}
          participantId={participantId}
          inviteToken={inviteToken}
        />
    </main>
  );
}