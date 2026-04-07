"use client";

import { useEffect, useState } from "react";

type Project = {
  project_id: string;
  project_name: string;
  company_name: string;
  project_status: string;
  created_at: string;
};

export default function AdvisorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/client-diagnostic-projects");
        const json = await res.json();

        if (json.success) {
          setProjects(json.projects);
        }
      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Projects
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6">
              View and manage all diagnostic projects.
            </p>
          </div>
        </div>
      </section>

      <div className="brand-container py-10">
        {loading ? (
          <p>Loading projects...</p>
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

                <p className="text-sm text-slate-600 mt-1">
                  {project.company_name}
                </p>

                <p className="text-xs text-slate-500 mt-2">
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