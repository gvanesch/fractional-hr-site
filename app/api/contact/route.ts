import { NextResponse } from "next/server";
import {
  buildAdvisorBrief,
  calculateDiagnosticResult,
  type DiagnosticAnswers,
  type DiagnosticResult,
  type AdvisorBrief,
} from "../../../lib/diagnostic";

export const runtime = "edge";

type ContactRequestBody = {
  name: string;
  email: string;
  company?: string;
  topic?: string;
  message: string;
  source?: string;
  diagnosticAnswers?: DiagnosticAnswers;
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
  website?: string;
};

type ResendSendResponse = {
  id?: string;
  object?: string;
  error?: {
    message?: string;
    name?: string;
  };
};

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 320;
const MAX_COMPANY_LENGTH = 160;
const MAX_TOPIC_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_CONTEXT_LENGTH = 120;

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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

function normaliseRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} is required.`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmed.slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  if (email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildAdvisorUrl(submissionId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${siteUrl.replace(/\/$/, "")}/advisor/${submissionId}`;
}

function getDimensionInsight(label: string): string {
  switch (label) {
    case "Process clarity":
      return "Processes may not be clearly documented or consistently followed, leading to reliance on individual judgement.";
    case "Consistency":
      return "Employees and managers may be experiencing HR differently across teams, suggesting a lack of standardisation.";
    case "Service access":
      return "Employees may not always know where to go for HR support, which can create confusion and delays.";
    case "Ownership":
      return "Accountability for HR processes may be unclear, increasing the risk of bottlenecks or dropped tasks.";
    case "Onboarding":
      return "Onboarding may be inconsistent or manager-dependent, which can create variability in early employee experience.";
    case "Technology alignment":
      return "HR systems may not fully reflect operational reality, leading to workarounds and avoidable inefficiency.";
    case "Knowledge and self-service":
      return "Employees and managers may rely too heavily on HR because guidance is not sufficiently accessible or structured.";
    case "Operational capacity":
      return "HR may be operating reactively, with limited capacity to improve processes proactively.";
    case "Data and handoffs":
      return "Work may be getting stuck, repeated, or corrected due to weak handoffs or unreliable data flow.";
    case "Change resilience":
      return "HR processes may struggle to adapt smoothly during growth or organisational change.";
    default:
      return "This area may be contributing to operational friction.";
  }
}

function normaliseDiagnosticAnswers(
  value: unknown,
): DiagnosticAnswers | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Diagnostic answers are invalid.");
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    throw new Error("Diagnostic answers are invalid.");
  }

  const normalised: Record<number, 1 | 2 | 3 | 4 | 5> = {};

  for (const [rawKey, rawValue] of entries) {
    const numericKey = Number(rawKey);

    if (!Number.isInteger(numericKey) || numericKey < 1 || numericKey > 10) {
      throw new Error("Diagnostic answers are invalid.");
    }

    if (
      rawValue !== 1 &&
      rawValue !== 2 &&
      rawValue !== 3 &&
      rawValue !== 4 &&
      rawValue !== 5
    ) {
      throw new Error("Diagnostic answers are invalid.");
    }

    normalised[numericKey] = rawValue;
  }

  return normalised as DiagnosticAnswers;
}

function parseRequestBody(input: unknown): ContactRequestBody {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid request body.");
  }

  const raw = input as Record<string, unknown>;

  const name = normaliseRequiredString(raw.name, "Name", MAX_NAME_LENGTH);
  const email = normaliseRequiredString(
    raw.email,
    "Email",
    MAX_EMAIL_LENGTH,
  ).toLowerCase();
  const message = normaliseRequiredString(
    raw.message,
    "Message",
    MAX_MESSAGE_LENGTH,
  );

  if (!isValidEmail(email)) {
    throw new Error("A valid email address is required.");
  }

  if (message.length < 10) {
    throw new Error("Message must be at least 10 characters.");
  }

  const website = normaliseOptionalString(raw.website, 200);

  return {
    name,
    email,
    message,
    company: normaliseOptionalString(raw.company, MAX_COMPANY_LENGTH),
    topic: normaliseOptionalString(raw.topic, MAX_TOPIC_LENGTH),
    source: normaliseOptionalString(raw.source, MAX_TOPIC_LENGTH) || "website",
    companySize: normaliseOptionalString(raw.companySize, MAX_CONTEXT_LENGTH),
    industry: normaliseOptionalString(raw.industry, MAX_CONTEXT_LENGTH),
    role: normaliseOptionalString(raw.role, MAX_CONTEXT_LENGTH),
    countryRegion: normaliseOptionalString(
      raw.countryRegion,
      MAX_CONTEXT_LENGTH,
    ),
    diagnosticAnswers: normaliseDiagnosticAnswers(raw.diagnosticAnswers),
    website,
  };
}

