import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

type AdvisorBrief = {
  headline?: string;
  overallAssessment?: string;
  keyThemes?: string[];
  likelyOperationalRisks?: string[];
  discussionPrompts?: string[];
  suggestedFocusAreas?: string[];
  executiveReadout?: string;
  likelyFrictionPoints?: string[];
  businessImplications?: string[];
  whatTypicallyHappensNext?: string[];
  first30DayPriorities?: string[];
  recommendedCallAngle?: string;
};

type AdvisorRecord = {
  submission_id: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_company: string | null;
  contact_topic: string | null;
  contact_message: string | null;
  contact_source: string | null;
  company_size: string | null;
  industry: string | null;
  role: string | null;
  country_region: string | null;
  score: number | null;
  band: string | null;
  advisor_brief: AdvisorBrief | null;
  created_at?: string | null;
  contact_submitted_at?: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderList(items?: string[] | null, emptyText = "No items available.") {
  if (!items?.length) {
    return <p className="text-slate-500">{emptyText}</p>;
  }

  return (
    <ul className="space-y-3 text-slate-700">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3">
          <span className="mt-1 text-[#1E6FD9]">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="font-medium text-slate-600">{label}</dt>
      <dd className="text-slate-800 break-words">{value || "—"}</dd>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200/70">
      <h2 className="mb-5 text-xl font-semibold text-[#0A1628]">{title}</h2>
      {children}
    </section>
  );
}

export default async function AdvisorSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;

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
        score,
        band,
        advisor_brief,
        created_at,
        contact_submitted_at
      `
    )
    .eq("submission_id", submissionId)
    .single<AdvisorRecord>();

  if (error || !data) {
    notFound();
  }

  const brief = data.advisor_brief;
  const submittedAt = data.contact_submitted_at ?? data.created_at;

  return (
    <main className="min-h-screen bg-[#F4F6FA] px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#0A1628] to-[#0D1F3C] p-8 text-white shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[#8AAAC8]">
                Internal advisor brief
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                {data.contact_company || data.contact_name || "Lead overview"}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">
                {brief?.executiveReadout ||
                  brief?.overallAssessment ||
                  "No executive readout available for this submission yet."}
              </p>
            </div>

            <div className="rounded-2xl bg-white/8 p-6 ring-1 ring-white/10 backdrop-blur-sm">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[#8AAAC8]">Score</p>
                  <p className="text-2xl font-semibold text-white">
                    {data.score ?? "—"} / 100
                  </p>
                </div>
                <div>
                  <p className="text-[#8AAAC8]">Band</p>
                  <p className="font-medium text-white">{data.band || "—"}</p>
                </div>
                <div>
                  <p className="text-[#8AAAC8]">Submitted</p>
                  <p className="font-medium text-white">
                    {formatDate(submittedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[#8AAAC8]">Submission ID</p>
                  <p className="break-all font-medium text-white">
                    {data.submission_id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <SectionCard title="Lead details">
            <dl className="space-y-4">
              <DetailRow label="Name" value={data.contact_name} />
              <DetailRow label="Email" value={data.contact_email} />
              <DetailRow label="Organisation" value={data.contact_company} />
              <DetailRow label="Topic" value={data.contact_topic} />
              <DetailRow label="Source" value={data.contact_source} />
            </dl>
          </SectionCard>

          <SectionCard title="Context">
            <dl className="space-y-4">
              <DetailRow label="Company size" value={data.company_size} />
              <DetailRow label="Industry" value={data.industry} />
              <DetailRow label="Role" value={data.role} />
              <DetailRow label="Region" value={data.country_region} />
            </dl>
          </SectionCard>
        </div>

        <SectionCard title="Enquiry message">
          <p className="whitespace-pre-wrap leading-7 text-slate-700">
            {data.contact_message || "—"}
          </p>
        </SectionCard>

        <SectionCard title="Executive interpretation">
          <div className="space-y-4">
            {brief?.headline && (
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1E6FD9]">
                {brief.headline}
              </p>
            )}
            <p className="leading-7 text-slate-700">
              {brief?.executiveReadout ||
                brief?.overallAssessment ||
                "No executive interpretation available."}
            </p>
            {brief?.recommendedCallAngle && (
              <div className="rounded-2xl bg-[#F4F6FA] p-5 ring-1 ring-slate-200/70">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Recommended call angle
                </p>
                <p className="leading-7 text-slate-700">
                  {brief.recommendedCallAngle}
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        <div className="grid gap-8 lg:grid-cols-2">
          <SectionCard title="Key themes">
            {renderList(brief?.keyThemes, "No key themes available.")}
          </SectionCard>

          <SectionCard title="Likely operational friction">
            {renderList(
              brief?.likelyFrictionPoints,
              "No friction points available."
            )}
          </SectionCard>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <SectionCard title="Business implications">
            {renderList(
              brief?.businessImplications,
              "No business implications available."
            )}
          </SectionCard>

          <SectionCard title="Likely operational risks">
            {renderList(
              brief?.likelyOperationalRisks,
              "No operational risks available."
            )}
          </SectionCard>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <SectionCard title="What typically happens next">
            {renderList(
              brief?.whatTypicallyHappensNext,
              "No pattern summary available."
            )}
          </SectionCard>

          <SectionCard title="First 30-day priorities">
            {renderList(
              brief?.first30DayPriorities,
              "No priority actions available."
            )}
          </SectionCard>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <SectionCard title="Discussion prompts">
            {renderList(
              brief?.discussionPrompts,
              "No discussion prompts available."
            )}
          </SectionCard>

          <SectionCard title="Suggested focus areas">
            {renderList(
              brief?.suggestedFocusAreas,
              "No focus areas available."
            )}
          </SectionCard>
        </div>
      </div>
    </main>
  );
}