import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  calculateDiagnosticResult,
  type DiagnosticAnswers,
} from "../../../lib/diagnostic";

export const runtime = "edge";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = {
  [key: string]: JsonValue;
};

type AdvisorBrief = {
  headline?: string;
  overallAssessment?: string;
  executiveReadout?: string;
  recommendedCallAngle?: string;
  keyThemes?: string[];
  likelyFrictionPoints?: string[];
  businessImplications?: string[];
  likelyOperationalRisks?: string[];
  whatTypicallyHappensNext?: string[];
  first30DayPriorities?: string[];
  discussionPrompts?: string[];
  suggestedFocusAreas?: string[];
};

type SubmissionRow = {
  submission_id: string;
  contact_name: string;
  contact_email: string;
  contact_company: string | null;
  contact_topic: string | null;
  contact_message: string;
  contact_source: string | null;
  company_size: string | null;
  industry: string | null;
  role: string | null;
  country_region: string | null;
  answers: JsonValue;
  score: number | null;
  band: string | null;
  advisor_brief: JsonValue;
  contact_submitted_at: string | null;
};

type ErrorResponse = {
  success: false;
  error: string;
};

type SuccessResponse = {
  success: true;
  submission: {
    submissionId: string;
    contactName: string;
    contactEmail: string;
    contactCompany: string | null;
    contactTopic: string | null;
    contactMessage: string;
    contactSource: string | null;
    companySize: string | null;
    industry: string | null;
    role: string | null;
    countryRegion: string | null;
    contactSubmittedAt: string | null;
  };
  diagnostic: {
    score: number;
    band: {
      label: string;
      summary: string;
    };
    lowestDimensions: Array<{
      label: string;
      score: number;
    }>;
  } | null;
  derived: {
    narrative: string | null;
    impact: string | null;
    priorities: string[];
    callOpener: string | null;
    lowestDimensionInsights: Array<{
      label: string;
      score: number;
      insight: string;
    }>;
  };
  advisorBrief: AdvisorBrief | null;
};

function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

