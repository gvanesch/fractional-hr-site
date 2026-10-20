"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CURRENT_COLLECTION_VERSION as COLLECTION_VERSION, isCollectionVersion } from "@/lib/baseline/collection";
import Administration from "./administration";
import Dashboard from "./dashboard";
import type { CompletionDashboard } from "@/lib/baseline/admin-types";
import "./admin.css";
import { ROSTER_FIELDS } from "@/lib/baseline/roster-fields";
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
  retention_days: number | null;
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
  profile: Record<string, string>;
  roster: Record<string, string>;
  revision: number;
  invite_expires_at: string | null;
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
async function api<T = Result>(path: string, body?: unknown): Promise<T> {
  const response = await fetch("/advisor/baseline/api/" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(data.error ?? "Unable to complete this request.");
  return data;
}
export default function AdminPanel({
  initialCampaign = "",
  mode = "workspace",
}: { initialCampaign?: string; mode?: "create" | "workspace" } = {}) {
  const router = useRouter();
  const id = initialCampaign;
  const [tab, setTab] = useState("overview"),
    [editParticipantId, setEditParticipantId] = useState<string | null>(null),
    [current, setCurrent] = useState<Campaign | null>(null),
    [dashboard, setDashboard] = useState<CompletionDashboard | null>(null),
    [people, setPeople] = useState<Person[]>([]),
    [name, setName] = useState("team.blue People Operations Baseline — QA"),
    [date, setDate] = useState("2026-10-30"),
    [closingTime, setClosingTime] = useState("18:00"),
    [notice, setNotice] = useState(PRIVACY),
    [entityList, setEntityList] = useState(""),
    [csv, setCsv] = useState(""),
    [preview, setPreview] = useState<{
      count: number;
      duplicates: string[];
      canImport: boolean;
      rows: Record<string, string>[];
    } | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [link, setLink] = useState(""),
    [qaCode, setQaCode] = useState(""),
    [view, setView] = useState<Person | null>(null),
    [filter, setFilter] = useState("");
  async function refresh(campaign = id) {
    if (campaign) {
      const [data, report] = await Promise.all([
        api("campaign?campaign=" + encodeURIComponent(campaign)),
        api<CompletionDashboard>(
          "dashboard?campaign=" + encodeURIComponent(campaign),
        ),
      ]);
      setDashboard(report);
      setCurrent(data.campaign);
      setPeople(data.participants);
      setDate(data.campaign.closes_at.slice(0, 10));
      setClosingTime(new Date(data.campaign.closes_at).toISOString().slice(11, 16));
      setNotice(data.campaign.privacy_notice);
      setEntityList(
        (data.campaign.entities ?? []).map((e) => e.label).join("\n"),
      );
    }
  }
  useEffect(() => {
    void refresh(initialCampaign).catch((e) => setError(e.message));
  }, [initialCampaign]); // eslint-disable-line react-hooks/exhaustive-deps
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
  const template = () => {
    const blob = new Blob([ROSTER_FIELDS.join(",") + "\n"], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "baseline-roster-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="tb-advisor brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <p className="brand-kicker">Advisor workspace</p>
          <div className="tb-workspace-title">
            <h1 className="brand-heading-lg">
              {mode === "create"
                ? "Create baseline project"
                : (current?.name ?? "Baseline project")}
            </h1>
            <span
              className="tb-status"
              data-status={current?.status ?? "draft"}
            >
              {current?.status ?? "QA preview"}
            </span>
          </div>
          <p className="brand-subheading">
            {mode === "create"
              ? "Set up a new assessment project. Add respondents after creating it."
              : "team.blue · People Operations Baseline"}
          </p>
          <div className="tb-hero-actions">
            <Link className="brand-button-dark" href="/advisor/baseline">
              Baseline projects
            </Link>
            <Link
              className="brand-button-dark"
              href="/advisor/baseline/prototype"
            >
              Review the current questionnaire preview
            </Link>
          </div>
        </div>
      </section>
      {mode === "workspace" && (
        <nav
          className="tb-workspace-nav"
          aria-label="Baseline workspace sections"
        >
          <div className="brand-container">
            <span>Project workspace</span>
            <div>
              {[
                ["overview", "Overview"],
                ["respondents", "Respondents"],
                ["settings", "Settings and launch"],
                ["sharing", "Sharing"],
                ["exports", "Exports"],
              ].map(([code, label]) => (
                <button
                  key={code}
                  aria-current={tab === code ? "page" : undefined}
                  onClick={() => setTab(code)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}
      <div className="brand-container tb-shell tb-workspace-body">
        <div className="tb-qa-notice">
          QA workspace · Synthetic roster data. Production collection is not
          authorised.
        </div>
        {error && (
          <div role="alert" className="tb-error">
            {error}
          </div>
        )}
        {message && <p role="status">{message}</p>}
        {mode === "workspace" &&
          tab === "overview" &&
          id &&
          current &&
          dashboard && (
            <Dashboard
              data={dashboard}
              onEditParticipant={(id) => {
                setTab("respondents");
                setEditParticipantId(id);
              }}
            />
          )}
        {mode === "create" || tab === "settings" ? (
          <section
            id="campaign-settings"
            className="tb-card"
            style={{ marginTop: 20 }}
          >
            <p className="brand-section-kicker">Campaign configuration</p>
            <h2>{mode === "create" ? "New project" : "Project settings"}</h2>
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
                Questionnaire: {current?.version ?? COLLECTION_VERSION}. The
                version is fixed for this campaign.
              </p>
              <p><Link href="/advisor/baseline/depth-preview">Preview the detailed questionnaire</Link></p>
              <label className="tb-field">
                <span>Closing date (UTC)</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className="tb-field">
                <span>Closing time (UTC)</span>
                <input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} required />
              </label>
              <p>Collection window: 21–30 October 2026. Keep baseline data without an automatic deletion date. Closing collection does not delete answers.</p>
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
              {current && current.version !== COLLECTION_VERSION && (
                <p>
                  This project uses an earlier questionnaire. Its responses and
                  exports are retained.{" "}
                  <Link href="/advisor/baseline/create">
                    Create a new project
                  </Link>{" "}
                  for the updated questionnaire.
                </p>
              )}
              {!id ? (
                <button
                  className="tb-primary"
                  onClick={() =>
                    void action(async () => {
                      const result = await api("create", {
                        questionnaireVersion: COLLECTION_VERSION,
                        name,
                        closesAt: date + "T" + closingTime + ":00.000Z",
                        privacy: notice,
                        entityList,
                      });
                      router.push(
                        "/advisor/baseline/project/" + result.campaignId,
                      );
                    })
                  }
                >
                  Create project
                </button>
              ) : (
                <>
                  <button
                    onClick={() =>
                      void action(async () => {
                        await api("configure", {
                          campaign: id,
                          privacy: notice,
                          closesAt: date + "T" + closingTime + ":00.000Z",
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
                    disabled={
                      current?.version !== VERSION ||
                      process.env.NEXT_PUBLIC_APP_ENV !== "qa"
                    }
                    className="tb-primary"
                    onClick={() =>
                      void action(async () => {
                        await api("configure", {
                          campaign: id,
                          status: "open",
                        });
                        await refresh();
                        setMessage("Campaign opened.");
                      })
                    }
                  >
                    Open project for QA testing
                  </button>
                  <button
                    onClick={() =>
                      void action(async () => {
                        await api("configure", {
                          campaign: id,
                          status: "closed",
                        });
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
        ) : null}
        {id && current && (
          <>
            <div hidden={tab !== "respondents"}>
              <section
                id="roster-import"
                className="tb-card"
                style={{ marginTop: 20 }}
              >
                <p className="brand-section-kicker">Participant roster</p>
                <h2>CSV roster import</h2>
                <p>
                  Import a CSV with name and email. Optional columns: job_title,
                  country, region, entity, work_type, manages_people,
                  direct_reports. Management refers to formal direct reports;
                  use yes, no or not_sure. These roster fields are not shown or
                  asked in the questionnaire. Use supplied country codes. Work
                  type codes: {WORK_TYPES.map(([code]) => code).join(", ")}.
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
                        setPreview(null);
                      }
                    }}
                  />
                </label>
                <button
                  disabled={busy || !csv}
                  onClick={() =>
                    void action(async () => {
                      const response = await fetch(
                        "/advisor/baseline/api/import-preview",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ campaign: id, csv }),
                        },
                      );
                      const result = (await response.json()) as {
                        count: number;
                        duplicates: string[];
                        canImport: boolean;
                        rows: Record<string, string>[];
                        error?: string;
                      };
                      if (!response.ok)
                        throw new Error(result.error ?? "Check the CSV.");
                      setPreview(result);
                    })
                  }
                >
                  Preview and validate CSV
                </button>
                {preview && (
                  <div className="tb-process">
                    <h3>CSV preview</h3>
                    <p>
                      {preview.count} respondents. {preview.duplicates.length}{" "}
                      emails already in this campaign.
                    </p>
                    {preview.rows.slice(0, 5).map((p) => (
                      <p key={p.email}>
                        {p.name} · {p.email} · {p.region} · {p.entity}
                      </p>
                    ))}
                    {preview.count > 5 && <p>First five records shown.</p>}
                    {preview.duplicates.length > 0 && (
                      <p className="tb-error">
                        Existing emails: {preview.duplicates.join(", ")}. No
                        rows will be imported.
                      </p>
                    )}
                    <button
                      disabled={busy || !preview.canImport}
                      onClick={() =>
                        void action(async () => {
                          const result = await api("import", {
                            campaign: id,
                            csv,
                          });
                          setCsv("");
                          setPreview(null);
                          await refresh();
                          setMessage(
                            `${result.imported} respondents imported. No invitations sent.`,
                          );
                        })
                      }
                    >
                      Confirm import
                    </button>
                  </div>
                )}
                <p>
                  QA email sending is disabled. Generate private test links to
                  exercise the journey. A new link revokes the previous link and
                  its sessions; saved answers remain.
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
                    <button
                      onClick={() => {
                        setLink("");
                        setQaCode("");
                      }}
                    >
                      Hide link
                    </button>
                    {isCollectionVersion(current.version) && (
                      <>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void action(async () => {
                              const result = await api<{
                                code: string;
                                challenge: string;
                              }>("test-code", {
                                token: link.split("#")[1].split(":")[0],
                              });
                              setQaCode(result.code);
                              setLink(
                                link.split("#")[0] +
                                  "#" +
                                  link.split("#")[1].split(":")[0] +
                                  ":" +
                                  result.challenge,
                              );
                            })
                          }
                        >
                          Create synthetic QA verification code
                        </button>
                        <p>
                          This private preview works with synthetic .invalid
                          recipients. It sends no email.
                        </p>
                        {qaCode && (
                          <label className="tb-field">
                            <span>QA verification code</span>
                            <input
                              readOnly
                              aria-label="QA verification code"
                              value={qaCode}
                            />
                          </label>
                        )}
                      </>
                    )}
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
                <details>
                  <summary>Private test access and saved responses</summary>
                  <div className="tb-roster">
                    {people
                      .filter((p) =>
                        (p.email + " " + p.profile.name)
                          .toLowerCase()
                          .includes(filter.toLowerCase()),
                      )
                      .map((p) => (
                        <article key={p.participant_id} className="tb-detail">
                          <h3>{p.profile.name}</h3>
                          <p>
                            {p.email} · {p.status.replaceAll("_", " ")} · Step{" "}
                            {p.progress} / 8 ·{" "}
                            {p.active ? "Access active" : "Access revoked"}
                          </p>
                          <p>
                            {p.profile.job_title} ·{" "}
                            {p.profile.region || "Region not recorded"} ·{" "}
                            {p.profile.country
                              ? countryLabel(p.profile.country)
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
                                setQaCode("");
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
                          <button onClick={() => setView(p)}>
                            View response
                          </button>
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
                </details>
              </section>
            </div>
            <Administration
              editParticipantId={editParticipantId}
              onEditOpened={() => setEditParticipantId(null)}
              section={tab}
              campaign={id}
              name={current.name}
              people={people}
              refresh={() => refresh()}
            />
            <div hidden={tab !== "exports"}>
              <section
                id="exports"
                className="tb-card"
                style={{ marginTop: 20 }}
              >
                <p className="brand-section-kicker">Data downloads</p>
                <h2>Analysis-ready exports</h2>
                {isCollectionVersion(current.version) && (
                  <>
                    <p>
                      Requested answer-copy emails stay in preview mode in QA.
                      Failed production deliveries can be retried after
                      production mail is approved.
                    </p>
                    <button
                      disabled={
                        busy || process.env.NEXT_PUBLIC_APP_ENV === "qa"
                      }
                      onClick={() =>
                        void action(async () => {
                          const result = await api<{ sent: number }>(
                            "retry-answer-copies",
                            { campaign: id },
                          );
                          setMessage(
                            result.sent + " requested answer copies sent.",
                          );
                        })
                      }
                    >
                      Retry requested answer copies
                    </button>
                  </>
                )}
                <p>
                  Includes response status, questionnaire version and current
                  work type. Reception and Facilities are mapped to People
                  Operations, without losing their work-type classification.
                  Draft answers are clearly marked; do not treat them as
                  completed responses.
                </p>
                {isCollectionVersion(current.version) && <p><a style={{ display: "inline-block", padding: 12, fontWeight: 700, textDecoration: "underline" }} href={`/advisor/baseline/api/export?campaign=${encodeURIComponent(id)}&format=xlsx`}>Download Excel analysis workbook</a><br/>Separate filterable tables, one answer per cell, numeric percentages, and a field guide. Filter Include in analysis to TRUE for completed responses.</p>}
                {(["respondents", "activities", "json"] as const).map(
                  (format) => (
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
                        ? "Raw respondent CSV"
                        : format === "activities"
                          ? "Raw work-area CSV"
                          : "Complete structured JSON"}
                    </a>
                  ),
                )}
              </section>
            </div>
            {view && tab === "respondents" && (
              <section className="tb-card" style={{ marginTop: 20 }}>
                <h2>Response: {view.profile.name}</h2>
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
      </div>
    </main>
  );
}
