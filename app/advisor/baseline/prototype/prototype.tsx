"use client";
import { useRef, useState, useEffect, useId } from "react";
import {
  AREAS,
  FREQUENCIES,
  FREQUENCY_LABELS,
  ROLES,
  ROLE_LABELS,
} from "@/lib/baseline/model";
import { OPTION_HELP } from "@/lib/baseline/help";
import {
  PROCESSES,
  emptyPrototype,
  activityChoices,
  processesFor,
  addActivity,
  activeProcesses,
  processTotal,
  completeAnswer,
  selectActivities,
  applyAnswers,
  prototypeIssues,
  prototypeEvidence,
  type PrototypeDraft,
  type ActivityAnswer,
} from "@/lib/baseline/prototype";
import "@/app/baseline/start/style.css";
import { PROCESS_EXAMPLES } from "@/lib/baseline/prototype-actions";
import "./prototype.css";
const STEPS = [
  "Your activities",
  "Time by process",
  "Your part in the work",
  "Review",
];
function Choice({
  label,
  value,
  codes,
  labels,
  change,
  invalid = false,
}: {
  label: string;
  value: string;
  codes: string[];
  labels: string[];
  change: (value: string) => void;
  invalid?: boolean;
}) {
  const helpId = useId();
  return (
    <label className="tb-field">
      <span>{label}</span>
      <select
        aria-label={label}
        aria-describedby={value ? helpId : undefined}
        aria-invalid={invalid}
        value={value}
        onChange={(e) => change(e.target.value)}
      >
        <option value="">Choose an answer</option>
        {codes.map((code, i) => (
          <option value={code} key={code}>
            {labels[i]}
          </option>
        ))}
      </select>
      {value && (
        <small id={helpId} className="tb-definition">
          {OPTION_HELP[value]}
        </small>
      )}
    </label>
  );
}
function AddBox({
  processCode,
  onAdd,
}: {
  processCode: string;
  onAdd: (label: string, group: string) => boolean;
}) {
  const [label, setLabel] = useState(""),
    [group, setGroup] = useState(processCode);
  const title =
    PROCESSES.find((p) => p.code === processCode)?.label ?? "other work";
  return (
    <div className="tb-add-box">
      <label className="tb-field">
        <span>Another activity: {title}</span>
        <input
          maxLength={120}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      {processCode === "other_work" && (
        <Choice
          label="Where does this added activity fit?"
          value={group}
          codes={[...PROCESSES.map((p) => p.code), "other_work"]}
          labels={[...PROCESSES.map((p) => p.label), "Not sure where it fits"]}
          change={setGroup}
        />
      )}
      <button
        disabled={!label.trim()}
        onClick={() => {
          if (onAdd(label, group)) setLabel("");
        }}
      >
        Add activity
      </button>
    </div>
  );
}
export default function Prototype() {
  const [draft, setDraft] = useState<PrototypeDraft>(emptyPrototype),
    [started, setStarted] = useState(false),
    [stage, setStage] = useState(0),
    [checked, setChecked] = useState(false),
    [reviewVisited, setReviewVisited] = useState(false),
    [search, setSearch] = useState(""),
    [groups, setGroups] = useState<string[]>([]),
    [coverage, setCoverage] = useState(false),
    [addError, setAddError] = useState(""),
    [bulk, setBulk] = useState<
      Record<string, { frequency: string; role: string }>
    >({});
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [stage, started, coverage]);
  const choices = activityChoices(draft);
  const processes = processesFor(draft);
  const active = activeProcesses(draft),
    issues = checked ? prototypeIssues(draft, stage) : [];
  function go(next: number) {
    if (stage === 0 && next > 0 && !coverage) {
      if (prototypeIssues(draft, 0).length) setChecked(true);
      else {
        setCoverage(true);
        setChecked(false);
        setSearch("");
      }
      return;
    }

    if (next === 3) {
      const incomplete = [0, 1, 2].find(
        (s) => prototypeIssues(draft, s).length > 0,
      );
      if (incomplete !== undefined) {
        setStage(incomplete);
        setChecked(true);
        window.scrollTo({ top: 0 });
        return;
      }
    }
    if (next > stage && stage < 3 && prototypeIssues(draft, stage).length) {
      setChecked(true);
      window.scrollTo({ top: 0 });
      return;
    }
    setChecked(false);
    setStage(next);
    setCoverage(false);
    if (next === 3) setReviewVisited(true);
  }
  function answer(
    code: string,
    key: keyof ActivityAnswer,
    value: string | boolean,
  ) {
    setDraft({
      ...draft,
      answers: {
        ...draft.answers,
        [code]: {
          ...(draft.answers[code] ?? {
            frequency: "",
            role: "",
            important: false,
          }),
          [key]: value,
        },
      },
    });
  }
  function add(label: string, group: string) {
    try {
      setDraft(
        addActivity(draft, label, group, "added_" + crypto.randomUUID()),
      );
      setGroups([...new Set([...groups, group])]);
      setAddError("");
      return true;
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Check the activity name.");
      return false;
    }
  }
  const completed = draft.selected.filter((c) =>
    completeAnswer(draft.answers[c]),
  ).length;
  const evidence = prototypeEvidence(draft);
  return (
    <main className="tb-shell tb-prototype">
      <aside className="tb-prototype-note">
        QA design test · Use synthetic examples only. Answers stay in this page
        and reset on refresh.
      </aside>
      <header className="tb-header">
        <span>team.blue · Current work baseline</span>
        <p>
          Understand current work, protect strengths and improve how we work.
        </p>
      </header>
      {!started ? (
        <section className="tb-card">
          <h1>A shorter way to describe your work</h1>
          <p>
            Choose the activities you do, estimate time across broad processes,
            then tell us how often you do each activity and your part in it.
          </p>
          <p>
            You can give the same answers to several activities together and
            change any exceptions. Every activity you select will be included.
          </p>
          <p>
            This prototype tests these three sections. Systems, scope, strengths
            and other questions are outside this design test.
          </p>
          <button className="tb-primary" onClick={() => setStarted(true)}>
            Start with empty answers
          </button>
          <button
            onClick={() => {
              setDraft({
                ...emptyPrototype(),
                selected: AREAS.map((a) => a.code),
              });
              setGroups(PROCESSES.map((p) => p.code));
              setStarted(true);
            }}
          >
            Try a broad example (all activities)
          </button>
        </section>
      ) : (
        <>
          <nav className="tb-progress" aria-label="Prototype progress">
            <span>Step {stage + 1} of 4</span>
            <progress max={4} value={stage + 1} />
            <span>
              {draft.selected.length} activities · {active.length} process
              groups
            </span>
          </nav>
          {addError && (
            <div role="alert" className="tb-error">
              {addError}
            </div>
          )}
          {issues.length > 0 && (
            <div role="alert" className="tb-error">
              {stage === 0
                ? "Choose at least one activity."
                : stage === 1
                  ? "Check the highlighted percentages. Aim for 100% in total."
                  : "Complete frequency and your part in the highlighted activities."}
            </div>
          )}
          <section className="tb-card">
            <h1 ref={heading} tabIndex={-1}>
              {stage === 0 && coverage
                ? "Check for missing work"
                : STEPS[stage]}
            </h1>
            {stage === 0 && (
              <>
                {coverage ? (
                  <>
                    <p>
                      Before continuing, check these groups. Do you also do work
                      here, even occasionally?
                    </p>
                    {processes
                      .filter((p) => !active.some((a) => a.code === p.code))
                      .map((p) => (
                        <section className="tb-process" key={p.code}>
                          <h2>{p.label}</h2>
                          <p>{PROCESS_EXAMPLES[p.code]}</p>
                          <button
                            onClick={() => {
                              setGroups([...new Set([...groups, p.code])]);
                              setCoverage(false);
                            }}
                          >
                            Add work from {p.label.toLowerCase()}
                          </button>
                        </section>
                      ))}
                    {active.length === processes.length && (
                      <p>You have included work from every group.</p>
                    )}
                    <p>
                      Is there work you do that is still missing? Add it below.
                      You can also go back and change your activity selections.
                    </p>
                    <AddBox processCode="other_work" onAdd={add} />
                    <button onClick={() => setCoverage(false)}>
                      Back to group and activity choices
                    </button>
                  </>
                ) : (
                  <>
                    <p>
                      Choose all the groups that include work you do. You can
                      select several. These groups describe work, rather than
                      job titles.
                    </p>
                    <div className="tb-options tb-group-options">
                      {processes.map((p) => (
                        <label key={p.code}>
                          <input
                            aria-label={"Choose group: " + p.label}
                            type="checkbox"
                            checked={
                              groups.includes(p.code) ||
                              active.some((a) => a.code === p.code)
                            }
                            disabled={active.some((a) => a.code === p.code)}
                            onChange={() =>
                              setGroups(
                                groups.includes(p.code)
                                  ? groups.filter((c) => c !== p.code)
                                  : [...groups, p.code],
                              )
                            }
                          />
                          <span>
                            <strong>{p.label}</strong>
                            <small className="tb-activity-help">
                              {PROCESS_EXAMPLES[p.code]}
                            </small>
                            {active.some((a) => a.code === p.code) && (
                              <small className="tb-activity-help">
                                Included. Uncheck individual activities below to
                                remove this group.
                              </small>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                    <details>
                      <summary>
                        Optional search within your chosen groups
                      </summary>
                      <label className="tb-field">
                        <span>Optional activity search</span>
                        <input
                          type="search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </label>
                      <p>
                        You can browse every action below without using search.
                      </p>
                    </details>
                    {processes
                      .filter(
                        (p) =>
                          groups.includes(p.code) ||
                          active.some((a) => a.code === p.code),
                      )
                      .map((p) => (
                        <section className="tb-process" key={p.code}>
                          <h2>{p.label}</h2>
                          <p>
                            Select actions you do, including small or occasional
                            tasks. Similar words can describe the same work.
                            Count it once.
                          </p>
                          <div className="tb-options">
                            {choices
                              .filter(
                                (a) =>
                                  p.codes.includes(a.code) &&
                                  (!search ||
                                    draft.selected.includes(a.code) ||
                                    (a.label + " " + a.example)
                                      .toLowerCase()
                                      .includes(search.toLowerCase())),
                              )
                              .map((a) => (
                                <label key={a.code}>
                                  <input
                                    aria-label={"Select activity: " + a.label}
                                    type="checkbox"
                                    checked={draft.selected.includes(a.code)}
                                    onChange={() =>
                                      setDraft(
                                        selectActivities(
                                          draft,
                                          draft.selected.includes(a.code)
                                            ? draft.selected.filter(
                                                (c) => c !== a.code,
                                              )
                                            : [...draft.selected, a.code],
                                        ),
                                      )
                                    }
                                  />
                                  <span>
                                    {a.label}
                                    <small className="tb-activity-help">
                                      {a.example}
                                    </small>
                                  </span>
                                </label>
                              ))}
                          </div>
                          <AddBox processCode={p.code} onAdd={add} />
                        </section>
                      ))}
                    <h2>Something else, or not sure where it fits?</h2>
                    <p>
                      Add work using your own words. You do not need to know its
                      formal name.
                    </p>
                    <AddBox processCode="other_work" onAdd={add} />
                  </>
                )}
              </>
            )}
            {stage === 1 && (
              <>
                <div className="tb-total" role="status" aria-live="polite">
                  Working time total: {processTotal(draft)}%
                  <progress
                    max={100}
                    value={Math.min(100, processTotal(draft))}
                  />
                  <small>Aim for 100%. Between 98% and 102% is accepted.</small>
                </div>
                <p>
                  In an average month, about how much working time do you spend
                  on each process group? One day each week is about 20%.
                </p>
                <p>
                  Count the same work once. Occasional work can take very little
                  time in an average month; you can mark its importance in the
                  next step.
                </p>
                <p>
                  {draft.selected.length} activities are covered by just{" "}
                  {active.length} percentage entries.
                </p>
                {active.map((p) => (
                  <section key={p.code} className="tb-process">
                    <h2>{p.label}</h2>
                    <p className="tb-compact-text">
                      {choices
                        .filter(
                          (a) =>
                            p.codes.includes(a.code) &&
                            draft.selected.includes(a.code),
                        )
                        .map((a) => a.label)
                        .join("; ")}
                    </p>
                    <label
                      className={
                        "tb-field " +
                        (issues.includes(p.code) ? "tb-invalid" : "")
                      }
                    >
                      <span>{p.label} percentage</span>
                      <div className="tb-percentage">
                        <input
                          aria-invalid={issues.includes(p.code)}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={100}
                          step={1}
                          value={draft.time[p.code] ?? ""}
                          onChange={(e) => {
                            const time = { ...draft.time };
                            if (!e.target.value) delete time[p.code];
                            else time[p.code] = Number(e.target.value);
                            setDraft({ ...draft, time });
                          }}
                        />
                        <span>%</span>
                      </div>
                    </label>
                  </section>
                ))}
              </>
            )}
            {stage === 2 && (
              <>
                <p>
                  Two short answers describe each activity: how often you do it
                  and your part in the work. You do not need to write a task
                  description.
                </p>
                <p>
                  For similar activities, use the group answers below. Review
                  the individual answers and change anything different.
                </p>
                <p role="status">
                  {completed} of {draft.selected.length} activities described.
                </p>
                {active.map((p) => {
                  const codes = p.codes.filter((c) =>
                      draft.selected.includes(c),
                    ),
                    pending = codes.filter(
                      (c) => !completeAnswer(draft.answers[c]),
                    ),
                    b = bulk[p.code] ?? { frequency: "", role: "" };
                  return (
                    <details
                      className="tb-process"
                      key={p.code}
                      open={
                        active.find((group) =>
                          group.codes.some(
                            (code) =>
                              draft.selected.includes(code) &&
                              !completeAnswer(draft.answers[code]),
                          ),
                        )?.code === p.code
                      }
                    >
                      <summary>
                        {p.label}{" "}
                        <small>
                          ({codes.length - pending.length}/{codes.length}{" "}
                          described)
                        </small>
                      </summary>
                      <div className="tb-bulk">
                        <h2>Give the same answers to similar activities</h2>
                        <p>
                          This fills empty answers in this group. Existing
                          answers and importance markers are kept. Change
                          individual answers below if needed.
                        </p>
                        <Choice
                          label={"Group frequency: " + p.label}
                          value={b.frequency}
                          codes={FREQUENCIES}
                          labels={FREQUENCY_LABELS}
                          change={(frequency) =>
                            setBulk({ ...bulk, [p.code]: { ...b, frequency } })
                          }
                        />
                        <Choice
                          label={"Group part in the work: " + p.label}
                          value={b.role}
                          codes={ROLES}
                          labels={ROLE_LABELS}
                          change={(role) =>
                            setBulk({ ...bulk, [p.code]: { ...b, role } })
                          }
                        />
                        <button
                          disabled={!b.frequency || !b.role || !pending.length}
                          onClick={() =>
                            setDraft(
                              applyAnswers(draft, p.code, b.frequency, b.role),
                            )
                          }
                        >
                          Apply to {pending.length} activities with empty
                          answers
                        </button>
                      </div>
                      {codes.map((code) => {
                        const area = choices.find((a) => a.code === code)!,
                          a = draft.answers[code] ?? {
                            frequency: "",
                            role: "",
                            important: false,
                          };
                        return (
                          <article
                            key={code}
                            data-activity={code}
                            className={
                              "tb-activity " +
                              (issues.includes(code) ? "tb-invalid" : "")
                            }
                          >
                            <h3>{area.label}</h3>
                            <div className="tb-answer-pair">
                              <Choice
                                label={"How often? " + area.label}
                                value={a.frequency}
                                codes={FREQUENCIES}
                                labels={FREQUENCY_LABELS}
                                invalid={checked && !a.frequency}
                                change={(v) => answer(code, "frequency", v)}
                              />
                              <Choice
                                label={"Your part: " + area.label}
                                value={a.role}
                                codes={ROLES}
                                labels={ROLE_LABELS}
                                invalid={checked && !a.role}
                                change={(v) => answer(code, "role", v)}
                              />
                            </div>
                            <label className="tb-check">
                              <input
                                type="checkbox"
                                checked={a.important}
                                onChange={(e) =>
                                  answer(code, "important", e.target.checked)
                                }
                              />
                              <span>
                                Important occasional responsibility
                                <small className="tb-activity-help">
                                  Mark this if it needs significant knowledge or
                                  responsibility even though it happens
                                  infrequently.
                                </small>
                              </span>
                            </label>
                          </article>
                        );
                      })}
                      <label className="tb-field">
                        <span>
                          {p.label}: anything unusual or a difficult hand-off?
                          (optional)
                        </span>
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={draft.notes[p.code] ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              notes: {
                                ...draft.notes,
                                [p.code]: e.target.value,
                              },
                            })
                          }
                        />
                        <small>
                          A hand-off is work or information passed between
                          people or teams. Describe the process, without names
                          or individual cases.
                        </small>
                      </label>
                    </details>
                  );
                })}
              </>
            )}
            {stage === 3 && (
              <>
                <p>
                  Every selected activity is included. Time is recorded at
                  process level. No activity-level percentage is inferred.
                </p>
                <div className="tb-review">
                  {STEPS.slice(0, 3).map((label, i) => (
                    <button
                      key={label}
                      onClick={() => {
                        setChecked(false);
                        setStage(i);
                        setCoverage(false);
                      }}
                    >
                      Edit {label.toLowerCase()}
                    </button>
                  ))}
                </div>
                {evidence.processTime.map((p) => (
                  <section className="tb-process" key={p.code}>
                    <h2>
                      {p.label}: {p.percentage}%
                    </h2>
                    {evidence.activities
                      .filter((a) => a.processCode === p.code)
                      .map((a) => (
                        <div className="tb-review-activity" key={a.code}>
                          <strong>{a.label}</strong>
                          <p>
                            {
                              FREQUENCY_LABELS[
                                FREQUENCIES.indexOf(a.frequency ?? "")
                              ]
                            }{" "}
                            · {ROLE_LABELS[ROLES.indexOf(a.role ?? "")]}
                            {a.importantOccasionalWork &&
                              " · Important occasional responsibility"}
                          </p>
                        </div>
                      ))}
                    {draft.notes[p.code] && <p>{draft.notes[p.code]}</p>}
                  </section>
                ))}
                <p>
                  This completes the prototype. No campaign response has been
                  submitted.
                </p>
              </>
            )}
            <footer className="tb-actions">
              {stage > 0 && stage < 3 && (
                <button onClick={() => go(stage - 1)}>Back</button>
              )}
              {stage < 3 && (
                <button className="tb-primary" onClick={() => go(stage + 1)}>
                  {stage === 2 ? "Review answers" : "Continue"}
                </button>
              )}
              {reviewVisited && stage < 3 && (
                <button onClick={() => go(3)}>Return to review</button>
              )}
              {stage === 3 && (
                <button
                  onClick={() => {
                    setDraft(emptyPrototype());
                    setBulk({});
                    setChecked(false);
                    setReviewVisited(false);
                    setStage(0);
                    setGroups([]);
                    setCoverage(false);
                    setSearch("");
                    setAddError("");
                    setStarted(false);
                  }}
                >
                  Restart prototype
                </button>
              )}
            </footer>
          </section>
        </>
      )}
    </main>
  );
}