async function getSubmission(submissionId: string): Promise<SubmissionRow | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("diagnostic_submissions")
    .select(
      `
        submission_id,
        contact_name,
        contact_email,
        contact_company,
        contact_topic,
        contact_message,
        contact_source,
        company_size,
        industry,
        role,
        country_region,
        answers,
        score,
        band,
        advisor_brief,
        contact_submitted_at
      `,
    )
    .eq("submission_id", submissionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Supabase read failed: ${error.message}`);
  }

  return data as SubmissionRow;
}

function asObject(value: JsonValue): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonObject;
}

function asString(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asStringArray(value: JsonValue | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function asAdvisorBrief(value: JsonValue): AdvisorBrief | null {
  const objectValue = asObject(value);

  if (!objectValue) {
    return null;
  }

  return {
    headline: asString(objectValue.headline),
    overallAssessment: asString(objectValue.overallAssessment),
    executiveReadout: asString(objectValue.executiveReadout),
    recommendedCallAngle: asString(objectValue.recommendedCallAngle),
    keyThemes: asStringArray(objectValue.keyThemes),
    likelyFrictionPoints: asStringArray(objectValue.likelyFrictionPoints),
    businessImplications: asStringArray(objectValue.businessImplications),
    likelyOperationalRisks: asStringArray(objectValue.likelyOperationalRisks),
    whatTypicallyHappensNext: asStringArray(objectValue.whatTypicallyHappensNext),
    first30DayPriorities: asStringArray(objectValue.first30DayPriorities),
    discussionPrompts: asStringArray(objectValue.discussionPrompts),
    suggestedFocusAreas: asStringArray(objectValue.suggestedFocusAreas),
  };
}

function asDiagnosticAnswers(value: JsonValue): DiagnosticAnswers | null {
  const objectValue = asObject(value);

  if (!objectValue) {
    return null;
  }

  const parsed: Record<number, 1 | 2 | 3 | 4 | 5 | undefined> = {};

  for (const [key, rawValue] of Object.entries(objectValue)) {
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
      continue;
    }

    if (rawValue !== null && rawValue !== undefined) {
      return null;
    }
  }

  return parsed as DiagnosticAnswers;
}

function getInsight(label: string): string {
  switch (label) {
    case "Process clarity":
      return "Lack of documented and repeatable processes.";
    case "Consistency":
      return "Inconsistent HR experience across teams.";
    case "Service access":
      return "Employees unclear where to go for support.";
    case "Ownership":
      return "Responsibility unclear across workflows.";
    case "Onboarding":
      return "Onboarding varies by manager.";
    case "Technology alignment":
      return "Systems not aligned to real workflows.";
    case "Knowledge and self-service":
      return "Over-reliance on HR for basic queries.";
    case "Operational capacity":
      return "HR operating reactively.";
    case "Data and handoffs":
      return "Breakdowns and duplication in processes.";
    case "Change resilience":
      return "Difficulty adapting to growth or change.";
    default:
      return "This area may be contributing to operational friction.";
  }
}

function buildNarrative(
  score: number,
  submission: SubmissionRow,
): string {
  const size = submission.company_size || "a growing organisation";

  if (score < 40) {
    return `This looks like an early-stage HR operating model where processes have evolved organically. At ${size}, this typically shows up as inconsistency, unclear ownership, and reliance on individuals rather than systems.`;
  }

  if (score < 70) {
    return `This suggests a developing HR function where structure exists but is not consistently applied. At ${size}, this often creates friction and operational inefficiency.`;
  }

  return "This reflects a relatively mature HR operation. The focus is likely optimisation, scalability, and alignment with future growth.";
}

function buildImpact(score: number): string {
  if (score < 40) {
    return "High management overhead, inconsistent employee experience, and growing operational risk as the organisation scales.";
  }

  if (score < 70) {
    return "Hidden inefficiencies, duplication of effort, and increasing friction between teams.";
  }

  return "Opportunities to optimise efficiency, reduce cost-to-serve, and improve scalability.";
}

function buildPriorities(score: number): string[] {
  if (score < 40) {
    return [
      "Define and document core HR processes",
      "Clarify ownership across the employee lifecycle",
      "Establish a single entry point for HR support",
    ];
  }

  if (score < 70) {
    return [
      "Standardise processes across teams",
      "Improve system alignment and automation",
      "Introduce clearer service structure",
    ];
  }

  return [
    "Optimise workflows and reduce friction",
    "Enhance reporting and insights",
    "Align HR operations with strategic growth",
  ];
}

function buildCallOpener(score: number, submission: SubmissionRow): string {
  const size = submission.company_size || "your organisation";

  if (score < 40) {
    return `From what I’ve seen, organisations at ${size} often reach a point where HR starts to feel reactive and inconsistent. I’d be interested to understand where that’s showing up most for you right now.`;
  }

  if (score < 70) {
    return "It looks like you’ve got some structure in place, but it’s not fully consistent yet. I’d like to explore where that’s creating friction day-to-day.";
  }

  return "You seem to have a solid foundation in place. I’d be interested to understand where you’re seeing limitations as you scale further.";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "submissionId is required." },
        { status: 400 },
      );
    }

    const submission = await getSubmission(submissionId);

    if (!submission) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "Submission not found." },
        { status: 404 },
      );
    }

    const diagnosticAnswers = asDiagnosticAnswers(submission.answers);
    const result = diagnosticAnswers
      ? calculateDiagnosticResult(diagnosticAnswers)
      : null;

    const advisorBrief = asAdvisorBrief(submission.advisor_brief);

    const response: SuccessResponse = {
      success: true,
      submission: {
        submissionId: submission.submission_id,
        contactName: submission.contact_name,
        contactEmail: submission.contact_email,
        contactCompany: submission.contact_company,
        contactTopic: submission.contact_topic,
        contactMessage: submission.contact_message,
        contactSource: submission.contact_source,
        companySize: submission.company_size,
        industry: submission.industry,
        role: submission.role,
        countryRegion: submission.country_region,
        contactSubmittedAt: submission.contact_submitted_at,
      },
      diagnostic: result
        ? {
            score: result.score,
            band: {
              label: result.band.label,
              summary: result.band.summary,
            },
            lowestDimensions: result.lowestDimensions.map((dimension) => ({
              label: dimension.label,
              score: dimension.score,
            })),
          }
        : null,
      derived: result
        ? {
            narrative: buildNarrative(result.score, submission),
            impact: buildImpact(result.score),
            priorities: buildPriorities(result.score),
            callOpener: buildCallOpener(result.score, submission),
            lowestDimensionInsights: result.lowestDimensions.map((dimension) => ({
              label: dimension.label,
              score: dimension.score,
              insight: getInsight(dimension.label),
            })),
          }
        : {
            narrative: null,
            impact: null,
            priorities: [],
            callOpener: null,
            lowestDimensionInsights: [],
          },
      advisorBrief,
    };

    return NextResponse.json<SuccessResponse>(response, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";

    return NextResponse.json<ErrorResponse>(
      { success: false, error: message },
      { status: 500 },
    );
  }
}