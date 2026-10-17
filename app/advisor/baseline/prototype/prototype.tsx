"use client";
import Depth, { DepthReview } from "./depth";
import { emptyDepth, depthIssues } from "@/lib/baseline/depth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  emptyManagementTime,
  managementTimeIssues,
} from "@/lib/baseline/management-time-preview";
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
import {
  FROZEN_COLLECTION_VERSION,
  DEPTH_COLLECTION_VERSION,
  isRevisedCollection,
  collectionSteps,
  type CollectionDraft,
} from "@/lib/baseline/collection";
import Info from "./info";
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
  coverage: "Countries and businesses supported",
  work_detail: "Work activities and delivery",
  role_capacity: "Responsibility, demand and capacity",
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
  savedCollection,
  saveCollection,
  endCollectionSession,
}: {
  tester?: string;
  technologyPreview?: boolean;
  managerRecord?: ManagerRecord;
  savedCollection?: {
    draft: CollectionDraft;
    progress: number;
    status: string;
    campaign: { privacy: string; closed: boolean; copyPreview?: boolean };
    copyStatus?: string | null;
  };
  endCollectionSession?: () => Promise<void>;
  saveCollection?: (
    draft: CollectionDraft,
    progress: number,
    submit?: boolean,
  ) => Promise<unknown>;
} = {}) {
  const [draft, setDraft] = useState(
      savedCollection?.draft.broad ?? emptyBroadDraft,
    ),
    [started, setStarted] = useState(savedCollection?.draft.started ?? false),
    [stage, setStage] = useState(() =>
      savedCollection?.draft.version === DEPTH_COLLECTION_VERSION
        ? Math.max(
            0,
            collectionSteps(
              savedCollection.draft,
              managerRecord ?? { isPeopleManager: false },
            ).indexOf(savedCollection.draft.depth?.resumeStep ?? "areas"),
          )
        : Math.min(savedCollection?.progress ?? 0, 7),
    ),
    [checked, setChecked] = useState(false),
    [reviewVisited, setReviewVisited] = useState(false);
  const areas = managerRecord?.isPeopleManager
    ? [
        ...BROAD_AREAS.filter((a) => a.code !== "other"),
        MANAGEMENT_AREA,
        ...BROAD_AREAS.filter((a) => a.code === "other"),
      ]
    : BROAD_AREAS;
  const [management, setManagement] = useState(
    savedCollection?.draft.management ?? emptyManagement,
  );
  const revised =
    !saveCollection || isRevisedCollection(savedCollection?.draft.version);
  const expanded = savedCollection?.draft.version === DEPTH_COLLECTION_VERSION;
  const [depth, setDepth] = useState(
    savedCollection?.draft.depth ?? emptyDepth,
  );
  const [managementTime, setManagementTime] = useState(
    savedCollection?.draft.managementTime ?? emptyManagementTime,
  );
  const showManagement = managementVisible(managerRecord, draft.selected);
  const [rich, setRich] = useState(
    () =>
      savedCollection?.draft.rich ?? { ...emptyRichDraft(), payroll: "yes" },
  );
  const [technology, setTechnology] = useState(
    savedCollection?.draft.technology ?? emptyTechnology,
  );
  const showTechnology = technologyVisible(technologyPreview, draft.selected);
  const payrollVisible = draft.selected.includes("pay_benefits");
  const steps = [
    "areas",
    "time",
    ...(expanded ? ["coverage", "work_detail"] : []),
    "contact",
    ...(payrollVisible ? ["payroll"] : []),
    ...(showManagement ? ["management"] : []),
    "context",
    ...(showTechnology ? ["technology"] : []),
    ...(expanded ? ["role_capacity"] : []),
    "review",
  ];
  const resumeStep = String(steps[Math.min(stage, steps.length - 1)]);
  const savedProgress = expanded
    ? Math.round((Math.min(stage, steps.length - 1) * 7) / (steps.length - 1))
    : Math.min(stage, steps.length - 1);
  const [answerCopy, setAnswerCopy] = useState(
      savedCollection?.draft.answerCopy ?? false,
    ),
    [accepted, setAccepted] = useState(savedCollection?.draft.started ?? false),
    [submitted, setSubmitted] = useState(
      savedCollection?.status === "completed",
    ),
    [saveState, setSaveState] = useState("Saved securely"),
    [saveError, setSaveError] = useState(""),
    [copyDelivery, setCopyDelivery] = useState<string | null>(
      savedCollection?.copyStatus ?? null,
    );
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const payload: CollectionDraft = useMemo(
    () => ({
      version: savedCollection?.draft.version ?? FROZEN_COLLECTION_VERSION,
      ...(revised ? { managementTime } : {}),
      ...(expanded ? { depth: { ...depth, resumeStep } } : {}),
      broad: draft,
      rich,
      technology,
      management,
      started,
      answerCopy,
    }),
    [
      draft,
      rich,
      technology,
      management,
      started,
      answerCopy,
      revised,
      managementTime,
      savedCollection?.draft.version,
      expanded,
      depth,
      resumeStep,
    ],
  );
  const persistedPayload = useRef(
    JSON.stringify(savedCollection?.draft ?? payload),
  );
  const currentStage = Math.min(stage, steps.length - 1);
  useEffect(() => {
    if (
      !saveCollection ||
      !started ||
      submitted ||
      savedCollection?.campaign.closed
    )
      return;
    pendingSave.current = setTimeout(() => {
      setSaveState("Saving…");
      void saveCollection(payload, savedProgress)
        .then(() => {
          persistedPayload.current = JSON.stringify(payload);
          setSaveState("Saved securely");
          setSaveError("");
        })
        .catch((e) => {
          setSaveState("Save needs attention");
          setSaveError(e.message);
        });
    }, 700);
    return () => {
      if (pendingSave.current) clearTimeout(pendingSave.current);
    };
  }, [
    payload,
    started,
    currentStage,
    savedProgress,
    submitted,
    saveCollection,
    savedCollection?.campaign.closed,
  ]);
  useEffect(() => {
    if (!saveCollection || submitted) return;
    const leave = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(payload) !== persistedPayload.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [payload, saveCollection, submitted]);
  const reviewStage = steps.length - 1;
  const key = steps[currentStage];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [stage, started]);
  const active = broadSelected(draft, areas),
    total = broadTotal(draft, areas);
  const validate = (i: number) =>
    expanded && ["coverage", "work_detail", "role_capacity"].includes(steps[i])
      ? depthIssues(depth, draft.selected, steps[i])
      : i === 0
        ? broadIssues(draft, 0, areas)
        : i === 1
          ? [
              ...broadIssues(draft, 1, areas),
              ...richIssues(rich, "time_nature", draft.selected),
            ]
          : steps[i] === "management"
            ? revised
              ? managementTimeIssues(managementTime)
              : managementIssues(management)
            : steps[i] === "technology"
              ? technologyIssues(technology)
              : richIssues(rich, steps[i], draft.selected).filter(
                  (issue) =>
                    !revised ||
                    steps[i] !== "context" ||
                    issue !== "localNeeds",
                );
  const issues = checked ? validate(currentStage) : [];
  function go(next: number) {
    const invalid =
      next === reviewStage
        ? steps
            .slice(0, reviewStage)
            .findIndex((_, i) => validate(i).length > 0)
        : next > stage && validate(currentStage).length
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
  if (saveCollection && (submitted || savedCollection?.campaign.closed))
    return (
      <main className="tb-shell tb-prototype">
        <header className="tb-header">
          <span>team.blue · Current work baseline</span>
          <small className="tb-hosted-by">Hosted by Van Esch Advisory</small>
        </header>
        <section className="tb-card">
          <h1>
            {submitted
              ? "Thank you. Your answers have been submitted."
              : "The collection period has ended."}
          </h1>
          <p>Your answers are saved securely.</p>
          {endCollectionSession && (
            <button
              onClick={() =>
                void endCollectionSession().catch((e) =>
                  setSaveError(e.message),
                )
              }
            >
              Sign out
            </button>
          )}
          {submitted && answerCopy && (
            <p>
              {savedCollection?.campaign.copyPreview !== false
                ? "Your answer-copy preference has been saved. QA email delivery remains in preview mode."
                : copyDelivery === "sent"
                  ? "A copy has been emailed to the address used for your invitation."
                  : "Your answer copy is queued for delivery."}
            </p>
          )}
          {broadEvidence(draft, areas).workAreas.map((a) => (
            <p key={a.code}>
              {a.label}: {a.percentage}%
            </p>
          ))}
        </section>
      </main>
    );
  return (
    <main className="tb-shell tb-prototype">
      {!saveCollection && (
        <aside className="tb-prototype-note">
          {tester ? `${tester} · Private design test` : "QA design test"} · Use
          example answers only. Answers stay in this page and reset on refresh.
        </aside>
      )}
      {endCollectionSession && (
        <button
          disabled={saveState === "Signing out…"}
          onClick={() => {
            if (pendingSave.current) clearTimeout(pendingSave.current);
            setSaveState("Signing out…");
            void (
              started && saveCollection
                ? saveCollection(payload, savedProgress)
                : Promise.resolve()
            )
              .then(() => {
                persistedPayload.current = JSON.stringify(payload);
                return endCollectionSession();
              })
              .catch((e) => {
                setSaveState("Save needs attention");
                setSaveError(e.message);
              });
          }}
        >
          Save and sign out
        </button>
      )}
      {saveCollection && (
        <p role="status" className="tb-save">
          {saveState}
        </p>
      )}
      {saveError && (
        <p role="alert" className="tb-error">
          {saveError} Keep this page open and try again.
          <button
            onClick={() => {
              setSaveState("Saving…");
              void saveCollection?.(payload, savedProgress)
                .then(() => {
                  setSaveState("Saved securely");
                  setSaveError("");
                })
                .catch((e) => setSaveError(e.message));
            }}
          >
            Retry save
          </button>
        </p>
      )}
      <header className="tb-header">
        <span>team.blue · Current work baseline</span>
        <small className="tb-hosted-by">Hosted by Van Esch Advisory</small>
        <p>
          Understand current work, protect strengths and improve how we work.
        </p>
      </header>
      {!started ? (
        <section className="tb-card">
          <h1>
            {expanded
              ? "Your current work and delivery"
              : "A simple picture of your current work"}
          </h1>
          <p>
            {expanded
              ? "Start with your work areas and time split. Then describe the activities you actually do, countries and businesses you support, local requirements, responsibilities and workload."
              : "Choose the broad areas you work on, then estimate the time you spend in each area."}
          </p>
          <p>
            The examples help explain each area. Select an area when it
            describes some of your regular work.{" "}
            {expanded
              ? "Later questions ask for detail only about the areas you select."
              : "Your answers describe broad areas of work."}
          </p>
          {!saveCollection && (
            <p>
              This design test adds contact routes, payroll responsibilities and
              working context. It does not collect a campaign response.
            </p>
          )}
          {saveCollection && (
            <section className="tb-process">
              <h2>How your answers will be used</h2>
              <p>{savedCollection?.campaign.privacy}</p>
              <label className="tb-check">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                I understand how my answers will be used.
              </label>
            </section>
          )}
          <p className="tb-estimate">
            {expanded
              ? "Allow around 25–40 minutes for the detailed questions, and longer for a broad role. You can save and return."
              : "Most people will complete this in around 10–15 minutes. If your role covers a broad range of People activities, it may take closer to 20–30 minutes."}
          </p>
          {saveCollection && (
            <p>
              Your answers save as you go. Use your private invitation to return
              later.
            </p>
          )}
          <button
            className="tb-primary"
            disabled={Boolean(saveCollection) && !accepted}
            onClick={() => setStarted(true)}
          >
            {saveCollection ? "Start assessment" : "Start with empty answers"}
          </button>
          {!saveCollection && (
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
          )}
        </section>
      ) : (
        <>
          <nav className="tb-progress" aria-label="Assessment progress">
            <span>
              Step {currentStage + 1} of {steps.length}
            </span>
            <progress max={steps.length} value={currentStage + 1} />
            <span>{active.length} work areas</span>
          </nav>
          {issues.length > 0 && (
            <div role="alert" className="tb-error">
              {!active.length
                ? "Choose at least one work area."
                : currentStage === 1
                  ? issues.some((i) => !i.startsWith("nature_"))
                    ? "Check the highlighted time estimates and answers. Aim for 100% in total."
                    : "Choose the type of work in the highlighted areas."
                  : key === "management"
                    ? issues.some((i) => i.startsWith("time_"))
                      ? "Check the highlighted management time estimates. Aim for 100% of your management time. Answer any other highlighted questions."
                      : "Please answer the highlighted questions about managing your team."
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
                  {expanded
                    ? "Select broad areas here. Later questions ask which activities you actually do within each area."
                    : "The examples are there to help you recognise the area. There are no individual tasks to select."}
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
            {currentStage === 1 && (
              <>
                <p>
                  In a typical month, about how much of your working time is
                  spent in each area?
                </p>
                <p>
                  This does not need to be exact. Think about an average month.
                  About one day each week is 20%. Count each piece of work once.
                </p>
                <div className="tb-question-label">
                  <span>Estimating your time</span>
                  <Info label="Estimating your time">
                    Think about an average month. One day each week is about
                    20%. Count each activity once, in the area that best
                    describes it.
                  </Info>
                </div>
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
            {expanded &&
              ["coverage", "work_detail", "role_capacity"].includes(key) && (
                <Depth
                  step={key}
                  draft={depth}
                  selected={draft.selected}
                  issues={issues}
                  change={(patch) => setDepth({ ...depth, ...patch })}
                />
              )}
            {["contact", "payroll", "context"].includes(key) && (
              <Context
                step={key}
                directPayroll={revised}
                focusedLocalContext={revised}
                draft={rich}
                change={(patch) => setRich({ ...rich, ...patch })}
                issues={issues}
              />
            )}
            {key === "management" && (
              <Management
                draft={management}
                timeDraft={revised ? managementTime : undefined}
                timeChange={
                  revised
                    ? (patch) =>
                        setManagementTime({ ...managementTime, ...patch })
                    : undefined
                }
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
                  {expanded
                    ? "Review your work areas, activities and delivery evidence. Selecting a broad area does not mean you do every example within it."
                    : "This is the broad picture of your work. Selecting an area does not mean you do every example listed within it."}
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
                  focusedLocalContext={revised}
                  evidence={richEvidence(rich, draft.selected, payrollVisible)}
                />
                {showManagement && (
                  <ManagementReview
                    draft={management}
                    timeDraft={revised ? managementTime : undefined}
                    workingShare={draft.time.people_management ?? 0}
                  />
                )}
                {showTechnology && <TechnologyReview draft={technology} />}
                {expanded && (
                  <DepthReview draft={depth} selected={draft.selected} />
                )}
                {saveCollection ? (
                  <>
                    <p>Review your answers, then submit them.</p>
                    <label className="tb-check">
                      <input
                        type="checkbox"
                        checked={answerCopy}
                        onChange={(e) => setAnswerCopy(e.target.checked)}
                      />
                      I would like a copy sent to the email address used for my
                      invitation.
                    </label>
                    <p className="tb-compact-text">
                      {savedCollection?.campaign.copyPreview === false
                        ? "Your copy will go to the email address used for this invitation."
                        : "This test records your preference; answer-copy delivery remains in preview mode."}
                    </p>
                    <button
                      className="tb-primary"
                      disabled={saveState === "Submitting…"}
                      onClick={() => {
                        if (pendingSave.current)
                          clearTimeout(pendingSave.current);
                        setSaveState("Submitting…");
                        void saveCollection(payload, 8, true)
                          .then((result) => {
                            persistedPayload.current = JSON.stringify(payload);
                            setCopyDelivery(
                              (result as { copyStatus?: string | null })
                                ?.copyStatus ?? null,
                            );
                            setSubmitted(true);
                          })
                          .catch((e) => {
                            setSaveState("Submission needs attention");
                            setSaveError(e.message);
                          });
                      }}
                    >
                      Submit answers
                    </button>
                  </>
                ) : (
                  <p>
                    This completes the prototype. No campaign response has been
                    submitted.
                  </p>
                )}
              </>
            )}
            <footer className="tb-actions">
              {currentStage > 0 && currentStage < reviewStage && (
                <button onClick={() => go(currentStage - 1)}>Back</button>
              )}
              {currentStage < reviewStage && (
                <button
                  className="tb-primary"
                  onClick={() => go(currentStage + 1)}
                >
                  {currentStage === reviewStage - 1
                    ? "Review answers"
                    : "Continue"}
                </button>
              )}
              {reviewVisited && currentStage < reviewStage && (
                <button onClick={() => go(reviewStage)}>
                  Return to review
                </button>
              )}
              {key === "review" && !saveCollection && (
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
