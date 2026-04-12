import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type HealthCheckRow = {
  submission_id: string;
  contact_name: string;
  contact_email: string;
  contact_company: string | null;
  contact_source: string | null;
  company_size: string | null;
  industry: string | null;
  role: string | null;
  country_region: string | null;
  score: number | null;
  band: string | null;
  contact_submitted_at: string | null;
};

function formatSubmittedAt(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

async function getHealthChecks(): Promise<HealthCheckRow[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("diagnostic_submissions")
    .select(
      `
        submission_id,
        contact_name,
        contact_email,
        contact_company,
        contact_source,
        company_size,
        industry,
        role,
        country_region,
        score,
        band,
        contact_submitted_at
      `,
    )
    .order("contact_submitted_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Unable to load health check submissions: ${error.message}`);
  }

  return (data ?? []) as HealthCheckRow[];
}

export default async function AdvisorHealthChecksPage() {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const healthChecks = await getHealthChecks();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Health Check submissions
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Browse and review HR Health Check submissions. Open any submission
              to view the full advisor detail, interpretation, and follow-up
              context.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Showing latest <strong>{healthChecks.length}</strong> submissions
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {healthChecks.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No Health Check submissions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Organisation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Industry
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Band
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {healthChecks.map((submission) => (
                    <tr key={submission.submission_id} className="align-top">
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatSubmittedAt(submission.contact_submitted_at)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">
                        {submission.contact_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.contact_email}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.contact_company || "Not provided"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.industry || "Not provided"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.role || "Not provided"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.contact_source || "website"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.score ?? "N/A"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.band || "Not available"}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Link
                          href={`/advisor/${submission.submission_id}`}
                          className="font-medium text-[#1E6FD9] hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}