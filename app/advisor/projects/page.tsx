import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireAdvisorUser } from "@/lib/advisor-auth";


type Project = {
  project_id: string;
  project_name: string;
  company_name: string;
  project_status: string;
  created_at: string;
};

function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">Projects</h1>

            <p className="brand-subheading brand-body-on-dark mt-6">
              View and manage all diagnostic projects.
            </p>
          </div>
        </div>
      </section>

      <div className="brand-container py-10">
        {error ? (
          <p className="text-sm text-rose-600">
            Unable to load projects.
          </p>
        ) : projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <a
                key={project.project_id}
                href={`/advisor/project/${project.project_id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 hover:shadow"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  {project.project_name}
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  {project.company_name}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Status: {project.project_status}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}