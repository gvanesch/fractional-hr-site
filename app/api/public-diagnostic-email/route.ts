import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
    buildAdvisorBrief,
    calculateDiagnosticResult,
    type DiagnosticAnswers,
} from "@/lib/diagnostic";

export const dynamic = "force-dynamic";

const MAX_EMAIL_LENGTH = 320;

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: {
            "Cache-Control": "no-store",
        },
    });
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function isValidEmail(email: string): boolean {
    if (email.length > MAX_EMAIL_LENGTH) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normaliseEmail(value: unknown): string {
    if (typeof value !== "string") {
        throw new Error("A valid email address is required.");
    }

    const trimmed = value.trim().toLowerCase();

    if (!trimmed || !isValidEmail(trimmed)) {
        throw new Error("A valid email address is required.");
    }

    return trimmed;
}

function asDiagnosticAnswers(value: unknown): DiagnosticAnswers | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const parsed: Record<number, 1 | 2 | 3 | 4 | 5 | undefined> = {};

    for (const [key, rawValue] of Object.entries(value)) {
        const questionId = Number(key);

        if (!Number.isInteger(questionId)) {
            return null;
        }

        if (
            rawValue === 1 ||
            rawValue === 2 ||
            rawValue === 3 ||
            rawValue === 4 ||
            rawValue === 5
        ) {
            parsed[questionId] = rawValue;
        }
    }

    return parsed as DiagnosticAnswers;
}

