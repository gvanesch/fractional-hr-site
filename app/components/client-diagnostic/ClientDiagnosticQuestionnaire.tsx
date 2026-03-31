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

function isUuid(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default function ClientDiagnosticQuestionnaire({
  questionnaireType,
  projectId,
  participantId,
}: ClientDiagnosticQuestionnaireProps) {
  const [scoreAnswers, setScoreAnswers] = useState<
    Record<string, ScoreAnswerValue | undefined>
  >({});
  const [probeAnswers, setProbeAnswers] = useState<Record<string, string>>({});
  const [preparedSubmission, setPreparedSubmission] =
    useState<PreparedSubmission | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [showReview, setShowReview] = useState(false);

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dimensionHeaderRefs = useRef<Record<DimensionKey, HTMLDivElement | null>>(
    {} as Record<DimensionKey, HTMLDivElement | null>,
  );
  const stickyPanelRef = useRef<HTMLDivElement | null>(null);
  const reviewSectionRef = useRef<HTMLDivElement | null>(null);

  const hasValidSubmissionContext =
    isUuid(projectId) && isUuid(participantId);

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

  function getHeaderHeightInPixels(): number {
    const rootStyles = getComputedStyle(document.documentElement);
    const headerHeightValue = rootStyles
      .getPropertyValue("--site-header-height")
      .trim();

    if (headerHeightValue.endsWith("rem")) {
      return Number.parseFloat(headerHeightValue.replace("rem", "")) * 16;
    }

    return Number.parseFloat(headerHeightValue) || 88;
  }

  function getStickyCoverageHeight(): number {
    const headerHeight = getHeaderHeightInPixels();
    const stickyPanelHeight = stickyPanelRef.current?.offsetHeight ?? 0;
    return headerHeight + stickyPanelHeight;
  }

  function scrollElementToTargetTop(element: Element, targetTop: number) {
    const absoluteTop = element.getBoundingClientRect().top + window.scrollY;
    const scrollTop = absoluteTop - targetTop;

    window.scrollTo({
      top: scrollTop,
      behavior: "smooth",
    });
  }

  function scrollToNext(questionId: string) {
    const currentIndex = scoreQuestions.findIndex(
      (question) => question.id === questionId,
    );

    if (currentIndex === -1) {
      return;
    }

    const currentQuestion = scoreQuestions[currentIndex];
    const nextQuestion = scoreQuestions[currentIndex + 1];

    if (!currentQuestion || !nextQuestion) {
      return;
    }

    const stickyCoverageHeight = getStickyCoverageHeight();
    const isNewDimension = currentQuestion.dimension !== nextQuestion.dimension;

    if (isNewDimension) {
      const nextDimensionHeader =
        dimensionHeaderRefs.current[nextQuestion.dimension];

      if (nextDimensionHeader) {
        scrollElementToTargetTop(nextDimensionHeader, stickyCoverageHeight + 96);
      }

      return;
    }

    const nextQuestionElement = questionRefs.current[nextQuestion.id];

    if (!nextQuestionElement) {
      return;
    }

    scrollElementToTargetTop(nextQuestionElement, stickyCoverageHeight + 72);
  }

  function scrollToReviewSection() {
    if (!reviewSectionRef.current) {
      return;
    }

    const stickyCoverageHeight = getStickyCoverageHeight();
    scrollElementToTargetTop(reviewSectionRef.current, stickyCoverageHeight + 32);
  }

  function handleScoreChange(questionId: string, value: ScoreAnswerValue) {
    setScoreAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));

    window.setTimeout(() => {
      scrollToNext(questionId);
    }, 120);
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

  function handlePrepareReview() {
    setPreparedSubmission(buildPreparedSubmission());
    setShowReview(true);

    window.setTimeout(() => {
      scrollToReviewSection();
    }, 80);
  }

  async function handleSubmitDiagnostic() {
    if (!hasValidSubmissionContext) {
      setSubmitState("error");
      setSubmitMessage(
        "This diagnostic link is missing the required project or participant context.",
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

      setSubmitState("success");
      setSubmitMessage(
        result.message ||
          "Thank you. Your responses have been submitted successfully.",
      );
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit diagnostic.",
      );
    }
  }

  return (
    <section className="brand-light-section">
      <div className="brand-container py-10 sm:py-12">
        <div
          ref={stickyPanelRef}
          className="sticky top-[var(--site-header-height)] z-20 mb-8 rounded-2xl border border-[var(--brand-border)] bg-white/95 p-5 shadow-sm backdrop-blur"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Completion progress
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {completedRequiredCount} of {scoreQuestions.length} scored
                questions answered
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Optional detail responses: {completedProbeCount} of{" "}
                {probeQuestions.length}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[var(--brand-accent)]"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {completionPercentage}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {dimensionDefinitions.map((dimension) => {
            const questions = getQuestionsForDimension(
              questionnaireType,
              dimension.key,
            );

            if (questions.length === 0) {
              return null;
            }

            const scoredInDimension = questions.filter(
              (question): question is ScoreQuestion => question.kind === "score",
            );
            const completedScoredInDimension = scoredInDimension.filter(
              (question) => scoreAnswers[question.id],
            ).length;

            return (
              <section
                key={dimension.key}
                className="brand-surface-card p-6 sm:p-8"
              >
                <div
                  ref={(element) => {
                    dimensionHeaderRefs.current[dimension.key] = element;
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="brand-section-kicker">{dimension.label}</p>
                      <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                        {dimension.description}
                      </h2>
                    </div>

                    <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-3 text-sm text-slate-700">
                      {completedScoredInDimension} of {scoredInDimension.length}{" "}
                      scored answered
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  {questions.map((question) =>
                    question.kind === "score" ? (
                      <div
                        key={question.id}
                        ref={(element) => {
                          questionRefs.current[question.id] = element;
                        }}
                        className="rounded-2xl border border-[var(--brand-border)] bg-white p-5"
                      >
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                          Question {question.order} of{" "}
                          {scoredInDimension.length}
                        </p>
                        <p className="mt-3 text-base leading-7 text-slate-900">
                          {question.prompt}
                        </p>

                        <div className="mt-5 grid grid-cols-5 gap-3">
                          {[1, 2, 3, 4, 5].map((value) => {
                            const isSelected =
                              scoreAnswers[question.id] === value;

                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  handleScoreChange(
                                    question.id,
                                    value as ScoreAnswerValue,
                                  )
                                }
                                className={`rounded-xl border px-4 py-4 text-sm font-semibold transition ${
                                  isSelected
                                    ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white"
                                    : "border-[var(--brand-border)] bg-[var(--brand-surface-soft)] text-slate-700 hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
                                }`}
                                aria-pressed={isSelected}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <ProbeQuestionCard
                        key={question.id}
                        question={question}
                        value={probeAnswers[question.id] ?? ""}
                        onChange={handleProbeChange}
                      />
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <section
          ref={reviewSectionRef}
          className="brand-surface-card mt-10 p-6 sm:p-8"
        >
          <p className="brand-section-kicker">Review and submit</p>
          <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
            Final check
          </h2>

          <p className="brand-body-sm mt-4 max-w-3xl">
            Once submitted, your responses will be saved against the project and
            used in the diagnostic reporting and advisor views.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                Scored questions
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {completedRequiredCount} / {scoreQuestions.length}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                Optional detail
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {completedProbeCount} / {probeQuestions.length}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                Submission status
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {isReadyToSubmit ? "Ready" : "Incomplete"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={handlePrepareReview}
              className="brand-button-dark"
            >
              Review submission
            </button>

            <button
              type="button"
              onClick={handleSubmitDiagnostic}
              disabled={!isReadyToSubmit || submitState === "submitting"}
              className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitState === "submitting"
                ? "Submitting..."
                : "Submit diagnostic"}
            </button>
          </div>

          {!hasValidSubmissionContext ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              This diagnostic link is missing valid project or participant
              identifiers.
            </div>
          ) : null}

          {hasValidSubmissionContext && !isReadyToSubmit ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Please complete all scored questions before submitting. Optional
              detail fields can be left blank.
            </div>
          ) : null}

          {submitState === "success" ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {submitMessage}
            </div>
          ) : null}

          {submitState === "error" ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitMessage}
            </div>
          ) : null}

          {showReview && preparedSubmission ? (
            <div className="mt-8 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                Prepared submission
              </p>

              <p className="mt-3 text-sm text-slate-700">
                {preparedSubmission.responses.length} responses prepared for
                submission.
              </p>
              <p className="mt-2 text-sm text-slate-700">
                This includes {completedRequiredCount} scored responses and{" "}
                {completedProbeCount} optional detail responses.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </section>
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