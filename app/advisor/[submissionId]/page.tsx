import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { calculateDiagnosticResult } from "../../../lib/diagnostic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  answers: any;
  score: number | null;
  band: string | null;
  advisor_brief: any;
  contact_submitted_at: string | null;
};

type AdvisorPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

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

function buildNarrative(result: any, submission: SubmissionRow): string {
  const size = submission.company_size || "a growing organisation";

  if (result.score < 40) {
    return `This looks like an early-stage HR operating model where processes have evolved organically. At ${size}, this typically shows up as inconsistency, unclear ownership, and reliance on individuals rather than systems.`;
  }

  if (result.score < 70) {
    return `This suggests a developing HR function where structure exists but is not consistently applied. At ${size}, this often creates friction and operational inefficiency.`;
  }

  return "This reflects a relatively mature HR operation. The focus is likely optimisation, scalability, and alignment with future growth.";
}

function buildImpact(result: any): string {
  if (result.score < 40) {
    return "High management overhead, inconsistent employee experience, and growing operational risk as the organisation scales.";
  }

  if (result.score < 70) {
    return "Hidden inefficiencies, duplication of effort, and increasing friction between teams.";
  }

  return "Opportunities to optimise efficiency, reduce cost-to-serve, and improve scalability.";
}

function buildPriorities(result: any): string[] {
  if (result.score < 40) {
    return [
      "Define and document core HR processes",
      "Clarify ownership across the employee lifecycle",
      "Establish a single entry point for HR support",
    ];
  }

  if (result.score < 70) {
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

function buildCallOpener(result: any, submission: SubmissionRow): string {
  const size = submission.company_size || "your organisation";

  if (result.score < 40) {
    return `From what I’ve seen, organisations at ${size} often reach a point where HR starts to feel reactive and inconsistent. I’d be interested to understand where that’s showing up most for you right now.`;
  }

  if (result.score < 70) {
    return "It looks like you’ve got some structure in place, but it’s not fully consistent yet. I’d like to explore where that’s creating friction day-to-day.";
  }

  return "You seem to have a solid foundation in place. I’d be interested to understand where you’re seeing limitations as you scale further.";
}

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
      `
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

function asObject(value: any): Record<string, any> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value;
}

function asStringArray(value: any): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string");
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

export default async function AdvisorSubmissionPage({
  params,
}: AdvisorPageProps) {
  const { submissionId } = await params;
  const submission = await getSubmission(submissionId);

  if (!submission) {
    notFound();
  }

  const result = submission.answers
    ? calculateDiagnosticResult(submission.answers as any)
    : null;

  const advisorBrief = asObject(submission.advisor_brief);

  const keyThemes = asStringArray(advisorBrief?.keyThemes);
  const likelyFrictionPoints = asStringArray(advisorBrief?.likelyFrictionPoints);
  const businessImplications = asStringArray(advisorBrief?.businessImplications);
  const likelyOperationalRisks = asStringArray(
    advisorBrief?.likelyOperationalRisks
  );
  const whatTypicallyHappensNext = asStringArray(
    advisorBrief?.whatTypicallyHappensNext
  );
  const first30DayPriorities = asStringArray(
    advisorBrief?.first30DayPriorities
  );
  const discussionPrompts = asStringArray(advisorBrief?.discussionPrompts);
  const suggestedFocusAreas = asStringArray(advisorBrief?.suggestedFocusAreas);

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
                {submission.submission_id}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">
                Submitted
              </p>
              <p className="mt-1 text-sm text-slate-900">
                {formatSubmittedAt(submission.contact_submitted_at)}
              </p>
            </div>
          </div>

          {result ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1E6FD9]">
                Diagnostic profile
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#0A1628]">
                {result.score} / 100 — {result.band.label}
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

        {advisorBrief ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
              Call focus
            </h2>

            {advisorBrief.headline ? (
              <p className="mb-3 text-lg font-semibold text-slate-900">
                {advisorBrief.headline}
              </p>
            ) : null}

            {advisorBrief.recommendedCallAngle ? (
              <p className="mb-5 leading-7 text-slate-700">
                {advisorBrief.recommendedCallAngle}
              </p>
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
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
            Contact details
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <p>
              <strong>Name:</strong> {submission.contact_name}
            </p>
            <p>
              <strong>Email:</strong> {submission.contact_email}
            </p>
            <p>
              <strong>Organisation:</strong>{" "}
              {submission.contact_company || "Not provided"}
            </p>
            <p>
              <strong>Topic:</strong> {submission.contact_topic || "Not provided"}
            </p>
            <p>
              <strong>Source:</strong> {submission.contact_source || "website"}
            </p>
            <p>
              <strong>Company size:</strong>{" "}
              {submission.company_size || "Not provided"}
            </p>
            <p>
              <strong>Industry:</strong> {submission.industry || "Not provided"}
            </p>
            <p>
              <strong>Role:</strong> {submission.role || "Not provided"}
            </p>
            <p>
              <strong>Region:</strong>{" "}
              {submission.country_region || "Not provided"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
            Message
          </h2>
          <div className="whitespace-pre-wrap leading-7 text-slate-700">
            {submission.contact_message}
          </div>
        </section>

        {result ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
                Diagnostic summary
              </h2>
              <p className="leading-7 text-slate-700">
                {buildNarrative(result, submission)}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
                Business impact
              </h2>
              <p className="leading-7 text-slate-700">{buildImpact(result)}</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
                Priority actions
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-slate-700">
                {buildPriorities(result).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-[#0A1628]">
                Lowest scoring areas
              </h2>
              <div className="space-y-4">
                {result.lowestDimensions.map((dimension: any) => (
                  <div
                    key={dimension.label}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {dimension.label} — {dimension.score}/5
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {getInsight(dimension.label)}
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
                {buildCallOpener(result, submission)}
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