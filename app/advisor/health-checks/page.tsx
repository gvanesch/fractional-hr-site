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

type SearchParams = Promise<{
  q?: string;
  completedFrom?: string;
  completedTo?: string;
  enquiryFrom?: string;
  enquiryTo?: string;
  industry?: string;
  role?: string;
  companySize?: string;
  band?: string;
  source?: string;
  status?: string;
  sort?: string;
}>;

type AdvisorHealthChecksPageProps = {
  searchParams: SearchParams;
};

type HealthCheckRow = {
  submission_id: string;
  completed_at: string | null;
  contact_submitted_at: string | null;
  submission_source: string | null;
  completion_version: string | null;
  email: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_company: string | null;
  contact_topic: string | null;
  contact_source: string | null;
  company_size: string | null;
  industry: string | null;
  role: string | null;
  country_region: string | null;
  score: number | null;
  band: string | null;
  advisor_brief: unknown | null;
  contact_message: string | null;
};

type HealthCheckFilters = {
  q: string;
  completedFrom: string;
  completedTo: string;
  enquiryFrom: string;
  enquiryTo: string;
  industry: string;
  role: string;
  companySize: string;
  band: string;
  source: string;
  status: string;
  sort: string;
};

type FilterOptions = {
  industries: string[];
  roles: string[];
  companySizes: string[];
  bands: string[];
  sources: string[];
};

const DEFAULT_SORT = "completed_desc";

function normaliseFilter(value: string | undefined): string {
  return value?.trim() ?? "";
}

function getFilters(searchParams: Awaited<SearchParams>): HealthCheckFilters {
  return {
    q: normaliseFilter(searchParams.q),
    completedFrom: normaliseFilter(searchParams.completedFrom),
    completedTo: normaliseFilter(searchParams.completedTo),
    enquiryFrom: normaliseFilter(searchParams.enquiryFrom),
    enquiryTo: normaliseFilter(searchParams.enquiryTo),
    industry: normaliseFilter(searchParams.industry),
    role: normaliseFilter(searchParams.role),
    companySize: normaliseFilter(searchParams.companySize),
    band: normaliseFilter(searchParams.band),
    source: normaliseFilter(searchParams.source),
    status: normaliseFilter(searchParams.status),
    sort: normaliseFilter(searchParams.sort) || DEFAULT_SORT,
  };
}

function formatTimestamp(value: string | null): string {
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

function formatDateForInput(value: string): string {
  return value || "";
}

function getDateRange(from: string, to: string): {
  fromIso?: string;
  toIsoExclusive?: string;
} {
  const result: {
    fromIso?: string;
    toIsoExclusive?: string;
  } = {};

  if (from) {
    result.fromIso = `${from}T00:00:00.000Z`;
  }

  if (to) {
    const toDate = new Date(`${to}T00:00:00.000Z`);

    if (!Number.isNaN(toDate.getTime())) {
      toDate.setUTCDate(toDate.getUTCDate() + 1);
      result.toIsoExclusive = toDate.toISOString();
    }
  }

  return result;
}

function buildSort(sort: string): {
  column:
    | "completed_at"
    | "contact_submitted_at"
    | "score"
    | "contact_name"
    | "email";
  ascending: boolean;
} {
  switch (sort) {
    case "completed_asc":
      return { column: "completed_at", ascending: true };
    case "enquiry_desc":
      return { column: "contact_submitted_at", ascending: false };
    case "enquiry_asc":
      return { column: "contact_submitted_at", ascending: true };
    case "score_desc":
      return { column: "score", ascending: false };
    case "score_asc":
      return { column: "score", ascending: true };
    case "name_asc":
      return { column: "contact_name", ascending: true };
    case "name_desc":
      return { column: "contact_name", ascending: false };
    case "email_asc":
      return { column: "email", ascending: true };
    case "completed_desc":
    default:
      return { column: "completed_at", ascending: false };
  }
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b, "en-GB"));
}

