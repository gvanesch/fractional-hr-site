import { NextResponse } from "next/server";
import {
  buildAdvisorBrief,
  calculatePercentageScore,
  calculateRawScore,
  getDimensionScores,
  questions,
  scoreToBand,
  type AnswerValue,
} from "../../../lib/diagnostic";

type DiagnosticCompleteRequestBody = {
  answers: Record<number, AnswerValue | undefined>;
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
  email?: string;
  website?: string;
};

type ResendSendResponse = {
  id?: string;
  object?: string;
  error?: {
    message?: string;
    name?: string;
  };
  message?: string;
};

type DimensionScoreRow = {
  label: string;
  score: number;
};

const MAX_CONTEXT_LENGTH = 120;
const MAX_EMAIL_LENGTH = 320;

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
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

function normaliseOptionalString(
  value: unknown,
  maxLength: number,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function normaliseOptionalEmail(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return undefined;
  }

  return isValidEmail(trimmed) ? trimmed : undefined;
}

function normaliseAnswers(
  value: unknown,
): Record<number, AnswerValue | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Diagnostic answers are invalid.");
  }

  const rawAnswers = value as Record<string, unknown>;
  const normalised: Record<number, AnswerValue | undefined> = {};

  for (const question of questions) {
    const rawValue = rawAnswers[String(question.id)];

    if (
      rawValue === 1 ||
      rawValue === 2 ||
      rawValue === 3 ||
      rawValue === 4 ||
      rawValue === 5
    ) {
      normalised[question.id] = rawValue;
      continue;
    }

    if (rawValue == null) {
      continue;
    }

    throw new Error("Diagnostic answers are invalid.");
  }

  return normalised;
}

function getAnsweredCount(
  answers: Record<number, AnswerValue | undefined>,
): number {
  return Object.values(answers).filter(
    (value): value is AnswerValue => value !== undefined,
  ).length;
}

