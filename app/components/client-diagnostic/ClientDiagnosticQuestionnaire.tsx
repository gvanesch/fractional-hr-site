"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  dimensionDefinitions,
  getQuestionsForDimension,
  type DimensionKey,
  type ProbeQuestion,
  type QuestionnaireType,
  type ScoreAnswerValue,
  type ScoreQuestion,
} from "@/lib/client-diagnostic/question-bank";

type ClientDiagnosticQuestionnaireProps = {
  questionnaireType: QuestionnaireType;
  projectId?: string;
  participantId?: string;
  inviteToken?: string;
  questionnaireTitle: string;
  questionnaireIntro: string;
};

type PreparedResponse =
  | {
      questionId: string;
      dimension: DimensionKey;
      kind: "score";
      value: ScoreAnswerValue;
    }
  | {
      questionId: string;
      dimension: DimensionKey;
      kind: "probe";
      value: string;
    };

type PreparedSubmission = {
  questionnaireType: QuestionnaireType;
  preparedAt: string;
  responses: PreparedResponse[];
};

type SubmitState = "idle" | "submitting" | "success" | "error";

type SubmitResult = {
  success: boolean;
  message?: string;
  error?: string;
  savedResponseCount?: number;
};

const WELCOME_STEP = 0;
const FIRST_DIMENSION_STEP = 1;
const REVIEW_STEP = dimensionDefinitions.length + 1;

