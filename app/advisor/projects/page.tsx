import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireAdvisorUser } from "@/lib/advisor-auth";

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

function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatProjectTitle(project: Project): string {
  if (project.project_name && project.project_name.trim().length > 0) {
    return project.project_name;
  }

  if (project.company_name && project.company_name.trim().length > 0) {
    return project.company_name;
  }

  return "Untitled project";
}

/**
 * 🔴 CRITICAL CHANGE
 * UI language is now Open / Closed only
 */
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

export default async function AdvisorProjectsPage() {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("client_projects")
    .select("project_id, project_name, company_name, project_status, created_at")
    .order("created_at", { ascending: false });

  const projects: Project[] = !error && data ? data : [];

  const openProjects = projects.filter((p) => p.project_status === "active");
  const closedProjects = projects.filter((p) => p.project_status === "closed");

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-5xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">Projects</h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              View and manage all diagnostic projects. This is the control layer
              for accessing project workspaces, monitoring progress, and moving
              into reporting.
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
        ) : projects.length === 0 ? (
          <section className="brand-surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              No projects found
            </h2>
            <p className="mt-4 text-sm text-slate-700">
              No diagnostic projects are currently available.
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <section
                key={project.project_id}
                className="brand-surface-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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

                  <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:grid-cols-1 xl:grid-cols-2">
                    <Link
                      href={`/advisor/project/${project.project_id}`}
                      className="brand-button-primary text-center"
                    >
                      Open workspace
                    </Link>

                    <Link
                      href={`/advisor/report/${project.project_id}`}
                      className="brand-button-dark text-center"
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
    </main>
  );
}

function WorkspaceStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}