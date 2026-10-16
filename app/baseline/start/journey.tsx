"use client";
import { useEffect, useRef, useState } from "react";
import {
  AREAS,
  STEP_LABELS,
  SYSTEMS,
  systemLabel,
  KNOWLEDGE,
  KNOWLEDGE_LABELS,
  CHANNELS,
  CHANNEL_LABELS,
  FREQUENCIES,
  FREQUENCY_LABELS,
  ROLES,
  ROLE_LABELS,
  HANDOFFS,
  HANDOFF_LABELS,
  availableAreas,
  allocationTotal,
  detailCodes,
  stepError,
  completionError,
  type Draft,
  type EntityOption,
  validationIssues,
  intakeTotal,
  type Detail,
  type Area,
} from "@/lib/baseline/model";
import { GROUP_LABELS, OPTION_HELP } from "@/lib/baseline/help";
import "./style.css";
type Saved = {
  draft: Draft;
  campaign: {
    name: string;
    privacy: string;
    closed: boolean;
    entities: EntityOption[];
  };
  revision: number;
  progress: number;
  status: string;
  updatedAt: string;
};
async function api<T = { revision: number; status: string }>(
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch("/api/baseline/" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(result.error ?? "Unable to save. Please try again.");
  return result;
}
function Checks({
  codes,
  labels,
  values,
  change,
  max,
  invalid = false,
  descriptions = OPTION_HELP,
}: {
  codes: readonly string[];
  labels?: readonly string[];
  values: string[];
  change: (values: string[]) => void;
  max?: number;
  invalid?: boolean;
  descriptions?: Record<string, string>;
}) {
  const visible = values.filter((x) => codes.includes(x));
  return (
    <div
      className={"tb-options " + (invalid ? "tb-invalid" : "")}
      aria-invalid={invalid}
    >
      {codes.map((code, i) => (
        <label key={code}>
          <input
            type="checkbox"
            checked={values.includes(code)}
            disabled={!!max && values.length >= max && !values.includes(code)}
            onChange={() =>
              change(
                visible.includes(code)
                  ? visible.filter((x) => x !== code)
                  : [...visible, code],
              )
            }
          />
          <span>
            {labels?.[i] ?? code}
            {values.includes(code) && descriptions[code] && (
              <small className="tb-definition">{descriptions[code]}</small>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}
function Text({
  label,
  value,
  change,
  help,
  max = 1500,
  invalid = false,
}: {
  label: string;
  value: string;
  change: (value: string) => void;
  help?: string;
  max?: number;
  invalid?: boolean;
}) {
  return (
    <label className={"tb-field " + (invalid ? "tb-invalid" : "")}>
      <span>{label}</span>
      {help && <small>{help}</small>}
      <textarea
        aria-invalid={invalid}
        rows={3}
        value={value}
        maxLength={max}
        onChange={(e) => change(e.target.value)}
      />
      <small>
        {value.length} / {max} characters
      </small>
    </label>
  );
}
function Select({
  invalid = false,
  label,
  value,
  codes,
  labels,
  change,
}: {
  invalid?: boolean;
  label: string;
  value: string;
  codes: readonly string[];
  labels?: readonly string[];
  change: (value: string) => void;
}) {
  return (
    <label className="tb-field">
      <span>{label}</span>
      <select
        className={invalid ? "tb-invalid" : ""}
        aria-invalid={invalid}
        value={value}
        onChange={(e) => change(e.target.value)}
      >
        <option value="">Choose an answer</option>
        {codes.map((code, i) => (
          <option key={code} value={code}>
            {labels?.[i] ?? code}
          </option>
        ))}
      </select>
      {OPTION_HELP[value] && (
        <small className="tb-definition">{OPTION_HELP[value]}</small>
      )}
    </label>
  );
}
export default function BaselineJourney() {
  const [saved, setSaved] = useState<Saved | null>(null),
    [draft, setDraft] = useState<Draft | null>(null),
    [step, setStep] = useState(0),
    [started, setStarted] = useState(false),
    [review, setReview] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState("Opening your saved response…"),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [checked, setChecked] = useState(false),
    [reviewVisited, setReviewVisited] = useState(false),
    [custom, setCustom] = useState(""),
    [customCategory, setCustomCategory] = useState<Area["category"]>("ops"),
    [systemSearch, setSystemSearch] = useState(""),
    [systemOther, setSystemOther] = useState("");
  const latest = useRef<Draft | null>(null),
    revision = useRef(0),
    queue = useRef<Promise<void>>(Promise.resolve()),
    lastSaved = useRef(""),
    progress = useRef(0),
    conflict = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const change = (next: Draft) => {
    latest.current = next;
    setDraft(next);
    setStatus("Changes waiting to save…");
  };
  function save(next = latest.current, stage?: number) {
    if (!next || conflict.current)
      return Promise.reject(
        new Error("Reload your saved response before continuing."),
      );
    const snapshot = structuredClone(next);
    const serialized = JSON.stringify(snapshot);
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        const targetStage = stage ?? progress.current;
        if (
          serialized === lastSaved.current &&
          targetStage === progress.current
        )
          return;
        try {
          setStatus("Saving…");
          const result = await api("save", {
            draft: snapshot,
            revision: revision.current,
            progress: targetStage,
          });
          revision.current = result.revision;
          progress.current = targetStage;
          lastSaved.current = serialized;
          setStatus(
            latest.current && JSON.stringify(latest.current) === serialized
              ? "Saved securely"
              : "Changes waiting to save…",
          );
          setError("");
        } catch (e) {
          const message =
            e instanceof Error
              ? e.message
              : "Not saved. Keep this page open and retry.";
          if (
            message.includes("newer save") ||
            message.includes("already submitted")
          )
            conflict.current = true;
          setStatus("Not saved — keep this page open");
          setError(message);
          throw e;
        }
      });
    return queue.current;
  }
  useEffect(() => {
    let live = true;
    async function open() {
      try {
        const token = window.location.hash.slice(1);
        if (token) {
          window.history.replaceState(null, "", window.location.pathname);
          await api("access", { token });
        }
        const response = await api<Saved>("response");
        if (!live) return;
        setSaved(response);
        setDraft(response.draft);
        latest.current = response.draft;
        revision.current = response.revision;
        progress.current = response.progress;
        lastSaved.current = JSON.stringify(response.draft);
        setStep(Math.min(response.progress, 7));
        setReview(response.progress === 8);
        setReviewVisited(response.progress === 8);
        setStarted(response.draft.privacyAcknowledged);
        setStatus("Saved securely");
      } catch (e) {
        if (live) {
          setError(
            e instanceof Error ? e.message : "Unable to open this assessment.",
          );
          setStatus("");
        }
      }
    }
    void open();
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (
      !draft ||
      !started ||
      saved?.status === "completed" ||
      saved?.campaign.closed
    )
      return;
    const timer = setTimeout(() => {
      void save().catch(() => {});
    }, 650);
    return () =>
      clearTimeout(
        timer,
      ); /* save uses current refs; never capture an obsolete revision. */
  }, [draft, started, saved?.status, saved?.campaign.closed]);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (
        latest.current &&
        JSON.stringify(latest.current) !== lastSaved.current
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const online = () => {
      if (
        latest.current &&
        JSON.stringify(latest.current) !== lastSaved.current
      )
        void save().catch(() => {});
    };
    window.addEventListener("beforeunload", leave);
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("online", online);
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [step, review]);
  async function move(forward: boolean) {
    if (!draft) return;
    const message = forward
      ? stepError(draft, step, saved?.campaign.entities ?? [])
      : null;
    if (message) {
      setChecked(true);
      setError(message);
      return;
    }
    setBusy(true);
    try {
      await save(
        draft,
        forward ? Math.min(step + 1, 8) : Math.max(step - 1, 0),
      );
      if (forward && step === 7) {
        setReview(true);
        setReviewVisited(true);
      } else setStep((s) => (forward ? s + 1 : s - 1));
      setError("");
      setSearch("");
      setChecked(false);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    if (!draft) return;
    const message = completionError(draft, saved?.campaign.entities ?? []);
    if (message) {
      const first = Array.from({ length: 8 }, (_, i) => i).find((i) =>
        stepError(draft, i, saved?.campaign.entities ?? []),
      );
      if (first !== undefined) {
        setStep(first);
        setReview(false);
      }
    }
    if (message) {
      setChecked(true);
      setError(message);
      return;
    }
    setBusy(true);
    try {
      await save();
      const result = await api("submit", {
        draft: latest.current,
        revision: revision.current,
        progress: 8,
      });
      revision.current = result.revision;
      lastSaved.current = JSON.stringify(latest.current);
      setSaved((s) => (s ? { ...s, status: "completed" } : s));
      setStatus("Submitted securely");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit.");
    } finally {
      setBusy(false);
    }
  }
  async function leave() {
    setBusy(true);
    try {
      if (draft && saved?.status !== "completed") await save();
      await api("logout", {});
      window.location.reload();
    } catch {
    } finally {
      setBusy(false);
    }
  }
  const entities = saved?.campaign.entities ?? [];
  const issues =
    draft && checked ? validationIssues(draft, step, entities) : [];
  const invalid = (key: string) => issues.some((x) => x.key === key);
  async function returnToReview() {
    if (!draft) return;
    const message = stepError(draft, step, entities);
    if (message) {
      setChecked(true);
      setError(message);
      return;
    }
    setBusy(true);
    try {
      await save(draft, 8);
      setReview(true);
      setChecked(false);
      setError("");
    } catch {
    } finally {
      setBusy(false);
    }
  }
  const updateDetail = (
    code: string,
    key: keyof Detail,
    value: Detail[keyof Detail],
  ) =>
    draft &&
    change({
      ...draft,
      details: {
        ...draft.details,
        [code]: {
          ...(draft.details[code] ?? {
            description: "",
            frequency: "",
            role: "",
            handoffs: [],
            other: "",
          }),
          [key]: value,
        },
      },
    });
  const chooseArea = (code: string) => {
    if (!draft) return;
    if (draft.areas.includes(code)) {
      const allocation = { ...draft.allocation },
        details = { ...draft.details };
      delete allocation[code];
      delete details[code];
      change({
        ...draft,
        areas: draft.areas.filter((x) => x !== code),
        important: draft.important.filter((x) => x !== code),
        allocation,
        details,
      });
    } else change({ ...draft, areas: [...draft.areas, code] });
  };
  const selected = draft
    ? [...AREAS, ...draft.customAreas].filter((a) =>
        draft.areas.includes(a.code),
      )
    : [];
  return (
    <main className="tb-shell">
      <header className="tb-header">
        <span>team.blue · Current work baseline</span>
        <p>Describe what you do today. Help us understand the work.</p>
      </header>
      {(error || issues.length > 0) && (
        <div role="alert" className="tb-error">
          {error || issues[0]?.message}
          {conflict.current && (
            <button onClick={() => window.location.reload()}>
              Reload saved response
            </button>
          )}
        </div>
      )}
      {!saved || !draft ? (
        <section className="tb-card">
          <h1>Current work baseline</h1>
          <p>
            {status ||
              "Use the private link in your invitation email. If it has expired, ask the organiser for a new one."}
          </p>
        </section>
      ) : saved.status === "completed" ? (
        <section className="tb-card">
          <h1>Thank you. Your response is complete.</h1>
          <p>
            Your answers have been saved. You do not need to submit them again.
          </p>
          <p>
            If you need to correct an answer, contact the campaign organiser.
          </p>
          <button onClick={leave}>Close secure session</button>
        </section>
      ) : (
        <>
          {!started ? (
            <section className="tb-card">
              <h1>{saved.campaign.name}</h1>
              <p className="tb-estimate">
                About 20–25 minutes · Save and return at any time
              </p>
              <h2>Before you start</h2>
              <p>{saved.campaign.privacy}</p>
              <p>
                There are eight short steps. Use selections where possible.
                Approximate answers are useful.
              </p>
              <label className="tb-check">
                <input
                  type="checkbox"
                  checked={draft.privacyAcknowledged}
                  onChange={(e) =>
                    change({ ...draft, privacyAcknowledged: e.target.checked })
                  }
                />
                I have read how my answers will be used.
              </label>
              <button
                disabled={!draft.privacyAcknowledged || saved.campaign.closed}
                onClick={() => setStarted(true)}
              >
                Start assessment
              </button>
            </section>
          ) : (
            <>
              <nav aria-label="Assessment progress" className="tb-progress">
                <span>Step {step + 1} of 8</span>
                <progress max={8} value={review ? 8 : step + 1} />
                <span>{STEP_LABELS[step]}</span>
              </nav>
              <div role="status" aria-live="polite" className="tb-save">
                {status}{" "}
                {status.startsWith("Not saved") && (
                  <button onClick={() => void save().catch(() => {})}>
                    Retry save
                  </button>
                )}
              </div>
              <section className="tb-card">
                <h1 ref={heading} tabIndex={-1}>
                  {review ? "Review and submit" : STEP_LABELS[step]}
                </h1>
                {saved.campaign.closed && (
                  <p role="alert">
                    This campaign is closed. You can see your saved answers, but
                    you cannot change them.
                  </p>
                )}
                <fieldset
                  disabled={busy || saved.campaign.closed || conflict.current}
                >
                  {review ? (
                    <>
                      <p>
                        Please check your answers before submitting. You can go
                        back to any step.
                      </p>
                      <dl>
                        <dt>Support scope</dt>
                        <dd>
                          {OPTION_HELP[draft.scope.reach]}{" "}
                          {draft.scope.entities
                            .map(
                              (c) => entities.find((e) => e.code === c)?.label,
                            )
                            .join(", ")}
                        </dd>
                        <dt>Incoming work</dt>
                        <dd>
                          {draft.channels
                            .map(
                              (c) =>
                                `${CHANNEL_LABELS[CHANNELS.indexOf(c)]}: ${draft.channelAllocation[c]}%`,
                            )
                            .join("; ")}
                        </dd>
                        <dt>Time allocation</dt>
                        <dd>{allocationTotal(draft)}% in total</dd>
                        <dt>Your main work areas</dt>
                        <dd>{selected.map((a) => a.label).join("; ")}</dd>
                      </dl>
                      <div className="tb-review">
                        {STEP_LABELS.map((label, i) => (
                          <button
                            key={label}
                            onClick={() => {
                              setReview(false);
                              setReviewVisited(true);
                              setChecked(false);
                              setStep(i);
                            }}
                          >
                            {i + 1}. {label}
                          </button>
                        ))}
                      </div>
                      <p>
                        Submitting finishes your response. Your answers help us
                        understand the baseline, protect strengths and improve
                        how we work.
                      </p>
                    </>
                  ) : (
                    <>
                      {step === 0 && (
                        <>
                          <p>
                            Does your regular work support one brand or entity,
                            more than one, or the Group?
                          </p>
                          <Select
                            label="Who does your regular work support?"
                            value={draft.scope.reach}
                            codes={[
                              "one_entity",
                              "multiple_entities",
                              "all_group",
                              "not_sure",
                            ]}
                            labels={[
                              "One brand or entity",
                              "More than one brand or entity",
                              "Group / all team.blue",
                              "Not sure",
                            ]}
                            invalid={invalid("scope")}
                            change={(reach) =>
                              change({
                                ...draft,
                                scope: { reach, entities: [] },
                              })
                            }
                          />
                          {["one_entity", "multiple_entities"].includes(
                            draft.scope.reach,
                          ) &&
                            (entities.length ? (
                              <>
                                <h2>
                                  Which brands or entities do you support
                                  regularly?
                                </h2>
                                <p>
                                  A legal entity is the company that employs
                                  people. Choose{" "}
                                  {draft.scope.reach === "one_entity"
                                    ? "one"
                                    : "all that apply"}
                                  .
                                </p>
                                <Checks
                                  codes={entities.map((e) => e.code)}
                                  labels={entities.map((e) => e.label)}
                                  values={draft.scope.entities}
                                  max={
                                    draft.scope.reach === "one_entity"
                                      ? 1
                                      : undefined
                                  }
                                  invalid={invalid("entities")}
                                  change={(values) =>
                                    change({
                                      ...draft,
                                      scope: {
                                        ...draft.scope,
                                        entities: values,
                                      },
                                    })
                                  }
                                />
                              </>
                            ) : (
                              <p>
                                The organiser has not added the approved entity
                                list yet. For this test, your answer above
                                records the scope of your support.
                              </p>
                            ))}
                        </>
                      )}
                      {step === 1 && (
                        <>
                          <p>
                            Choose the areas where you currently spend
                            meaningful time. Choose across any group. Your work
                            may combine employee cases, payroll, events, office
                            services and systems.
                          </p>
                          <label className="tb-field">
                            <span>Search all work areas</span>
                            <input
                              type="search"
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                            />
                          </label>
                          <p>
                            {draft.areas.length} areas selected. Avoid counting
                            the same work in two areas.
                          </p>
                          <div className={invalid("areas") ? "tb-invalid" : ""}>
                            {(
                              Object.keys(GROUP_LABELS) as Area["category"][]
                            ).map((group) => {
                              const areas = availableAreas(
                                "mixed",
                                true,
                                search,
                              ).filter((a) => a.category === group);
                              return areas.length ? (
                                <section key={group}>
                                  <h2>{GROUP_LABELS[group]}</h2>
                                  <Checks
                                    codes={areas.map((a) => a.code)}
                                    labels={areas.map((a) => a.label)}
                                    descriptions={Object.fromEntries(
                                      areas.map((a) => [a.code, a.example]),
                                    )}
                                    values={draft.areas}
                                    max={40}
                                    change={(values) => {
                                      const code = areas.find(
                                        (a) =>
                                          values.includes(a.code) !==
                                          draft.areas.includes(a.code),
                                      )?.code;
                                      if (code) chooseArea(code);
                                    }}
                                  />
                                </section>
                              ) : null;
                            })}
                          </div>
                          {draft.customAreas.length > 0 && (
                            <>
                              <h2>Added activities</h2>
                              <Checks
                                codes={draft.customAreas.map((a) => a.code)}
                                labels={draft.customAreas.map((a) => a.label)}
                                values={draft.areas}
                                change={(values) => {
                                  const code = draft.customAreas.find(
                                    (a) =>
                                      values.includes(a.code) !==
                                      draft.areas.includes(a.code),
                                  )?.code;
                                  if (code) chooseArea(code);
                                }}
                              />
                            </>
                          )}
                          <label className="tb-field">
                            <span>Add another work area (up to six)</span>
                            <input
                              value={custom}
                              maxLength={120}
                              onChange={(e) => setCustom(e.target.value)}
                            />
                          </label>
                          <Select
                            label="Where does this added activity fit best?"
                            codes={Object.keys(GROUP_LABELS)}
                            labels={Object.values(GROUP_LABELS)}
                            value={customCategory}
                            change={(v) =>
                              setCustomCategory(v as Area["category"])
                            }
                          />
                          <button
                            disabled={
                              !custom.trim() ||
                              draft.customAreas.length >= 6 ||
                              draft.areas.length >= 40
                            }
                            onClick={() => {
                              const area: Area = {
                                code: "custom_" + crypto.randomUUID(),
                                label: custom.trim(),
                                category: customCategory,
                                example: "Briefly describe your current work.",
                              };
                              change({
                                ...draft,
                                customAreas: [...draft.customAreas, area],
                                areas: [...draft.areas, area.code],
                              });
                              setCustom("");
                            }}
                          >
                            Add work area
                          </button>
                        </>
                      )}
                      {step === 2 && (
                        <>
                          <p>
                            In a typical month, about how much of your working
                            time is spent on each area?
                          </p>
                          <p>
                            This does not need to be exact. Think about an
                            average month. If something normally takes about one
                            day each week, you might enter 20%.
                          </p>
                          <div className="tb-total" aria-live="polite">
                            Total: {allocationTotal(draft)}%{" "}
                            <progress
                              max={100}
                              value={Math.min(allocationTotal(draft), 100)}
                            />
                            <small>
                              Aim for 100%. Between 98% and 102% is accepted.
                            </small>
                          </div>
                          {selected.map((a) => (
                            <label
                              className={
                                "tb-field " +
                                (invalid("allocation:" + a.code)
                                  ? "tb-invalid"
                                  : "")
                              }
                              key={a.code}
                            >
                              <span>{a.label}</span>
                              <div className="tb-percentage">
                                <input
                                  aria-invalid={invalid("allocation:" + a.code)}
                                  aria-label={`${a.label} percentage`}
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  max={100}
                                  step={0.5}
                                  value={draft.allocation[a.code] ?? ""}
                                  onChange={(e) => {
                                    const allocation = { ...draft.allocation };
                                    if (e.target.value === "")
                                      delete allocation[a.code];
                                    else
                                      allocation[a.code] = Number(
                                        e.target.value,
                                      );
                                    change({ ...draft, allocation });
                                  }}
                                />
                                <span>%</span>
                              </div>
                            </label>
                          ))}
                        </>
                      )}
                      {step === 3 && (
                        <>
                          <p>
                            We ask for a little more detail about your three
                            largest work areas. Add up to two other areas if
                            they are important.
                          </p>
                          <details>
                            <summary>Choose additional important areas</summary>
                            <Checks
                              codes={draft.areas.filter(
                                (x) =>
                                  !detailCodes({
                                    ...draft,
                                    important: [],
                                  }).includes(x),
                              )}
                              labels={draft.areas
                                .filter(
                                  (x) =>
                                    !detailCodes({
                                      ...draft,
                                      important: [],
                                    }).includes(x),
                                )
                                .map(
                                  (code) =>
                                    selected.find((a) => a.code === code)!
                                      .label,
                                )}
                              values={draft.important}
                              max={2}
                              change={(v) => change({ ...draft, important: v })}
                            />
                          </details>
                          {detailCodes(draft).map((code) => {
                            const a = selected.find((a) => a.code === code)!;
                            const d = draft.details[code] ?? {
                              description: "",
                              frequency: "",
                              role: "",
                              handoffs: [],
                              other: "",
                            };
                            return (
                              <article className="tb-detail" key={code}>
                                <h2>{a.label}</h2>
                                <Text
                                  label="What do you normally do in this area?"
                                  help={
                                    a.example +
                                    " Do not include individual employee cases."
                                  }
                                  invalid={invalid(
                                    `detail:${code}:description`,
                                  )}
                                  value={d.description}
                                  max={700}
                                  change={(v) =>
                                    updateDetail(code, "description", v)
                                  }
                                />
                                <Select
                                  label="How often do you normally do this work?"
                                  codes={FREQUENCIES}
                                  labels={FREQUENCY_LABELS}
                                  invalid={invalid(`detail:${code}:frequency`)}
                                  value={d.frequency}
                                  change={(v) =>
                                    updateDetail(code, "frequency", v)
                                  }
                                />
                                <Select
                                  label="Which best describes your role in this work?"
                                  codes={ROLES}
                                  labels={ROLE_LABELS}
                                  invalid={invalid(`detail:${code}:role`)}
                                  value={d.role}
                                  change={(v) => updateDetail(code, "role", v)}
                                />
                                <h3>
                                  Who do you normally work with or hand this
                                  work to/from?
                                </h3>
                                <p>
                                  A hand-off is work or information passed
                                  between people or teams.
                                </p>
                                <Checks
                                  codes={HANDOFFS}
                                  labels={HANDOFF_LABELS}
                                  values={d.handoffs}
                                  change={(v) =>
                                    updateDetail(code, "handoffs", v)
                                  }
                                />
                                <Text
                                  label="Other team or important hand-off (optional)"
                                  value={d.other}
                                  max={300}
                                  change={(v) => updateDetail(code, "other", v)}
                                />
                              </article>
                            );
                          })}
                        </>
                      )}
                      {step === 4 && (
                        <>
                          <p>
                            Is there important work you do only at certain times
                            of the year or only when something happens?
                          </p>
                          <p>
                            For example: annual pay activity, audits, office
                            moves, annual reporting or system projects. Describe
                            the type of work, not individual cases.
                          </p>
                          <Select
                            label="Do you have important occasional work?"
                            codes={["yes", "no", "not_sure"]}
                            labels={["Yes", "No", "Not sure"]}
                            invalid={invalid("cyclical")}
                            value={draft.cyclical.answer}
                            change={(v) =>
                              change({
                                ...draft,
                                cyclical: {
                                  answer: v,
                                  text: v === "yes" ? draft.cyclical.text : "",
                                },
                              })
                            }
                          />
                          {draft.cyclical.answer === "yes" && (
                            <Text
                              label="Briefly describe this work"
                              invalid={invalid("cyclicalText")}
                              value={draft.cyclical.text}
                              max={1000}
                              change={(v) =>
                                change({
                                  ...draft,
                                  cyclical: { ...draft.cyclical, text: v },
                                })
                              }
                            />
                          )}
                        </>
                      )}
                      {step === 5 && (
                        <>
                          <h2>
                            Which systems or tools do you use regularly for your
                            work?
                          </h2>
                          <label className="tb-field">
                            <span>Search systems</span>
                            <input
                              type="search"
                              value={systemSearch}
                              onChange={(e) => setSystemSearch(e.target.value)}
                            />
                          </label>
                          <Checks
                            codes={[
                              ...new Set([...SYSTEMS, ...draft.systems]),
                            ].filter((s) =>
                              systemLabel(s)
                                .toLowerCase()
                                .includes(systemSearch.toLowerCase()),
                            )}
                            labels={[...new Set([...SYSTEMS, ...draft.systems])]
                              .filter((s) =>
                                systemLabel(s)
                                  .toLowerCase()
                                  .includes(systemSearch.toLowerCase()),
                              )
                              .map(systemLabel)}
                            invalid={invalid("systems")}
                            values={draft.systems}
                            change={(v) => {
                              const visible = new Set(
                                [...SYSTEMS, ...draft.systems].filter((s) =>
                                  systemLabel(s)
                                    .toLowerCase()
                                    .includes(systemSearch.toLowerCase()),
                                ),
                              );
                              change({
                                ...draft,
                                systems: [
                                  ...draft.systems.filter(
                                    (s) => !visible.has(s),
                                  ),
                                  ...v,
                                ],
                              });
                            }}
                          />
                          <label className="tb-field">
                            <span>Add another system or tool</span>
                            <input
                              value={systemOther}
                              maxLength={120}
                              onChange={(e) => setSystemOther(e.target.value)}
                            />
                          </label>
                          <button
                            disabled={!systemOther.trim()}
                            onClick={() => {
                              change({
                                ...draft,
                                systems: [
                                  ...new Set([
                                    ...draft.systems,
                                    systemOther.trim(),
                                  ]),
                                ],
                              });
                              setSystemOther("");
                            }}
                          >
                            Add system
                          </button>
                          <h2>
                            What knowledge or experience do colleagues rely on
                            you for?
                          </h2>
                          <p>
                            This describes current knowledge. It does not rate
                            your capability or performance.
                          </p>
                          <Checks
                            codes={KNOWLEDGE}
                            labels={KNOWLEDGE_LABELS}
                            invalid={invalid("knowledge")}
                            values={draft.knowledge}
                            change={(v) => change({ ...draft, knowledge: v })}
                          />
                          <Text
                            label="Specific country, business or specialist knowledge (optional)"
                            value={draft.knowledgeOther}
                            change={(v) =>
                              change({ ...draft, knowledgeOther: v })
                            }
                          />
                        </>
                      )}
                      {step === 6 && (
                        <>
                          <div
                            className="tb-total"
                            role="status"
                            aria-live="polite"
                          >
                            Incoming work total: {intakeTotal(draft)}%
                            <progress
                              max={100}
                              value={Math.min(100, intakeTotal(draft))}
                            />
                            <small>
                              Aim for 100%. Between 98% and 102% is accepted.
                            </small>
                          </div>
                          <p>
                            Choose up to five main ways work reaches you.
                            Estimate the share of incoming work through each
                            route.
                          </p>
                          <p>
                            Count each piece of work once, using the route
                            through which it first reaches you. These
                            percentages describe incoming work, rather than time
                            spent on activities.
                          </p>
                          <Checks
                            codes={CHANNELS}
                            labels={CHANNEL_LABELS}
                            values={draft.channels}
                            max={5}
                            invalid={invalid("channels")}
                            change={(channels) =>
                              change({
                                ...draft,
                                channels,
                                channelAllocation: Object.fromEntries(
                                  Object.entries(
                                    draft.channelAllocation,
                                  ).filter(([c]) => channels.includes(c)),
                                ),
                              })
                            }
                          />
                          {draft.channels.map((c) => (
                            <label
                              className={
                                "tb-field " +
                                (invalid("channelAllocation:" + c)
                                  ? "tb-invalid"
                                  : "")
                              }
                              key={c}
                            >
                              <span>{CHANNEL_LABELS[CHANNELS.indexOf(c)]}</span>
                              <div className="tb-percentage">
                                <input
                                  aria-label={`${CHANNEL_LABELS[CHANNELS.indexOf(c)]} percentage`}
                                  aria-invalid={invalid(
                                    "channelAllocation:" + c,
                                  )}
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.5}
                                  value={draft.channelAllocation[c] ?? ""}
                                  onChange={(e) => {
                                    const allocation = {
                                      ...draft.channelAllocation,
                                    };
                                    if (e.target.value === "")
                                      delete allocation[c];
                                    else allocation[c] = Number(e.target.value);
                                    change({
                                      ...draft,
                                      channelAllocation: allocation,
                                    });
                                  }}
                                />
                                <span>%</span>
                              </div>
                            </label>
                          ))}
                          <Text
                            label="Other way work reaches you (optional)"
                            value={draft.channelOther}
                            change={(channelOther) =>
                              change({ ...draft, channelOther })
                            }
                          />
                        </>
                      )}
                      {step === 7 && (
                        <>
                          <Text
                            label="Which parts of your work take more time or manual effort than they should? (optional)"
                            help="For example: re-entering information, spreadsheets, repeated checking, waiting for information, chasing approvals or doing the same task in more than one system."
                            value={draft.extraEffort}
                            change={(v) => change({ ...draft, extraEffort: v })}
                          />
                          <Text
                            label="What works particularly well today and should we make sure we keep? (optional)"
                            value={draft.strengths}
                            change={(v) => change({ ...draft, strengths: v })}
                          />
                          <Text
                            label="Is there anything important about your current work that we have not asked? (optional)"
                            value={draft.anything}
                            change={(v) => change({ ...draft, anything: v })}
                          />
                        </>
                      )}
                    </>
                  )}
                  <footer className="tb-actions">
                    {review ? (
                      <>
                        <button onClick={() => setReview(false)}>
                          Back to answers
                        </button>
                        <button className="tb-primary" onClick={finish}>
                          Submit response
                        </button>
                      </>
                    ) : (
                      <>
                        {step > 0 && (
                          <button onClick={() => void move(false)}>Back</button>
                        )}
                        {reviewVisited && (
                          <button onClick={() => void returnToReview()}>
                            Save and return to review
                          </button>
                        )}
                        <button
                          className="tb-primary"
                          onClick={() => void move(true)}
                        >
                          {step === 7 ? "Review answers" : "Save and continue"}
                        </button>
                      </>
                    )}
                  </footer>
                </fieldset>
              </section>
              <button disabled={busy} className="tb-leave" onClick={leave}>
                Save and close secure session — return using your private link
              </button>
            </>
          )}
        </>
      )}
      <footer className="tb-footnote">
        Current work only · No performance rating · Your private response
      </footer>
    </main>
  );
}
