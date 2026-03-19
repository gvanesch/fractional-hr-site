import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  calculatePercentageScore,
  calculateRawScore,
  questions,
  scoreToBand,
  type AnswerValue,
} from "../../../lib/diagnostic";

export const runtime = "edge";

type DiagnosticCompleteRequestBody = {
  answers: Record<number, AnswerValue | undefined>;
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
  email?: string;
};

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  return new Resend(apiKey);
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normaliseOptionalEmail(email?: string): string {
  const trimmed = (email || "").trim();
  return isValidEmail(trimmed) ? trimmed : "";
}

function normaliseAnswers(
  rawAnswers: Record<number, AnswerValue | undefined>
): Record<number, AnswerValue | undefined> {
  const normalised: Record<number, AnswerValue | undefined> = {};

  for (const question of questions) {
    const rawValue = rawAnswers[question.id];

    if (
      rawValue === 1 ||
      rawValue === 2 ||
      rawValue === 3 ||
      rawValue === 4 ||
      rawValue === 5
    ) {
      normalised[question.id] = rawValue;
    }
  }

  return normalised;
}

function getAnsweredCount(
  answers: Record<number, AnswerValue | undefined>
): number {
  return Object.values(answers).filter(Boolean).length;
}

function buildAnswersHtml(
  answers: Record<number, AnswerValue | undefined>
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

  const safeCompanySize = escapeHtml(companySize || "Not provided");
  const safeIndustry = escapeHtml(industry || "Not provided");
  const safeRole = escapeHtml(role || "Not provided");
  const safeCountryRegion = escapeHtml(countryRegion || "Not provided");
  const safeEmail = escapeHtml(email || "Not provided");

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
          Context captured
        </h2>

        <p style="margin: 0 0 8px; color: #334155;"><strong>Company size:</strong> ${safeCompanySize}</p>
        <p style="margin: 0 0 8px; color: #334155;"><strong>Industry:</strong> ${safeIndustry}</p>
        <p style="margin: 0 0 8px; color: #334155;"><strong>Role:</strong> ${safeRole}</p>
        <p style="margin: 0 0 8px; color: #334155;"><strong>Country / region:</strong> ${safeCountryRegion}</p>
        <p style="margin: 0 0 24px; color: #334155;"><strong>Email:</strong> ${safeEmail}</p>

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
      </div>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DiagnosticCompleteRequestBody;

    if (!process.env.CONTACT_TO_EMAIL) {
      return NextResponse.json(
        { error: "Missing CONTACT_TO_EMAIL environment variable." },
        { status: 500 }
      );
    }

    if (!process.env.CONTACT_FROM_EMAIL) {
      return NextResponse.json(
        { error: "Missing CONTACT_FROM_EMAIL environment variable." },
        { status: 500 }
      );
    }

    const answers = normaliseAnswers(body.answers || {});
    const answeredCount = getAnsweredCount(answers);
    const safeEmail = normaliseOptionalEmail(body.email);

    if (answeredCount !== questions.length) {
      return NextResponse.json(
        { error: "All diagnostic questions must be answered." },
        { status: 400 }
      );
    }

    const rawScore = calculateRawScore(answers);
    const score = calculatePercentageScore(rawScore);
    const band = scoreToBand(score);

    const resend = getResendClient();

    const resendResponse = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL,
      to: process.env.CONTACT_TO_EMAIL,
      replyTo: safeEmail || undefined,
      subject: `New HR Diagnostic Submission – ${band.label} (${score}/100)`,
      html: buildEmailHtml({
        score,
        bandLabel: band.label,
        bandSummary: band.summary,
        companySize: body.companySize,
        industry: body.industry,
        role: body.role,
        countryRegion: body.countryRegion,
        email: safeEmail,
        answers,
      }),
    });

    if (resendResponse.error) {
      console.error("Resend diagnostic-complete error:", resendResponse.error);

      return NextResponse.json(
        { error: "Failed to send diagnostic completion email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      score,
      band: band.label,
      resendId: resendResponse.data?.id ?? null,
    });
  } catch (error) {
    console.error("Diagnostic complete API error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error sending diagnostic completion email.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}