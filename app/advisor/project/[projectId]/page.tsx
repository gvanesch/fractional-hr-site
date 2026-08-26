import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
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

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="brand-container flex flex-wrap items-center justify-end gap-2 py-3">
          <Link
            href={`/advisor/report/${projectId}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            View report
          </Link>
          <Link
            href={`/advisor/explore/${projectId}`}
            className="inline-flex items-center justify-center rounded-xl bg-[#1E6FD9] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1859ad]"
          >
            Open Explorer
          </Link>
        </div>
      </div>

      <AdvisorProjectDashboardClient projectId={projectId} />
    </>
  );
}