function isUuid(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isReasonableInviteToken(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length >= 16;
}

export default function ClientDiagnosticQuestionnaire({
  questionnaireType,
  projectId,
  participantId,
  inviteToken,
  questionnaireTitle,
  questionnaireIntro,
}: ClientDiagnosticQuestionnaireProps) {
  const [scoreAnswers, setScoreAnswers] = useState<
    Record<string, ScoreAnswerValue | undefined>
  >({});
  const [probeAnswers, setProbeAnswers] = useState<Record<string, string>>({});
  const [preparedSubmission, setPreparedSubmission] =
    useState<PreparedSubmission | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(WELCOME_STEP);
  const [editingFromReview, setEditingFromReview] = useState(false);

  const questionnaireTopRef = useRef<HTMLDivElement | null>(null);

  const hasValidSubmissionContext =
    isUuid(projectId) &&
    isUuid(participantId) &&
    isReasonableInviteToken(inviteToken);

  const draftStorageKey = `client-diagnostic-draft:${questionnaireType}:${projectId ?? "unknown"}:${participantId ?? "unknown"}`;

  const allQuestions = useMemo(() => {
    return dimensionDefinitions.flatMap((dimension) =>
      getQuestionsForDimension(questionnaireType, dimension.key),
    );
  }, [questionnaireType]);

  const scoreQuestions = useMemo(() => {
    return allQuestions.filter(
      (question): question is ScoreQuestion => question.kind === "score",
    );
  }, [allQuestions]);

  const probeQuestions = useMemo(() => {
    return allQuestions.filter(
      (question): question is ProbeQuestion => question.kind === "probe",
    );
  }, [allQuestions]);

  const completedRequiredCount = useMemo(() => {
    return scoreQuestions.filter((question) => scoreAnswers[question.id]).length;
  }, [scoreAnswers, scoreQuestions]);

  const completedProbeCount = useMemo(() => {
    return probeQuestions.filter((question) =>
      Boolean(probeAnswers[question.id]?.trim()),
    ).length;
  }, [probeAnswers, probeQuestions]);

  const completionPercentage =
    scoreQuestions.length === 0
      ? 0
      : Math.round((completedRequiredCount / scoreQuestions.length) * 100);

  const isReadyToSubmit =
    hasValidSubmissionContext &&
    scoreQuestions.length > 0 &&
    completedRequiredCount === scoreQuestions.length;

  const activeDimension =
    currentStep >= FIRST_DIMENSION_STEP && currentStep < REVIEW_STEP
      ? dimensionDefinitions[currentStep - FIRST_DIMENSION_STEP]
      : null;

  const activeQuestions = useMemo(() => {
    if (!activeDimension) {
      return [];
    }

    return getQuestionsForDimension(questionnaireType, activeDimension.key);
  }, [activeDimension, questionnaireType]);

  const activeScoreQuestions = useMemo(() => {
    return activeQuestions.filter(
      (question): question is ScoreQuestion => question.kind === "score",
    );
  }, [activeQuestions]);

  const completedActiveScoreCount = useMemo(() => {
    return activeScoreQuestions.filter(
      (question) => scoreAnswers[question.id],
    ).length;
  }, [activeScoreQuestions, scoreAnswers]);

  const isActiveDimensionComplete =
    activeScoreQuestions.length > 0 &&
    completedActiveScoreCount === activeScoreQuestions.length;

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(draftStorageKey);

      if (savedDraft) {
        const parsed = JSON.parse(savedDraft) as {
          scoreAnswers?: Record<string, ScoreAnswerValue>;
          probeAnswers?: Record<string, string>;
        };

        setScoreAnswers(parsed.scoreAnswers ?? {});
        setProbeAnswers(parsed.probeAnswers ?? {});
      } else {
        setScoreAnswers({});
        setProbeAnswers({});
      }
    } catch (error) {
      console.error("Unable to load questionnaire draft.", error);
    } finally {
      setIsHydrated(true);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          scoreAnswers,
          probeAnswers,
        }),
      );
    } catch (error) {
      console.error("Unable to save questionnaire draft.", error);
    }
  }, [draftStorageKey, isHydrated, probeAnswers, scoreAnswers]);

  function scrollToQuestionnaireTop() {
    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }, 40);
  }

  function goToStep(step: number) {
    const boundedStep = Math.max(
      WELCOME_STEP,
      Math.min(REVIEW_STEP, step),
    );

    setCurrentStep(boundedStep);
    setSubmitState("idle");
    setSubmitMessage("");
    scrollToQuestionnaireTop();
  }

  function handleScoreChange(questionId: string, value: ScoreAnswerValue) {
    setScoreAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  function handleProbeChange(questionId: string, value: string) {
    setProbeAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  function buildPreparedSubmission(): PreparedSubmission {
    const responses: PreparedResponse[] = [];

    for (const question of allQuestions) {
      if (question.kind === "score") {
        const value = scoreAnswers[question.id];

        if (value) {
          responses.push({
            questionId: question.id,
            dimension: question.dimension,
            kind: "score",
            value,
          });
        }

        continue;
      }

      const probeValue = probeAnswers[question.id]?.trim();

      if (probeValue) {
        responses.push({
          questionId: question.id,
          dimension: question.dimension,
          kind: "probe",
          value: probeValue,
        });
      }
    }

    return {
      questionnaireType,
      preparedAt: new Date().toISOString(),
      responses,
    };
  }

  function handleContinueFromDimension() {
    if (!isActiveDimensionComplete) {
      return;
    }

    if (currentStep === dimensionDefinitions.length) {
      setPreparedSubmission(buildPreparedSubmission());
      setEditingFromReview(false);
      goToStep(REVIEW_STEP);
      return;
    }

    goToStep(currentStep + 1);
  }

  function handleReturnToReview() {
    setPreparedSubmission(buildPreparedSubmission());
    setEditingFromReview(false);
    goToStep(REVIEW_STEP);
  }

  async function handleSubmitDiagnostic() {
    if (!hasValidSubmissionContext) {
      setSubmitState("error");
      setSubmitMessage(
        "This diagnostic link is missing the required project, participant, or invite token context.",
      );
      return;
    }

    if (!isReadyToSubmit) {
      setSubmitState("error");
      setSubmitMessage(
        "Please complete all scored questions before submitting the diagnostic.",
      );
      return;
    }

    const submission = buildPreparedSubmission();

    setPreparedSubmission(submission);
    setSubmitState("submitting");
    setSubmitMessage("");

    try {
      const response = await fetch("/api/client-diagnostic-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          participantId,
          inviteToken,
          questionnaireType,
          submission,
        }),
      });

      const result = (await response.json()) as SubmitResult;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to submit diagnostic.");
      }

      try {
        window.localStorage.removeItem(draftStorageKey);
      } catch (error) {
        console.error("Unable to clear questionnaire draft.", error);
      }

      window.location.replace("/client-diagnostic/submitted");
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(
        error instanceof Error ? error.message : "Unable to submit diagnostic.",
      );
    }
  }

  const journeyHeroKicker =
    currentStep === WELCOME_STEP
      ? "Client diagnostic"
      : currentStep === REVIEW_STEP
        ? "Review & submit"
        : `Section ${currentStep} of ${dimensionDefinitions.length}`;

  const journeyHeroTitle =
    currentStep === WELCOME_STEP
      ? questionnaireTitle
      : currentStep === REVIEW_STEP
        ? "Final check"
        : activeDimension?.label ?? questionnaireTitle;

  const journeyHeroNarrative =
    currentStep === WELCOME_STEP
      ? questionnaireIntro
      : currentStep === REVIEW_STEP
        ? "Review your responses across each section before submitting the diagnostic."
        : activeDimension?.description ?? questionnaireIntro;

  return (
    <>
      {currentStep === WELCOME_STEP ? (
        <section className="brand-hero">
          <div className="brand-container relative z-[1] pt-28 pb-16 sm:pt-32 sm:pb-18">
            <p className="brand-kicker">Client diagnostic</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              {questionnaireTitle}
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This diagnostic is designed to build a rounded view of how people
              operations are working today across different roles and
              perspectives.
            </p>

            <div className="brand-card-dark mt-8 max-w-3xl p-6 sm:p-7">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Guidance
                </p>

                <p className="text-base leading-7 text-slate-200">
                  {questionnaireIntro}
                </p>

                <p className="text-base leading-7 text-slate-300">
                  Please answer candidly and based on current experience. The
                  most useful insight comes from reflecting how work operates in
                  reality, including where processes feel clear, well supported,
                  inconsistent, or difficult to navigate.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="brand-hero">
          <div className="brand-container relative z-[1] py-10 sm:py-12">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8AAAC8]">
                {journeyHeroKicker}
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {journeyHeroTitle}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                {journeyHeroNarrative}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="brand-light-section">
      <div
        ref={questionnaireTopRef}
        className="brand-container scroll-mt-28 py-10 sm:py-12"
      >
        {currentStep === WELCOME_STEP ? (
          <WelcomeStep
            scoreQuestionCount={scoreQuestions.length}
            dimensionCount={dimensionDefinitions.length}
            onBegin={() => goToStep(FIRST_DIMENSION_STEP)}
          />
        ) : null}

        {activeDimension ? (
          <DimensionStep
            dimensionIndex={currentStep - FIRST_DIMENSION_STEP}
            questions={activeQuestions}
            scoreAnswers={scoreAnswers}
            probeAnswers={probeAnswers}
            completedScoreCount={completedActiveScoreCount}
            totalScoreCount={activeScoreQuestions.length}
            overallCompletedCount={completedRequiredCount}
            overallScoreCount={scoreQuestions.length}
            completionPercentage={completionPercentage}
            onScoreChange={handleScoreChange}
            onProbeChange={handleProbeChange}
            onPrevious={() => goToStep(currentStep - 1)}
            onContinue={handleContinueFromDimension}
            onReturnToReview={handleReturnToReview}
            canContinue={isActiveDimensionComplete}
            showReturnToReview={editingFromReview}
          />
        ) : null}

        {currentStep === REVIEW_STEP ? (
          <ReviewStep
            questionnaireType={questionnaireType}
            scoreAnswers={scoreAnswers}
            probeAnswers={probeAnswers}
            completedRequiredCount={completedRequiredCount}
            totalRequiredCount={scoreQuestions.length}
            completedProbeCount={completedProbeCount}
            totalProbeCount={probeQuestions.length}
            isReadyToSubmit={isReadyToSubmit}
            hasValidSubmissionContext={hasValidSubmissionContext}
            submitState={submitState}
            submitMessage={submitMessage}
            preparedSubmission={preparedSubmission}
            onEditDimension={(dimensionIndex) => {
              setEditingFromReview(true);
              goToStep(FIRST_DIMENSION_STEP + dimensionIndex);
            }}
            onPrevious={() => goToStep(dimensionDefinitions.length)}
            onSubmit={handleSubmitDiagnostic}
          />
        ) : null}
      </div>
    </section>
    </>
  );
}

