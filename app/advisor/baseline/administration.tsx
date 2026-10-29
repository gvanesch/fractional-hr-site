"use client";
import { PROXY_FIELDS } from "@/lib/baseline/proxy";
import { useEffect, useRef, useState } from "react";
import {
  ROSTER_FIELDS,
  FIELD_LABELS,
  validateRosterExtras,
} from "@/lib/baseline/roster-fields";
import { WORK_TYPES, toCsv } from "@/lib/baseline/model";
import type { LaunchReadiness } from "@/lib/baseline/admin-types";
type Person = {
  participant_id: string;
  email: string;
  active: number;
  invited: number;
  status: string;
  revision: number;
  progress: number;
  updated_at: string;
  invite_expires_at: string | null;
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
  proxyEnabled = process.env.NEXT_PUBLIC_APP_ENV === "qa",
  name,
  people,
  refresh,
  section,
  editParticipantId,
  onEditOpened,
}: {
  section: string;
  editParticipantId: string | null;
  onEditOpened: () => void;
  campaign: string;
  proxyEnabled?: boolean;
  name: string;
  people: Person[];
  refresh: () => Promise<void>;
}) {
  const [readiness, setReadiness] = useState<LaunchReadiness | null>(null),
    [shares, setShares] = useState<Share[]>([]),
    [person, setPerson] = useState<Person | null>(null),
    [editing, setEditing] = useState(false),
    [fields, setFields] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [errorAttempt, setErrorAttempt] = useState(0),
    [message, setMessage] = useState(""),
    [label, setLabel] = useState(""),
    [days, setDays] = useState(14),
    [search, setSearch] = useState(""),
    [statusFilter, setStatusFilter] = useState("all"),
    [leaderFilter, setLeaderFilter] = useState(""),
    [shareRole, setShareRole] = useState("regional_lead"),
    [regionalLeaderEmail, setRegionalLeaderEmail] = useState(""),
    [extensionDays, setExtensionDays] = useState<Record<string, number>>({}),
    [shareLink, setShareLink] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [selected, setSelected] = useState<string[]>([]);
  const editor = useRef<HTMLDialogElement>(null);
  const editorError = useRef<HTMLParagraphElement>(null);
  const hoursMismatch = Boolean(
    fields.contracted_hours &&
    fields.full_time_hours &&
    fields.working_fraction &&
    Number(fields.full_time_hours) > 0 &&
    Math.abs(
      Number(fields.contracted_hours) / Number(fields.full_time_hours) -
        Number(fields.working_fraction),
    ) > 0.02,
  );
  useEffect(() => {
    if (editing && error) {
      editorError.current?.focus();
      editorError.current?.scrollIntoView({ block: "nearest" });
    }
  }, [editing, error, errorAttempt]);
  useEffect(() => {
    if (editing) {
      editor.current?.showModal();
      editor.current?.querySelector<HTMLInputElement>("input")?.focus();
    } else editor.current?.close();
  }, [editing]);
  useEffect(() => {
    if (!editParticipantId) return;
    const target = people.find((p) => p.participant_id === editParticipantId);
    if (target) {
      edit(target);
      onEditOpened();
    }
  }, [editParticipantId, people]); // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    const query = "?campaign=" + encodeURIComponent(campaign);
    const [r, s] = await Promise.all([
      call<LaunchReadiness>("readiness" + query),
      call<{ shares: Share[] }>("shares" + query),
    ]);
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
      setErrorAttempt((n) => n + 1);
      setError(
        e instanceof Error ? e.message : "Unable to complete this request.",
      );
    } finally {
      setBusy(false);
    }
  }
  function edit(p: Person | null) {
    setError("");
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
      {error && !editing && (
        <p className="tb-error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <div hidden={section !== "settings"}>
        <section className="tb-card" style={{ marginTop: 20 }}>
          <p className="brand-section-kicker">Campaign controls</p>
          <h2>Launch readiness</h2>
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
                selected roster batch.
              </p>
            </>
          )}
        </section>
      </div>
      <div hidden={section !== "respondents"}>
        <section id="respondents" className="tb-card" style={{ marginTop: 20 }}>
          <p className="brand-section-kicker">Participant register</p>
          <h2>Manage respondents</h2>
          <button disabled={busy} onClick={() => edit(null)}>
            Add respondent
          </button>
          <p>
            Changes affect roster metadata. Submitted answers are retained.
            Removing a respondent withdraws access. Changing their email
            invalidates their old invitation and session.
          </p>
          <div className="tb-register-views">
            <button
              aria-pressed={statusFilter === "all"}
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
                setLeaderFilter("");
              }}
            >
              All participants ({people.length})
            </button>
            <button
              aria-pressed={statusFilter === "withdrawn"}
              onClick={() => {
                setStatusFilter("withdrawn");
                setSearch("");
                setLeaderFilter("");
              }}
            >
              Withdrawn participants ({people.filter((p) => !p.active).length})
            </button>
          </div>
          <div className="tb-register-filters">
            <label className="tb-field">
              <span>Search participant list</span>
              <input
                aria-label="Search participant list"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, role, region, entity or team"
              />
            </label>
            <label className="tb-field">
              <span>Participant status</span>
              <select
                aria-label="Participant status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {[
                  ["all", "All"],
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
            <label className="tb-field">
              <span>Filter by regional leader</span>
              <select
                aria-label="Filter by regional leader"
                value={leaderFilter}
                onChange={(e) => setLeaderFilter(e.target.value)}
              >
                <option value="">All regional leaders</option>
                {[
                  ...new Set(
                    people
                      .map((p) => p.roster.regional_leader_email)
                      .filter(Boolean),
                  ),
                ]
                  .sort()
                  .map((email) => (
                    <option key={email} value={email}>
                      {people.find(
                        (p) => p.roster.regional_leader_email === email,
                      )?.roster.regional_leader_name || email}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="tb-management-grid">
            {people
              .filter((p) =>
                [
                  p.profile.name,
                  p.email,
                  p.profile.job_title,
                  p.profile.country,
                  p.profile.region,
                  p.profile.entity,
                  p.roster.team,
                  p.roster.regional_leader_name,
                ]
                  .join(" ")
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .filter(
                (p) =>
                  statusFilter === "all" ||
                  (statusFilter === "withdrawn"
                    ? !p.active
                    : p.active && p.status === statusFilter),
              )
              .filter(
                (p) =>
                  !leaderFilter ||
                  p.roster.regional_leader_email === leaderFilter,
              )
              .map((p) => (
                <article
                  className="tb-detail tb-management-card"
                  key={p.participant_id}
                >
                  <div className="tb-register-identity">
                    <h3>{p.profile.name}</h3>
                    <span
                      className="tb-status"
                      data-status={p.active ? p.status : "withdrawn"}
                    >
                      {p.active ? p.status.replaceAll("_", " ") : "Withdrawn"}
                    </span>
                  </div>
                  <p>
                    {p.roster.response_source === "proxy" && <>Completed on behalf by {p.roster.completer_name} ({p.roster.completer_email}) · </>}{p.email} · {p.status.replaceAll("_", " ")} ·{" "}
                    {p.active ? "Active" : "Removed"}
                  </p>
                  <p>
                    {p.profile.job_title} · {p.roster.team || p.profile.entity}{" "}
                    ·{" "}
                    {p.roster.contracted_hours
                      ? `${p.roster.contracted_hours} hours/week`
                      : p.roster.working_fraction
                        ? `Working fraction ${p.roster.working_fraction}`
                        : "Capacity not recorded"}
                  </p>
                  <p>
                    Regional leader:{" "}
                    {p.roster.regional_leader_name ||
                      p.roster.regional_leader_email ||
                      "Not recorded"}
                  </p>
                  <p>
                    Step {p.progress} · Invitation expires{" "}
                    {p.invite_expires_at
                      ? new Date(p.invite_expires_at).toLocaleDateString(
                          "en-GB",
                        )
                      : "Not issued"}
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
                  <div className="tb-respondent-controls">
                    <button
                      disabled={
                        busy ||
                        !readiness?.ready ||
                        !p.active ||
                        p.status === "completed"
                      }
                      onClick={() =>
                        void run(async () => {
                          await call("invite", {
                            campaign,
                            participantId: p.participant_id,
                            send: true,
                          });
                          setMessage("Invitation sent again.");
                        })
                      }
                    >
                      Resend invitation
                    </button>
                    <label className="tb-field">
                      <span>Extra invitation days</span>
                      <input
                        aria-label={"Extra invitation days: " + p.email}
                        type="number"
                        min={1}
                        max={90}
                        value={extensionDays[p.participant_id] ?? 21}
                        onChange={(e) =>
                          setExtensionDays({
                            ...extensionDays,
                            [p.participant_id]: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <button
                      disabled={
                        busy ||
                        !p.active ||
                        p.status === "completed" ||
                        !p.invite_expires_at
                      }
                      onClick={() =>
                        void run(async () => {
                          await call("extend", {
                            campaign,
                            participantId: p.participant_id,
                            revision: p.revision,
                            days: extensionDays[p.participant_id] ?? 21,
                          });
                          setMessage(
                            "Invitation extended. The same private link continues to work.",
                          );
                        })
                      }
                    >
                      Extend invitation
                    </button>
                    <button disabled={busy} onClick={() => edit(p)}>
                      Edit participant data
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
                      {p.active
                        ? "Withdraw respondent"
                        : "Reinstate participant"}
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
        </section>
      </div>
      <div hidden={section !== "sharing"}>
        <section id="sharing" className="tb-card" style={{ marginTop: 20 }}>
          <p className="brand-section-kicker">Leadership access</p>
          <h2>Share a read-only dashboard</h2>
          <p>
            Create separate private links for Gaia or regional leaders. Links
            show named respondents and completion status. Gaia can see the full
            roster. Regional leaders see only respondents assigned to their work
            email in the CSV. Individual answers and exports remain in the
            authorised admin area. Anyone holding a link can see its dashboard
            until expiry or revocation; share privately.
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
          <label className="tb-field">
            <span>Dashboard visibility</span>
            <select
              aria-label="Dashboard visibility"
              value={shareRole}
              onChange={(e) => setShareRole(e.target.value)}
            >
              <option value="regional_lead">
                Regional leader: assigned team only
              </option>
              <option value="all">Gaia: full campaign visibility</option>
            </select>
          </label>
          {shareRole === "regional_lead" && (
            <label className="tb-field">
              <span>Regional leader from CSV</span>
              <select
                aria-label="Regional leader from CSV"
                value={regionalLeaderEmail}
                onChange={(e) => setRegionalLeaderEmail(e.target.value)}
              >
                <option value="">Choose a regional leader</option>
                {[
                  ...new Set(
                    people
                      .map((p) => p.roster.regional_leader_email)
                      .filter(Boolean),
                  ),
                ]
                  .sort()
                  .map((email) => (
                    <option key={email} value={email}>
                      {people.find(
                        (p) => p.roster.regional_leader_email === email,
                      )?.roster.regional_leader_name || email}{" "}
                      · {email}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <button
            disabled={
              busy ||
              !label.trim() ||
              (shareRole === "regional_lead" && !regionalLeaderEmail)
            }
            onClick={() =>
              void run(async () => {
                const r = await call<{ link: string }>("share", {
                  campaign,
                  label,
                  days,
                  scope: {
                    role: shareRole,
                    regionalLeaderEmail:
                      shareRole === "regional_lead" ? regionalLeaderEmail : "",
                  },
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
                    await call("share-revoke", {
                      campaign,
                      shareId: s.share_id,
                    });
                    setMessage("Dashboard link revoked.");
                  })
                }
              >
                Revoke dashboard link
              </button>
            </article>
          ))}
        </section>
      </div>
      <dialog
        ref={editor}
        className="tb-participant-editor"
        aria-labelledby="participant-editor-title"
        onCancel={() => setEditing(false)}
      >
        {editing && (
          <form
            className="tb-process"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                validateRosterExtras(fields, 1);
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
            {error && (
              <p
                ref={editorError}
                tabIndex={-1}
                className="tb-error"
                role="alert"
                id="participant-editor-error"
              >
                {error}
              </p>
            )}
            <div className="tb-register-identity">
              <h2 id="participant-editor-title">
                {person ? "Edit participant data" : "Add respondent"}
              </h2>
              <button type="button" onClick={() => setEditing(false)}>
                Close editor
              </button>
            </div>
            <p>
              {person
                ? person.profile.name + " · " + person.email
                : "Add a new participant."}{" "}
              All CSV roster fields can be edited here. This does not change
              their assessment answers.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
                gap: 12,
              }}
            >
              {ROSTER_FIELDS.filter(k => proxyEnabled || !PROXY_FIELDS.includes(k)).map((k) => (
                <label key={k} className="tb-field">
                  <span>
                    {proxyEnabled && k === "name" ? "Participant name (whose role is described)" : FIELD_LABELS[k]}
                    {["name", "email"].includes(k) ? " *" : ""}
                  </span>
                  {k === "response_source" ? <select value={fields[k] ?? ""} onChange={e => setFields({...fields,[k]:e.target.value})}><option value="">Self-response</option><option value="proxy">Completed on behalf of someone else</option></select> : ["work_type", "manages_people"].includes(k) ? (
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
                      aria-invalid={
                        error &&
                        hoursMismatch &&
                        [
                          "contracted_hours",
                          "full_time_hours",
                          "working_fraction",
                        ].includes(k)
                          ? true
                          : undefined
                      }
                      aria-describedby={
                        error &&
                        hoursMismatch &&
                        [
                          "contracted_hours",
                          "full_time_hours",
                          "working_fraction",
                        ].includes(k)
                          ? "participant-editor-error"
                          : undefined
                      }
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
              Hours use the same weekly basis. Working fraction is contracted
              hours divided by full-time hours. For example, 20 hours out of a
              40-hour week gives 0.5. Record formal direct reports only. Do not
              upload salary, performance ratings or sensitive personal data.
            </p>
            <button disabled={busy} className="tb-primary" type="submit">
              Save respondent
            </button>
            <button type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </form>
        )}
      </dialog>
    </>
  );
}
