"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDiagnosticState,
  questions,
  scoreToBand,
  getDimensionScores,
  calculateRawScore,
  calculatePercentageScore,
  type AnswerValue,
} from "@/lib/diagnostic";
import {
  saveDiagnosticState,
  clearDiagnosticState,
} from "@/lib/diagnostic-storage";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type CompletionEmailStatus = "idle" | "sending" | "sent" | "error";

type DiagnosticDraftState = {
  answers: Record<number, AnswerValue | undefined>;
  companySize: string;
  industry: string;
  role: string;
  countryRegion: string;
  email: string;
  acceptedNotice: boolean;
  showResults: boolean;
};

type DiagnosticCompleteResponse = {
  submissionId?: string;
  publicToken?: string;
  error?: string;
};

const DIAGNOSTIC_DRAFT_STORAGE_KEY = "greg-diagnostic-draft-v1";
const HEALTH_CHECK_SUBMISSION_ID_STORAGE_KEY = "health-check-submission-id";
const HEALTH_CHECK_PUBLIC_TOKEN_STORAGE_KEY = "health-check-public-token";

const scaleOptions: { label: string; value: AnswerValue }[] = [
  { label: "Strongly disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Partly / not consistently", value: 3 },
  { label: "Agree", value: 4 },
  { label: "Strongly agree", value: 5 },
];

const companySizeOptions = [
  "1–25 employees",
  "26–50 employees",
  "51–100 employees",
  "101–250 employees",
  "251–500 employees",
  "501–1,000 employees",
  "1,000+ employees",
];

const industryOptions = [
  "Technology / SaaS",
  "Professional Services",
  "Financial Services",
  "Healthcare / Life Sciences",
  "Manufacturing",
  "Retail / Consumer",
  "Education",
  "Public Sector / Non-profit",
  "Other",
];

const roleOptions = [
  "Founder / CEO",
  "COO / Operations Leader",
  "CHRO / Head of People",
  "HR / People Operations Leader",
  "HRBP / Generalist",
  "Manager / Department Leader",
  "Consultant / Advisor",
  "Other",
];

const openingPoints = [
  {
    title: "Structured first view",
    text: "A structured read across clarity, ownership, service access, systems, and delivery.",
  },
  {
    title: "Focus for attention",
    text: "Highlights where improvement is most likely to strengthen how HR operates.",
  },
  {
    title: "Next-step route",
    text: "Creates a stronger basis for interpretation, discussion, and deeper diagnostic work.",
  },
];