function buildAnswersHtml(
  answers: Record<number, AnswerValue | undefined>,
): string {
  return questions
    .map((question) => {
      const value = answers[question.id];

      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; vertical-align: top;">
            <strong>${escapeHtml(question.dimension)}</strong><br />
            <span style="color: #475569;">${escapeHtml(question.text)}</span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; width: 90px; text-align: center; vertical-align: top;">
            ${value ?? "-"}
          </td>
        </tr>
      `;
    })
    .join("");
}

function buildContextHtml(params: {
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
  email?: string;
}): string {
  const rows: Array<{ label: string; value: string | undefined }> = [
    { label: "Company size", value: params.companySize },
    { label: "Industry", value: params.industry },
    { label: "Role", value: params.role },
    { label: "Country / region", value: params.countryRegion },
    { label: "Email", value: params.email },
  ];

  const presentRows = rows.filter((row) => row.value);

  if (presentRows.length === 0) {
    return "";
  }

  return `
    <h2 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; color: #0A1628;">
      Context captured
    </h2>
    ${presentRows
      .map(
        (row, index) => `
          <p style="margin: 0 0 ${index === presentRows.length - 1 ? "24px" : "8px"}; color: #334155;">
            <strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value as string)}
          </p>
        `,
      )
      .join("")}
  `;
}

function buildEmailHtml(params: {
  score: number;
  bandLabel: string;
  bandSummary: string;
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
  email?: string;
  answers: Record<number, AnswerValue | undefined>;
}) {
  const {
    score,
    bandLabel,
    bandSummary,
    companySize,
    industry,
    role,
    countryRegion,
    email,
    answers,
  } = params;

  const result = {
    rawScore: calculateRawScore(answers),
    score,
    band: scoreToBand(score),
    dimensions: getDimensionScores(answers).sort((a, b) => a.score - b.score),
    lowestDimensions: getDimensionScores(answers)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3),
  };

  const brief = buildAdvisorBrief(result);
  const keyThemes = brief.keyThemes.slice(0, 3);
  const nextNarrative = brief.whatTypicallyHappensNext.slice(0, 1);

  const keyThemesHtml = keyThemes
    .map(
      (theme) => `
        <li style="margin: 0 0 8px; color: #334155; line-height: 1.7;">
          ${escapeHtml(theme)}
        </li>
      `,
    )
    .join("");

  const nextNarrativeHtml = nextNarrative
    .map(
      (item) => `
        <li style="margin: 0 0 8px; color: #334155; line-height: 1.7;">
          ${escapeHtml(item)}
        </li>
      `,
    )
    .join("");

  const contextHtml = buildContextHtml({
    companySize,
    industry,
    role,
    countryRegion,
    email,
  });

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background: #F8FAFC; padding: 32px;">
      <div style="max-width: 760px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #1E6FD9;">
          Van Esch
        </p>

        <h1 style="margin: 0 0 8px; font-size: 28px; line-height: 1.2; color: #0A1628;">
          New HR Diagnostic Submission
        </h1>

        <p style="margin: 0 0 24px; color: #64748B;">
          HR Operations &amp; Transformation Advisory
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

        <h2 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; color: #0A1628;">
          What this may suggest
        </h2>

        <p style="margin: 0 0 16px; color: #334155; line-height: 1.8;">
          ${escapeHtml(brief.overallAssessment)}
        </p>

        ${keyThemes.length > 0
      ? `
        <h2 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; color: #0A1628;">
          Where this pattern may be coming from
        </h2>

        <ul style="margin: 0 0 24px; padding-left: 20px;">
          ${keyThemesHtml}
        </ul>
        `
      : ""
    }

        ${nextNarrative.length > 0
      ? `
        <h2 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; color: #0A1628;">
          What often becomes more visible over time
        </h2>

        <ul style="margin: 0 0 24px; padding-left: 20px;">
          ${nextNarrativeHtml}
        </ul>
        `
      : ""
    }

        ${contextHtml}

        <h2 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; color: #0A1628;">
          Answers
        </h2>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
          <thead>
            <tr style="background: #F8FAFC;">
              <th style="padding: 12px; text-align: left; color: #0A1628; border-bottom: 1px solid #E2E8F0;">Question</th>
              <th style="padding: 12px; text-align: center; color: #0A1628; border-bottom: 1px solid #E2E8F0; width: 90px;">Score</th>
            </tr>
          </thead>
          <tbody>
            ${buildAnswersHtml(answers)}
          </tbody>
        </table>

        <div style="margin-top: 24px; padding: 20px; border-radius: 14px; background: #F8FAFC; border: 1px solid #E2E8F0;">
          <p style="margin: 0 0 12px; color: #334155; line-height: 1.8;">
            If helpful, this can be explored in a short follow-up conversation to understand what may be driving the pattern in practice and whether a deeper diagnostic would be useful.
          </p>
        </div>
      </div>
    </div>
  `;
}

function parseRequestBody(input: unknown): DiagnosticCompleteRequestBody {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid request body.");
  }

  const raw = input as Record<string, unknown>;

  return {
    answers: normaliseAnswers(raw.answers),
    companySize: normaliseOptionalString(raw.companySize, MAX_CONTEXT_LENGTH),
    industry: normaliseOptionalString(raw.industry, MAX_CONTEXT_LENGTH),
    role: normaliseOptionalString(raw.role, MAX_CONTEXT_LENGTH),
    countryRegion: normaliseOptionalString(
      raw.countryRegion,
      MAX_CONTEXT_LENGTH,
    ),
    email: normaliseOptionalEmail(raw.email),
    website: normaliseOptionalString(raw.website, 200),
  };
}

function buildDimensionScoreColumns(
  dimensionScores: DimensionScoreRow[],
): Record<string, number | null> {
  const scoreMap = new Map(
    dimensionScores.map((dimension) => [dimension.label, dimension.score]),
  );

  return {
    process_clarity_score: scoreMap.get("Process clarity") ?? null,
    consistency_score: scoreMap.get("Consistency") ?? null,
    service_access_score: scoreMap.get("Service access") ?? null,
    ownership_score: scoreMap.get("Ownership") ?? null,
    onboarding_score: scoreMap.get("Onboarding") ?? null,
    technology_alignment_score: scoreMap.get("Technology alignment") ?? null,
    knowledge_self_service_score:
      scoreMap.get("Knowledge and self-service") ?? null,
    operational_capacity_score: scoreMap.get("Operational capacity") ?? null,
    data_handoffs_score: scoreMap.get("Data and handoffs") ?? null,
    change_resilience_score: scoreMap.get("Change resilience") ?? null,
  };
}

function createPublicToken(): string {
  return crypto.randomUUID();
}

async function createCompletionSubmission(params: {
  answers: Record<number, AnswerValue | undefined>;
  rawScore: number;
  score: number;
  bandLabel: string;
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
  email?: string;
}) {
  const {
    answers,
    rawScore,
    score,
    bandLabel,
    companySize,
    industry,
    role,
    countryRegion,
    email,
  } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const dimensionScores = getDimensionScores(answers);
  const submissionId = crypto.randomUUID();
  const publicToken = createPublicToken();
  const completedAt = new Date().toISOString();

  const rowToInsert = {
    submission_id: submissionId,
    public_token: publicToken,
    completed_at: completedAt,
    submission_source: "health-check",
    completion_version: "v1",
    company_size: companySize || null,
    industry: industry || null,
    role: role || null,
    country_region: countryRegion || null,
    email: email || null,
    answers,
    score,
    band: bandLabel,
    ...buildDimensionScoreColumns(dimensionScores),
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/diagnostic_submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(rowToInsert),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase insert failed: ${errorText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || !data[0]?.submission_id) {
    throw new Error(
      "Supabase insert succeeded but no submission_id was returned.",
    );
  }

  return {
    submissionId: data[0].submission_id as string,
    publicToken: (data[0].public_token as string | null) ?? publicToken,
    completedAt,
    rawScore,
  };
}

async function sendDiagnosticEmail(params: {
  score: number;
  bandLabel: string;
  bandSummary: string;
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
  email?: string;
  answers: Record<number, AnswerValue | undefined>;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  if (!fromEmail) {
    throw new Error("Missing CONTACT_FROM_EMAIL environment variable.");
  }

  if (!toEmail) {
    throw new Error("Missing CONTACT_TO_EMAIL environment variable.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: params.email || undefined,
      subject: `New HR Diagnostic Submission – ${params.bandLabel} (${params.score}/100)`,
      html: buildEmailHtml({
        score: params.score,
        bandLabel: params.bandLabel,
        bandSummary: params.bandSummary,
        companySize: params.companySize,
        industry: params.industry,
        role: params.role,
        countryRegion: params.countryRegion,
        email: params.email,
        answers: params.answers,
      }),
    }),
  });

  const result = (await response.json()) as ResendSendResponse;

  if (!response.ok) {
    throw new Error(
      result?.error?.message ||
      result?.message ||
      `Resend request failed with status ${response.status}`,
    );
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const rawBody = (await request.json()) as unknown;
    const body = parseRequestBody(rawBody);

    if (body.website) {
      return jsonResponse({ ok: true }, 200);
    }

    const answeredCount = getAnsweredCount(body.answers);

    if (answeredCount !== questions.length) {
      return jsonResponse(
        {
          error: `All diagnostic questions must be answered. Received ${answeredCount} of ${questions.length}.`,
        },
        400,
      );
    }

    const rawScore = calculateRawScore(body.answers);
    const score = calculatePercentageScore(rawScore);
    const band = scoreToBand(score);

    const completion = await createCompletionSubmission({
      answers: body.answers,
      rawScore,
      score,
      bandLabel: band.label,
      companySize: body.companySize,
      industry: body.industry,
      role: body.role,
      countryRegion: body.countryRegion,
      email: body.email,
    });

    const resendResponse = await sendDiagnosticEmail({
      score,
      bandLabel: band.label,
      bandSummary: band.summary,
      companySize: body.companySize,
      industry: body.industry,
      role: body.role,
      countryRegion: body.countryRegion,
      email: body.email,
      answers: body.answers,
    });

    if (body.email) {
      try {
        const clientEmailResponse = await fetch(
          `${new URL(request.url).origin}/api/public-diagnostic-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: completion.publicToken,
              email: body.email,
            }),
          },
        );

        if (!clientEmailResponse.ok) {
          const clientEmailPayload = (await clientEmailResponse
            .json()
            .catch(() => null)) as
            | { error?: string; ok?: boolean }
            | null;

          console.error(
            "Client result email send failed:",
            clientEmailPayload?.error ||
            `Request failed with status ${clientEmailResponse.status}`,
          );
        }
      } catch (error) {
        console.error("Client result email send failed:", error);
      }
    }

    return jsonResponse({
      ok: true,
      submissionId: completion.submissionId,
      publicToken: completion.publicToken,
      completedAt: completion.completedAt,
      score,
      band: band.label,
      resendId: resendResponse.id ?? null,
    });

    return jsonResponse({
      ok: true,
      submissionId: completion.submissionId,
      publicToken: completion.publicToken,
      completedAt: completion.completedAt,
      score,
      band: band.label,
      resendId: resendResponse.id ?? null,
    });
  } catch (error) {
    console.error("Diagnostic complete API error:", error);

    const isValidationError =
      error instanceof Error &&
      (error.message === "Invalid request body." ||
        error.message === "Diagnostic answers are invalid.");

    if (isValidationError && error instanceof Error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse(
      { error: "Unable to process diagnostic submission at the moment." },
      500,
    );
  }
}