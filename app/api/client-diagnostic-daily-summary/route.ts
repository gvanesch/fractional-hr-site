import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  dimensionDefinitions,
  questionnaireTypes,
} from "@/lib/client-diagnostic/question-bank";

export const runtime = "edge";

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

function buildDimensionSummary(scores: DimensionScoreRow[]) {
  return dimensionDefinitions.map((dimension) => {
    const rows = scores.filter(
      (r) => r.dimension_key === dimension.key,
    );

    const roleScores: Record<string, number> = {};

    for (const qt of questionnaireTypes) {
      const match = rows.find((r) => r.questionnaire_type === qt);
      if (match) {
        roleScores[qt] = Number(match.average_score);
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

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const resend = getResendClient();

    const { data: projects } = await supabase
      .from("client_projects")
      .select("*")
      .eq("project_status", "active");

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active projects.",
      });
    }

    let emailHtml = `<h2>Client Diagnostic Daily Summary</h2>`;

    for (const project of projects) {
      const projectId = project.project_id;

      const [{ data: participants }, { data: scores }] =
        await Promise.all([
          supabase
            .from("client_participants")
            .select("participant_status")
            .eq("project_id", projectId)
            .returns<ParticipantRow[]>(),

          supabase
            .from("client_dimension_scores")
            .select(
              "project_id, questionnaire_type, dimension_key, average_score, response_count",
            )
            .eq("project_id", projectId)
            .returns<DimensionScoreRow[]>(),
        ]);

      const total = participants?.length ?? 0;

      const completed =
        participants?.filter((p) => p.participant_status === "completed")
          .length ?? 0;

      const invited =
        participants?.filter((p) => p.participant_status === "invited")
          .length ?? 0;

      const inProgress =
        participants?.filter(
          (p) =>
            p.participant_status !== "completed" &&
            p.participant_status !== "invited",
        ).length ?? 0;

      const completionPct =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      const dimensionSummary = buildDimensionSummary(scores ?? []);

      const biggestGaps = dimensionSummary
        .filter((d) => d.gap !== null)
        .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))
        .slice(0, 2);

      emailHtml += `
        <hr />
        <h3>${project.company_name}</h3>
        <p><strong>Completion:</strong> ${completionPct}% (${completed}/${total})</p>
        <p><strong>Status:</strong> ${project.project_status}</p>
        <p><strong>Invited:</strong> ${invited} | <strong>In progress:</strong> ${inProgress}</p>

        <p><strong>Top gaps:</strong></p>
        <ul>
          ${
            biggestGaps.length > 0
              ? biggestGaps
                  .map(
                    (g) =>
                      `<li>${g.label} — gap ${g.gap}</li>`,
                  )
                  .join("")
              : "<li>Awaiting multiple respondent groups</li>"
          }
        </ul>
      `;
    }

    await resend.emails.send({
      from: "Van Esch Advisory <no-reply@vanesch.uk>",
      to: "greg@example.com", // change later
      subject: "Client Diagnostic Daily Summary",
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: "Daily summary email sent.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send daily summary.",
      },
      { status: 500 },
    );
  }
}