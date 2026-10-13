"use client";
import { useEffect, useState } from "react";
import { ROSTER_FIELDS, FIELD_LABELS } from "@/lib/baseline/roster-fields";
import { WORK_TYPES, toCsv } from "@/lib/baseline/model";
import type {
  CompletionDashboard,
  LaunchReadiness,
} from "@/lib/baseline/admin-types";
import Dashboard from "./dashboard";
type Person = {
  participant_id: string;
  email: string;
  active: number;
  invited: number;
  status: string;
  revision: number;
  profile: Record<string, string>;
  roster: Record<string, string>;
};
type Share = {
  share_id: string;
  label: string;
  expires_at: string;
  revoked_at: string | null;
};
async function call<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch("/advisor/baseline/api/" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? "Unable to complete this request.");
  return data;
}
export default function Administration({
  campaign,
  name,
  people,
  refresh,
}: {
  campaign: string;
  name: string;
  people: Person[];
  refresh: () => Promise<void>;
}) {
  const [dashboard, setDashboard] = useState<CompletionDashboard | null>(null),
    [readiness, setReadiness] = useState<LaunchReadiness | null>(null),
    [shares, setShares] = useState<Share[]>([]),
    [person, setPerson] = useState<Person | null>(null),
    [editing, setEditing] = useState(false),
    [fields, setFields] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [label, setLabel] = useState(""),
    [days, setDays] = useState(14),
    [scope, setScope] = useState({
      regions: [] as string[],
      countries: [] as string[],
      entities: [] as string[],
    }),
    [shareLink, setShareLink] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [selected, setSelected] = useState<string[]>([]);
  async function load() {
    const query = "?campaign=" + encodeURIComponent(campaign);
    const [d, r, s] = await Promise.all([
      call<CompletionDashboard>("dashboard" + query),
      call<LaunchReadiness>("readiness" + query),
      call<{ shares: Share[] }>("shares" + query),
    ]);
    setDashboard(d);
    setReadiness(r);
    setShares(s.shares);
  }
  useEffect(() => {
    setShareLink("");
    setEditing(false);
    setSelected([]);
  }, [campaign]);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [campaign, people]); // eslint-disable-line react-hooks/exhaustive-deps
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to complete this request.",
      );
    } finally {
      setBusy(false);
    }
  }
  function edit(p: Person | null) {
    setPerson(p);
    setFields(
      Object.fromEntries(
        ROSTER_FIELDS.map((k) => [k, p?.profile[k] ?? p?.roster[k] ?? ""]),
      ),
    );
    setEditing(true);
  }
  async function change(p: Person, action: string) {
    await call("participant", {
      campaign,
      participantId: p.participant_id,
      revision: p.revision,
      action,
    });
    setMessage(
      action === "remove"
        ? "Respondent removed. Access withdrawn; answers retained."
        : "Respondent reinstated. Generate a fresh invitation.",
    );
  }
  return (
    <>
      <section className="tb-card" style={{ marginTop: 20 }}>
        <h2>Launch readiness</h2>
        {error && (
          <p className="tb-error" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {readiness && (
          <>
            <p>
              {readiness.active} active respondents · {readiness.toInvite} not
              yet invited · Questionnaire {readiness.questionnaireVersion}
            </p>
            {readiness.blockers.length > 0 && (
              <div className="tb-error">
                <strong>Launch is blocked</strong>
                <ul>
                  {readiness.blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
            {readiness.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
            <label className="tb-field">
              <span>Confirm campaign name to launch</span>
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            <button
              className="tb-primary"
              disabled={busy || !readiness.ready || confirmation !== name}
              onClick={() =>
                void run(async () => {
                  await call("launch", {
                    campaign,
                    confirmation,
                    expectedActive: readiness.active,
                  });
                  setMessage(
                    "Campaign launched. Review the roster and send invitations in batches.",
                  );
                })
              }
            >
              Launch campaign
            </button>
            <p>
              Launch opens collection. Emails are sent separately to the
              selected roster batch. QA sending remains disabled.
            </p>
          </>
        )}
      </section>
      <section className="tb-card" style={{ marginTop: 20 }}>
        <h2>Manage respondents</h2>
        <button disabled={busy} onClick={() => edit(null)}>
          Add respondent
        </button>
        <p>
          Changes affect roster metadata. Submitted answers are retained.
          Removing a respondent withdraws access. Changing their email
          invalidates their old invitation and session.
        </p>
        <div className="tb-roster">
          {people.map((p) => (
            <article className="tb-detail" key={p.participant_id}>
              <h3>{p.profile.name}</h3>
              <p>
                {p.email} · {p.status.replaceAll("_", " ")} ·{" "}
                {p.active ? "Active" : "Removed"}
              </p>
              <p>
                {p.profile.job_title} · {p.roster.team || p.profile.entity} ·{" "}
                {p.roster.contracted_hours
                  ? `${p.roster.contracted_hours} hours/week`
                  : p.roster.working_fraction
                    ? `Working fraction ${p.roster.working_fraction}`
                    : "Capacity not recorded"}
              </p>
              <label>
                <input
                  type="checkbox"
                  aria-label={"Select respondent: " + p.email}
                  disabled={!p.active || p.status === "completed" || busy}
                  checked={selected.includes(p.participant_id)}
                  onChange={() =>
                    setSelected(
                      selected.includes(p.participant_id)
                        ? selected.filter((id) => id !== p.participant_id)
                        : [...selected, p.participant_id],
                    )
                  }
                />{" "}
                Select for invitation / reminder
              </label>
              <div>
                <button disabled={busy} onClick={() => edit(p)}>
                  Edit respondent
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        p.active
                          ? "Remove this respondent? Their answers will be retained and access withdrawn."
                          : "Reinstate this respondent? A fresh invitation will be needed.",
                      )
                    )
                      void run(() =>
                        change(p, p.active ? "remove" : "reinstate"),
                      );
                  }}
                >
                  {p.active ? "Remove respondent" : "Reinstate respondent"}
                </button>
              </div>
            </article>
          ))}
        </div>
        <button
          disabled={
            busy ||
            !readiness?.ready ||
            !selected.length ||
            selected.length > 20
          }
          onClick={() => {
            if (
              window.confirm(
                `Send invitations or reminders to ${selected.length} selected respondents? Existing links will be replaced.`,
              )
            )
              void run(async () => {
                const r = await call<{ sent: string[]; failed: string[] }>(
                  "invite-batch",
                  { campaign, participantIds: selected },
                );
                setSelected(r.failed);
                setMessage(
                  `${r.sent.length} emails sent. ${r.failed.length} failed; only failed rows remain selected.`,
                );
              });
          }}
        >
          Send selected invitations / reminders ({selected.length}/20)
        </button>
        {editing && (
          <form
            className="tb-process"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const csv = toCsv([
                  Object.fromEntries(
                    ROSTER_FIELDS.map((k) => [k, fields[k] ?? ""]),
                  ),
                ]);
                if (person)
                  await call("participant", {
                    campaign,
                    participantId: person.participant_id,
                    revision: person.revision,
                    action: "edit",
                    csv,
                  });
                else await call("import", { campaign, csv });
                setEditing(false);
                setMessage(
                  person
                    ? "Respondent details saved. If the email changed, issue a fresh invitation."
                    : "Respondent added. No invitation sent.",
                );
              });
            }}
          >
            <h3>{person ? "Edit respondent" : "Add respondent"}</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
                gap: 12,
              }}
            >
              {ROSTER_FIELDS.map((k) => (
                <label key={k} className="tb-field">
                  <span>
                    {FIELD_LABELS[k]}
                    {["name", "email"].includes(k) ? " *" : ""}
                  </span>
                  {["work_type", "manages_people"].includes(k) ? (
                    <select
                      value={fields[k] ?? ""}
                      onChange={(e) =>
                        setFields({ ...fields, [k]: e.target.value })
                      }
                    >
                      <option value="">Not recorded</option>
                      {(k === "work_type"
                        ? WORK_TYPES
                        : [
                            ["yes", "Yes"],
                            ["no", "No"],
                            ["not_sure", "Not sure"],
                          ]
                      ).map(([c, l]) => (
                        <option key={c} value={c}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required={["name", "email"].includes(k)}
                      type={k.includes("email") ? "email" : "text"}
                      maxLength={250}
                      value={fields[k] ?? ""}
                      onChange={(e) =>
                        setFields({ ...fields, [k]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
            <p>
              Hours use the same weekly basis. Working fraction is 0–1, for
              example 0.8. Record formal direct reports only. Do not upload
              salary, performance ratings or sensitive personal data.
            </p>
            <button disabled={busy} className="tb-primary" type="submit">
              Save respondent
            </button>
            <button type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </form>
        )}
      </section>
      {dashboard && (
        <div style={{ marginTop: 20 }}>
          <Dashboard data={dashboard} />
        </div>
      )}
      <section className="tb-card" style={{ marginTop: 20 }}>
        <h2>Share a read-only dashboard</h2>
        <p>
          Create separate private links for Gaia or regional leaders. Links
          contain completion counts only. No names, individual answers or
          exports. Groups with fewer than five invitations are hidden. Anyone
          holding a link can see its dashboard until expiry or revocation; share
          privately.
        </p>
        <label className="tb-field">
          <span>Viewer / audience label</span>
          <input
            maxLength={150}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <label className="tb-field">
          <span>Link expiry in days (1–30)</span>
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </label>
        {(
          [
            ["regions", "region", "Regions"],
            ["countries", "country", "Countries"],
            ["entities", "entity", "Employing entities"],
          ] as const
        ).map(([key, field, title]) => (
          <label className="tb-field" key={key}>
            <span>{title} (leave unselected for all)</span>
            <select
              multiple
              value={scope[key]}
              onChange={(e) =>
                setScope({
                  ...scope,
                  [key]: Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  ),
                })
              }
            >
              {[...new Set(people.map((p) => p.profile[field]).filter(Boolean))]
                .sort()
                .map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
            </select>
          </label>
        ))}
        <button
          disabled={busy || !label.trim()}
          onClick={() =>
            void run(async () => {
              const r = await call<{ link: string }>("share", {
                campaign,
                label,
                days,
                scope,
              });
              setShareLink(r.link);
              setMessage("Private dashboard link created. No email sent.");
            })
          }
        >
          Create dashboard link
        </button>
        {shareLink && (
          <div className="tb-detail">
            <input
              aria-label="Private dashboard link"
              readOnly
              value={shareLink}
            />
            <button
              onClick={() =>
                void navigator.clipboard
                  .writeText(shareLink)
                  .then(() => setMessage("Dashboard link copied."))
              }
            >
              Copy dashboard link
            </button>
            <button onClick={() => setShareLink("")}>Hide link</button>
          </div>
        )}
        {shares.map((s) => (
          <article className="tb-detail" key={s.share_id}>
            <strong>{s.label}</strong>
            <p>
              {s.revoked_at
                ? "Revoked"
                : "Expires " + new Date(s.expires_at).toLocaleString("en-GB")}
            </p>
            <button
              disabled={busy || Boolean(s.revoked_at)}
              onClick={() =>
                void run(async () => {
                  await call("share-revoke", { campaign, shareId: s.share_id });
                  setMessage("Dashboard link revoked.");
                })
              }
            >
              Revoke dashboard link
            </button>
          </article>
        ))}
      </section>
    </>
  );
}
