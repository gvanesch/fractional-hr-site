import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Advisor Projects | Van Esch Advisory",
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
    q?: string;
    status?: string;
    sort?: string;
  }>;
};

const fieldClassName =
  "mt-2 h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 text-sm leading-none text-slate-900 outline-none transition focus:border-slate-500";

const actionButtonClassName =
  "inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full px-5 text-center text-sm font-semibold";

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

function getProjectStatusLabel(status: Project["project_status"]): string {
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

function getSafeStatus(value: string | undefined): string {
  if (value === "active" || value === "closed" || value === "archived") {
    return value;
  }

  return "all";
}

function getSafeSort(value: string | undefined): "newest" | "oldest" {
  return value === "oldest" ? "oldest" : "newest";
}

function matchesSearch(project: Project, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    project.project_name,
    project.company_name,
    project.project_id,
    project.project_status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export default async function AdvisorProjectsPage({ searchParams }: PageProps) {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const status = getSafeStatus(resolvedSearchParams?.status);
  const sort = getSafeSort(resolvedSearchParams?.sort);

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("client_projects")
    .select("project_id, project_name, company_name, project_status, created_at")
    .order("created_at", { ascending: sort === "oldest" });

  const projects: Project[] = !error && data ? data : [];

  const openProjects = projects.filter((p) => p.project_status === "active");
  const closedProjects = projects.filter((p) => p.project_status === "closed");

  const filteredProjects = projects.filter((project) => {
    const matchesStatus = status === "all" || project.project_status === status;
    return matchesStatus && matchesSearch(project, query);
  });

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-5xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">Projects</h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              View and manage diagnostic projects. This is the control layer for
              accessing project workspaces, monitoring progress, and moving into
              reporting.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <WorkspaceStat label="Total" value={String(projects.length)} />
              <WorkspaceStat label="Open" value={String(openProjects.length)} />
              <WorkspaceStat label="Closed" value={String(closedProjects.length)} />
            </div>
          </div>
        </div>
      </section>

      <div className="brand-container py-10">
        {error ? (
          <section className="brand-surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Unable to load projects
            </h2>
            <p className="mt-4 text-sm text-rose-600">
              There was a problem retrieving projects from Supabase.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="brand-surface-card p-6">
              <form className="grid items-end gap-4 lg:grid-cols-[1fr_180px_180px_auto]">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Search projects
                  </span>
                  <input
                    name="q"
                    type="search"
                    defaultValue={query}
                    placeholder="Search company, project, or project ID"
                    className={fieldClassName}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>
                  <select
                    name="status"
                    defaultValue={status}
                    className={fieldClassName}
                  >
                    <option value="all">All</option>
                    <option value="active">Open</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Sort
                  </span>
                  <select
                    name="sort"
                    defaultValue={sort}
                    className={fieldClassName}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </label>

                <div className="flex flex-wrap items-end gap-3">
                  <button
                    type="submit"
                    className={`${actionButtonClassName} brand-button-primary`}
                  >
                    Apply
                  </button>

                  <Link
                    href="/advisor/projects"
                    className={`${actionButtonClassName} brand-button-dark`}
                  >
                    Reset
                  </Link>
                </div>
              </form>

              <p className="mt-4 text-sm text-slate-600">
                Showing {filteredProjects.length} of {projects.length} projects.
              </p>
            </section>

            {projects.length === 0 ? (
              <section className="brand-surface-card p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  No projects found
                </h2>
                <p className="mt-4 text-sm text-slate-700">
                  No diagnostic projects are currently available.
                </p>
              </section>
            ) : filteredProjects.length === 0 ? (
              <section className="brand-surface-card p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  No matching projects
                </h2>
                <p className="mt-4 text-sm text-slate-700">
                  Adjust the search or filters to show more projects.
                </p>
              </section>
            ) : (
              <div className="grid gap-4">
                {filteredProjects.map((project) => (
                  <section
                    key={project.project_id}
                    className="brand-surface-card min-h-[168px] p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-full flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
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
                            {getProjectStatusLabel(project.project_status)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {project.company_name || "No company name recorded"}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                          <span>Project ID: {project.project_id}</span>
                          <span>Created: {formatDate(project.created_at)}</span>
                        </div>
                      </div>

                      <div className="grid content-center gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:grid-cols-1 xl:grid-cols-2">
                        <Link
                          href={`/advisor/project/${project.project_id}`}
                          className={`${actionButtonClassName} brand-button-primary`}
                        >
                          Open workspace
                        </Link>

                        <Link
                          href={`/advisor/report/${project.project_id}`}
                          className={`${actionButtonClassName} brand-button-dark`}
                        >
                          View report
                        </Link>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function WorkspaceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-full rounded-2xl border border-white/15 bg-white/10 p-5 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}