import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Diagnostic Explorers | Van Esch Advisory",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type Project = {
  project_id: string;
  project_name: string | null;
  company_name: string | null;
  project_status: "active" | "closed" | "archived" | null;
  created_at: string;
};

type PageProps = {
  searchParams?: Promise<{
    client?: string;
    project?: string;
    status?: string;
    from?: string;
    to?: string;
    sort?: string;
  }>;
};

const fieldClassName =
  "mt-2 h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 text-sm leading-none text-slate-900 outline-none transition focus:border-slate-500";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatProjectTitle(project: Project): string {
  if (project.project_name?.trim()) {
    return project.project_name;
  }

  if (project.company_name?.trim()) {
    return project.company_name;
  }

  return "Untitled project";
}

function getSafeStatus(value: string | undefined): string {
  if (value === "active" || value === "closed" || value === "archived") {
    return value;
  }

  return "all";
}

function getSafeSort(value: string | undefined): "newest" | "oldest" {
  return value === "oldest" ? "oldest" : "newest";
}

function matchesText(value: string | null, query: string): boolean {
  if (!query) {
    return true;
  }

  return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

function matchesDateRange(
  createdAt: string,
  from: string,
  to: string,
): boolean {
  const createdDate = createdAt.slice(0, 10);

  if (from && createdDate < from) {
    return false;
  }

  if (to && createdDate > to) {
    return false;
  }

  return true;
}

function getStatusLabel(status: Project["project_status"]): string {
  switch (status) {
    case "active":
      return "Open";
    case "closed":
      return "Closed";
    case "archived":
      return "Archived";
    default:
      return "Unknown";
  }
}

function getStatusClasses(status: Project["project_status"]): string {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "closed":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "archived":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export default async function AdvisorExplorersPage({ searchParams }: PageProps) {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const resolvedSearchParams = await searchParams;
  const clientQuery = resolvedSearchParams?.client?.trim() ?? "";
  const projectQuery = resolvedSearchParams?.project?.trim() ?? "";
  const status = getSafeStatus(resolvedSearchParams?.status);
  const from = resolvedSearchParams?.from?.trim() ?? "";
  const to = resolvedSearchParams?.to?.trim() ?? "";
  const sort = getSafeSort(resolvedSearchParams?.sort);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("client_projects")
    .select("project_id, project_name, company_name, project_status, created_at")
    .order("created_at", { ascending: sort === "oldest" });

  const projects: Project[] = !error && data ? data : [];
  const filteredProjects = projects.filter((project) => {
    const matchesStatus = status === "all" || project.project_status === status;

    return (
      matchesStatus &&
      matchesText(project.company_name, clientQuery) &&
      matchesText(project.project_name, projectQuery) &&
      matchesDateRange(project.created_at, from, to)
    );
  });

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-5xl">
            <p className="brand-kicker">Advisor workspace</p>
            <h1 className="brand-heading-lg mt-5 text-white">
              Diagnostic Explorers
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Open an advisor-only diagnostic Explorer directly. Search and
              filter projects before moving into full-fidelity analysis.
            </p>
          </div>
        </div>
      </section>

      <div className="brand-container space-y-6 py-10">
        <section className="brand-surface-card p-6">
          <form className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="block xl:col-span-2">
              <span className="text-sm font-medium text-slate-700">Client name</span>
              <input
                name="client"
                type="search"
                defaultValue={clientQuery}
                placeholder="Search company or client"
                className={fieldClassName}
              />
            </label>

            <label className="block xl:col-span-2">
              <span className="text-sm font-medium text-slate-700">Project name</span>
              <input
                name="project"
                type="search"
                defaultValue={projectQuery}
                placeholder="Search project name"
                className={fieldClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select name="status" defaultValue={status} className={fieldClassName}>
                <option value="all">All</option>
                <option value="active">Open</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Sort</span>
              <select name="sort" defaultValue={sort} className={fieldClassName}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Created from</span>
              <input
                name="from"
                type="date"
                defaultValue={from}
                className={fieldClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Created to</span>
              <input
                name="to"
                type="date"
                defaultValue={to}
                className={fieldClassName}
              />
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-4">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1E6FD9] px-5 text-sm font-semibold text-white transition hover:bg-[#1859ad]"
              >
                Apply filters
              </button>
              <Link
                href="/advisor/explorers"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </Link>
            </div>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            Showing {filteredProjects.length} of {projects.length} diagnostic projects.
          </p>
        </section>

        {error ? (
          <section className="brand-surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Unable to load Explorers
            </h2>
            <p className="mt-3 text-sm text-rose-600">
              There was a problem retrieving diagnostic projects.
            </p>
          </section>
        ) : filteredProjects.length === 0 ? (
          <section className="brand-surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              No matching Explorers
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Adjust the client, project, status or date filters to show more projects.
            </p>
          </section>
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map((project) => (
              <section
                key={project.project_id}
                className="brand-surface-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {formatProjectTitle(project)}
                      </h2>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          project.project_status,
                        )}`}
                      >
                        {getStatusLabel(project.project_status)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {project.company_name || "No client name recorded"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                      <span>Created: {formatDate(project.created_at)}</span>
                      <span>Project ID: {project.project_id}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={`/advisor/explore/${project.project_id}`}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1E6FD9] px-4 text-sm font-semibold text-white transition hover:bg-[#1859ad]"
                    >
                      Open Explorer
                    </Link>
                    <Link
                      href={`/advisor/project/${project.project_id}`}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Project workspace
                    </Link>
                    <Link
                      href={`/advisor/report/${project.project_id}`}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Evidence pack
                    </Link>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