export default function DiagnosticPage() {
  const [answers, setAnswers] = useState<Record<number, AnswerValue | undefined>>(
    {},
  );
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [countryRegion, setCountryRegion] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedNotice, setAcceptedNotice] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [completionEmailStatus, setCompletionEmailStatus] =
    useState<CompletionEmailStatus>("idle");
  const [submitError, setSubmitError] = useState("");
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [pendingScrollQuestionId, setPendingScrollQuestionId] = useState<
    number | null
  >(null);
  const [publicToken, setPublicToken] = useState("");

  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(DIAGNOSTIC_DRAFT_STORAGE_KEY);

      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as DiagnosticDraftState;

        setAnswers(draft.answers ?? {});
        setCompanySize(draft.companySize ?? "");
        setIndustry(draft.industry ?? "");
        setRole(draft.role ?? "");
        setCountryRegion(draft.countryRegion ?? "");
        setEmail(draft.email ?? "");
        setAcceptedNotice(Boolean(draft.acceptedNotice));
        setShowResults(Boolean(draft.showResults));
      }

      const storedPublicToken =
        window.localStorage.getItem(HEALTH_CHECK_PUBLIC_TOKEN_STORAGE_KEY) ?? "";
      setPublicToken(storedPublicToken);
    } catch (error) {
      console.error("Failed to load diagnostic draft:", error);
    } finally {
      setHasLoadedDraft(true);
    }
  }, []);

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers],
  );

  const progress = Math.round((answeredCount / questions.length) * 100);
  const allAnswered = answeredCount === questions.length;
  const contextComplete = Boolean(companySize && industry && role);

  const rawScore = useMemo(() => {
    if (!allAnswered) return null;
    return calculateRawScore(answers);
  }, [answers, allAnswered]);

  const score = useMemo(() => {
    if (rawScore === null) return null;
    return calculatePercentageScore(rawScore);
  }, [rawScore]);

  const band = useMemo(() => {
    if (score === null) return null;
    return scoreToBand(score);
  }, [score]);

  const dimensions = useMemo(() => {
    if (!allAnswered) return [];
    return getDimensionScores(answers).sort((a, b) => a.score - b.score);
  }, [answers, allAnswered]);

  const lowestDimensions = dimensions.slice(0, 3);

  useEffect(() => {
    if (!hasLoadedDraft) return;

    const draft: DiagnosticDraftState = {
      answers,
      companySize,
      industry,
      role,
      countryRegion,
      email,
      acceptedNotice,
      showResults,
    };

    try {
      window.localStorage.setItem(
        DIAGNOSTIC_DRAFT_STORAGE_KEY,
        JSON.stringify(draft),
      );
    } catch (error) {
      console.error("Failed to save diagnostic draft:", error);
    }
  }, [
    answers,
    companySize,
    industry,
    role,
    countryRegion,
    email,
    acceptedNotice,
    showResults,
    hasLoadedDraft,
  ]);

  useEffect(() => {
    if (!showResults || !resultsRef.current) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const headerOffset = 130;
        const elementTop =
          resultsRef.current!.getBoundingClientRect().top + window.scrollY;
        const targetTop = Math.max(elementTop - headerOffset, 0);

        window.scrollTo({
          top: targetTop,
          behavior: "smooth",
        });
      });
    });
  }, [showResults]);

  useEffect(() => {
    if (pendingScrollQuestionId === null) {
      return;
    }

    const nextElement = questionRefs.current[pendingScrollQuestionId];

    if (!nextElement) {
      setPendingScrollQuestionId(null);
      return;
    }

    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const headerOffset = 150;
        const elementTop = nextElement.getBoundingClientRect().top + window.scrollY;
        const targetTop = Math.max(elementTop - headerOffset, 0);

        window.scrollTo({
          top: targetTop,
          behavior: "smooth",
        });

        setPendingScrollQuestionId(null);
      });
    });
  }, [pendingScrollQuestionId, answers]);

  function updateAnswer(questionId: number, value: AnswerValue) {
    const updatedAnswers = {
      ...answers,
      [questionId]: value,
    };

    const nextQuestion = questions.find(
      (question) => !updatedAnswers[question.id],
    );

    setAnswers(updatedAnswers);
    setShowResults(false);
    setSubmitError("");
    setSaveStatus("idle");
    setCompletionEmailStatus("idle");
    setPendingScrollQuestionId(nextQuestion?.id ?? null);
  }

  async function sendDiagnosticCompletionEmail() {
    if (!allAnswered || score === null || !band) {
      return;
    }

    if (completionEmailStatus === "sent") {
      return;
    }

    setCompletionEmailStatus("sending");

    const response = await fetch("/api/diagnostic-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answers,
        companySize,
        industry,
        role,
        countryRegion,
        email: email.trim(),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | DiagnosticCompleteResponse
      | null;

    if (!response.ok) {
      throw new Error(
        payload?.error || "Failed to send diagnostic completion email.",
      );
    }

    if (payload?.submissionId) {
      try {
        window.localStorage.setItem(
          HEALTH_CHECK_SUBMISSION_ID_STORAGE_KEY,
          payload.submissionId,
        );
      } catch (error) {
        console.error("Failed to persist health check submission id:", error);
      }
    }

    if (payload?.publicToken) {
      try {
        window.localStorage.setItem(
          HEALTH_CHECK_PUBLIC_TOKEN_STORAGE_KEY,
          payload.publicToken,
        );
        setPublicToken(payload.publicToken);
      } catch (error) {
        console.error("Failed to persist health check public token:", error);
      }
    }

    setCompletionEmailStatus("sent");
  }

  async function calculateScore() {
    if (
      !allAnswered ||
      !acceptedNotice ||
      !contextComplete ||
      score === null ||
      !band
    ) {
      return;
    }

    setSaveStatus("saving");
    setSubmitError("");

    try {
      saveDiagnosticState(buildDiagnosticState(answers));
      setSaveStatus("saved");
    } catch (error) {
      console.error("Failed to save diagnostic interpretation state:", error);
      setSaveStatus("error");
      setSubmitError(
        "Your result has been calculated, but local saving failed in this browser. Please try again.",
      );
    }

    try {
      await sendDiagnosticCompletionEmail();
    } catch (error) {
      console.error("Failed to send diagnostic completion email:", error);
      setCompletionEmailStatus("error");

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send diagnostic completion email.";

      if (errorMessage === "A valid email address is required.") {
        setSubmitError(
          "Your result has been calculated. The diagnostic notification could not be sent because the optional email address entered appears to be invalid.",
        );
      } else {
        setSubmitError(
          "Your result has been calculated, but the diagnostic completion notification could not be sent.",
        );
      }
    }

    setShowResults(true);
  }

  function resetDiagnostic() {
    setAnswers({});
    setCompanySize("");
    setIndustry("");
    setRole("");
    setCountryRegion("");
    setEmail("");
    setAcceptedNotice(false);
    setShowResults(false);
    setSaveStatus("idle");
    setCompletionEmailStatus("idle");
    setSubmitError("");
    setPendingScrollQuestionId(null);
    setPublicToken("");

    try {
      window.localStorage.removeItem(DIAGNOSTIC_DRAFT_STORAGE_KEY);
      window.localStorage.removeItem(HEALTH_CHECK_SUBMISSION_ID_STORAGE_KEY);
      window.localStorage.removeItem(HEALTH_CHECK_PUBLIC_TOKEN_STORAGE_KEY);
      clearDiagnosticState();
    } catch (error) {
      console.error("Failed to clear diagnostic storage:", error);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const interpretationHref = publicToken
    ? `/contact/diagnostic-interpretation?t=${encodeURIComponent(publicToken)}`
    : "/contact/diagnostic-interpretation";

  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">HR Health Check</p>

              <h1 className="brand-heading-xl max-w-5xl">
                See how clearly your HR model is actually running.
              </h1>
            </div>

            <p className="brand-subheading brand-body-on-dark max-w-4xl">
              Answer 10 questions to get a structured view across clarity,
              ownership, service access, systems, and delivery.
            </p>

            <p className="max-w-4xl text-base leading-8 text-[#C7D8EA]">
              Designed to surface where attention is most likely to strengthen
              how HR runs and to shape the next conversation from a stronger
              starting point.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 1 */}
      <section className="bg-white">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">What this is designed to do</p>

            <h2 className="brand-heading-lg text-slate-950">
              A structured starting point.
            </h2>

            <p className="brand-body-lg">
              The Health Check gives a structured starting point for how HR
              appears to be operating in practice, where attention is most
              likely to add value, and what the next step should be.
            </p>

            <p className="brand-body">
              It is designed to surface patterns and priorities, not replace a
              fuller diagnostic.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns">
              {openingPoints.map((item) => (
                <div key={item.title} className="brand-rule-col">
                  <h3 className="brand-heading-sm text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-4 brand-body">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTEXT + QUESTIONNAIRE */}
      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section-tight">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 rounded-[1.5rem] bg-white p-6 shadow-sm sm:p-8">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">A little context first</p>

                <h2 className="brand-heading-md text-slate-950">
                  A small amount of context helps make the result more useful.
                </h2>

                <p className="brand-body">Takes around 3 minutes to complete.</p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Company size <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => {
                      setCompanySize(e.target.value);
                      setCompletionEmailStatus("idle");
                    }}
                    className="h-14 w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 text-base leading-none text-slate-900"
                  >
                    <option value="">Select company size</option>
                    {companySizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => {
                      setIndustry(e.target.value);
                      setCompletionEmailStatus("idle");
                    }}
                    className="h-14 w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 text-base leading-none text-slate-900"
                  >
                    <option value="">Select industry</option>
                    {industryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Your role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setCompletionEmailStatus("idle");
                    }}
                    className="h-14 w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 text-base leading-none text-slate-900"
                  >
                    <option value="">Select your role</option>
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Country / region
                  </label>
                  <input
                    type="text"
                    value={countryRegion}
                    onChange={(e) => {
                      setCountryRegion(e.target.value);
                      setCompletionEmailStatus("idle");
                    }}
                    placeholder="Optional"
                    className="h-14 w-full rounded-lg border border-slate-300 bg-white px-4 text-base leading-none text-slate-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setCompletionEmailStatus("idle");
                    }}
                    placeholder="Optional"
                    className="h-14 w-full rounded-lg border border-slate-300 bg-white px-4 text-base leading-none text-slate-900"
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    Optional. Add your email if you would like a copy of your
                    result. You will not be added to a mailing list.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="sticky top-[calc(var(--site-header-height)+1rem)] z-30">
                <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-[#1E6FD9] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {answeredCount} / {questions.length} questions answered ({progress}
                    %)
                  </p>
                </div>
              </div>

              {questions.map((q) => (
                <div
                  key={q.id}
                  ref={(element) => {
                    questionRefs.current[q.id] = element;
                  }}
                  className="scroll-mt-40 rounded-lg bg-white p-6 shadow-sm"
                >
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#1E6FD9]">
                    {q.dimension}
                  </p>

                  <p className="mb-4 font-medium text-slate-800">{q.text}</p>

                  <div className="space-y-2">
                    {scaleOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === option.value}
                          onChange={() => updateAnswer(q.id, option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 space-y-4 rounded-[1.5rem] bg-white p-6 shadow-sm">
              <p className="text-sm leading-7 text-slate-600">
                If helpful, the result can also be discussed in a short follow-up
                conversation to interpret what the pattern may mean in practice
                and whether a deeper review would be useful.
              </p>

              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={acceptedNotice}
                  onChange={(e) => {
                    setAcceptedNotice(e.target.checked);
                    setCompletionEmailStatus("idle");
                  }}
                />
                <span>
                  I understand this assessment provides general informational
                  guidance only and is not legal, regulatory, employment, tax, or
                  professional advice. I also understand that the information I
                  submit may be used to create aggregated or anonymised
                  benchmarking insights.
                </span>
              </label>

              {submitError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={calculateScore}
                  disabled={
                    !allAnswered ||
                    !acceptedNotice ||
                    !contextComplete ||
                    saveStatus === "saving" ||
                    completionEmailStatus === "sending"
                  }
                  className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveStatus === "saving" || completionEmailStatus === "sending"
                    ? "Calculating..."
                    : "Get My Health Check Result"}
                </button>

                <button
                  onClick={resetDiagnostic}
                  className="rounded-lg border border-slate-300 px-6 py-3 text-slate-800"
                >
                  Reset
                </button>
              </div>
            </div>

            {showResults && score !== null && band && (
              <div
                ref={resultsRef}
                className="mt-16 rounded-[1.5rem] bg-white p-8 shadow-sm"
              >
                <div className="brand-stack-sm">
                  <p className="brand-section-kicker">Your result</p>

                  <h2 className="brand-heading-md text-slate-950">
                    HR Operations Health Check Score: {score} / 100
                  </h2>

                  <p className="brand-heading-sm text-[#1E6FD9]">
                    {band.label}
                  </p>
                </div>

                <div className="mt-8 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-6">
                  <div className="brand-stack-sm">
                    <h3 className="brand-heading-sm text-slate-950">
                      Structured interpretation
                    </h3>

                    <p className="brand-body">{band.summary}</p>

                    <p className="brand-body">
                      This is an initial interpretation based on one set of
                      responses. It is most useful as a starting point for
                      discussion rather than a full organisational diagnostic.
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="brand-stack-sm">
                    <h3 className="brand-heading-sm text-slate-950">
                      What this may indicate
                    </h3>

                    <div className="space-y-2">
                      {band.freeInsights.map((insight) => (
                        <div
                          key={insight}
                          className="rounded-lg bg-slate-50 px-4 py-3"
                        >
                          <p className="brand-body-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <div className="brand-stack-sm">
                    <h3 className="brand-heading-sm text-slate-950">
                      Operational profile
                    </h3>

                    <div className="space-y-3">
                      {dimensions.map((dimension) => {
                        const percent = (dimension.score / 5) * 100;

                        return (
                          <div key={dimension.label}>
                            <div className="mb-1 flex justify-between text-sm text-slate-700">
                              <span>{dimension.label}</span>
                              <span>{dimension.score} / 5</span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full bg-[#1E6FD9]"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {lowestDimensions.length > 0 && (
                  <div className="mt-10">
                    <div className="brand-stack-sm">
                      <h3 className="brand-heading-sm text-slate-950">
                        Where attention may be most useful
                      </h3>

                      <p className="brand-body-sm">
                        These areas may represent the greatest opportunity to
                        strengthen how HR operates in practice.
                      </p>

                      <div className="space-y-2">
                        {lowestDimensions.map((dimension) => (
                          <div
                            key={dimension.label}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-slate-700"
                          >
                            <span className="text-sm">{dimension.label}</span>
                            <span className="text-sm font-medium">
                              {dimension.score} / 5
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-10 rounded-[1.25rem] bg-[#F4F6FA] p-6">
                  <div className="brand-stack-sm">
                    <h3 className="brand-heading-sm text-slate-950">
                      Want a more developed interpretation of what this may mean?
                    </h3>

                    <p className="brand-body-sm">
                      The Health Check provides a structured first view. A more
                      detailed interpretation helps translate this pattern into
                      clearer operational implications and next-step options.
                    </p>

                    <div className="pt-2">
                      <Link
                        href={interpretationHref}
                        className="brand-button-primary"
                      >
                        View detailed interpretation
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-lg bg-slate-50 p-5">
                  <p className="brand-body-sm">
                    {saveStatus === "saved" && completionEmailStatus === "sent"
                      ? "Your result has been saved locally in this browser and your health check completion has been recorded."
                      : saveStatus === "saved" &&
                        completionEmailStatus === "idle"
                        ? "Your result has been saved locally in this browser so you can continue to the interpretation flow."
                        : saveStatus === "saved" &&
                          completionEmailStatus === "error"
                          ? "Your result has been saved locally in this browser, but the completion notification could not be sent."
                          : saveStatus === "error"
                            ? "Your result has been calculated, but local saving failed in this browser."
                            : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}