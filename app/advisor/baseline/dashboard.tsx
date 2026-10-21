"use client";
import { useState } from "react";
import type { CompletionDashboard } from "@/lib/baseline/admin-types";
import "./admin.css";
import {
  filterDashboard,
  dashboardCounts,
  emptyDashboardFilters,
} from "@/lib/baseline/dashboard-view";
import { WORK_TYPES, countryLabel } from "@/lib/baseline/model";
export default function Dashboard({
  data: d,
  onEditParticipant,
}: {
  data: CompletionDashboard;
  onEditParticipant?: (id: string) => void;
}) {
  const [filters, setFilters] = useState(emptyDashboardFilters);
  const rows = filterDashboard(d.participants ?? [], filters);
  const filtered = Object.entries(filters).some(([k, v]) =>
    k === "status" ? v !== "all" : Boolean(v),
  );
  const counts = filtered
    ? dashboardCounts(rows)
    : { ...d.counts, percent: d.completionPercent };
  const choose = (key: keyof typeof filters, value: string) =>
    setFilters({ ...filters, [key]: value });
  const labels: Record<string, string> = {
    region: "Region",
    country: "Country",
    work_type: "Current work type",
    entity: "Employing entity",
    division: "Division / business",
    team: "Team",
  };
  const cards = [
    ["Active roster", counts.roster],
    ["Invited", counts.invited],
    ["Not invited", counts.notInvited],
    ["Not started", counts.notStarted],
    ["In progress", counts.inProgress],
    ["Completed", counts.completed],
  ];
  return (
    <section id="overview" className="tb-card tb-dashboard">
      <p className="brand-section-kicker">Campaign overview</p>
      <h2>Completion dashboard</h2>
      <p>
        {d.campaign.name} · {d.campaign.status} · Closes{" "}
        {new Date(d.campaign.closesAt).toLocaleString("en-GB", {
          timeZone: "UTC",
          dateStyle: "medium",
          timeStyle: "short",
        })}{" "}
        UTC
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 12,
        }}
      >
        {cards.map(([label, value]) => (
          <button
            type="button"
            className="tb-detail tb-metric"
            key={label}
            onClick={() =>
              choose(
                "status",
                (
                  {
                    "Active roster": "all",
                    Invited: "invited",
                    "Not invited": "not_invited",
                    "Not started": "not_started",
                    "In progress": "in_progress",
                    Completed: "completed",
                  } as Record<string, string>
                )[String(label)],
              )
            }
          >
            <strong style={{ fontSize: 28, display: "block" }}>{value}</strong>
            {label}
          </button>
        ))}
      </div>
      <p>
        {counts.percent}% of invited respondents have completed.{" "}
        {counts.removed} removed records are excluded.
      </p>
      <progress
        aria-label="Overall completion"
        max={100}
        value={counts.percent}
        style={{ width: "100%" }}
      />
      <h3>Respondents</h3>
      <p>
        {filtered ? "Filtered view" : "Full permitted roster"}: {rows.length}{" "}
        respondents. Select a completion widget to filter by status.
      </p>
      <div className="tb-dashboard-filters">
        <label className="tb-field">
          <span>Search respondents</span>
          <input
            type="search"
            aria-label="Search respondents"
            value={filters.search}
            onChange={(e) => choose("search", e.target.value)}
            placeholder="Name, email, role, region, entity or team"
          />
        </label>
        <label className="tb-field">
          <span>Completion status</span>
          <select
            aria-label="Completion status"
            value={filters.status}
            onChange={(e) => choose("status", e.target.value)}
          >
            {[
              ["all", "All statuses"],
              ["invited", "Invited"],
              ["not_invited", "Not invited"],
              ["not_started", "Not started"],
              ["in_progress", "In progress"],
              ["completed", "Completed"],
              ["withdrawn", "Withdrawn"],
            ].map(([c, l]) => (
              <option key={c} value={c}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ["region", "Region"],
            ["country", "Country"],
            ["entity", "Employing entity"],
            ["team", "Team"],
            ["leader", "Regional leader"],
          ] as const
        ).map(([key, label]) => {
          const field = key === "leader" ? "regionalLeaderEmail" : key;
          const options = [
            ...new Set(
              (d.participants ?? []).map((p) => p[field]).filter(Boolean),
            ),
          ].sort();
          return (
            <label className="tb-field" key={key}>
              <span>{label}</span>
              <select
                aria-label={"Dashboard " + label}
                value={filters[key]}
                onChange={(e) => choose(key, e.target.value)}
              >
                <option value="">All {label.toLowerCase()}s</option>
                {options.map((v) => (
                  <option key={v} value={v}>
                    {key === "country"
                      ? countryLabel(v)
                      : key === "leader"
                        ? d.participants.find(
                            (p) => p.regionalLeaderEmail === v,
                          )?.regionalLeaderName || v
                        : v}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
      <button
        onClick={() => setFilters(emptyDashboardFilters())}
        disabled={!filtered}
      >
        Clear dashboard filters
      </button>
      {rows.length === 0 && <p>No respondents match these filters.</p>}
      <div className="tb-respondent-grid">
        {rows.map((p) => (
          <article
            className="tb-detail tb-respondent-card"
            key={p.participantId}
          >
            <div className="tb-register-identity">
              <h4>{p.name}</h4>
              <span
                className="tb-status"
                data-status={p.active ? p.status : "withdrawn"}
              >
                {p.active ? p.status.replaceAll("_", " ") : "Withdrawn"}
              </span>
            </div>
            <p>
              {p.email} · {p.jobTitle}
            </p>
            <p>
              {p.region} · {p.country} · {p.entity} · {p.team}
            </p>
            <p>
              Regional leader:{" "}
              {p.regionalLeaderName || p.regionalLeaderEmail || "Not recorded"}
            </p>
            <p>
              {p.active ? p.status.replaceAll("_", " ") : "Withdrawn"} ·{" "}
              {p.invited ? "Invitation issued" : "Not invited"} · Step{" "}
              {p.progress}
            </p>
            {p.inviteExpiresAt && (
              <p>
                Invitation expires{" "}
                {new Date(p.inviteExpiresAt).toLocaleDateString("en-GB")}
              </p>
            )}
            {p.submittedAt && (
              <p>
                Completed {new Date(p.submittedAt).toLocaleDateString("en-GB")}
              </p>
            )}
            {onEditParticipant && (
              <button onClick={() => onEditParticipant(p.participantId)}>
                Edit participant data
              </button>
            )}
          </article>
        ))}
      </div>
      <h3>Completion across the full permitted roster</h3>
      <div className="tb-completion-breakdowns">
        {Object.entries(d.groups).map(([key, groups]) => (
          <details className="tb-breakdown-card" key={key} open>
            <summary>Completion by {labels[key] ?? key}</summary>
            {groups.length ? (
              groups.map((g) => (
                <div className="tb-detail" key={g.label}>
                  <strong>
                    {key === "country"
                      ? countryLabel(g.label)
                      : key === "work_type"
                        ? (WORK_TYPES.find((o) => o[0] === g.label)?.[1] ??
                          g.label)
                        : g.label}
                  </strong>
                  <p>
                    {g.completed} completed / {g.invited} invited ·{" "}
                    {g.inProgress} in progress
                  </p>
                  <progress
                    aria-label={"Completion: " + g.label}
                    max={g.invited}
                    value={g.completed}
                    style={{ width: "100%" }}
                  />
                </div>
              ))
            ) : (
              <p>No reportable groups yet.</p>
            )}
          </details>
        ))}
      </div>
      <small>Updated {new Date(d.generatedAt).toLocaleString("en-GB")}</small>
    </section>
  );
}
