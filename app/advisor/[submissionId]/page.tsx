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
  buildAdvisorBrief,
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
  contact_name: string | null;
  contact_email: string | null;
  contact_company: string | null;
  contact_topic: string | null;
  contact_message: string | null;
  contact_source: string | null;
  email: string | null;
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
    contactName: string | null;
    contactEmail: string | null;
    contactCompany: string | null;
    contactTopic: string | null;
    contactMessage: string | null;
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
  if (!value) return "Empty";

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
      return value || "Empty";
  }
}

function formatRelationshipValue(value: string | null): string {
  switch (value) {
    case "weak":
      return "Weak";
    case "medium":
      return "Medium";
    case "strong":
      return "Strong";
    default:
      return value || "Empty";
  }
}

function formatSourceValue(value: string | null): string {
  switch (value) {
    case "network":
      return "Network";
    case "referral":
      return "Referral";
    case "website":
      return "Website";
    case "other":
      return "Other";
    default:
      return value || "Empty";
  }
}

function formatFieldLabel(value: string | null): string {
  switch (value) {
    case "source":
      return "source";
    case "status":
      return "status";
    case "relationship":
      return "relationship";
    case "last_contact_date":
      return "last contact date";
    case "next_action_date":
      return "next action date";
    case "notes":
      return "notes";
    default:
      return value || "field";
  }
}

