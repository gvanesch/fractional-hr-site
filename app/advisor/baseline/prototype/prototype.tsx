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
import Context from "./context";
import ContextReview from "./review";
import {
  emptyRichDraft,
  richIssues,
  richEvidence,
} from "@/lib/baseline/prototype-enrichment";
const LABELS: Record<string, string> = {
  areas: "Your work areas",
  time: "Time across your work",
  contact: "How people contact HR",
  payroll: "Payroll responsibilities",
  context: "Scope and working context",
  review: "Review",
};
export default function Prototype() {
  const [draft, setDraft] = useState(emptyBroadDraft),
    [started, setStarted] = useState(false),
    [stage, setStage] = useState(0),
    [checked, setChecked] = useState(false),
    [reviewVisited, setReviewVisited] = useState(false);
  const [rich, setRich] = useState(emptyRichDraft);
  const payrollVisible = draft.selected.includes("pay_benefits");
  const steps = [
    "areas",
    "time",
    "contact",
    ...(payrollVisible ? ["payroll"] : []),
    "context",
    "review",
  ];
  const reviewStage = steps.length - 1;
  const key = steps[stage];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [stage, started]);
  const active = broadSelected(draft),
    total = broadTotal(draft);
  const validate = (i: number) =>
    i === 0
      ? broadIssues(draft, 0)
      : i === 1
        ? broadIssues(draft, 1)
        : richIssues(rich, steps[i]);
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
          <button className="tb-primary" onClick={() => setStarted(true)}>
            Start with empty answers
          </button>
          <button
            onClick={() => {
              setDraft({
                ...emptyBroadDraft(),
                selected: BROAD_AREAS.filter((a) => a.code !== "other").map(
                  (a) => a.code,
                ),
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
                  ? "Check the highlighted percentages. Aim for 100% in total."
                  : "Please check the highlighted answers. Percentage totals should be about 100%."}
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
                  {BROAD_AREAS.map((a) => (
                    <label key={a.code}>
                      <input
                        type="checkbox"
                        aria-label={a.label}
                        checked={draft.selected.includes(a.code)}
                        onChange={() => setDraft(toggleBroad(draft, a.code))}
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
                  starter’s record belongs in lifecycle support; configuring a
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
                areas={active}
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
                {broadEvidence(draft).workAreas.map((a) => (
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
