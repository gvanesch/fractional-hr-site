export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ClientFactPackForm from "@/app/components/client-diagnostic/ClientFactPackForm";

export const runtime = "edge";

type PageProps = {
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
  name: string | null;
};

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

function CompletedFactPackPage() {
  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Client fact pack</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Fact pack already submitted
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This client fact pack has already been completed. Thank you for
              providing the context needed to support the wider diagnostic and
              final interpretation.
            </p>

            <div className="brand-card-dark mt-8 max-w-3xl p-6 sm:p-7">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                  What happens next
                </p>

                <p className="text-base leading-7 text-slate-200">
                  The fact pack will be used as contextual input alongside the
                  scored diagnostic and qualitative evidence.
                </p>

                <p className="text-base leading-7 text-slate-300">
                  It is not used in statistical analysis, but it helps ground
                  the final advisory view in the current systems and delivery
                  environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function ClientFactPackPage({
  searchParams,
}: PageProps) {
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
      "participant_id, project_id, questionnaire_type, participant_status, completed_at, invite_token, name",
    )
    .eq("participant_id", participantId)
    .eq("project_id", projectId)
    .single<ParticipantLookupRow>();

  if (error || !participant) {
    notFound();
  }

  if (participant.questionnaire_type !== "client_fact_pack") {
    notFound();
  }

  if (!participant.invite_token || participant.invite_token !== inviteToken) {
    notFound();
  }

  if (
    participant.participant_status === "completed" ||
    participant.completed_at !== null
  ) {
    return <CompletedFactPackPage />;
  }

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Client fact pack</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Client systems and operating context
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This fact pack captures the current systems, tooling, and delivery
              context that supports people operations today.
            </p>

            <div className="brand-card-dark mt-8 max-w-3xl p-6 sm:p-7">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                  Guidance
                </p>

                <p className="text-base leading-7 text-slate-200">
                  Please complete this once for the project. Focus on the
                  current operating environment rather than target state or
                  future plans.
                </p>

                <p className="text-base leading-7 text-slate-300">
                  This information is used to strengthen final interpretation and
                  recommendations. It is not included in scored statistical
                  analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClientFactPackForm
        projectId={projectId}
        participantId={participantId}
        inviteToken={inviteToken}
        recipientName={participant.name ?? ""}
      />
    </main>
  );
}