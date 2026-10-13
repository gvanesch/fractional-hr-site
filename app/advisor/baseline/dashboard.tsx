import type { CompletionDashboard } from "@/lib/baseline/admin-types";
import { WORK_TYPES, countryLabel } from "@/lib/baseline/model";
export default function Dashboard({ data: d }: { data: CompletionDashboard }) {
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
      {d.smallGroupsHidden && (
        <p>
          Groups with fewer than five invited respondents are hidden. Individual
          answers are not available here.
        </p>
      )}
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