function WelcomeStep({
  scoreQuestionCount,
  dimensionCount,
  onBegin,
}: {
  scoreQuestionCount: number;
  dimensionCount: number;
  onBegin: () => void;
}) {
  return (
    <div className="space-y-8">
      <section className="brand-surface-card p-6 sm:p-8">
        <p className="brand-section-kicker">Before you begin</p>

        <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
          A structured view of how people operations work in practice.
        </h2>

        <p className="brand-body-sm mt-4 max-w-3xl">
          The diagnostic is organised into {dimensionCount} focused sections.
          Each section contains a small number of scored statements and an
          optional opportunity to add context.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <SummaryMetric label="Sections" value={String(dimensionCount)} />
          <SummaryMetric
            label="Scored statements"
            value={String(scoreQuestionCount)}
          />
          <SummaryMetric label="Typical time" value="8–10 min" />
        </div>

        <p className="mt-6 text-sm leading-6 text-slate-600">
          Your answers are saved in this browser as you work through the
          diagnostic, so you can return using the same invitation if needed.
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] p-5 sm:p-6">
        <div className="w-full">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
            How to use the scale
          </p>

          <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
            Please score each statement based on how work operates today in
            reality, not how it is intended to work on paper.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ScaleCard
              value="1"
              label="Rarely true"
              description="Rarely true in practice, or breaks down regularly."
            />
            <ScaleCard
              value="2"
              label="Sometimes true"
              description="Some evidence exists, but it is inconsistent or unreliable."
            />
            <ScaleCard
              value="3"
              label="Mixed / uneven"
              description="Partly true, but the experience is uneven or depends on the situation."
            />
            <ScaleCard
              value="4"
              label="Mostly true"
              description="Generally true in practice, with only occasional gaps."
            />
            <ScaleCard
              value="5"
              label="Consistently true"
              description="Consistently true in practice and works as expected."
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onBegin}
          className="brand-button-primary"
        >
          Begin diagnostic
        </button>
      </div>
    </div>
  );
}

