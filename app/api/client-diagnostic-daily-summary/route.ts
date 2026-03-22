import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  dimensionDefinitions,
  questionnaireTypes,
} from "@/lib/client-diagnostic/question-bank";

export const runtime = "edge";

type ClientProjectRow = {
  project_id: string;
  company_name: string;
  project_status: string;
};

type DimensionScoreRow = {
  project_id: string;
  questionnaire_type: string;
  dimension_key: string;
  average_score: number;
  response_count: number;
};

type ParticipantRow = {
  participant_status: string;
};

type SummaryProjectResult = {
  projectId: string;
  companyName: string;
  projectStatus: string;
  totalParticipants: number;
  completedParticipants: number;
  invitedParticipants: number;
  inProgressParticipants: number;
  completionPercentage: number;
  biggestGaps: Array<{
    label: string;
    gap: number | null;
  }>;
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

function buildDimensionSummary(scores: DimensionScoreRow[]) {
  return dimensionDefinitions.map((dimension) => {
    const rows = scores.filter((row) => row.dimension_key === dimension.key);

    const roleScores: Record<string, number> = {};

    for (const questionnaireType of questionnaireTypes) {
      const match = rows.find(
        (row) => row.questionnaire_type === questionnaireType,
      );

      if (match) {
        roleScores[questionnaireType] = Number(match.average_score);
      }
    }

    const values = Object.values(roleScores);

    if (values.length < 2) {
      return {
        label: dimension.label,
        gap: null,
      };
    }

    const gap = Math.max(...values) - Math.min(...values);

    return {
      label: dimension.label,
      gap: Number(gap.toFixed(2)),
    };
  });
}

function getCompletionMetrics(participants: ParticipantRow[]) {
  const totalParticipants = participants.length;
  const completedParticipants = participants.filter(
    (participant) => participant.participant_status === "completed",
  ).length;
  const invitedParticipants = participants.filter(
    (participant) => participant.participant_status === "invited",
  ).length;
  const inProgressParticipants = participants.filter(
    (participant) =>
      participant.participant_status !== "completed" &&
      participant.participant_status !== "invited",
  ).length;

  const completionPercentage =
    totalParticipants === 0
      ? 0
      : Math.round((completedParticipants / totalParticipants) * 100);

  return {
    totalParticipants,
    completedParticipants,
    invitedParticipants,
    inProgressParticipants,
    completionPercentage,
  };
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

function buildEmailHtml(projects: SummaryProjectResult[]) {
  const projectSections = projects
    .map((project) => {
      const biggestGapsHtml =
        project.biggestGaps.length > 0
          ? project.biggestGaps
              .map((gap) => {
                if (gap.gap === null) {
                  return "";
                }

                return `<li style="margin: 0 0 6px 0;">${escapeHtml(
                  gap.label,
                )} — gap ${gap.gap}</li>`;
              })
              .join("")
          : `<li style="margin: 0 0 6px 0;">Awaiting multiple respondent groups</li>`;

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
            <strong>Completion:</strong> ${project.completionPercentage}% (${project.completedParticipants}/${project.totalParticipants})
          </p>
          <p style="margin: 0 0 12px 0; color: #334155;">
            <strong>Invited:</strong> ${project.invitedParticipants}
            &nbsp;|&nbsp;
            <strong>In progress:</strong> ${project.inProgressParticipants}
          </p>

          <p style="margin: 0 0 8px 0; color: #0A1628;"><strong>Top gaps</strong></p>
          <ul style="margin: 0; padding-left: 20px; color: #334155;">
            ${biggestGapsHtml}
          </ul>

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
          Active project overview for Van Esch Advisory.
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

  const [
    { data: participants, error: participantsError },
    { data: scores, error: scoresError },
  ] = await Promise.all([
    supabase
      .from("client_participants")
      .select("participant_status")
      .eq("project_id", project.project_id)
      .returns<ParticipantRow[]>(),
    supabase
      .from("client_dimension_scores")
      .select(
        "project_id, questionnaire_type, dimension_key, average_score, response_count",
      )
      .eq("project_id", project.project_id)
      .returns<DimensionScoreRow[]>(),
  ]);

  if (participantsError) {
    throw new Error(
      `Failed to load participants for project ${project.project_id}: ${participantsError.message}`,
    );
  }

  if (scoresError) {
    throw new Error(
      `Failed to load dimension scores for project ${project.project_id}: ${scoresError.message}`,
    );
  }

  const participantRows = participants ?? [];
  const scoreRows = scores ?? [];

  const {
    totalParticipants,
    completedParticipants,
    invitedParticipants,
    inProgressParticipants,
    completionPercentage,
  } = getCompletionMetrics(participantRows);

  const biggestGaps = buildDimensionSummary(scoreRows)
    .filter((dimension) => dimension.gap !== null)
    .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))
    .slice(0, 2);

  return {
    projectId: project.project_id,
    companyName: project.company_name,
    projectStatus: project.project_status,
    totalParticipants,
    completedParticipants,
    invitedParticipants,
    inProgressParticipants,
    completionPercentage,
    biggestGaps,
    dashboardUrl: buildDashboardUrl(appBaseUrl, project.project_id),
  };
}

function isAuthorized(request: Request, cronSecret: string) {
  const authorizationHeader = request.headers.get("authorization");
  const xCronSecretHeader = request.headers.get("x-cron-secret");

  if (authorizationHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  if (xCronSecretHeader === cronSecret) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const { cronSecret, dailySummaryRecipient, appBaseUrl } =
      getRequiredConfig();

    if (!isAuthorized(request, cronSecret)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 },
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
        details: message,
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