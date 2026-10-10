"use client";
import { useEffect, useState } from "react";
import {
  PRIVACY,
  WORK_TYPES,
  countryLabel,
  VERSION,
  type Draft,
  type EntityOption,
} from "@/lib/baseline/model";
import "@/app/baseline/start/style.css";
type Campaign = {
  campaign_id: string;
  name: string;
  status: string;
  closes_at: string;
  privacy_notice: string;
  retention_days: number;
  version: string;
  participants: number;
  entities: EntityOption[];
};
type Person = {
  participant_id: string;
  email: string;
  active: number;
  invited: number;
  status: string;
  progress: number;
  updated_at: string;
  draft: Draft;
};
type Result = {
  campaigns: Campaign[];
  campaign: Campaign;
  participants: Person[];
  campaignId: string;
  imported: number;
  link: string;
  error?: string;
};
async function api(path: string, body?: unknown): Promise<Result> {
  const response = await fetch("/advisor/baseline/api/" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await response.json()) as Result;
  if (!response.ok)
    throw new Error(data.error ?? "Unable to complete this request.");
  return data;
}
function breakdown(rows: Person[], key: "country" | "region" | "work_type") {
  const groups = new Map<string, { invited: number; completed: number }>();
  for (const p of rows) {
    const code = p.draft.profile[key] || "Not recorded";
    const g = groups.get(code) ?? { invited: 0, completed: 0 };
    g.invited++;
    if (p.status === "completed") g.completed++;
    groups.set(code, g);
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, g]) => ({
      label:
        key === "country" && code !== "Not recorded"
          ? countryLabel(code)
          : key === "work_type"
            ? (WORK_TYPES.find(([c]) => c === code)?.[1] ?? code)
            : code,
      ...g,
    }));
}
export default function AdminPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]),
    [id, setId] = useState(""),
    [current, setCurrent] = useState<Campaign | null>(null),
    [people, setPeople] = useState<Person[]>([]),
    [name, setName] = useState("team.blue People Operations Baseline — QA"),
    [date, setDate] = useState(""),
    [notice, setNotice] = useState(PRIVACY),
    [retention, setRetention] = useState(90),
    [entityList, setEntityList] = useState(""),
    [csv, setCsv] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [link, setLink] = useState(""),
    [view, setView] = useState<Person | null>(null),
    [filter, setFilter] = useState("");
  async function refresh(campaign = id) {
    const list = await api("campaigns");
    setCampaigns(list.campaigns);
    if (campaign) {
      const data = await api(
        "campaign?campaign=" + encodeURIComponent(campaign),
      );
      setCurrent(data.campaign);
      setPeople(data.participants);
      setDate(data.campaign.closes_at.slice(0, 10));
      setNotice(data.campaign.privacy_notice);
      setRetention(data.campaign.retention_days);
      setEntityList(
        (data.campaign.entities ?? []).map((e) => e.label).join("\n"),
      );
    }
  }
  useEffect(() => {
    void refresh("").catch((e) => setError(e.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to complete this request.",
      );
    } finally {
      setBusy(false);
    }
  }
  const invited = people.filter((p) => p.invited === 1),
    total = (status: string) =>
      invited.filter((p) => p.status === status).length;
  const template = () => {
    const blob = new Blob(
      [
        "name,email,job_title,country,region,entity,work_type,manages_people,direct_reports\nQA Respondent,respondent@example.invalid,Current title,GB,Test region,Test business,people_operations,no,0\n",
      ],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "baseline-roster-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="tb-shell" style={{ maxWidth: 1100 }}>
      <header className="tb-header">
        <span>team.blue · Baseline administration</span>
        <p>
          QA only: synthetic roster data. No production collection is
          authorised.
        </p>
      </header>
      {error && (
        <div role="alert" className="tb-error">
          {error}
        </div>
      )}
      {message && <p role="status">{message}</p>}
      <section className="tb-card">
        <h1>Campaigns</h1>
        <label className="tb-field">
          <span>Choose a campaign</span>
          <select
            value={id}
            onChange={(e) => {
              const value = e.target.value;
              setId(value);
              setLink("");
              setView(null);
              setCurrent(null);
              setPeople([]);
              if (value) void action(() => refresh(value));
              else {
                setNotice(PRIVACY);
                setEntityList("");
              }
            }}
          >
            <option value="">Create a campaign</option>
            {campaigns.map((c) => (
              <option key={c.campaign_id} value={c.campaign_id}>
                {c.name} · {c.status}
              </option>
            ))}
          </select>
        </label>
        <fieldset disabled={busy}>
          {!id && (
            <label className="tb-field">
              <span>Campaign name</span>
              <input
                value={name}
                maxLength={150}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <p>
            Questionnaire: {current?.version ?? VERSION}. The version is fixed
            for this campaign.
          </p>
          <label className="tb-field">
            <span>Closing date (end of day, UTC)</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="tb-field">
            <span>Planned retention in days</span>
            <input
              type="number"
              min={30}
              max={730}
              value={retention}
              onChange={(e) => setRetention(Number(e.target.value))}
            />
            <small>
              QA placeholder. Confirm controller, access, lawful use and
              retention before real employee collection. No automatic deletion
              runs.
            </small>
          </label>
          <label className="tb-field">
            <span>Data-use statement shown before starting</span>
            <textarea
              rows={6}
              value={notice}
              maxLength={4000}
              onChange={(e) => setNotice(e.target.value)}
            />
          </label>
          <label className="tb-field">
            <span>Approved brands / legal entities (one per line)</span>
            <textarea
              rows={5}
              value={entityList}
              maxLength={60000}
              onChange={(e) => setEntityList(e.target.value)}
            />
            <small>
              Use the supplied team.blue list. Choices are fixed once
              invitations are created. Leave blank for the initial QA test.
            </small>
          </label>
          {current && current.version !== VERSION && (
            <>
              <p>
                This campaign uses the earlier questionnaire. Its responses and
                exports are retained. Create a revised campaign for the updated
                questionnaire.
              </p>
              <button
                onClick={() =>
                  void action(async () => {
                    const result = await api("create", {
                      name: (current.name + " — revised").slice(0, 150),
                      closesAt: date + "T23:59:59.000Z",
                      privacy: PRIVACY,
                      retentionDays: retention,
                      entityList,
                      copyRosterFrom: id,
                    });
                    setId(result.campaignId);
                    setLink("");
                    setView(null);
                    await refresh(result.campaignId);
                    setMessage(
                      "Revised draft created. Roster copied; earlier responses retained. Open this campaign and create a new private test link.",
                    );
                  })
                }
              >
                Create revised campaign (copy roster)
              </button>
            </>
          )}
          {!id ? (
            <button
              className="tb-primary"
              onClick={() =>
                void action(async () => {
                  const result = await api("create", {
                    name,
                    closesAt: date + "T23:59:59.000Z",
                    privacy: notice,
                    retentionDays: retention,
                    entityList,
                  });
                  setId(result.campaignId);
                  await refresh(result.campaignId);
                  setMessage(
                    "Campaign created in draft. Import a synthetic roster, then open it.",
                  );
                })
              }
            >
              Create draft campaign
            </button>
          ) : (
            <>
              <button
                onClick={() =>
                  void action(async () => {
                    await api("configure", {
                      campaign: id,
                      privacy: notice,
                      closesAt: date + "T23:59:59.000Z",
                      retentionDays: retention,
                      entityList,
                    });
                    await refresh();
                    setMessage("Campaign settings saved.");
                  })
                }
              >
                Save settings
              </button>
              <button
                disabled={current?.version !== VERSION}
                className="tb-primary"
                onClick={() =>
                  void action(async () => {
                    await api("configure", { campaign: id, status: "open" });
                    await refresh();
                    setMessage("Campaign opened.");
                  })
                }
              >
                Open campaign
              </button>
              <button
                onClick={() =>
                  void action(async () => {
                    await api("configure", { campaign: id, status: "closed" });
                    await refresh();
                    setMessage(
                      "Campaign closed. Saved responses are retained.",
                    );
                  })
                }
              >
                Close campaign
              </button>
            </>
          )}
        </fieldset>
      </section>
      {id && current && (
        <>
          <section className="tb-card" style={{ marginTop: 20 }}>
            <h2>Roster and invitations</h2>
            <p>
              Import a CSV with name and email. Optional columns: job_title,
              country, region, entity, work_type, manages_people,
              direct_reports. Management refers to formal direct reports; use
              yes, no or not_sure. These roster fields are not shown or asked in
              the questionnaire. Use supplied country codes. Work type codes:{" "}
              {WORK_TYPES.map(([code]) => code).join(", ")}.
            </p>
            <button onClick={template}>Download CSV template</button>
            <label className="tb-field">
              <span>Choose a CSV (up to 200 people per file)</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 250000) {
                      setError("Use a CSV under 250 KB.");
                      return;
                    }
                    setCsv(await file.text());
                  }
                }}
              />
            </label>
            <button
              disabled={busy || !csv}
              onClick={() =>
                void action(async () => {
                  const result = await api("import", { campaign: id, csv });
                  setCsv("");
                  await refresh();
                  setMessage(
                    `${result.imported} participants imported. No invitations were sent.`,
                  );
                })
              }
            >
              Validate and import
            </button>
            <p>
              QA email sending is disabled. Generate private test links to
              exercise the journey. A new link revokes the previous link and its
              sessions; saved answers remain.
            </p>
            {link && (
              <div className="tb-detail">
                <p role="status">
                  Private test invitation — do not share it publicly.
                </p>
                <input
                  aria-label="Private test invitation"
                  readOnly
                  value={link}
                />
                <button
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(link)
                      .then(() => setMessage("Private link copied."))
                  }
                >
                  Copy private link
                </button>
                <button onClick={() => setLink("")}>Hide link</button>
              </div>
            )}
            <label className="tb-field">
              <span>Find a participant</span>
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </label>
            <div className="tb-roster">
              {people
                .filter((p) =>
                  (p.email + " " + p.draft.profile.name)
                    .toLowerCase()
                    .includes(filter.toLowerCase()),
                )
                .map((p) => (
                  <article key={p.participant_id} className="tb-detail">
                    <h3>{p.draft.profile.name}</h3>
                    <p>
                      {p.email} · {p.status.replaceAll("_", " ")} · Step{" "}
                      {p.progress} / 8 ·{" "}
                      {p.active ? "Access active" : "Access revoked"}
                    </p>
                    <p>
                      {p.draft.profile.job_title} ·{" "}
                      {p.draft.profile.region || "Region not recorded"} ·{" "}
                      {p.draft.profile.country
                        ? countryLabel(p.draft.profile.country)
                        : "Country not recorded"}
                    </p>
                    <button
                      disabled={busy || !p.active}
                      onClick={() =>
                        void action(async () => {
                          const result = await api("invite", {
                            campaign: id,
                            participantId: p.participant_id,
                            send: false,
                          });
                          setLink(result.link);
                          await refresh();
                          setMessage(
                            "Private test link created. No email was sent.",
                          );
                        })
                      }
                    >
                      {p.invited
                        ? "Generate replacement link"
                        : "Generate test invitation"}
                    </button>
                    <button
                      disabled={busy || !p.active}
                      onClick={() =>
                        void action(async () => {
                          await api("invite", {
                            campaign: id,
                            participantId: p.participant_id,
                            send: true,
                          });
                          await refresh();
                          setMessage("Invitation sent.");
                        })
                      }
                    >
                      Send / resend email
                    </button>
                    <button onClick={() => setView(p)}>View response</button>
                    <button
                      disabled={busy || !p.active}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Revoke this person's access? Their saved response will be retained.",
                          )
                        )
                          void action(async () => {
                            await api("revoke", {
                              campaign: id,
                              participantId: p.participant_id,
                            });
                            await refresh();
                          });
                      }}
                    >
                      Revoke access
                    </button>
                  </article>
                ))}
            </div>
          </section>
          <section className="tb-card" style={{ marginTop: 20 }}>
            <h2>Completion</h2>
            <p>
              {people.length} roster records · {invited.length} invited ·{" "}
              {total("not_started")} not started · {total("in_progress")} in
              progress · {total("completed")} completed
            </p>
            {(["region", "country", "work_type"] as const).map((key) => (
              <details key={key} open>
                <summary>Completion by {key.replaceAll("_", " ")}</summary>
                {breakdown(invited, key).map((g) => (
                  <p key={g.label}>
                    {g.label}: {g.completed} completed / {g.invited} invited
                  </p>
                ))}
              </details>
            ))}
          </section>
          <section className="tb-card" style={{ marginTop: 20 }}>
            <h2>Analysis-ready exports</h2>
            <p>
              Includes response status, questionnaire version and current work
              type. Reception and Facilities are mapped to People Operations,
              without losing their work-type classification. Draft answers are
              clearly marked; do not treat them as completed responses.
            </p>
            {(["respondents", "activities", "json"] as const).map((format) => (
              <a
                style={{
                  display: "inline-block",
                  padding: 12,
                  textDecoration: "underline",
                }}
                key={format}
                href={`/advisor/baseline/api/export?campaign=${encodeURIComponent(id)}&format=${format}`}
              >
                {format === "respondents"
                  ? "Respondent-level CSV"
                  : format === "activities"
                    ? "Work-area-level CSV"
                    : "Complete structured JSON"}
              </a>
            ))}
          </section>
          {view && (
            <section className="tb-card" style={{ marginTop: 20 }}>
              <h2>Response: {view.draft.profile.name}</h2>
              <button onClick={() => setView(null)}>Close response</button>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  fontSize: 13,
                }}
              >
                {JSON.stringify(view.draft, null, 2)}
              </pre>
            </section>
          )}
        </>
      )}
    </main>
  );
}