async function getFilterOptions(): Promise<FilterOptions> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("diagnostic_submissions")
    .select(
      `
        industry,
        role,
        company_size,
        band,
        contact_source,
        submission_source
      `,
    )
    .or("completed_at.not.is.null,contact_submitted_at.not.is.null")
    .limit(2000);

  if (error) {
    throw new Error(
      `Unable to load Health Check filter options: ${error.message}`,
    );
  }

  const rows = (data ?? []) as Array<{
    industry: string | null;
    role: string | null;
    company_size: string | null;
    band: string | null;
    contact_source: string | null;
    submission_source: string | null;
  }>;

  return {
    industries: uniqueSorted(rows.map((row) => row.industry)),
    roles: uniqueSorted(rows.map((row) => row.role)),
    companySizes: uniqueSorted(rows.map((row) => row.company_size)),
    bands: uniqueSorted(rows.map((row) => row.band)),
    sources: uniqueSorted(
      rows.flatMap((row) => [row.contact_source, row.submission_source]),
    ),
  };
}

async function getHealthChecks(
  filters: HealthCheckFilters,
): Promise<HealthCheckRow[]> {
  const supabase = createSupabaseAdminClient();
  const sort = buildSort(filters.sort);
  const completedRange = getDateRange(
    filters.completedFrom,
    filters.completedTo,
  );
  const enquiryRange = getDateRange(filters.enquiryFrom, filters.enquiryTo);

  let query = supabase
    .from("diagnostic_submissions")
    .select(
      `
        submission_id,
        completed_at,
        contact_submitted_at,
        submission_source,
        completion_version,
        email,
        contact_name,
        contact_email,
        contact_company,
        contact_topic,
        contact_source,
        company_size,
        industry,
        role,
        country_region,
        score,
        band,
        advisor_brief,
        contact_message
      `,
    )
    .not("completed_at", "is", null);

  if (filters.q) {
    const safeQuery = filters.q.replace(/,/g, " ");
    query = query.or(
      `contact_name.ilike.%${safeQuery}%,contact_email.ilike.%${safeQuery}%,contact_company.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%`,
    );
  }

  if (filters.industry) {
    query = query.eq("industry", filters.industry);
  }

  if (filters.role) {
    query = query.eq("role", filters.role);
  }

  if (filters.companySize) {
    query = query.eq("company_size", filters.companySize);
  }

  if (filters.band) {
    query = query.eq("band", filters.band);
  }

  if (filters.source) {
    query = query.or(
      `contact_source.eq.${filters.source},submission_source.eq.${filters.source}`,
    );
  }

  if (completedRange.fromIso) {
    query = query.gte("completed_at", completedRange.fromIso);
  }

  if (completedRange.toIsoExclusive) {
    query = query.lt("completed_at", completedRange.toIsoExclusive);
  }

  if (enquiryRange.fromIso) {
    query = query.gte("contact_submitted_at", enquiryRange.fromIso);
  }

  if (enquiryRange.toIsoExclusive) {
    query = query.lt("contact_submitted_at", enquiryRange.toIsoExclusive);
  }

  switch (filters.status) {
    case "completion_only":
      query = query.is("contact_submitted_at", null);
      break;
    case "contact_request":
      query = query.not("contact_submitted_at", "is", null);
      break;
    default:
      break;
  }

  const { data, error } = await query
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .limit(250);

  if (error) {
    throw new Error(`Unable to load health check submissions: ${error.message}`);
  }

  return (data ?? []) as HealthCheckRow[];
}

function getSummaryStats(rows: HealthCheckRow[]) {
  const withScore = rows.filter((row) => typeof row.score === "number");
  const withEnquiry = rows.filter((row) => Boolean(row.contact_submitted_at));

  const averageScore =
    withScore.length > 0
      ? Math.round(
          withScore.reduce((total, row) => total + (row.score ?? 0), 0) /
            withScore.length,
        )
      : null;

  return {
    total: rows.length,
    averageScore,
    withEnquiry: withEnquiry.length,
    completionOnly: rows.length - withEnquiry.length,
  };
}

function badgeClasses(band: string | null): string {
  const value = (band ?? "").toLowerCase();

  if (value.includes("strong") || value.includes("mature")) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  }

  if (value.includes("structured") || value.includes("developing")) {
    return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }

  if (
    value.includes("chaotic") ||
    value.includes("friction") ||
    value.includes("emerging")
  ) {
    return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
  }

  return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
}

function signalBadgeClasses(kind: "completed" | "enquiry" | "topic"): string {
  switch (kind) {
    case "completed":
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
    case "enquiry":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "topic":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }
}

function cellValue(value: string | null): string {
  return value && value.trim() ? value : "Not provided";
}

