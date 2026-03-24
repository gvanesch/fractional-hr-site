export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const runtime = "edge";
export const dynamic = "force-dynamic";

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

type AdvisorPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
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

type ErrorResponse = {
  success: false;
  error: string;
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

async function getBaseUrl(): Promise<string> {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (envSiteUrl) {
    return envSiteUrl.replace(/\/$/, "");
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  if (!host) {
    throw new Error("Unable to determine site host.");
  }

  const protocol =
    host.includes("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";

  return `${protocol}://${host}`;
}

async function getAdvisorSubmission(
  submissionId: string,
): Promise<SuccessResponse> {
  const baseUrl = await getBaseUrl();

  const response = await fetch(
    `${baseUrl}/api/advisor-submission?submissionId=${encodeURIComponent(
      submissionId,
    )}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    notFound();
  }

  const data = (await response.json()) as SuccessResponse | ErrorResponse;

  if (!response.ok || !data.success) {
    throw new Error("Unable to load advisor submission.");
  }

  return data;
}

export default async function AdvisorSubmissionPage({
  params,
}: AdvisorPageProps) {
  const { submissionId } = await params;
  const data = await getAdvisorSubmission(submissionId);

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
                      {dimension.label} — {dimension.score}/5
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