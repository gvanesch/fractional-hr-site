import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { questionnaireTypes } from "@/lib/client-diagnostic/question-bank";

export const runtime = "edge";

type ClientProjectRow = {
  project_id: string;
  company_name: string;
  project_status: string;
};

type ParticipantRow = {
  questionnaire_type: string;
  participant_status: string;
};

type RespondentProgressRow = {
  questionnaireType: string;
  label: string;
  totalInvited: number;
  outstanding: number;
  completed: number;
};

type SummaryProjectResult = {
  projectId: string;
  companyName: string;
  projectStatus: string;
  totalInvited: number;
  outstanding: number;
  completed: number;
  completionPercentage: number;
  respondentProgress: RespondentProgressRow[];
  dashboardUrl: string | null;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  return new Resend(apiKey);
}

function getRequiredConfig() {
  const cronSecret = process.env.CRON_SECRET;
  const dailySummaryRecipient = process.env.DAILY_SUMMARY_RECIPIENT;
  const appBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? null;

  if (!cronSecret) {
    throw new Error("Missing CRON_SECRET.");
  }

  if (!dailySummaryRecipient) {
    throw new Error("Missing DAILY_SUMMARY_RECIPIENT.");
  }

  return {
    cronSecret,
    dailySummaryRecipient,
    appBaseUrl,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatQuestionnaireTypeLabel(questionnaireType: string): string {
  switch (questionnaireType) {
    case "hr":
      return "HR";
    case "manager":
      return "Manager";
    case "leadership":
      return "Leadership";
    case "client_fact_pack":
      return "Client Fact Pack";
    default:
      return questionnaireType
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function getCompletionMetrics(participants: ParticipantRow[]) {
  const totalInvited = participants.length;
  const completed = participants.filter(
    (participant) => participant.participant_status === "completed",
  ).length;
  const outstanding = Math.max(totalInvited - completed, 0);

  const completionPercentage =
    totalInvited === 0 ? 0 : Math.round((completed / totalInvited) * 100);

  return {
    totalInvited,
    outstanding,
    completed,
    completionPercentage,
  };
}

function buildRespondentProgress(
  participants: ParticipantRow[],
): RespondentProgressRow[] {
  return questionnaireTypes.map((questionnaireType) => {
    const matchingParticipants = participants.filter(
      (participant) => participant.questionnaire_type === questionnaireType,
    );

    const totalInvited = matchingParticipants.length;
    const completed = matchingParticipants.filter(
      (participant) => participant.participant_status === "completed",
    ).length;
    const outstanding = Math.max(totalInvited - completed, 0);

    return {
      questionnaireType,
      label: formatQuestionnaireTypeLabel(questionnaireType),
      totalInvited,
      outstanding,
      completed,
    };
  });
}

function buildDashboardUrl(
  appBaseUrl: string | null,
  projectId: string,
): string | null {
  if (!appBaseUrl) {
    return null;
  }

  return `${appBaseUrl}/advisor/client-diagnostic/${projectId}`;
}

function buildRespondentProgressTable(
  respondentProgress: RespondentProgressRow[],
) {
  const rowsHtml = respondentProgress
    .map((row) => {
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628;">${escapeHtml(row.label)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #334155; text-align: center;">${row.totalInvited}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #334155; text-align: center;">${row.outstanding}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #334155; text-align: center;">${row.completed}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      <thead>
        <tr style="background: #F8FAFC;">
          <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: left;">Respondent group</th>
          <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: center;">Total invited</th>
          <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: center;">Outstanding</th>
          <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: center;">Completed</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

function buildEmailHtml(projects: SummaryProjectResult[]) {
  const projectSections = projects
    .map((project) => {
      const dashboardLinkHtml = project.dashboardUrl
        ? `<p style="margin: 12px 0 0 0;"><a href="${escapeHtml(
            project.dashboardUrl,
          )}" style="color: #1E6FD9; text-decoration: none;">Open advisor dashboard</a></p>`
        : "";

      return `
        <section style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin: 0 0 16px 0;">
          <h3 style="margin: 0 0 12px 0; color: #0A1628; font-size: 18px; line-height: 1.3;">
            ${escapeHtml(project.companyName)}
          </h3>

          <p style="margin: 0 0 8px 0; color: #334155;">
            <strong>Status:</strong> ${escapeHtml(project.projectStatus)}
          </p>
          <p style="margin: 0 0 8px 0; color: #334155;">
            <strong>Overall completion:</strong> ${project.completionPercentage}% (${project.completed}/${project.totalInvited})
          </p>
          <p style="margin: 0 0 12px 0; color: #334155;">
            <strong>Total invited:</strong> ${project.totalInvited}
            &nbsp;|&nbsp;
            <strong>Outstanding:</strong> ${project.outstanding}
            &nbsp;|&nbsp;
            <strong>Completed:</strong> ${project.completed}
          </p>

          <p style="margin: 0 0 8px 0; color: #0A1628;"><strong>Respondent progress</strong></p>
          ${buildRespondentProgressTable(project.respondentProgress)}

          ${dashboardLinkHtml}
        </section>
      `;
    })
    .join("");

  return `
    <div style="background: #F4F6FA; padding: 24px; font-family: Inter, Arial, sans-serif; color: #0A1628;">
      <div style="max-width: 760px; margin: 0 auto;">
        <h2 style="margin: 0 0 8px 0; font-size: 24px; line-height: 1.2; color: #0A1628;">
          Client Diagnostic Daily Summary
        </h2>
        <p style="margin: 0 0 24px 0; color: #64748B;">
          Active project participation overview for Van Esch Advisory.
        </p>

        ${projectSections}
      </div>
    </div>
  `;
}

async function loadActiveProjects() {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("client_projects")
    .select("project_id, company_name, project_status")
    .eq("project_status", "active")
    .order("company_name", { ascending: true })
    .returns<ClientProjectRow[]>();

  if (error) {
    throw new Error(`Failed to load active projects: ${error.message}`);
  }

  return data ?? [];
}

async function buildProjectResult(
  project: ClientProjectRow,
  appBaseUrl: string | null,
): Promise<SummaryProjectResult> {
  const supabase = getSupabaseAdminClient();

  const { data: participants, error: participantsError } = await supabase
    .from("client_participants")
    .select("questionnaire_type, participant_status")
    .eq("project_id", project.project_id)
    .returns<ParticipantRow[]>();

  if (participantsError) {
    throw new Error(
      `Failed to load participants for project ${project.project_id}: ${participantsError.message}`,
    );
  }

  const participantRows = participants ?? [];

  const { totalInvited, outstanding, completed, completionPercentage } =
    getCompletionMetrics(participantRows);

  return {
    projectId: project.project_id,
    companyName: project.company_name,
    projectStatus: project.project_status,
    totalInvited,
    outstanding,
    completed,
    completionPercentage,
    respondentProgress: buildRespondentProgress(participantRows),
    dashboardUrl: buildDashboardUrl(appBaseUrl, project.project_id),
  };
}

function isAuthorized(request: Request, cronSecret: string) {
  const authorizationHeader = request.headers.get("authorization");
  return authorizationHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: Request) {
  try {
    const { cronSecret, dailySummaryRecipient, appBaseUrl } =
      getRequiredConfig();

    if (!isAuthorized(request, cronSecret)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden.",
        },
        { status: 403 },
      );
    }

    const resend = getResendClient();
    const activeProjects = await loadActiveProjects();

    if (activeProjects.length === 0) {
      console.info(
        JSON.stringify({
          event: "client_diagnostic_daily_summary_skipped",
          reason: "no_active_projects",
        }),
      );

      return NextResponse.json({
        success: true,
        message: "No active projects.",
        projectCount: 0,
      });
    }

    const projectResults = await Promise.all(
      activeProjects.map((project) => buildProjectResult(project, appBaseUrl)),
    );

    const emailHtml = buildEmailHtml(projectResults);

    const resendResponse = await resend.emails.send({
      from: "Van Esch Advisory <no-reply@vanesch.uk>",
      to: dailySummaryRecipient,
      subject: "Client Diagnostic Daily Summary",
      html: emailHtml,
    });

    if (resendResponse.error) {
      throw new Error(
        `Resend failed to send daily summary: ${resendResponse.error.message}`,
      );
    }

    console.info(
      JSON.stringify({
        event: "client_diagnostic_daily_summary_sent",
        recipient: dailySummaryRecipient,
        projectCount: projectResults.length,
      }),
    );

    return NextResponse.json({
      success: true,
      message: "Daily summary email sent.",
      projectCount: projectResults.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred.";

    console.error(
      JSON.stringify({
        event: "client_diagnostic_daily_summary_failed",
        error: message,
      }),
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send daily summary.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed.",
    },
    { status: 405 },
  );
}