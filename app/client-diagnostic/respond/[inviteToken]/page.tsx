import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  questionnaireTypes,
  type QuestionnaireType,
} from "@/lib/client-diagnostic/question-bank";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type ProjectQuestionnaireType = QuestionnaireType | "client_fact_pack";

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
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
  client_projects:
    | {
        project_status: string;
      }
    | {
        project_status: string;
      }[]
    | null;
};

type ResolvedParticipantInvite = {
  participant_id: string;
  project_id: string;
  questionnaire_type: ProjectQuestionnaireType;
  participant_status: string;
  completed_at: string | null;
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
  project_status: string;
};

function isScoredQuestionnaireType(value: string): value is QuestionnaireType {
  return questionnaireTypes.includes(value as QuestionnaireType);
}

function isProjectQuestionnaireType(
  value: string,
): value is ProjectQuestionnaireType {
  return isScoredQuestionnaireType(value) || value === "client_fact_pack";
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

function isInviteExpired(inviteExpiresAt: string | null): boolean {
  if (!inviteExpiresAt) {
    return false;
  }

  const expiresAt = new Date(inviteExpiresAt);
  return Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now();
}

function isParticipantStateAllowed(params: {
  participantStatus: string;
  completedAt: string | null;
  questionnaireType: ProjectQuestionnaireType;
}): boolean {
  const { participantStatus, completedAt, questionnaireType } = params;

  if (participantStatus === "archived") {
    return false;
  }

  if (questionnaireType === "client_fact_pack") {
    return participantStatus === "invited" || participantStatus === "started";
  }

  if (completedAt) {
    return false;
  }

  return participantStatus === "invited" || participantStatus === "started";
}

function getProjectStatus(
  clientProjects: ParticipantInviteLookupRow["client_projects"],
): string | null {
  if (!clientProjects) {
    return null;
  }

  if (Array.isArray(clientProjects)) {
    return clientProjects[0]?.project_status ?? null;
  }

  return clientProjects.project_status ?? null;
}

function LinkNoLongerActivePage() {
  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Client diagnostic</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              This diagnostic link is no longer active
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This can happen if the project has been closed, the invitation has
              expired, or the link is no longer valid.
            </p>

            <div className="brand-card-dark mt-8 max-w-3xl p-6 sm:p-7">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                  Need help?
                </p>

                <p className="text-base leading-7 text-slate-200">
                  If you believe this is an error, please contact{" "}
                  <a
                    href="mailto:info@vanesch.uk"
                    className="font-semibold text-white underline underline-offset-4"
                  >
                    info@vanesch.uk
                  </a>{" "}
                  for further assistance.
                </p>

                <p className="text-base leading-7 text-slate-300">
                  You can also return to the Van Esch Advisory website below.
                </p>

                <div className="pt-2">
                  <Link href="/" className="brand-button-primary text-center">
                    Visit vanesch.uk
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function ClientDiagnosticRespondPage({
  params,
}: PageProps) {
  const { inviteToken } = await params;

  if (!isReasonableInviteToken(inviteToken)) {
    return <LinkNoLongerActivePage />;
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("client_participants")
    .select(
      `
        participant_id,
        project_id,
        questionnaire_type,
        participant_status,
        completed_at,
        invite_expires_at,
        invite_revoked_at,
        client_projects!client_participants_project_fk!inner(project_status)
      `,
    )
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error || !data) {
    console.info(
      JSON.stringify({
        event: "client_diagnostic_respond_inactive_link",
        reason: "participant_lookup_failed",
        inviteToken,
        error: error?.message ?? null,
      }),
    );

    return <LinkNoLongerActivePage />;
  }

  const participant = data as ParticipantInviteLookupRow;
  const projectStatus = getProjectStatus(participant.client_projects);

  if (!isUuid(participant.participant_id) || !isUuid(participant.project_id)) {
    return <LinkNoLongerActivePage />;
  }

  if (!isProjectQuestionnaireType(participant.questionnaire_type)) {
    return <LinkNoLongerActivePage />;
  }

  if (!projectStatus) {
    return <LinkNoLongerActivePage />;
  }

  const resolvedParticipant: ResolvedParticipantInvite = {
    participant_id: participant.participant_id,
    project_id: participant.project_id,
    questionnaire_type: participant.questionnaire_type,
    participant_status: participant.participant_status,
    completed_at: participant.completed_at,
    invite_expires_at: participant.invite_expires_at,
    invite_revoked_at: participant.invite_revoked_at,
    project_status: projectStatus,
  };

  if (resolvedParticipant.project_status !== "active") {
    return <LinkNoLongerActivePage />;
  }

  if (resolvedParticipant.invite_revoked_at) {
    return <LinkNoLongerActivePage />;
  }

  if (isInviteExpired(resolvedParticipant.invite_expires_at)) {
    return <LinkNoLongerActivePage />;
  }

  if (
    !isParticipantStateAllowed({
      participantStatus: resolvedParticipant.participant_status,
      completedAt: resolvedParticipant.completed_at,
      questionnaireType: resolvedParticipant.questionnaire_type,
    })
  ) {
    return <LinkNoLongerActivePage />;
  }

  const targetUrl =
    resolvedParticipant.questionnaire_type === "client_fact_pack"
      ? `/client-diagnostic/client-fact-pack` +
        `?projectId=${encodeURIComponent(resolvedParticipant.project_id)}` +
        `&participantId=${encodeURIComponent(resolvedParticipant.participant_id)}` +
        `&inviteToken=${encodeURIComponent(inviteToken)}`
      : `/client-diagnostic/${resolvedParticipant.questionnaire_type}` +
        `?projectId=${encodeURIComponent(resolvedParticipant.project_id)}` +
        `&participantId=${encodeURIComponent(resolvedParticipant.participant_id)}` +
        `&inviteToken=${encodeURIComponent(inviteToken)}`;

  redirect(targetUrl);
}