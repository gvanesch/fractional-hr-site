"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import RosterGuide from "./roster-guide";
import "@/app/baseline/start/style.css";
import "./admin.css";
type Project = {
  campaign_id: string;
  name: string;
  status: string;
  closes_at: string;
  participants: number;
  version: string;
};
export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void fetch("/advisor/baseline/api/campaigns", { cache: "no-store" })
      .then(async (r) => {
        const data = (await r.json()) as {
          campaigns: Project[];
          error?: string;
        };
        if (!r.ok) throw new Error(data.error ?? "Unable to load projects.");
        if (active) setProjects(data.campaigns);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const filtered = projects.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      p.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <main className="tb-advisor brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <p className="brand-kicker">Advisor workspace</p>
          <h1 className="brand-heading-lg">Baseline projects</h1>
          <p className="brand-subheading">
            Find a project. Review progress and manage respondents in its
            workspace.
          </p>
          <div className="tb-hero-actions">
            <a
              className="brand-button-outline"
              href="/advisor/baseline/api/roster-template"
              download="baseline-roster-template.csv"
            >
              Download CSV template
            </a>
            <Link className="brand-button-dark" href="/advisor/baseline/create">
              Create baseline project
            </Link>
          </div>
        </div>
      </section>
      <div className="brand-container tb-shell tb-workspace-body">
        <RosterGuide />
        <section className="tb-card">
          <p className="brand-section-kicker">Project directory</p>
          <h2>Your projects</h2>
          <div className="tb-register-filters">
            <label className="tb-field">
              <span>Search projects</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Project name"
              />
            </label>
            <label className="tb-field">
              <span>Project status</span>
              <select
                aria-label="Project status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All projects</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>
          {error && (
            <p className="tb-error" role="alert">
              {error}
            </p>
          )}
          {loading && <p role="status">Loading projects…</p>}
          {!loading && !error && (
            <>
              <p>
                {filtered.length} project{filtered.length === 1 ? "" : "s"}
              </p>
              <div className="tb-management-grid">
                {filtered.map((p) => (
                  <article className="tb-management-card" key={p.campaign_id}>
                    <div className="tb-register-identity">
                      <h3>{p.name}</h3>
                      <span className="tb-status" data-status={p.status}>
                        {p.status}
                      </span>
                    </div>
                    <p>
                      {p.participants} respondents · Closes{" "}
                      {new Date(p.closes_at).toLocaleString("en-GB", {
                        timeZone: "UTC",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      UTC
                    </p>
                    <Link
                      className="brand-button-primary"
                      href={"/advisor/baseline/project/" + p.campaign_id}
                    >
                      Open project
                    </Link>
                  </article>
                ))}
              </div>
              {filtered.length === 0 && (
                <p>No projects match your search and status filter.</p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
