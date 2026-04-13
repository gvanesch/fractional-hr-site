export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import ProspectCrmPanel from "@/app/components/advisor/ProspectCrmPanel";
import {
  calculateDiagnosticResult,
  type DiagnosticAnswers,
  type AdvisorBrief,
} from "../../../lib/diagnostic";

export const dynamic = "force-dynamic";

type AdvisorPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = {
  [key: string]: JsonValue;
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

type ProspectRecord = {
  prospect_id: string;
  submission_id: string;
  name: string | null;
  company: string | null;
  relationship: "weak" | "medium" | "strong";
  status:
    | "not_contacted"
    | "contacted"
    | "replied"
    | "call_booked"
    | "opportunity"
    | "won"
    | "lost";
  last_contact_date: string | null;
  next_action_date: string | null;
  source: "network" | "referral" | "website" | "other";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ProspectActivityRecord = {
  activity_id: string;
  prospect_id: string;
  submission_id: string;
  activity_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};

type DerivedResult = {
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

function formatSubmittedAt(value: string | null): string {
  if (!value) return "Not available";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateValue(value: string | null): string {
  if (!value) return "empty";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
      }).format(new Date(`${value}T00:00:00`));
    } catch {
      return value;
    }
  }

  return value;
}

function renderList(items: string[]) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="list-disc space-y-2 pl-5 text-slate-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function formatProspectStatusValue(value: string | null): string {
  switch (value) {
    case "not_contacted":
      return "Not Contacted";
    case "contacted":
      return "Contacted";
    case "replied":
      return "Replied";
    case "call_booked":
      return "Call Booked";
    case "opportunity":
      return "Opportunity";
    case "won":
      return "Won";
    case "lost":
      return "Lost";
    default:
      return value || "empty";
  }
}

function formatFieldLabel(value: string | null): string {
  switch (value) {
    case "status":
      return "status";
    case "next_action_date":
      return "next action date";
    default:
      return value || "field";
  }
}

