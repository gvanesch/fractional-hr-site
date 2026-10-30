import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getD1Database,
  isD1ClientDiagnosticEnabled,
} from "@/lib/d1/database";
import AdvisorProjectNav from "@/app/components/advisor/AdvisorProjectNav";
import AdvisorProjectDashboardClient from "@/app/components/advisor/AdvisorProjectDashboardClient";

export const metadata = {
  title: "Project Workspace | Van Esch Advisory",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default async function AdvisorProjectWorkspacePage({
  params,
}: PageProps) {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const { projectId } = await params;

  if (!isUuid(projectId)) {
    notFound();
  }

  let project: {
    project_name: string | null;
    company_name: string | null;
  } | null = null;

  if (isD1ClientDiagnosticEnabled()) {
    project = await getD1Database()
      .prepare(
        `SELECT project_name, company_name
        FROM client_projects
        WHERE project_id = ?
        LIMIT 1`,
      )
      .bind(projectId)
      .first();
  } else {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("client_projects")
      .select("project_name, company_name")
      .eq("project_id", projectId)
      .maybeSingle();

    project = data;
  }

  const projectLabel =
    project?.project_name?.trim() ||
    project?.company_name?.trim() ||
    "Diagnostic project";
  const crmSearchTerm = project?.company_name?.trim() || projectLabel;

  return (
    <>
      <AdvisorProjectNav
        projectId={projectId}
        projectLabel={projectLabel}
        crmSearchTerm={crmSearchTerm}
      />
      <AdvisorProjectDashboardClient projectId={projectId} />
    </>
  );
}
