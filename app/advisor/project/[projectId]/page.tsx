import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  const supabase = createSupabaseAdminClient();
  const { data: project } = await supabase
    .from("client_projects")
    .select("project_name, company_name")
    .eq("project_id", projectId)
    .maybeSingle();

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