function formatActivityDescription(activity: ProspectActivityRecord): string {
  const actor = activity.changed_by || "Unknown advisor";

  if (activity.activity_type === "status_changed") {
    return `${actor} changed status from ${formatProspectStatusValue(
      activity.old_value,
    )} to ${formatProspectStatusValue(activity.new_value)}.`;
  }

  if (activity.activity_type === "next_action_date_changed") {
    return `${actor} changed next action date from ${formatDateValue(
      activity.old_value,
    )} to ${formatDateValue(activity.new_value)}.`;
  }

  return `${actor} changed ${formatFieldLabel(
    activity.field_name,
  )} from ${activity.old_value || "empty"} to ${activity.new_value || "empty"}.`;
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

  const headline = asString(objectValue.headline);
  const overallAssessment = asString(objectValue.overallAssessment);
  const executiveReadout = asString(objectValue.executiveReadout);
  const recommendedCallAngle = asString(objectValue.recommendedCallAngle);
  const callOpening = asString(objectValue.callOpening);

  if (
    !headline ||
    !overallAssessment ||
    !executiveReadout ||
    !recommendedCallAngle ||
    !callOpening
  ) {
    return null;
  }

  return {
    headline,
    overallAssessment,
    keyThemes: asStringArray(objectValue.keyThemes),
    likelyOperationalRisks: asStringArray(objectValue.likelyOperationalRisks),
    discussionPrompts: asStringArray(objectValue.discussionPrompts),
    suggestedFocusAreas: asStringArray(objectValue.suggestedFocusAreas),
    executiveReadout,
    likelyFrictionPoints: asStringArray(objectValue.likelyFrictionPoints),
    businessImplications: asStringArray(objectValue.businessImplications),
    whatTypicallyHappensNext: asStringArray(objectValue.whatTypicallyHappensNext),
    first30DayPriorities: asStringArray(objectValue.first30DayPriorities),
    recommendedCallAngle,
    callOpening,
    conversationFlow: asStringArray(objectValue.conversationFlow),
    conversionPositioning: asStringArray(objectValue.conversionPositioning),
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

function buildNarrative(score: number, submission: SubmissionRow): string {
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

async function requireAdvisorSession(submissionId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/advisor/login?next=/advisor/${submissionId}`);
  }

  const allowedEmails = (process.env.ADVISOR_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = session.user.email?.toLowerCase() ?? "";

  if (!userEmail || !allowedEmails.includes(userEmail)) {
    redirect("/advisor/login?error=forbidden");
  }

  return session;
}

async function getSubmission(submissionId: string): Promise<SubmissionRow | null> {
  const supabase = createSupabaseAdminClient();

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

async function getHealthCheckProspect(
  submissionId: string,
): Promise<ProspectRecord | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("health_check_prospects")
    .select(
      `
        prospect_id,
        submission_id,
        name,
        company,
        relationship,
        status,
        last_contact_date,
        next_action_date,
        source,
        notes,
        created_at,
        updated_at
      `,
    )
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load prospect record: ${error.message}`);
  }

  return (data as ProspectRecord | null) ?? null;
}

async function getProspectActivity(
  prospectId: string | null,
): Promise<ProspectActivityRecord[]> {
  if (!prospectId) {
    return [];
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("health_check_prospect_activity")
    .select(
      `
        activity_id,
        prospect_id,
        submission_id,
        activity_type,
        field_name,
        old_value,
        new_value,
        note,
        changed_by,
        created_at
      `,
    )
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Unable to load prospect activity: ${error.message}`);
  }

  return (data ?? []) as ProspectActivityRecord[];
}

async function getSubmissionView(submissionId: string): Promise<DerivedResult> {
  const submission = await getSubmission(submissionId);

  if (!submission) {
    notFound();
  }

  const diagnosticAnswers = asDiagnosticAnswers(submission.answers);
  const result = diagnosticAnswers
    ? calculateDiagnosticResult(diagnosticAnswers)
    : null;

  const advisorBrief = asAdvisorBrief(submission.advisor_brief);

  return {
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
}

export default async function AdvisorSubmissionPage({
  params,
}: AdvisorPageProps) {
  const { submissionId } = await params;

  await requireAdvisorSession(submissionId);

  const [data, prospect] = await Promise.all([
    getSubmissionView(submissionId),
    getHealthCheckProspect(submissionId),
  ]);

  const activity = await getProspectActivity(prospect?.prospect_id ?? null);

  const submission = data.submission;
  const result = data.diagnostic;
  const advisorBrief = data.advisorBrief;

  const keyThemes = advisorBrief?.keyThemes ?? [];
  const likelyFrictionPoints = advisorBrief?.likelyFrictionPoints ?? [];
  const businessImplications = advisorBrief?.businessImplications ?? [];
  const likelyOperationalRisks = advisorBrief?.likelyOperationalRisks ?? [];
  const whatTypicallyHappensNext = advisorBrief?.whatTypicallyHappensNext ?? [];
  const first30DayPriorities = advisorBrief?.first30DayPriorities ?? [];
  const discussionPrompts = advisorBrief?.discussionPrompts ?? [];
  const suggestedFocusAreas = advisorBrief?.suggestedFocusAreas ?? [];
  const conversationFlow = advisorBrief?.conversationFlow ?? [];
  const conversionPositioning = advisorBrief?.conversionPositioning ?? [];

  return (
    <main className="min-h-screen bg-[#F4F6FA] px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1E6FD9]">
            Van Esch
          </p>
          <h1 className="mb-2 text-3xl font-bold text-[#0A1628]">
            Advisor View
          </h1>
          <p className="mb-6 text-base text-slate-600">
            HR Operations &amp; Transformation Advisory
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">
                Submission ID
              </p>
              <p className="mt-1 break-all text-sm text-slate-900">
                {submission.submissionId}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">
                Submitted
              </p>
              <p className="mt-1 text-sm text-slate-900">
                {formatSubmittedAt(submission.contactSubmittedAt)}
              </p>
            </div>
          </div>

          {result ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1E6FD9]">
                Diagnostic profile
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#0A1628]">
                {result.score} / 100 - {result.band.label}
              </h2>
              <p className="mt-2 text-slate-700">{result.band.summary}</p>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1E6FD9]">
                Enquiry type
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#0A1628]">
                Standard website enquiry
              </h2>
              <p className="mt-2 text-slate-700">
                This submission did not include diagnostic answers.
              </p>
            </div>
          )}
        </section>

        <ProspectCrmPanel prospect={prospect} />

        {prospect ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#0A1628]">
                Prospect activity timeline
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Read-only history of meaningful CRM changes made against this
                prospect record.
              </p>
            </div>

            {activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div
                    key={item.activity_id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {formatActivityDescription(item)}
                    </p>

                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                      {formatSubmittedAt(item.created_at)}
                    </p>

                    {item.note?.trim() ? (
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm leading-7 text-slate-700">
                  No prospect activity has been recorded yet.
                </p>
              </div>
            )}
          </section>
        ) : null}

        {advisorBrief ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
              Call focus
            </h2>

            <div className="space-y-6">
              {advisorBrief.headline ? (
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {advisorBrief.headline}
                  </p>
                </div>
              ) : null}

              {advisorBrief.recommendedCallAngle ? (
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Recommended call angle
                  </p>
                  <p className="leading-7 text-slate-700">
                    {advisorBrief.recommendedCallAngle}
                  </p>
                </div>
              ) : null}

              {advisorBrief.callOpening ? (
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Suggested call opening
                  </p>
                  <p className="leading-7 text-slate-700">
                    {advisorBrief.callOpening}
                  </p>
                </div>
              ) : null}

              {conversationFlow.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Conversation flow
                  </p>
                  {renderList(conversationFlow)}
                </div>
              ) : null}

              {conversionPositioning.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Positioning into next step
                  </p>
                  {renderList(conversionPositioning)}
                </div>
              ) : null}

              {discussionPrompts.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    First questions to explore
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-slate-700">
                    {discussionPrompts.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
            Contact details
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <p>
              <strong>Name:</strong> {submission.contactName}
            </p>
            <p>
              <strong>Email:</strong> {submission.contactEmail}
            </p>
            <p>
              <strong>Organisation:</strong>{" "}
              {submission.contactCompany || "Not provided"}
            </p>
            <p>
              <strong>Topic:</strong> {submission.contactTopic || "Not provided"}
            </p>
            <p>
              <strong>Source:</strong> {submission.contactSource || "website"}
            </p>
            <p>
              <strong>Company size:</strong>{" "}
              {submission.companySize || "Not provided"}
            </p>
            <p>
              <strong>Industry:</strong> {submission.industry || "Not provided"}
            </p>
            <p>
              <strong>Role:</strong> {submission.role || "Not provided"}
            </p>
            <p>
              <strong>Region:</strong>{" "}
              {submission.countryRegion || "Not provided"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
            Message
          </h2>
          <div className="whitespace-pre-wrap leading-7 text-slate-700">
            {submission.contactMessage}
          </div>
        </section>

        {result ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
                Diagnostic summary
              </h2>
              <p className="leading-7 text-slate-700">
                {data.derived.narrative}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
                Business impact
              </h2>
              <p className="leading-7 text-slate-700">{data.derived.impact}</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
                Priority actions
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-slate-700">
                {data.derived.priorities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
                Lowest scoring areas
              </h2>
              <div className="space-y-4">
                {data.derived.lowestDimensionInsights.map((dimension) => (
                  <div
                    key={dimension.label}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {dimension.label} - {dimension.score}/5
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {dimension.insight}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
                Call opener
              </h2>
              <p className="leading-7 text-slate-700">
                {data.derived.callOpener}
              </p>
            </section>
          </>
        ) : null}

        {advisorBrief ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-[#0A1628]">
              Internal advisor brief
            </h2>

            {advisorBrief.headline ? (
              <div className="mb-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Headline
                </h3>
                <p className="mt-2 text-slate-900">{advisorBrief.headline}</p>
              </div>
            ) : null}

            {advisorBrief.overallAssessment ? (
              <div className="mb-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Overall assessment
                </h3>
                <p className="mt-2 leading-7 text-slate-700">
                  {advisorBrief.overallAssessment}
                </p>
              </div>
            ) : null}

            {advisorBrief.executiveReadout ? (
              <div className="mb-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Executive readout
                </h3>
                <p className="mt-2 leading-7 text-slate-700">
                  {advisorBrief.executiveReadout}
                </p>
              </div>
            ) : null}

            {advisorBrief.recommendedCallAngle ? (
              <div className="mb-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Recommended call angle
                </h3>
                <p className="mt-2 leading-7 text-slate-700">
                  {advisorBrief.recommendedCallAngle}
                </p>
              </div>
            ) : null}

            {advisorBrief.callOpening ? (
              <div className="mb-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Suggested call opening
                </h3>
                <p className="mt-2 leading-7 text-slate-700">
                  {advisorBrief.callOpening}
                </p>
              </div>
            ) : null}

            {conversationFlow.length > 0 ? (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Conversation flow
                </h3>
                {renderList(conversationFlow)}
              </div>
            ) : null}

            {conversionPositioning.length > 0 ? (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Positioning into next step
                </h3>
                {renderList(conversionPositioning)}
              </div>
            ) : null}

            {keyThemes.length > 0 ? (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Key themes
                </h3>
                {renderList(keyThemes)}
              </div>
            ) : null}

            {likelyFrictionPoints.length > 0 ? (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Likely operational friction
                </h3>
                {renderList(likelyFrictionPoints)}
              </div>
            ) : null}

            {businessImplications.length > 0 ? (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Business implications
                </h3>
                {renderList(businessImplications)}
              </div>
            ) : null}

            {likelyOperationalRisks.length > 0 ? (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Likely operational risks
                </h3>
                {renderList(likelyOperationalRisks)}
              </div>
            ) : null}

            {whatTypicallyHappensNext.length > 0 ? (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  What typically happens next
                </h3>
                {renderList(whatTypicallyHappensNext)}
              </div>
            ) : null}

            {first30DayPriorities.length > 0 ? (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  First 30-day priorities
                </h3>
                {renderList(first30DayPriorities)}
              </div>
            ) : null}

            {discussionPrompts.length > 0 ? (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Discussion prompts
                </h3>
                {renderList(discussionPrompts)}
              </div>
            ) : null}

            {suggestedFocusAreas.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Suggested focus areas
                </h3>
                {renderList(suggestedFocusAreas)}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}