function DimensionStep({
  dimensionIndex,
  questions,
  scoreAnswers,
  probeAnswers,
  completedScoreCount,
  totalScoreCount,
  overallCompletedCount,
  overallScoreCount,
  completionPercentage,
  onScoreChange,
  onProbeChange,
  onPrevious,
  onContinue,
  onReturnToReview,
  canContinue,
  showReturnToReview,
}: {
  dimensionIndex: number;
  questions: Array<ScoreQuestion | ProbeQuestion>;
  scoreAnswers: Record<string, ScoreAnswerValue | undefined>;
  probeAnswers: Record<string, string>;
  completedScoreCount: number;
  totalScoreCount: number;
  overallCompletedCount: number;
  overallScoreCount: number;
  completionPercentage: number;
  onScoreChange: (questionId: string, value: ScoreAnswerValue) => void;
  onProbeChange: (questionId: string, value: string) => void;
  onPrevious: () => void;
  onContinue: () => void;
  onReturnToReview: () => void;
  canContinue: boolean;
  showReturnToReview: boolean;
}) {
  return (
    <div className="space-y-8">
      <section>
        <div className="border-b border-[var(--brand-border)] pb-7">
          <div className="w-full sm:ml-auto sm:w-64">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                Overall progress
              </span>
              <span className="font-semibold text-slate-900">
                {completionPercentage}%
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[var(--brand-accent)]"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {overallCompletedCount} of {overallScoreCount} scored statements
              answered
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Complete all {totalScoreCount} scored statements to continue.
          </span>

          <span className="font-semibold text-slate-900">
            {completedScoreCount} / {totalScoreCount}
          </span>
        </div>
      </section>

      <div className="space-y-6">
        {questions.map((question) =>
          question.kind === "score" ? (
            <ScoreQuestionCard
              key={question.id}
              question={question}
              totalScoreCount={totalScoreCount}
              selectedValue={scoreAnswers[question.id]}
              onChange={onScoreChange}
            />
          ) : (
            <ProbeQuestionCard
              key={question.id}
              question={question}
              value={probeAnswers[question.id] ?? ""}
              onChange={onProbeChange}
            />
          ),
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--brand-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className="brand-button-dark"
        >
          Previous
        </button>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {!canContinue ? (
            <p className="text-sm text-slate-500">
              Answer all scored statements in this section to continue.
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {showReturnToReview ? (
              <button
                type="button"
                onClick={onReturnToReview}
                className="brand-button-dark"
              >
                Return to review
              </button>
            ) : null}

            <button
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {dimensionIndex === dimensionDefinitions.length - 1
                ? "Review responses"
                : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreQuestionCard({
  question,
  totalScoreCount,
  selectedValue,
  onChange,
}: {
  question: ScoreQuestion;
  totalScoreCount: number;
  selectedValue: ScoreAnswerValue | undefined;
  onChange: (questionId: string, value: ScoreAnswerValue) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        Question {question.order} of {totalScoreCount}
      </p>

      <p className="mt-3 max-w-4xl text-base leading-7 text-slate-900 sm:text-lg">
        {question.prompt}
      </p>

      <div className="mt-6">
        <div className="mb-3 grid grid-cols-3 text-xs font-medium text-slate-500 sm:text-sm">
          <span>Rarely true</span>
          <span className="text-center">Mixed / uneven</span>
          <span className="text-right">Consistently true</span>
        </div>

        <div
      data-diagnostic-score-controls
      className="grid grid-cols-5 gap-2 sm:gap-3"
    >
          {[1, 2, 3, 4, 5].map((value) => {
            const isSelected = selectedValue === value;

            return (
              <button
                key={value}
                type="button"
                onClick={(event) => {
              const currentControls =
                event.currentTarget.closest<HTMLElement>(
                  "[data-diagnostic-score-controls]",
                );

              const currentTop =
                currentControls?.getBoundingClientRect().top ?? null;

              onChange(question.id, value as ScoreAnswerValue);

              if (!currentControls || currentTop === null) {
                return;
              }

              window.requestAnimationFrame(() => {
                const controls = Array.from(
                  document.querySelectorAll<HTMLElement>(
                    "[data-diagnostic-score-controls], [data-diagnostic-probe-controls]",
                  ),
                );

                const currentIndex = controls.indexOf(currentControls);

                if (currentIndex === -1) {
                  return;
                }

                const nextControls = controls[currentIndex + 1];

                if (!nextControls) {
                  return;
                }

                const nextTop =
                  nextControls.getBoundingClientRect().top;

                window.scrollBy({
                  top: nextTop - currentTop,
                  left: 0,
                  behavior: "smooth",
                });
              });
            }}
                className={`min-h-14 rounded-xl border px-3 py-4 text-base font-semibold transition ${
                  isSelected
                    ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white shadow-sm"
                    : "border-[var(--brand-border)] bg-[var(--brand-surface-soft)] text-slate-700 hover:border-[var(--brand-accent)] hover:bg-white hover:text-[var(--brand-accent)]"
                }`}
                aria-pressed={isSelected}
                aria-label={`Score ${value} out of 5`}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReviewStep({
  questionnaireType,
  scoreAnswers,
  probeAnswers,
  completedRequiredCount,
  totalRequiredCount,
  completedProbeCount,
  totalProbeCount,
  isReadyToSubmit,
  hasValidSubmissionContext,
  submitState,
  submitMessage,
  preparedSubmission,
  onEditDimension,
  onPrevious,
  onSubmit,
}: {
  questionnaireType: QuestionnaireType;
  scoreAnswers: Record<string, ScoreAnswerValue | undefined>;
  probeAnswers: Record<string, string>;
  completedRequiredCount: number;
  totalRequiredCount: number;
  completedProbeCount: number;
  totalProbeCount: number;
  isReadyToSubmit: boolean;
  hasValidSubmissionContext: boolean;
  submitState: SubmitState;
  submitMessage: string;
  preparedSubmission: PreparedSubmission | null;
  onEditDimension: (dimensionIndex: number) => void;
  onPrevious: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-8">
      <section>
        <p className="brand-section-kicker">Review and submit</p>

        <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
          Your diagnostic is ready for a final check.
        </h2>

        <p className="brand-body-sm mt-4 max-w-3xl">
          Review completion across each section before submitting. You can
          return to any section if you want to change a response.
        </p>
      </section>

      <section className="brand-surface-card p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryMetric
            label="Scored statements"
            value={`${completedRequiredCount} / ${totalRequiredCount}`}
          />
          <SummaryMetric
            label="Optional detail"
            value={`${completedProbeCount} / ${totalProbeCount}`}
          />
          <SummaryMetric
            label="Submission status"
            value={isReadyToSubmit ? "Ready" : "Incomplete"}
          />
        </div>

        <div className="mt-8 divide-y divide-[var(--brand-border)] border-y border-[var(--brand-border)]">
          {dimensionDefinitions.map((dimension, index) => {
            const questions = getQuestionsForDimension(
              questionnaireType,
              dimension.key,
            );

            const scoredQuestions = questions.filter(
              (question): question is ScoreQuestion =>
                question.kind === "score",
            );

            const completedCount = scoredQuestions.filter(
              (question) => scoreAnswers[question.id],
            ).length;

            const isComplete =
              scoredQuestions.length > 0 &&
              completedCount === scoredQuestions.length;

            const probeQuestion = questions.find(
              (question): question is ProbeQuestion =>
                question.kind === "probe",
            );

            const hasOptionalContext = Boolean(
              probeQuestion &&
                probeAnswers[probeQuestion.id]?.trim(),
            );

            return (
              <div
                key={dimension.key}
                className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {index + 1}. {dimension.label}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {completedCount} of {scoredQuestions.length} scored
                    statements complete
                  </p>

                  {hasOptionalContext ? (
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Optional context added
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm font-semibold ${
                      isComplete ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {isComplete ? "Complete" : "Incomplete"}
                  </span>

                  <button
                    type="button"
                    onClick={() => onEditDimension(index)}
                    className="text-sm font-semibold text-[var(--brand-accent)] transition hover:opacity-75"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {preparedSubmission ? (
          <p className="mt-6 text-sm text-slate-600">
            {preparedSubmission.responses.length} responses are currently
            prepared for submission, including {completedRequiredCount} scored
            responses and {completedProbeCount} optional detail responses.
          </p>
        ) : null}
      </section>

      {!hasValidSubmissionContext ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          This diagnostic link is missing valid project, participant, or invite
          token identifiers.
        </div>
      ) : null}

      {hasValidSubmissionContext && !isReadyToSubmit ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Please complete all scored questions before submitting. Optional
          detail fields can be left blank.
        </div>
      ) : null}

      {submitState === "success" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {submitMessage}
        </div>
      ) : null}

      {submitState === "error" ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 border-t border-[var(--brand-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className="brand-button-dark"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!isReadyToSubmit || submitState === "submitting"}
          className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitState === "submitting"
            ? "Submitting..."
            : "Submit diagnostic"}
        </button>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ScaleCard({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--brand-border)] bg-white p-4 xl:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-accent)] text-sm font-bold text-white">
          {value}
        </div>

        <p className="text-sm font-semibold text-slate-900">{label}</p>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function ProbeQuestionCard({
  question,
  value,
  onChange,
}: {
  question: ProbeQuestion;
  value: string;
  onChange: (questionId: string, value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        Optional detail
      </p>

      <p className="mt-3 text-base leading-7 text-slate-900">
        {question.prompt}
      </p>

      <textarea
        data-diagnostic-probe-controls
        value={value}
        onChange={(event) => onChange(question.id, event.target.value)}
        rows={5}
        className="mt-5 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--brand-accent)]"
        placeholder="Add any relevant context here..."
      />

      {question.helpText ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {question.helpText}
        </p>
      ) : null}
    </div>
  );
}
