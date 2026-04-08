import { redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const runtime = "edge";

export default async function AdvisorHomePage() {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Advisor dashboard
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Manage diagnostic projects, track participant completion, and
              move from diagnostic insight to structured advisory engagement.
            </p>
          </div>
        </div>
      </section>

      <div className="brand-container py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/advisor/create-project"
            className="brand-surface-card p-6 transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Create project
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Set up a new diagnostic and invite participants.
            </p>
          </a>

          <a
            href="/advisor/projects"
            className="brand-surface-card p-6 transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              View projects
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Monitor completion and access project dashboards.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}