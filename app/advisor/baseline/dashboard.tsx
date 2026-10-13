"use client";
import { useState } from "react";
import type { CompletionDashboard } from "@/lib/baseline/admin-types";
import { WORK_TYPES, countryLabel } from "@/lib/baseline/model";
export default function Dashboard({ data: d }: { data: CompletionDashboard }) {
  const [search, setSearch] = useState("");
  const labels: Record<string, string> = {
    region: "Region",
    country: "Country",
    work_type: "Current work type",
    entity: "Employing entity",
    division: "Division / business",
    team: "Team",
  };
  const cards = [
    ["Active roster", d.counts.roster],
    ["Invited", d.counts.invited],
    ["Not invited", d.counts.notInvited],
    ["Not started", d.counts.notStarted],
    ["In progress", d.counts.inProgress],
    ["Completed", d.counts.completed],
  ];
  return (
    <section className="tb-card">
      <h2>Completion dashboard</h2>
      <p>
        {d.campaign.name} · {d.campaign.status} · Closes{" "}
        {new Date(d.campaign.closesAt).toLocaleDateString("en-GB")}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 12,
        }}
      >
        {cards.map(([label, value]) => (
          <div className="tb-detail" key={label}>
            <strong style={{ fontSize: 28, display: "block" }}>{value}</strong>
            {label}
          </div>
        ))}
      </div>
      <p>
        {d.completionPercent}% of invited respondents have completed.{" "}
        {d.counts.removed} removed records are excluded.
      </p>
      <progress
        aria-label="Overall completion"
        max={100}
        value={d.completionPercent}
        style={{ width: "100%" }}
      />
      <h3>Respondents</h3>
      <label className="tb-field">
        <span>Search respondents</span>
        <input
          type="search"
          aria-label="Search respondents"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email, role, region, entity or team"
        />
      </label>
      <div className="tb-roster">
        {(d.participants ?? [])
          .filter((p) =>
            [
              p.name,
              p.email,
              p.jobTitle,
              p.region,
              p.country,
              p.entity,
              p.team,
              p.regionalLeaderName,
            ]
              .join(" ")
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map((p) => (
            <article className="tb-detail" key={p.participantId}>
              <h4>{p.name}</h4>
              <p>
                {p.email} · {p.jobTitle}
              </p>
              <p>
                {p.region} · {p.country} · {p.entity} · {p.team}
              </p>
              <p>
                Regional leader:{" "}
                {p.regionalLeaderName ||
                  p.regionalLeaderEmail ||
                  "Not recorded"}
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
                  Completed{" "}
                  {new Date(p.submittedAt).toLocaleDateString("en-GB")}
                </p>
              )}
            </article>
          ))}
      </div>
      {Object.entries(d.groups).map(([key, groups]) => (
        <details key={key} open>
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
                  {g.completed} completed / {g.invited} invited · {g.inProgress}{" "}
                  in progress
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
      <small>Updated {new Date(d.generatedAt).toLocaleString("en-GB")}</small>
    </section>
  );
}