async function createLeadSubmission(params: {
  body: ContactRequestBody;
  result: DiagnosticResult | null;
  advisorBrief: AdvisorBrief | null;
}) {
  const { body, result, advisorBrief } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const rowToInsert = {
    contact_name: body.name,
    contact_email: body.email,
    contact_company: body.company || null,
    contact_topic: body.topic || null,
    contact_message: body.message,
    contact_source: body.source || "website",
    company_size: body.companySize || null,
    industry: body.industry || null,
    role: body.role || null,
    country_region: body.countryRegion || null,
    answers: body.diagnosticAnswers || null,
    score: result?.score ?? null,
    band: result?.band.label ?? null,
    advisor_brief: advisorBrief ?? null,
    contact_submitted_at: new Date().toISOString(),
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
    throw new Error("Supabase insert succeeded but no submission_id returned.");
  }

  return data[0].submission_id as string;
}

function buildListHtml(items: string[]): string {
  return items
    .map(
      (item) => `
        <li style="margin: 0 0 10px; color: #334155; line-height: 1.7;">
          ${escapeHtml(item)}
        </li>
      `,
    )
    .join("");
}

function buildEmailHtml(params: {
  body: ContactRequestBody;
  submissionId: string;
  advisorUrl: string;
  result: DiagnosticResult | null;
  advisorBrief: AdvisorBrief | null;
}) {
  const { body, submissionId, advisorUrl, result, advisorBrief } = params;

  const safeName = escapeHtml(body.name);
  const safeEmail = escapeHtml(body.email);
  const safeCompany = escapeHtml(body.company || "Not provided");
  const safeTopic = escapeHtml(body.topic || "Not provided");
  const safeSource = escapeHtml(body.source || "website");
  const safeMessage = escapeHtml(body.message).replaceAll("\n", "<br />");
  const safeCompanySize = escapeHtml(body.companySize || "Not provided");
  const safeIndustry = escapeHtml(body.industry || "Not provided");
  const safeRole = escapeHtml(body.role || "Not provided");
  const safeCountryRegion = escapeHtml(body.countryRegion || "Not provided");
  const safeSubmissionId = escapeHtml(submissionId);
  const safeAdvisorUrl = escapeHtml(advisorUrl);

  const isHealthCheckEnquiry =
    body.source === "diagnostic-interpretation" ||
    body.topic === "HR Health Check Interpretation";

  const headerTitle = isHealthCheckEnquiry
    ? "New HR Health Check enquiry"
    : "New website enquiry";

  const hasDiagnostic = Boolean(result && advisorBrief);

  let diagnosticSection = "";

  if (hasDiagnostic && result && advisorBrief) {
    const lowestDimensionsHtml = result.lowestDimensions
      .map(
        (item) => `
          <li style="margin: 0 0 12px; color: #334155; line-height: 1.7;">
            <strong>${escapeHtml(item.label)} — ${item.score} / 5</strong><br />
            ${escapeHtml(getDimensionInsight(item.label))}
          </li>
        `,
      )
      .join("");

    const keyThemesHtml = buildListHtml(advisorBrief.keyThemes ?? []);
    const risksHtml = buildListHtml(advisorBrief.likelyOperationalRisks ?? []);
    const promptsHtml = buildListHtml(advisorBrief.discussionPrompts ?? []);
    const focusAreasHtml = buildListHtml(advisorBrief.suggestedFocusAreas ?? []);
    const frictionPointsHtml = buildListHtml(
      advisorBrief.likelyFrictionPoints ?? [],
    );
    const businessImplicationsHtml = buildListHtml(
      advisorBrief.businessImplications ?? [],
    );
    const whatNextHtml = buildListHtml(
      advisorBrief.whatTypicallyHappensNext ?? [],
    );
    const first30DayHtml = buildListHtml(
      advisorBrief.first30DayPriorities ?? [],
    );
    const conversationFlowHtml = buildListHtml(
      advisorBrief.conversationFlow ?? [],
    );
    const conversionPositioningHtml = buildListHtml(
      advisorBrief.conversionPositioning ?? [],
    );

    diagnosticSection = `
      <hr style="margin: 32px 0; border: 0; border-top: 1px solid #E2E8F0;" />

      <h2 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; color: #0A1628;">
        Diagnostic summary
      </h2>

      <p style="margin: 0 0 8px; color: #334155;">
        <strong>Score:</strong> ${result.score} / 100
      </p>
      <p style="margin: 0 0 8px; color: #334155;">
        <strong>Profile:</strong> ${escapeHtml(result.band.label)}
      </p>
      <p style="margin: 0 0 24px; color: #334155; line-height: 1.7;">
        ${escapeHtml(result.band.summary)}
      </p>

      <div style="margin: 0 0 24px; padding: 18px 20px; border-radius: 14px; background: #F4F6FA; border: 1px solid #E2E8F0;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #1E6FD9;">
          Why this matters
        </p>
        <p style="margin: 0; color: #334155; line-height: 1.7;">
          ${escapeHtml(
            advisorBrief.executiveReadout ||
              advisorBrief.overallAssessment ||
              "The diagnostic suggests there are identifiable HR operational themes worth exploring in more depth.",
          )}
        </p>
      </div>

      <h3 style="margin: 24px 0 12px; font-size: 18px; color: #0A1628;">
        Context captured
      </h3>
      <p style="margin: 0 0 8px; color: #334155;"><strong>Company size:</strong> ${safeCompanySize}</p>
      <p style="margin: 0 0 8px; color: #334155;"><strong>Industry:</strong> ${safeIndustry}</p>
      <p style="margin: 0 0 8px; color: #334155;"><strong>Role:</strong> ${safeRole}</p>
      <p style="margin: 0 0 20px; color: #334155;"><strong>Country / region:</strong> ${safeCountryRegion}</p>

      <h3 style="margin: 24px 0 12px; font-size: 18px; color: #0A1628;">
        Lowest-scoring areas
      </h3>
      <ul style="margin: 0 0 24px 20px; padding: 0;">
        ${lowestDimensionsHtml}
      </ul>

      <h3 style="margin: 28px 0 12px; font-size: 18px; color: #0A1628;">
        Internal advisor brief
      </h3>

      <p style="margin: 0 0 8px; color: #334155;">
        <strong>Headline:</strong> ${escapeHtml(
          advisorBrief.headline || "Not available",
        )}
      </p>
      <p style="margin: 0 0 20px; color: #334155; line-height: 1.7;">
        ${escapeHtml(
          advisorBrief.overallAssessment || "No overall assessment available.",
        )}
      </p>

      ${
        advisorBrief.recommendedCallAngle
          ? `
            <div style="margin: 0 0 24px; padding: 18px 20px; border-radius: 14px; background: #F8FAFC; border: 1px solid #E2E8F0;">
              <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #64748B;">
                Recommended call angle
              </p>
              <p style="margin: 0; color: #334155; line-height: 1.7;">
                ${escapeHtml(advisorBrief.recommendedCallAngle)}
              </p>
            </div>
          `
          : ""
      }

      ${
        advisorBrief.callOpening
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              Suggested call opening
            </h4>
            <p style="margin: 0 0 20px; color: #334155; line-height: 1.7;">
              ${escapeHtml(advisorBrief.callOpening)}
            </p>
          `
          : ""
      }

      ${
        advisorBrief.conversationFlow?.length
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              Conversation flow
            </h4>
            <ul style="margin: 0 0 20px 20px; padding: 0;">
              ${conversationFlowHtml}
            </ul>
          `
          : ""
      }

      ${
        advisorBrief.conversionPositioning?.length
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              Positioning into next step
            </h4>
            <ul style="margin: 0 0 20px 20px; padding: 0;">
              ${conversionPositioningHtml}
            </ul>
          `
          : ""
      }

      ${
        advisorBrief.keyThemes?.length
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              Key themes
            </h4>
            <ul style="margin: 0 0 20px 20px; padding: 0;">
              ${keyThemesHtml}
            </ul>
          `
          : ""
      }

      ${
        advisorBrief.likelyFrictionPoints?.length
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              Likely operational friction
            </h4>
            <ul style="margin: 0 0 20px 20px; padding: 0;">
              ${frictionPointsHtml}
            </ul>
          `
          : ""
      }

      ${
        advisorBrief.businessImplications?.length
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              Business implications
            </h4>
            <ul style="margin: 0 0 20px 20px; padding: 0;">
              ${businessImplicationsHtml}
            </ul>
          `
          : ""
      }

      ${
        advisorBrief.likelyOperationalRisks?.length
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              Likely operational risks
            </h4>
            <ul style="margin: 0 0 20px 20px; padding: 0;">
              ${risksHtml}
            </ul>
          `
          : ""
      }

      ${
        advisorBrief.whatTypicallyHappensNext?.length
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              What typically happens next
            </h4>
            <ul style="margin: 0 0 20px 20px; padding: 0;">
              ${whatNextHtml}
            </ul>
          `
          : ""
      }

      ${
        advisorBrief.first30DayPriorities?.length
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              First 30-day priorities
            </h4>
            <ul style="margin: 0 0 20px 20px; padding: 0;">
              ${first30DayHtml}
            </ul>
          `
          : ""
      }

      ${
        advisorBrief.discussionPrompts?.length
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              Suggested discussion prompts
            </h4>
            <ul style="margin: 0 0 20px 20px; padding: 0;">
              ${promptsHtml}
            </ul>
          `
          : ""
      }

      ${
        advisorBrief.suggestedFocusAreas?.length
          ? `
            <h4 style="margin: 20px 0 10px; font-size: 16px; color: #0A1628;">
              Suggested focus areas
            </h4>
            <ul style="margin: 0 0 20px 20px; padding: 0;">
              ${focusAreasHtml}
            </ul>
          `
          : ""
      }

      <div style="margin: 28px 0 0;">
        <a
          href="${safeAdvisorUrl}"
          style="display: inline-block; background: #1E6FD9; color: #FFFFFF; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;"
        >
          Open full Advisor View
        </a>
      </div>
    `;
  }

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background: #F8FAFC; padding: 32px;">
      <div style="max-width: 720px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #1E6FD9;">
          Van Esch
        </p>

        <h1 style="margin: 0 0 8px; font-size: 28px; line-height: 1.2; color: #0A1628;">
          ${headerTitle}
        </h1>

        <p style="margin: 0 0 24px; color: #64748B;">
          HR Operations &amp; Transformation Advisory
        </p>

        <p style="margin: 0 0 16px; color: #334155;">
          <strong>Submission ID:</strong> ${safeSubmissionId}
        </p>

        <p style="margin: 0 0 24px;">
          <a
            href="${safeAdvisorUrl}"
            style="display: inline-block; background: #1E6FD9; color: #FFFFFF; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;"
          >
            Open Advisor View
          </a>
        </p>

        <h2 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; color: #0A1628;">
          Contact details
        </h2>

        <p style="margin: 0 0 8px; color: #334155;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin: 0 0 8px; color: #334155;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin: 0 0 8px; color: #334155;"><strong>Organisation:</strong> ${safeCompany}</p>
        <p style="margin: 0 0 8px; color: #334155;"><strong>Topic:</strong> ${safeTopic}</p>
        <p style="margin: 0 0 20px; color: #334155;"><strong>Source:</strong> ${safeSource}</p>

        <h2 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; color: #0A1628;">
          Message
        </h2>

        <div style="margin: 0; color: #334155; line-height: 1.7;">
          ${safeMessage}
        </div>

        ${diagnosticSection}
      </div>
    </div>
  `;
}

async function sendEnquiryEmail(params: {
  body: ContactRequestBody;
  submissionId: string;
  advisorUrl: string;
  result: DiagnosticResult | null;
  advisorBrief: AdvisorBrief | null;
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

  const isHealthCheckEnquiry =
    params.body.source === "diagnostic-interpretation" ||
    params.body.topic === "HR Health Check Interpretation";

  const subjectPrefix = isHealthCheckEnquiry
    ? "New HR Health Check enquiry"
    : "New website enquiry";

  const companyPart = params.body.company ? ` – ${params.body.company}` : "";

  const enrichedSubject =
    params.result && isHealthCheckEnquiry
      ? `${subjectPrefix} – ${params.result.band.label} (${params.result.score}/100)${companyPart}`
      : `${subjectPrefix}${companyPart}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: params.body.email,
      subject: enrichedSubject,
      html: buildEmailHtml({
        body: params.body,
        submissionId: params.submissionId,
        advisorUrl: params.advisorUrl,
        result: params.result,
        advisorBrief: params.advisorBrief,
      }),
    }),
  });

  const result = (await response.json()) as ResendSendResponse;

  if (!response.ok) {
    throw new Error(result?.error?.message || "Failed to send enquiry email.");
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const rawBody = (await request.json()) as unknown;
    const body = parseRequestBody(rawBody);

    if (isNonEmptyString(body.website)) {
      return jsonResponse({ ok: true }, 200);
    }

    const result = body.diagnosticAnswers
      ? calculateDiagnosticResult(body.diagnosticAnswers)
      : null;

    const advisorBrief = result ? buildAdvisorBrief(result) : null;

    const submissionId = await createLeadSubmission({
      body,
      result,
      advisorBrief,
    });

    const advisorUrl = buildAdvisorUrl(submissionId);

    const resendResponse = await sendEnquiryEmail({
      body,
      submissionId,
      advisorUrl,
      result,
      advisorBrief,
    });

    return jsonResponse({
      ok: true,
      submissionId,
      advisorUrl,
      resendId: resendResponse.id ?? null,
      message:
        "Thanks, your enquiry has been sent. We will come back to you shortly.",
    });
  } catch (error) {
    console.error("Contact API error:", error);

    const isValidationError =
      error instanceof Error &&
      (error.message === "Invalid request body." ||
        error.message === "Name is required." ||
        error.message === "Email is required." ||
        error.message === "Message is required." ||
        error.message === "A valid email address is required." ||
        error.message === "Message must be at least 10 characters." ||
        error.message === "Diagnostic answers are invalid.");

    if (isValidationError && error instanceof Error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse(
      { error: "Unable to process enquiry at the moment." },
      500,
    );
  }
}