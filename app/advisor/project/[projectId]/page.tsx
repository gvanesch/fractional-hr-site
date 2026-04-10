import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import AddParticipantForm from "@/app/components/advisor/AddParticipantForm";

export const metadata = {
  title: "Project Participants | Van Esch Advisory",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

type Participant = {
  participant_id: string;
  project_id: string;
  questionnaire_type: "hr" | "manager" | "leadership" | "client_fact_pack";
  role_label: string;
  invite_token: string;
  participant_status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  status: string | null;
  invited_at: string | null;
  segmentation_values: Record<string, unknown> | null;
};

type Project = {
  project_id: string;
  project_name: string | null;
  company_name: string;
  project_status: string;
};

function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function formatProjectTitle(project: Project): string {
  if (project.project_name && project.project_name.trim().length > 0) {
    return project.project_name;
  }

  if (project.company_name && project.company_name.trim().length > 0) {
    return project.company_name;
  }

  return "Untitled project";
}

function formatQuestionnaireType(
  questionnaireType: Participant["questionnaire_type"],
): string {
  switch (questionnaireType) {
    case "hr":
      return "HR";
    case "manager":
      return "Manager";
    case "leadership":
      return "Leadership";
    case "client_fact_pack":
      return "Fact Pack";
    default:
      return questionnaireType;
  }
}

function formatParticipantStatus(status: string): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    case "invited":
      return "Invited";
    default:
      return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

function getParticipantStatusClasses(status: string): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "invited":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSegmentationSummary(
  segmentationValues: Record<string, unknown> | null,
): string {
  if (!segmentationValues || Object.keys(segmentationValues).length === 0) {
    return "—";
  }

  const entries = Object.entries(segmentationValues)
    .filter(([, value]) => value !== null && value !== "")
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`);

  return entries.length > 0 ? entries.join(" · ") : "—";
}

export default async function AdvisorProjectParticipantsPage({
  params,
}: PageProps) {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const { projectId } = await params;

  if (!isUuid(projectId)) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();

  const [{ data: project, error: projectError }, { data: participants, error: participantsError }] =
    await Promise.all([
      supabase
        .from("client_projects")
        .select("project_id, project_name, company_name, project_status")
        .eq("project_id", projectId)
        .single<Project>(),
      supabase
        .from("client_participants")
        .select(
          "participant_id, project_id, questionnaire_type, role_label, invite_token, participant_status, started_at, completed_at, created_at, updated_at, name, email, status, invited_at, segmentation_values",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .returns<Participant[]>(),
    ]);

  if (projectError || !project) {
    notFound();
  }

  const participantRows = !participantsError && participants ? participants : [];

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-5xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Project participants
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              {formatProjectTitle(project)}. Review invited participants, response
              status, and coverage across questionnaire groups. This page now
              supports adding participants mid-project so the stakeholder set can
              evolve without breaking the workspace.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Link
                href={`/advisor/project/${projectId}`}
                className="brand-button-dark text-center"
              >
                Back to workspace
              </Link>

              <Link
                href={`/advisor/report/${projectId}`}
                className="brand-button-dark text-center"
              >
                View report
              </Link>

              <Link
                href="/advisor/projects"
                className="brand-button-dark text-center"
              >
                All projects
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="brand-container space-y-8 py-10">
        <AddParticipantForm projectId={projectId} />

        {participantsError ? (
          <section className="brand-surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Unable to load participants
            </h2>
            <p className="mt-4 text-sm leading-7 text-rose-600">
              There was a problem retrieving participant data for this project.
            </p>
          </section>
        ) : participantRows.length === 0 ? (
          <section className="brand-surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              No participants found
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              This project currently has no participants recorded.
            </p>
          </section>
        ) : (
          <section className="brand-surface-card p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Participant register
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  Current source-of-truth status is based on{" "}
                  <span className="font-semibold">participant_status</span>.
                  Duplicate legacy status fields are not being used here.
                </p>
              </div>

              <div className="text-sm text-slate-500">
                {participantRows.length} participant
                {participantRows.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Participant
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Role
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Questionnaire
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Invited
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Started
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Completed
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Segmentation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {participantRows.map((participant) => (
                    <tr key={participant.participant_id}>
                      <td className="border-b border-slate-200 px-4 py-4 align-top">
                        <p className="text-sm font-semibold text-slate-900">
                          {participant.name || "Unnamed participant"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {participant.email || "No email recorded"}
                        </p>
                      </td>

                      <td className="border-b border-slate-200 px-4 py-4 align-top text-sm text-slate-700">
                        {participant.role_label}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-4 align-top text-sm text-slate-700">
                        {formatQuestionnaireType(participant.questionnaire_type)}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getParticipantStatusClasses(
                            participant.participant_status,
                          )}`}
                        >
                          {formatParticipantStatus(participant.participant_status)}
                        </span>
                      </td>

                      <td className="border-b border-slate-200 px-4 py-4 align-top text-sm text-slate-700">
                        {formatDateTime(participant.invited_at)}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-4 align-top text-sm text-slate-700">
                        {formatDateTime(participant.started_at)}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-4 align-top text-sm text-slate-700">
                        {formatDateTime(participant.completed_at)}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-4 align-top text-sm text-slate-700">
                        {formatSegmentationSummary(participant.segmentation_values)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}