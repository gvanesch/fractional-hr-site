import AdvisorProjectDashboardClient from "@/app/components/advisor/AdvisorProjectDashboardClient";
export const runtime = "edge";

export const metadata = {
  title: "Diagnostic Project Dashboard | Van Esch Advisory",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}

export default async function AdvisorProjectDashboardPage({
  params,
}: PageProps) {
  const { projectId } = await params;

  if (!isUuid(projectId)) {
    return (
      <main className="brand-light-section min-h-screen">
        <section className="brand-hero">
          <div className="brand-container brand-section brand-hero-content">
            <div className="max-w-3xl">
              <p className="brand-kicker">Advisor workspace</p>

              <h1 className="brand-heading-lg mt-5 text-white">
                Invalid project ID
              </h1>

              <p className="brand-subheading brand-body-on-dark mt-6">
                The project dashboard link is missing a valid project ID.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Diagnostic project dashboard
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Review project status, monitor participant completion, identify
              outstanding respondents, and move into reporting and advisory.
            </p>

            {/* ✅ ADD THIS BLOCK */}
            <div className="mt-6 flex gap-3">
              <a
                href={`/advisor/report/${projectId}`}
                className="brand-button-primary"
              >
                View report
              </a>

              <a
                href="/advisor/projects"
                className="brand-button-dark"
              >
                Back to projects
              </a>
            </div>
          </div>
        </div>
      </section>

      <AdvisorProjectDashboardClient projectId={projectId} />
    </main>
  );
}