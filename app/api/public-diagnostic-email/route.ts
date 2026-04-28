import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
    buildPublicDiagnosticInterpretation,
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
    interpretationUrl: string;
}) {
    const {
        score,
        bandLabel,
        bandSummary,
        overallAssessment,
        focusAreas,
        whatTypicallyHappensNext,
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

    return `
    <div style="font-family: Arial, Helvetica, sans-serif; background: #F8FAFC; padding: 32px;">
      <div style="max-width: 760px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #1E6FD9;">
          Van Esch
        </p>

        <h1 style="margin: 0 0 12px; font-size: 28px; line-height: 1.2; color: #0A1628;">
          Your HR Health Check result
        </h1>

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

        <p style="margin: 0 0 24px; color: #334155; line-height: 1.8;">
          ${escapeHtml(overallAssessment)}
        </p>

        <ul style="margin: 0 0 24px; padding-left: 20px;">
          ${focusAreasHtml}
        </ul>

        <ul style="margin: 0 0 24px; padding-left: 20px;">
          ${nextNarrativesHtml}
        </ul>

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
        const interpretation = buildPublicDiagnosticInterpretation(result);

        await supabase
            .from("diagnostic_submissions")
            .update({ email })
            .eq("public_token", token);

        const apiKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.CONTACT_FROM_EMAIL;

        if (!apiKey || !fromEmail) {
            throw new Error("Email configuration missing.");
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
                    overallAssessment: interpretation.overallAssessment,
                    focusAreas: interpretation.focusAreas,
                    whatTypicallyHappensNext:
                        interpretation.whatTypicallyHappensNext,
                    interpretationUrl,
                }),
            }),
        });

        if (!response.ok) {
            return jsonResponse(
                { ok: false, error: "Unable to send email." },
                500,
            );
        }

        return jsonResponse({ ok: true });
    } catch (error) {
        console.error("Public diagnostic email API error:", error);

        return jsonResponse(
            { ok: false, error: "Unable to send result email." },
            500,
        );
    }
}