function buildClientEmailHtml(params: {
    score: number;
    bandLabel: string;
    bandSummary: string;
    overallAssessment: string;
    focusAreas: string[];
    whatTypicallyHappensNext: string[];
    lowestDimensions: Array<{ label: string; score: number }>;
    interpretationUrl: string;
}) {
    const {
        score,
        bandLabel,
        bandSummary,
        overallAssessment,
        focusAreas,
        whatTypicallyHappensNext,
        lowestDimensions,
        interpretationUrl,
    } = params;

    const focusAreasHtml = focusAreas
        .slice(0, 3)
        .map(
            (item) => `
        <li style="margin: 0 0 8px; color: #334155; line-height: 1.7;">
          ${escapeHtml(item)}
        </li>
      `,
        )
        .join("");

    const nextNarrativesHtml = whatTypicallyHappensNext
        .slice(0, 2)
        .map(
            (item) => `
        <li style="margin: 0 0 8px; color: #334155; line-height: 1.7;">
          ${escapeHtml(item)}
        </li>
      `,
        )
        .join("");

    const lowestDimensionsHtml = lowestDimensions
        .map(
            (dimension) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628;">
            ${escapeHtml(dimension.label)}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; width: 90px; text-align: center;">
            ${dimension.score} / 5
          </td>
        </tr>
      `,
        )
        .join("");

    return `
    <div style="font-family: Arial, Helvetica, sans-serif; background: #F8FAFC; padding: 32px;">
      <div style="max-width: 760px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #1E6FD9;">
          Van Esch
        </p>

        <h1 style="margin: 0 0 12px; font-size: 28px; line-height: 1.2; color: #0A1628;">
          Your HR Health Check result
        </h1>

        <p style="margin: 0 0 24px; color: #475569; line-height: 1.7;">
          Here is a copy of your Health Check result and detailed interpretation.
        </p>

        <div style="margin: 0 0 24px; padding: 20px; border-radius: 14px; background: #F4F6FA; border: 1px solid #E2E8F0;">
          <p style="margin: 0 0 8px; color: #334155;">
            <strong>Score:</strong> ${score} / 100
          </p>
          <p style="margin: 0 0 8px; color: #334155;">
            <strong>Band:</strong> ${escapeHtml(bandLabel)}
          </p>
          <p style="margin: 0; color: #334155; line-height: 1.7;">
            ${escapeHtml(bandSummary)}
          </p>
        </div>

        <h2 style="margin: 0 0 14px; font-size: 22px; line-height: 1.3; color: #0A1628;">
          Overall interpretation
        </h2>

        <p style="margin: 0 0 24px; color: #334155; line-height: 1.8;">
          ${escapeHtml(overallAssessment)}
        </p>

        <h2 style="margin: 0 0 14px; font-size: 22px; line-height: 1.3; color: #0A1628;">
          Areas that may be worth looking at first
        </h2>

        <ul style="margin: 0 0 24px; padding-left: 20px;">
          ${focusAreasHtml}
        </ul>

        <h2 style="margin: 0 0 14px; font-size: 22px; line-height: 1.3; color: #0A1628;">
          If this pattern continues
        </h2>

        <ul style="margin: 0 0 24px; padding-left: 20px;">
          ${nextNarrativesHtml}
        </ul>

        <h2 style="margin: 0 0 14px; font-size: 22px; line-height: 1.3; color: #0A1628;">
          Lowest-scoring areas
        </h2>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
          <thead>
            <tr style="background: #F8FAFC;">
              <th style="padding: 12px; text-align: left; color: #0A1628; border-bottom: 1px solid #E2E8F0;">Area</th>
              <th style="padding: 12px; text-align: center; color: #0A1628; border-bottom: 1px solid #E2E8F0; width: 90px;">Score</th>
            </tr>
          </thead>
          <tbody>
            ${lowestDimensionsHtml}
          </tbody>
        </table>

        <p style="margin: 0 0 24px; color: #334155; line-height: 1.8;">
          You can view the fuller interpretation using the secure link below.
        </p>

        <p style="margin: 0;">
          <a
            href="${escapeHtml(interpretationUrl)}"
            style="display: inline-block; background: #1E6FD9; color: #FFFFFF; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;"
          >
            View your detailed interpretation
          </a>
        </p>
      </div>
    </div>
  `;
}

export async function POST(request: Request) {
    try {
        const rawBody = (await request.json()) as {
            token?: string;
            email?: string;
        };

        const token = typeof rawBody.token === "string" ? rawBody.token.trim() : "";

        if (!token) {
            return jsonResponse({ ok: false, error: "Token is required." }, 400);
        }

        const email = normaliseEmail(rawBody.email);

        const supabase = createSupabaseAdminClient();

        const { data, error } = await supabase
            .from("diagnostic_submissions")
            .select("answers")
            .eq("public_token", token)
            .single();

        if (error || !data) {
            return jsonResponse({ ok: false, error: "Result not found." }, 404);
        }

        const answers = asDiagnosticAnswers(data.answers);

        if (!answers) {
            return jsonResponse({ ok: false, error: "Invalid diagnostic data." }, 500);
        }

        const result = calculateDiagnosticResult(answers);
        const brief = buildAdvisorBrief(result);

        const updateResponse = await supabase
            .from("diagnostic_submissions")
            .update({ email })
            .eq("public_token", token);

        if (updateResponse.error) {
            return jsonResponse(
                { ok: false, error: "Unable to save email address." },
                500,
            );
        }

        const apiKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.CONTACT_FROM_EMAIL;

        if (!apiKey) {
            throw new Error("Missing RESEND_API_KEY environment variable.");
        }

        if (!fromEmail) {
            throw new Error("Missing CONTACT_FROM_EMAIL environment variable.");
        }

        const requestUrl = new URL(request.url);
        const interpretationUrl = `${requestUrl.origin}/contact/diagnostic-interpretation?t=${encodeURIComponent(
            token,
        )}`;

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [email],
                subject: `Your HR Health Check result – ${result.band.label} (${result.score}/100)`,
                html: buildClientEmailHtml({
                    score: result.score,
                    bandLabel: result.band.label,
                    bandSummary: result.band.summary,
                    overallAssessment: brief.overallAssessment,
                    focusAreas: brief.suggestedFocusAreas,
                    whatTypicallyHappensNext: brief.whatTypicallyHappensNext,
                    lowestDimensions: result.lowestDimensions.map((dimension) => ({
                        label: dimension.label,
                        score: dimension.score,
                    })),
                    interpretationUrl,
                }),
            }),
        });

        const resendPayload = (await response.json().catch(() => null)) as
            | { id?: string; error?: { message?: string } }
            | null;

        if (!response.ok) {
            return jsonResponse(
                {
                    ok: false,
                    error:
                        resendPayload?.error?.message ||
                        "Unable to send result email at the moment.",
                },
                500,
            );
        }

        return jsonResponse({
            ok: true,
            email,
            resendId: resendPayload?.id ?? null,
        });
    } catch (error) {
        console.error("Public diagnostic email API error:", error);

        const message =
            error instanceof Error
                ? error.message
                : "Unable to send result email at the moment.";

        if (message === "A valid email address is required.") {
            return jsonResponse({ ok: false, error: message }, 400);
        }

        return jsonResponse(
            { ok: false, error: "Unable to send result email at the moment." },
            500,
        );
    }
}