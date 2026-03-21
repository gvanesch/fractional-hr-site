"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  dimensionDefinitions,
  getQuestionsForDimension,
  type DimensionKey,
  type ProbeQuestion,
  type ScoreAnswerValue,
  type ScoreQuestion,
} from "@/lib/client-diagnostic/question-bank";

type QuestionnaireType = "hr" | "manager" | "leadership" | "client_fact_pack";

type ClientDiagnosticQuestionnaireProps = {
  questionnaireType: QuestionnaireType;
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

function isUuid(value: string | null): value is string {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default function ClientDiagnosticQuestionnaire({
  questionnaireType,
}: ClientDiagnosticQuestionnaireProps) {
  const searchParams = useSearchParams();

  const [scoreAnswers, setScoreAnswers] = useState<
    Record<string, ScoreAnswerValue | undefined>
  >({});
  const [probeAnswers, setProbeAnswers] = useState<Record<string, string>>({});
  const [preparedSubmission, setPreparedSubmission] =
    useState<PreparedSubmission | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState<string>("");

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dimensionHeaderRefs = useRef<Record<DimensionKey, HTMLDivElement | null>>(
    {} as Record<DimensionKey, HTMLDivElement | null>,
  );
  const stickyPanelRef = useRef<HTMLDivElement | null>(null);

  const projectId = searchParams.get("projectId");
  const participantId = searchParams.get("participantId");

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

  const completedRequiredCount = useMemo(() => {
    return scoreQuestions.filter((question) => scoreAnswers[question.id]).length;
  }, [scoreAnswers, scoreQuestions]);

  const completionPercentage =
    scoreQuestions.length === 0
      ? 0
      : Math.round((completedRequiredCount / scoreQuestions.length) * 100);

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
    const currentQuestion = scoreQuestions[currentIndex];
    const nextQuestion = scoreQuestions[currentIndex + 1];

    if (!currentQuestion || !nextQuestion) {
      return;
    }

    const stickyCoverageHeight = getStickyCoverageHeight();
    const isNewDimension = currentQuestion.dimension !== nextQuestion.dimension;

    if (isNewDimension) {
      const nextDimensionHeader = dimensionHeaderRefs.current[nextQuestion.dimension];

      if (nextDimensionHeader) {
        scrollElementToTargetTop(nextDimensionHeader, stickyCoverageHeight + 96);
      }

      return;
    }

    const nextQuestionElement = questionRefs.current[nextQuestion.id];

    if (!nextQuestionElement) {
      return;
    }

    if (currentQuestion.order === 1) {
      scrollElementToTargetTop(nextQuestionElement, stickyCoverageHeight + 180);
      return;
    }

    if (currentQuestion.order === 2) {
      scrollElementToTargetTop(nextQuestionElement, stickyCoverageHeight + 96);
      return;
    }

    scrollElementToTargetTop(nextQuestionElement, stickyCoverageHeight + 32);
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
      }

      if (question.kind === "probe") {
        const value = (probeAnswers[question.id] ?? "").trim();

        if (value.length > 0) {
          responses.push({
            questionId: question.id,
            dimension: question.dimension,
            kind: "probe",
            value,
          });
        }
      }
    }

    return {
      questionnaireType,
      preparedAt: new Date().toISOString(),
      responses,
    };
  }

  function handleReviewSubmission() {
    setPreparedSubmission(buildPreparedSubmission());
    setSubmitMessage("");
  }

  async function handleSubmitDiagnostic() {
    setSubmitMessage("");

    if (!hasValidSubmissionContext || !projectId || !participantId) {
      setSubmitState("error");
      setSubmitMessage(
        "This questionnaire link is missing a valid project or participant reference.",
      );
      return;
    }

    const submission = buildPreparedSubmission();
    setPreparedSubmission(submission);

    const scoreResponseCount = submission.responses.filter(
      (response) => response.kind === "score",
    ).length;

    if (scoreResponseCount !== scoreQuestions.length) {
      setSubmitState("error");
      setSubmitMessage(
        "Please complete all scored questions before submitting.",
      );
      return;
    }

    setSubmitState("submitting");

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
          responses: submission.responses,
        }),
      });

      const result = (await response.json()) as SubmitResult;

      if (!response.ok || !result.success) {
        setSubmitState("error");
        setSubmitMessage(
          result.error ?? "Unable to submit the diagnostic at this time.",
        );
        return;
      }

      setSubmitState("success");
      setSubmitMessage(
        result.message ??
          `Submission saved successfully${result.savedResponseCount ? ` (${result.savedResponseCount} responses).` : "."}`,
      );

      try {
        window.localStorage.removeItem(draftStorageKey);
      } catch (error) {
        console.error("Unable to clear local draft after submission.", error);
      }
    } catch (error) {
      console.error("Client diagnostic submission failed.", error);
      setSubmitState("error");
      setSubmitMessage(
        "Unexpected error while submitting the diagnostic. Please try again.",
      );
    }
  }

  function handleClearDraft() {
    setScoreAnswers({});
    setProbeAnswers({});
    setPreparedSubmission(null);
    setSubmitState("idle");
    setSubmitMessage("");
    window.localStorage.removeItem(draftStorageKey);
  }

  return (
    <section className="brand-light-section">
      <div className="brand-container py-10 sm:py-12">
        <div
          ref={stickyPanelRef}
          className="sticky top-[calc(var(--site-header-height)+1rem)] z-30 mb-8 rounded-2xl border border-[var(--brand-border)] bg-white/95 p-5 shadow-[var(--brand-shadow-card)] backdrop-blur sm:p-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="brand-section-kicker">Completion progress</p>

              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {completionPercentage}% complete
              </p>

              <p className="mt-2 text-sm leading-6 text-[var(--brand-text-muted)]">
                {completedRequiredCount} of {scoreQuestions.length} scored
                questions completed
              </p>

              {!hasValidSubmissionContext ? (
                <p className="mt-3 text-sm leading-6 text-amber-700">
                  Submission link is missing a valid project or participant ID.
                  Review mode works, but submission is currently disabled.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReviewSubmission}
                className="brand-button-primary"
              >
                Review submission
              </button>

              <button
                type="button"
                onClick={handleSubmitDiagnostic}
                disabled={
                  submitState === "submitting" || !hasValidSubmissionContext
                }
                className="inline-flex min-h-[2.9rem] items-center justify-center rounded-[0.85rem] bg-[var(--brand-navy-2)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-navy-1)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitState === "submitting"
                  ? "Submitting..."
                  : "Submit diagnostic"}
              </button>

              <button
                type="button"
                onClick={handleClearDraft}
                className="inline-flex min-h-[2.9rem] items-center justify-center rounded-[0.85rem] border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear draft
              </button>
            </div>
          </div>

          {submitMessage ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 ${
                submitState === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : submitState === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {submitMessage}
            </div>
          ) : null}

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[var(--brand-accent)] transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-8">
          {dimensionDefinitions.map((dimension, dimensionIndex) => {
            const questions = getQuestionsForDimension(
              questionnaireType,
              dimension.key,
            );

            const scoreItems = questions.filter(
              (question): question is ScoreQuestion => question.kind === "score",
            );

            const probeItem = questions.find(
              (question): question is ProbeQuestion => question.kind === "probe",
            );

            return (
              <section
                key={dimension.key}
                className="brand-surface-card p-6 sm:p-8"
              >
                <div
                  ref={(element) => {
                    dimensionHeaderRefs.current[dimension.key] = element;
                  }}
                  className="mb-6 border-b border-[var(--brand-border)] pb-5"
                >
                  <p className="brand-section-kicker">
                    Dimension {dimensionIndex + 1}
                  </p>

                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    {dimension.label}
                  </h2>

                  <p className="brand-body-sm mt-3 max-w-3xl">
                    {dimension.description}
                  </p>
                </div>

                <div className="space-y-6">
                  {scoreItems.map((question, questionIndex) => (
                    <div
                      key={question.id}
                      ref={(element) => {
                        questionRefs.current[question.id] = element;
                      }}
                    >
                      <ScoreQuestionCard
                        question={question}
                        questionNumber={questionIndex + 1}
                        selectedValue={scoreAnswers[question.id]}
                        onChange={handleScoreChange}
                      />
                    </div>
                  ))}

                  {probeItem ? (
                    <ProbeQuestionCard
                      question={probeItem}
                      value={probeAnswers[probeItem.id] ?? ""}
                      onChange={handleProbeChange}
                    />
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-[var(--brand-navy-1)] p-6 text-white shadow-[var(--brand-shadow-card)] sm:p-8">
          <p className="brand-kicker">Submission preview</p>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This section shows a structured preview of the current draft
            submission. It is also the payload that will be sent to the storage
            and analysis workflow when submitted.
          </p>

          <pre className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-slate-200">
            {preparedSubmission
              ? JSON.stringify(preparedSubmission, null, 2)
              : "No submission preview generated yet."}
          </pre>
        </div>
      </div>
    </section>
  );
}

type ScoreQuestionCardProps = {
  question: ScoreQuestion;
  questionNumber: number;
  selectedValue?: ScoreAnswerValue;
  onChange: (questionId: string, value: ScoreAnswerValue) => void;
};

function ScoreQuestionCard({
  question,
  questionNumber,
  selectedValue,
  onChange,
}: ScoreQuestionCardProps) {
  return (
    <div className="brand-surface-soft p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        Score question {questionNumber}
      </p>

      <h3 className="mt-2 text-base font-medium leading-7 text-slate-900">
        {question.prompt}
      </h3>

      {question.helpText ? (
        <p className="mt-2 text-sm leading-6 text-[var(--brand-text-body)]">
          {question.helpText}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
        {[1, 2, 3, 4, 5].map((value) => {
          const typedValue = value as ScoreAnswerValue;
          const isSelected = selectedValue === typedValue;

          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(question.id, typedValue)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                isSelected
                  ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-100"
              }`}
              aria-pressed={isSelected}
            >
              {value}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-[var(--brand-text-muted)]">
        <span>Strongly disagree</span>
        <span>Strongly agree</span>
      </div>
    </div>
  );
}

type ProbeQuestionCardProps = {
  question: ProbeQuestion;
  value: string;
  onChange: (questionId: string, value: string) => void;
};

function ProbeQuestionCard({
  question,
  value,
  onChange,
}: ProbeQuestionCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--brand-border)] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        Optional context
      </p>

      <h3 className="mt-2 text-base font-medium leading-7 text-slate-900">
        {question.prompt}
      </h3>

      {question.helpText ? (
        <p className="mt-2 text-sm leading-6 text-[var(--brand-text-body)]">
          {question.helpText}
        </p>
      ) : null}

      <textarea
        value={value}
        onChange={(event) => onChange(question.id, event.target.value)}
        rows={5}
        maxLength={question.maxLength ?? 1200}
        className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-accent)] focus:ring-4 focus:ring-blue-100"
        placeholder="Add optional context here..."
      />

      <div className="mt-2 text-right text-xs text-[var(--brand-text-muted)]">
        {value.length}/{question.maxLength ?? 1200}
      </div>
    </div>
  );
}