function formatActivityDescription(activity: ProspectActivityRecord): string {
  const actor = activity.changed_by || "Unknown advisor";

  if (activity.activity_type === "source_changed") {
    return `${actor} changed source from ${formatSourceValue(
      activity.old_value,
    )} to ${formatSourceValue(activity.new_value)}.`;
  }

  if (activity.activity_type === "status_changed") {
    return `${actor} changed status from ${formatProspectStatusValue(
      activity.old_value,
    )} to ${formatProspectStatusValue(activity.new_value)}.`;
  }

  if (activity.activity_type === "relationship_changed") {
    return `${actor} changed relationship from ${formatRelationshipValue(
      activity.old_value,
    )} to ${formatRelationshipValue(activity.new_value)}.`;
  }

  if (activity.activity_type === "last_contact_date_changed") {
    return `${actor} changed last contact date from ${formatDateValue(
      activity.old_value,
    )} to ${formatDateValue(activity.new_value)}.`;
  }

  if (activity.activity_type === "next_action_date_changed") {
    return `${actor} changed next action date from ${formatDateValue(
      activity.old_value,
    )} to ${formatDateValue(activity.new_value)}.`;
  }

  if (activity.activity_type === "notes_changed") {
    return `${actor} updated internal prospect notes.`;
  }

  return `${actor} changed ${formatFieldLabel(
    activity.field_name,
  )} from ${activity.old_value || "Empty"} to ${activity.new_value || "Empty"}.`;
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
  const patternDiagnosis = asString(objectValue.patternDiagnosis);
  const likelyOperatingModel = asString(objectValue.likelyOperatingModel);
  const nextBestOffer = asString(objectValue.nextBestOffer);
  const callObjective = asString(objectValue.callObjective);

  if (
    !headline ||
    !overallAssessment ||
    !executiveReadout ||
    !recommendedCallAngle ||
    !callOpening ||
    !patternDiagnosis ||
    !likelyOperatingModel ||
    !nextBestOffer ||
    !callObjective
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
    patternDiagnosis,
    likelyOperatingModel,
    rootCauseHypotheses: asStringArray(objectValue.rootCauseHypotheses),
    whatToValidateInCall: asStringArray(objectValue.whatToValidateInCall),
    qualificationSignals: asStringArray(objectValue.qualificationSignals),
    nextBestOffer,
    callObjective,
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
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/advisor/login?next=/advisor/${submissionId}`);
  }

  const allowedEmails = (process.env.ADVISOR_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = user.email?.toLowerCase() ?? "";

  if (!userEmail || !allowedEmails.includes(userEmail)) {
    redirect("/advisor/login?error=forbidden");
  }

  return user;
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
        email,
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

  const storedAdvisorBrief = asAdvisorBrief(submission.advisor_brief);
  const advisorBrief =
    storedAdvisorBrief || (result ? buildAdvisorBrief(result) : null);

  return {
    submission: {
      submissionId: submission.submission_id,
      contactName: submission.contact_name,
      contactEmail: submission.contact_email || submission.email,
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

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-base font-semibold text-slate-900">
        {value}
      </p>
      {secondary ? (
        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
          {secondary}
        </p>
      ) : null}
    </div>
  );
}

function NotesCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {content}
      </div>
    </div>
  );
}

function SignalCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-3 text-sm leading-7 text-slate-700">{children}</div>
    </div>
  );
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
  const rootCauseHypotheses = advisorBrief?.rootCauseHypotheses ?? [];
  const whatToValidateInCall = advisorBrief?.whatToValidateInCall ?? [];
  const qualificationSignals = advisorBrief?.qualificationSignals ?? [];

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h1 className="brand-heading-lg text-white">
                {submission.contactCompany ||
                  submission.contactName ||
                  submission.contactEmail ||
                  "Health Check"}
              </h1>

              {prospect ? (
                <>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {formatSourceValue(prospect.source)}
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {formatRelationshipValue(prospect.relationship)}
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {formatProspectStatusValue(prospect.status)}
                  </span>
                </>
              ) : null}
            </div>

            <p className="brand-subheading brand-body-on-dark mt-5 max-w-3xl">
              Health Check submission view for contact context, advisory call
              preparation, commercial workflow, and activity history.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container py-8 sm:py-10">
          <div className="space-y-8">
            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="brand-section-kicker">Submission overview</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    At-a-glance context
                  </h2>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                  <MetricCard
                    label="Submission ID"
                    value={submission.submissionId}
                  />
                  <MetricCard
                    label="Submitted"
                    value={formatSubmittedAt(submission.contactSubmittedAt)}
                  />
                  <MetricCard
                    label="Profile"
                    value={result ? result.band.label : "Website enquiry"}
                  />
                  <MetricCard
                    label="Score"
                    value={result ? `${result.score} / 100` : "Not applicable"}
                  />
                </div>

                {result ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Health Check summary
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {result.band.summary}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Enquiry type
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      This submission did not include Health Check answers and is
                      being treated as a standard website enquiry.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <ProspectCrmPanel
              prospect={prospect}
              summary={
                result
                  ? {
                    score: result.score,
                    band: result.band.label,
                    narrative: data.derived.narrative ?? undefined,
                  }
                  : undefined
              }
            />

            {(advisorBrief || result) ? (
              <section className="brand-surface-card p-6 sm:p-8">
                <div className="flex flex-col gap-6">
                  <div>
                    <p className="brand-section-kicker">Call cheat sheet</p>
                    <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                      Operator read for a 10 to 15 minute introduction call
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                      Use this to control the conversation, validate whether the
                      signal reflects a real structural issue, and decide what
                      the right next step should be.
                    </p>
                  </div>

                  {advisorBrief ? (
                    <>
                      <SignalCard title="Headline">
                        {advisorBrief.headline}
                      </SignalCard>

                      <SignalCard title="Executive readout">
                        {advisorBrief.executiveReadout}
                      </SignalCard>

                      <SignalCard title="Overall assessment">
                        {advisorBrief.overallAssessment}
                      </SignalCard>

                      <SignalCard title="Recommended call angle">
                        {advisorBrief.recommendedCallAngle}
                      </SignalCard>

                      <SignalCard title="Pattern diagnosis">
                        {advisorBrief.patternDiagnosis}
                      </SignalCard>

                      <SignalCard title="Likely operating model">
                        {advisorBrief.likelyOperatingModel}
                      </SignalCard>

                      {rootCauseHypotheses.length > 0 ? (
                        <SignalCard title="Root cause hypotheses">
                          {renderList(rootCauseHypotheses)}
                        </SignalCard>
                      ) : null}

                      {whatToValidateInCall.length > 0 ? (
                        <SignalCard title="What to validate in call">
                          {renderList(whatToValidateInCall)}
                        </SignalCard>
                      ) : null}

                      <SignalCard title="Call objective">
                        {advisorBrief.callObjective}
                      </SignalCard>

                      <SignalCard title="Opening line">
                        {advisorBrief.callOpening}
                      </SignalCard>

                      {conversationFlow.length > 0 ? (
                        <SignalCard title="Conversation flow">
                          {renderList(conversationFlow)}
                        </SignalCard>
                      ) : null}

                      {discussionPrompts.length > 0 ? (
                        <SignalCard title="Probe questions">
                          {renderList(discussionPrompts.slice(0, 5))}
                        </SignalCard>
                      ) : null}

                      {keyThemes.length > 0 ? (
                        <SignalCard title="Key themes">
                          {renderList(keyThemes)}
                        </SignalCard>
                      ) : null}

                      {likelyFrictionPoints.length > 0 ? (
                        <SignalCard title="Likely operational friction">
                          {renderList(likelyFrictionPoints)}
                        </SignalCard>
                      ) : null}

                      {businessImplications.length > 0 ? (
                        <SignalCard title="Business implications">
                          {renderList(businessImplications)}
                        </SignalCard>
                      ) : null}

                      {likelyOperationalRisks.length > 0 ? (
                        <SignalCard title="Likely operational risks">
                          {renderList(likelyOperationalRisks)}
                        </SignalCard>
                      ) : null}

                      {whatTypicallyHappensNext.length > 0 ? (
                        <SignalCard title="What typically happens next">
                          {renderList(whatTypicallyHappensNext)}
                        </SignalCard>
                      ) : null}

                      {first30DayPriorities.length > 0 ? (
                        <SignalCard title="First 30-day priorities">
                          {renderList(first30DayPriorities)}
                        </SignalCard>
                      ) : null}

                      {qualificationSignals.length > 0 ? (
                        <SignalCard title="Qualification signals">
                          {renderList(qualificationSignals)}
                        </SignalCard>
                      ) : null}

                      <SignalCard title="Next best offer">
                        {advisorBrief.nextBestOffer}
                      </SignalCard>

                      {conversionPositioning.length > 0 ? (
                        <SignalCard title="Positioning into next step">
                          {renderList(conversionPositioning)}
                        </SignalCard>
                      ) : null}

                      {suggestedFocusAreas.length > 0 ? (
                        <SignalCard title="Likely focus areas if the signal holds">
                          {renderList(suggestedFocusAreas)}
                        </SignalCard>
                      ) : null}
                    </>
                  ) : null}

                  {result ? (
                    <div className="space-y-4">
                      {data.derived.lowestDimensionInsights.length > 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                          <p className="text-sm font-semibold text-slate-900">
                            Supporting diagnostic signals
                          </p>
                          <div className="mt-4 space-y-3">
                            {data.derived.lowestDimensionInsights.map((dimension) => (
                              <div
                                key={dimension.label}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                              >
                                <p className="text-sm font-semibold text-slate-900">
                                  {dimension.label} - {dimension.score}/5
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                  {dimension.insight}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {!advisorBrief && suggestedFocusAreas.length > 0 ? (
                        <SignalCard title="Likely focus areas if the signal holds">
                          {renderList(suggestedFocusAreas)}
                        </SignalCard>
                      ) : null}

                      {!advisorBrief &&
                        !suggestedFocusAreas.length &&
                        data.derived.priorities.length > 0 ? (
                        <SignalCard title="Likely focus areas if the signal holds">
                          {renderList(data.derived.priorities)}
                        </SignalCard>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="brand-section-kicker">Contact and context</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Submitted details
                  </h2>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <InfoCard
                    label="Contact"
                    value={
                      submission.contactName ||
                      submission.contactEmail ||
                      "Not provided"
                    }
                    secondary={
                      submission.contactName
                        ? submission.contactEmail || undefined
                        : undefined
                    }
                  />
                  <InfoCard
                    label="Organisation"
                    value={submission.contactCompany || "Not provided"}
                  />
                  <InfoCard
                    label="Topic"
                    value={submission.contactTopic || "Not provided"}
                  />
                  <InfoCard
                    label="Source"
                    value={submission.contactSource || "Website"}
                  />
                  <InfoCard
                    label="Company size"
                    value={submission.companySize || "Not provided"}
                  />
                  <InfoCard
                    label="Industry"
                    value={submission.industry || "Not provided"}
                  />
                  <InfoCard
                    label="Role"
                    value={submission.role || "Not provided"}
                  />
                  <InfoCard
                    label="Region"
                    value={submission.countryRegion || "Not provided"}
                  />
                </div>

                <NotesCard
                  title="Message"
                  content={
                    submission.contactMessage ||
                    "No contact message was submitted with this Health Check."
                  }
                />
              </div>
            </section>

            {prospect ? (
              <section className="brand-surface-card p-6 sm:p-8">
                <div className="mb-6">
                  <p className="brand-section-kicker">Activity history</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Prospect activity timeline
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm text-slate-600">
                    Read-only history of meaningful CRM changes made against this
                    Health Check prospect record.
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
          </div>
        </div>
      </section>
    </main>
  );
}