"use client";
import { useEffect, useRef, useState } from "react";
import {
  BROAD_AREAS,
  emptyBroadDraft,
  broadSelected,
  broadTotal,
  toggleBroad,
  broadIssues,
  broadEvidence,
} from "@/lib/baseline/broad-prototype";
import "@/app/baseline/start/style.css";
import "./prototype.css";
import Context, { Pick } from "./context";
import ContextReview from "./review";
import {
  emptyRichDraft,
  richIssues,
  richEvidence,
  richError,
  NATURE_AREAS,
  WORK_NATURE,
} from "@/lib/baseline/prototype-enrichment";
import Technology, { TechnologyReview } from "./technology";
import {
  emptyTechnology,
  technologyVisible,
  technologyIssues,
} from "@/lib/baseline/technology-prototype";
import Management, { ManagementReview } from "./management";
import {
  MANAGEMENT_AREA,
  emptyManagement,
  managementVisible,
  managementIssues,
  type ManagerRecord,
} from "@/lib/baseline/management-prototype";
const LABELS: Record<string, string> = {
  areas: "Your work areas",
  time: "Time across your work",
  contact: "How people contact you or your team",
  payroll: "Payroll responsibilities",
  context: "A few final questions",
  technology: "Your technology work",
  management: "Managing your team",
  review: "Review",
};
export default function Prototype({
  tester,
  technologyPreview = false,
  managerRecord,
}: {
  tester?: string;
  technologyPreview?: boolean;
  managerRecord?: ManagerRecord;
} = {}) {
  const [draft, setDraft] = useState(emptyBroadDraft),
    [started, setStarted] = useState(false),
    [stage, setStage] = useState(0),
    [checked, setChecked] = useState(false),
    [reviewVisited, setReviewVisited] = useState(false);
  const areas = managerRecord?.isPeopleManager
    ? [
        ...BROAD_AREAS.filter((a) => a.code !== "other"),
        MANAGEMENT_AREA,
        ...BROAD_AREAS.filter((a) => a.code === "other"),
      ]
    : BROAD_AREAS;
  const [management, setManagement] = useState(emptyManagement);
  const showManagement = managementVisible(managerRecord, draft.selected);
  const [rich, setRich] = useState(emptyRichDraft);
  const [technology, setTechnology] = useState(emptyTechnology);
  const showTechnology = technologyVisible(technologyPreview, draft.selected);
  const payrollVisible = draft.selected.includes("pay_benefits");
  const steps = [
    "areas",
    "time",
    "contact",
    ...(payrollVisible ? ["payroll"] : []),
    ...(showManagement ? ["management"] : []),
    "context",
    ...(showTechnology ? ["technology"] : []),
    "review",
  ];
  const reviewStage = steps.length - 1;
  const key = steps[stage];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [stage, started]);
  const active = broadSelected(draft, areas),
    total = broadTotal(draft, areas);
  const validate = (i: number) =>
    i === 0
      ? broadIssues(draft, 0, areas)
      : i === 1
        ? [
            ...broadIssues(draft, 1, areas),
            ...richIssues(rich, "time_nature", draft.selected),
          ]
        : steps[i] === "management"
          ? managementIssues(management)
          : steps[i] === "technology"
            ? technologyIssues(technology)
            : richIssues(rich, steps[i], draft.selected);
  const issues = checked ? validate(stage) : [];
  function go(next: number) {
    const invalid =
      next === reviewStage
        ? steps
            .slice(0, reviewStage)
            .findIndex((_, i) => validate(i).length > 0)
        : next > stage && validate(stage).length
          ? stage
          : -1;
    if (invalid >= 0) {
      setStage(invalid);
      setChecked(true);
      window.scrollTo({ top: 0 });
      return;
    }
    setStage(next);
    setChecked(false);
    if (next === reviewStage) setReviewVisited(true);
  }
  return (
    <main className="tb-shell tb-prototype">
      <aside className="tb-prototype-note">
        {tester ? `${tester} · Private design test` : "QA design test"} · Use
        example answers only. Answers stay in this page and reset on refresh.
      </aside>
      <header className="tb-header">
        <span>team.blue · Current work baseline</span>
        <p>
          Understand current work, protect strengths and improve how we work.
        </p>
      </header>
      {!started ? (
        <section className="tb-card">
          <h1>A simple picture of your current work</h1>
          <p>
            Choose the broad areas you work on, then estimate the time you spend
            in each area.
          </p>
          <p>
            The examples help explain each area. You do not need to do every
            example to select it. You will not be asked to list or describe
            every task.
          </p>
          <p>
            This design test adds contact routes, payroll responsibilities and
            working context. It does not collect a campaign response.
          </p>
          <p className="tb-estimate">
            Most people will complete this in around 10–15 minutes. If your role
            covers a broad range of People activities, it may take closer to
            20–30 minutes.
          </p>
          <button className="tb-primary" onClick={() => setStarted(true)}>
            Start with empty answers
          </button>
          <button
            onClick={() => {
              setDraft({
                ...emptyBroadDraft(),
                selected: areas
                  .filter((a) => a.code !== "other")
                  .map((a) => a.code),
              });
              setStarted(true);
            }}
          >
            Try a broad example
          </button>
        </section>
      ) : (
        <>
          <nav className="tb-progress" aria-label="Prototype progress">
            <span>
              Step {stage + 1} of {steps.length}
            </span>
            <progress max={steps.length} value={stage + 1} />
            <span>{active.length} work areas</span>
          </nav>
          {issues.length > 0 && (
            <div role="alert" className="tb-error">
              {!active.length
                ? "Choose at least one work area."
                : stage === 1
                  ? issues.some((i) => !i.startsWith("nature_"))
                    ? "Check the highlighted time estimates and answers. Aim for 100% in total."
                    : "Choose the type of work in the highlighted areas."
                  : key === "management"
                    ? "Please answer the highlighted questions about managing your team."
                    : key === "technology"
                      ? issues.some((i) => i.startsWith("time_"))
                        ? "Check the highlighted technology time estimates. Aim for 100% of your technology time. Answer any other highlighted questions."
                        : "Please answer the highlighted technology questions. Choose Not sure where needed."
                      : richError(key, issues)}
            </div>
          )}
          <section className="tb-card">
            <h1 ref={heading} tabIndex={-1}>
              {LABELS[key]}
            </h1>
            {stage === 0 && (
              <>
                <p>Which areas include work you do? Select all that apply.</p>
                <p>
                  <strong>
                    You only need to do some of the work described.
                  </strong>{" "}
                  The examples are there to help you recognise the area. There
                  are no individual tasks to select.
                </p>
                <div
                  className={
                    issues.length ? "tb-options tb-invalid" : "tb-options"
                  }
                >
                  {areas.map((a) => (
                    <label key={a.code}>
                      <input
                        type="checkbox"
                        aria-label={a.label}
                        checked={draft.selected.includes(a.code)}
                        onChange={() =>
                          setDraft(toggleBroad(draft, a.code, areas))
                        }
                      />
                      <span>
                        <strong>{a.label}</strong>
                        <small className="tb-activity-help">{a.examples}</small>
                      </span>
                    </label>
                  ))}
                </div>
                <p>
                  Do not count the same work twice. For example, entering a new
                  starter’s record belongs in lifecycle support. Configuring a
                  system belongs in systems, data and improvement.
                </p>
              </>
            )}
            {stage === 1 && (
              <>
                <p>
                  In a typical month, about how much of your working time is
                  spent in each area?
                </p>
                <p>
                  This does not need to be exact. Think about an average month.
                  About one day each week is 20%. Count each piece of work once.
                </p>
                <div className="tb-total" aria-live="polite">
                  Total: {total}%
                  <progress
                    max={100}
                    value={Math.min(100, Math.max(0, total))}
                  />
                  <small>Aim for 100% in total.</small>
                </div>
                {active.map((a) => (
                  <section
                    key={a.code}
                    className={
                      "tb-process" +
                      (issues.includes(a.code) ? " tb-invalid" : "")
                    }
                  >
                    <h2>{a.label}</h2>
                    <p className="tb-compact-text">{a.examples}</p>
                    <label className="tb-field">
                      <span>Time spent: {a.label}</span>
                      <div className="tb-percentage">
                        <input
                          aria-label={"Time spent: " + a.label}
                          aria-invalid={issues.includes(a.code)}
                          type="number"
                          min={0}
                          max={100}
                          step="any"
                          inputMode="decimal"
                          value={
                            Number.isFinite(draft.time[a.code])
                              ? draft.time[a.code]
                              : ""
                          }
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              time: {
                                ...draft.time,
                                [a.code]:
                                  e.target.value === ""
                                    ? NaN
                                    : Number(e.target.value),
                              },
                            })
                          }
                        />
                        <span>%</span>
                      </div>
                    </label>
                    {NATURE_AREAS.includes(a.code) && (
                      <Pick
                        label={"Main type of work: " + a.label}
                        value={rich.workNature[a.code] ?? ""}
                        options={WORK_NATURE}
                        invalid={issues.includes("nature_" + a.code)}
                        change={(value) =>
                          setRich({
                            ...rich,
                            workNature: { ...rich.workNature, [a.code]: value },
                          })
                        }
                      />
                    )}
                    <details>
                      <summary>Add a short note (optional)</summary>
                      <label className="tb-field">
                        <span>
                          Anything useful to clarify about{" "}
                          {a.label.toLowerCase()}?
                        </span>
                        <textarea
                          maxLength={500}
                          value={draft.notes[a.code] ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              notes: {
                                ...draft.notes,
                                [a.code]: e.target.value,
                              },
                            })
                          }
                        />
                        <small>
                          For example, a particular responsibility or part of
                          this area that you do. Do not include names or details
                          of individual employee cases.
                        </small>
                      </label>
                    </details>
                  </section>
                ))}
                <label className="tb-field">
                  <span>
                    Any important work that this typical month misses?
                    (optional)
                  </span>
                  <textarea
                    maxLength={1000}
                    aria-label="Any important work that this typical month misses? (optional)"
                    value={draft.occasional}
                    onChange={(e) =>
                      setDraft({ ...draft, occasional: e.target.value })
                    }
                  />
                  <small>
                    For example, annual pay activity, audits, an office move or
                    a major system project. A short answer is enough.
                  </small>
                </label>
              </>
            )}
            {["contact", "payroll", "context"].includes(key) && (
              <Context
                step={key}
                draft={rich}
                change={(patch) => setRich({ ...rich, ...patch })}
                issues={issues}
              />
            )}
            {key === "management" && (
              <Management
                draft={management}
                change={(patch) => setManagement({ ...management, ...patch })}
                issues={issues}
              />
            )}
            {key === "technology" && (
              <Technology
                draft={technology}
                change={(patch) => setTechnology({ ...technology, ...patch })}
                issues={issues}
                regularSystems={rich.systems}
                regularOtherSystems={rich.otherSystems}
              />
            )}
            {key === "review" && (
              <>
                <p>
                  This is the broad picture of your work. Selecting an area does
                  not mean you do every example listed within it.
                </p>
                <div className="tb-review">
                  {steps.slice(0, reviewStage).map((step, i) => (
                    <button key={step} onClick={() => go(i)}>
                      Edit {LABELS[step].toLowerCase()}
                    </button>
                  ))}
                </div>
                {broadEvidence(draft, areas).workAreas.map((a) => (
                  <section className="tb-process tb-review-area" key={a.code}>
                    <h2>
                      {a.label}: {a.percentage}%
                    </h2>
                    {a.respondentNote && <p>{a.respondentNote}</p>}
                  </section>
                ))}
                {draft.occasional && (
                  <section className="tb-process">
                    <h2>Important work outside a typical month</h2>
                    <p>{draft.occasional}</p>
                  </section>
                )}
                <ContextReview
                  evidence={richEvidence(rich, draft.selected, payrollVisible)}
                />
                {showManagement && <ManagementReview draft={management} />}
                {showTechnology && <TechnologyReview draft={technology} />}
                <p>
                  This completes the prototype. No campaign response has been
                  submitted.
                </p>
              </>
            )}
            <footer className="tb-actions">
              {stage > 0 && stage < reviewStage && (
                <button onClick={() => go(stage - 1)}>Back</button>
              )}
              {stage < reviewStage && (
                <button className="tb-primary" onClick={() => go(stage + 1)}>
                  {stage === reviewStage - 1 ? "Review answers" : "Continue"}
                </button>
              )}
              {reviewVisited && stage < reviewStage && (
                <button onClick={() => go(reviewStage)}>
                  Return to review
                </button>
              )}
              {key === "review" && (
                <button
                  onClick={() => {
                    setDraft(emptyBroadDraft());
                    setRich(emptyRichDraft());
                    setTechnology(emptyTechnology());
                    setManagement(emptyManagement());
                    setStage(0);
                    setStarted(false);
                    setChecked(false);
                    setReviewVisited(false);
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