function hasActiveFilters(filters: HealthCheckFilters): boolean {
  return Boolean(
    filters.q ||
      filters.completedFrom ||
      filters.completedTo ||
      filters.enquiryFrom ||
      filters.enquiryTo ||
      filters.industry ||
      filters.role ||
      filters.companySize ||
      filters.band ||
      filters.source ||
      filters.status ||
      (filters.sort && filters.sort !== DEFAULT_SORT),
  );
}

function hasTopic(value: string | null): boolean {
  return Boolean(value && value.trim());
}

function getPrimaryEmail(row: HealthCheckRow): string {
  return row.contact_email || row.email || "Not provided";
}

function getPrimaryName(row: HealthCheckRow): string {
  return row.contact_name || "No enquiry yet";
}

export default async function AdvisorHealthChecksPage({
  searchParams,
}: AdvisorHealthChecksPageProps) {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const resolvedSearchParams = await searchParams;
  const filters = getFilters(resolvedSearchParams);

  const [healthChecks, filterOptions] = await Promise.all([
    getHealthChecks(filters),
    getFilterOptions(),
  ]);

  const stats = getSummaryStats(healthChecks);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Health Check repository
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Browse, filter, and review all HR Health Check completions and
              linked contact requests from one advisor workspace. Use this view
              to see which submissions remain as completion only and which have
              moved into conversation.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            Signed in as <strong>{advisorUser.email}</strong>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Completions</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Contact requests</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stats.withEnquiry}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Completion only</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stats.completionOnly}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Average score</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stats.averageScore ?? "N/A"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form className="space-y-5" method="get">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_180px_180px]">
              <div>
                <label
                  htmlFor="q"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Search
                </label>
                <input
                  id="q"
                  name="q"
                  type="text"
                  defaultValue={filters.q}
                  placeholder="Name, email, or organisation"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="completedFrom"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Completed from
                </label>
                <input
                  id="completedFrom"
                  name="completedFrom"
                  type="date"
                  defaultValue={formatDateForInput(filters.completedFrom)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="completedTo"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Completed to
                </label>
                <input
                  id="completedTo"
                  name="completedTo"
                  type="date"
                  defaultValue={formatDateForInput(filters.completedTo)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[180px_180px_minmax(0,1fr)]">
              <div>
                <label
                  htmlFor="enquiryFrom"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Contact request from
                </label>
                <input
                  id="enquiryFrom"
                  name="enquiryFrom"
                  type="date"
                  defaultValue={formatDateForInput(filters.enquiryFrom)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="enquiryTo"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Contact request to
                </label>
                <input
                  id="enquiryTo"
                  name="enquiryTo"
                  type="date"
                  defaultValue={formatDateForInput(filters.enquiryTo)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Lifecycle status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={filters.status}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                >
                  <option value="">All records</option>
                  <option value="completion_only">Health Check completion only</option>
                  <option value="contact_request">Contact request</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label
                  htmlFor="industry"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  defaultValue={filters.industry}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                >
                  <option value="">All industries</option>
                  {filterOptions.industries.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue={filters.role}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                >
                  <option value="">All roles</option>
                  {filterOptions.roles.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="companySize"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Company size
                </label>
                <select
                  id="companySize"
                  name="companySize"
                  defaultValue={filters.companySize}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                >
                  <option value="">All company sizes</option>
                  {filterOptions.companySizes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="band"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Band
                </label>
                <select
                  id="band"
                  name="band"
                  defaultValue={filters.band}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                >
                  <option value="">All bands</option>
                  {filterOptions.bands.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="source"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Source
                </label>
                <select
                  id="source"
                  name="source"
                  defaultValue={filters.source}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                >
                  <option value="">All sources</option>
                  {filterOptions.sources.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="text-sm text-slate-500">
                {hasActiveFilters(filters)
                  ? "Filters applied to Health Check records."
                  : "Showing all recent Health Check completions and linked contact requests."}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full sm:w-[220px]">
                  <label
                    htmlFor="sort"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Sort by
                  </label>
                  <select
                    id="sort"
                    name="sort"
                    defaultValue={filters.sort}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                  >
                    <option value="completed_desc">Latest completion</option>
                    <option value="completed_asc">Oldest completion</option>
                    <option value="enquiry_desc">Latest contact request</option>
                    <option value="enquiry_asc">Oldest contact request</option>
                    <option value="score_desc">Highest score</option>
                    <option value="score_asc">Lowest score</option>
                    <option value="name_asc">Name A to Z</option>
                    <option value="name_desc">Name Z to A</option>
                    <option value="email_asc">Email A to Z</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="/advisor/health-checks"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Reset
                  </a>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-[#1E6FD9] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1859ad]"
                  >
                    Apply filters
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {healthChecks.length === 0 ? (
            <div className="p-8">
              <h2 className="text-lg font-semibold text-slate-900">
                No matching Health Check records found
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Try widening the completion or contact request date range, or
                removing one or more filters to see more records.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Health Check completed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Contact request submitted
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Organisation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Diagnostic
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Lifecycle / signals
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {healthChecks.map((submission) => (
                      <tr key={submission.submission_id} className="align-top">
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                          {formatTimestamp(submission.completed_at)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                          {submission.contact_submitted_at
                            ? formatTimestamp(submission.contact_submitted_at)
                            : "No contact request yet"}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700">
                          <div className="font-medium text-slate-900">
                            {getPrimaryName(submission)}
                          </div>
                          <div className="mt-1">{getPrimaryEmail(submission)}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {cellValue(submission.role)} ·{" "}
                            {cellValue(submission.country_region)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700">
                          <div className="font-medium text-slate-900">
                            {cellValue(submission.contact_company)}
                          </div>
                          <div className="mt-1">
                            {cellValue(submission.industry)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {cellValue(submission.company_size)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700">
                          <div className="font-medium text-slate-900">
                            Score: {submission.score ?? "N/A"}
                          </div>
                          <div className="mt-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClasses(
                                submission.band,
                              )}`}
                            >
                              {submission.band || "Not available"}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            Submission source:{" "}
                            {submission.submission_source || "Not available"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Contact source: {submission.contact_source || "None"}
                          </div>
                          {hasTopic(submission.contact_topic) ? (
                            <div className="mt-1 text-xs text-slate-500">
                              Topic: {submission.contact_topic}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${signalBadgeClasses(
                                "completed",
                              )}`}
                            >
                              Completed
                            </span>

                            {submission.contact_submitted_at ? (
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${signalBadgeClasses(
                                  "enquiry",
                                )}`}
                              >
                                Contact request
                              </span>
                            ) : null}

                            {hasTopic(submission.contact_topic) ? (
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${signalBadgeClasses(
                                  "topic",
                                )}`}
                              >
                                Topic
                              </span>
                            ) : null}
                          </div>
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

              <div className="grid gap-4 p-4 lg:hidden">
                {healthChecks.map((submission) => (
                  <article
                    key={submission.submission_id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">
                          Completed: {formatTimestamp(submission.completed_at)}
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-slate-900">
                          {getPrimaryName(submission)}
                        </h2>
                        <p className="mt-1 text-sm text-slate-700">
                          {getPrimaryEmail(submission)}
                        </p>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClasses(
                            submission.band,
                          )}`}
                        >
                          {submission.band || "Not available"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Contact
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {cellValue(submission.role)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {cellValue(submission.country_region)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Contact request:{" "}
                          {submission.contact_submitted_at
                            ? formatTimestamp(submission.contact_submitted_at)
                            : "No contact request yet"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Organisation
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {cellValue(submission.contact_company)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {cellValue(submission.industry)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {cellValue(submission.company_size)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Diagnostic
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          Score: {submission.score ?? "N/A"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Submission source:{" "}
                          {submission.submission_source || "Not available"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Contact source: {submission.contact_source || "None"}
                        </p>
                        {hasTopic(submission.contact_topic) ? (
                          <p className="mt-1 text-sm text-slate-500">
                            Topic: {submission.contact_topic}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Lifecycle / signals
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${signalBadgeClasses(
                              "completed",
                            )}`}
                          >
                            Completed
                          </span>

                          {submission.contact_submitted_at ? (
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${signalBadgeClasses(
                                "enquiry",
                              )}`}
                            >
                              Contact request
                            </span>
                          ) : null}

                          {hasTopic(submission.contact_topic) ? (
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${signalBadgeClasses(
                                "topic",
                              )}`}
                            >
                              Topic
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <Link
                        href={`/advisor/${submission.submission_id}`}
                        className="font-medium text-[#1E6FD9] hover:underline"
                      >
                        Open full advisor view
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}