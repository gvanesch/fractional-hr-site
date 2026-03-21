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
} from "../../lib/diagnostic";
import {
  saveDiagnosticState,
  clearDiagnosticState,
} from "../../lib/diagnostic-storage";

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

const DIAGNOSTIC_DRAFT_STORAGE_KEY = "greg-diagnostic-draft-v1";

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

export default function DiagnosticPage() {
  const [answers, setAnswers] = useState<Record<number, AnswerValue | undefined>>(
    {}
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
    } catch (error) {
      console.error("Failed to load diagnostic draft:", error);
    } finally {
      setHasLoadedDraft(true);
    }
  }, []);

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
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
        JSON.stringify(draft)
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

  function scrollToNextQuestion(
    updatedAnswers: Record<number, AnswerValue | undefined>
  ) {
    const nextQuestion = questions.find((question) => !updatedAnswers[question.id]);

    if (!nextQuestion) {
      return;
    }

    const nextElement = questionRefs.current[nextQuestion.id];

    if (!nextElement) {
      return;
    }

    const headerOffset = 150;
    const elementTop = nextElement.getBoundingClientRect().top + window.scrollY;
    const targetTop = Math.max(elementTop - headerOffset, 0);

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  }

  function updateAnswer(questionId: number, value: AnswerValue) {
    const updatedAnswers = {
      ...answers,
      [questionId]: value,
    };

    setAnswers(updatedAnswers);
    setShowResults(false);
    setSubmitError("");
    setSaveStatus("idle");
    setCompletionEmailStatus("idle");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToNextQuestion(updatedAnswers);
      });
    });
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
      | { error?: string }
      | null;

    if (!response.ok) {
      throw new Error(
        payload?.error || "Failed to send diagnostic completion email."
      );
    }

    setCompletionEmailStatus("sent");
  }

  async function calculateScore() {
    if (!allAnswered || !acceptedNotice || !contextComplete || score === null || !band) {
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
        "Your result has been calculated, but local saving failed in this browser. Please try again."
      );
    }

    try {
      await sendDiagnosticCompletionEmail();
    } catch (error) {
      console.error("Failed to send diagnostic completion email:", error);
      setCompletionEmailStatus("error");
      setSubmitError(
        "Your score has been calculated, but the diagnostic completion notification could not be sent."
      );
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

    try {
      window.localStorage.removeItem(DIAGNOSTIC_DRAFT_STORAGE_KEY);
      clearDiagnosticState();
    } catch (error) {
      console.error("Failed to clear diagnostic storage:", error);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="brand-kicker">Diagnostic</p>
            <h1 className="brand-heading-xl mt-3">HR Operations Health Check</h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Answer 10 questions to assess potential HR operational friction and get
              an immediate HR Operations Score.
            </p>
            <p className="mt-4 max-w-3xl text-sm text-[#8AAAC8]">
              This is designed as a quick diagnostic tool to help identify whether
              operational strain may be building across HR processes, onboarding,
              service delivery, ownership, and day-to-day execution.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
          <div className="mb-10 rounded-[1.5rem] bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-slate-950">
              A little context first
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  placeholder="Optional"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  placeholder="Optional"
                />
                <p className="mt-2 text-sm text-slate-500">
                  Optional. Provide this only if you would like follow-up or a deeper
                  interpretation of the result.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-10 h-[88px]" aria-hidden="true" />

          <div className="fixed left-1/2 top-[calc(var(--site-header-height)+1rem)] z-40 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 px-4 sm:px-6 lg:px-0">
            <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-[#1E6FD9] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-2 text-sm text-slate-600">
                {answeredCount} / {questions.length} questions answered ({progress}%)
              </p>
            </div>
          </div>

          <div className="space-y-8">
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
                      className="flex items-center gap-3 rounded-lg px-2 py-1 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === option.value}
                        onChange={() => updateAnswer(q.id, option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-4 rounded-[1.5rem] bg-white p-6 shadow-sm">
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
                I understand this tool provides general informational guidance only and
                is not legal, regulatory, employment, tax, or professional advice. I
                also understand that the information I submit may be used to create
                aggregated or anonymised benchmarking insights.
              </span>
            </label>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

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
                className="rounded-lg bg-[#1E6FD9] px-6 py-3 text-white disabled:bg-slate-400"
              >
                {saveStatus === "saving" || completionEmailStatus === "sending"
                  ? "Calculating..."
                  : "Calculate score"}
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
            <div ref={resultsRef} className="mt-16 rounded-lg bg-white p-8 shadow">
              <h2 className="mb-2 text-2xl font-semibold text-slate-950">
                Your HR Operations Maturity Score: {score} / 100
              </h2>

              <p className="mb-1 text-lg font-medium text-[#1E6FD9]">{band.label}</p>

              <p className="mb-6 text-slate-700">{band.summary}</p>

              <h3 className="mb-4 text-lg font-semibold text-slate-950">
                Operational Profile
              </h3>

              <div className="mb-10 space-y-3">
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

              {lowestDimensions.length > 0 && (
                <div className="mb-10">
                  <h3 className="mb-3 text-lg font-semibold text-slate-950">
                    Areas likely to benefit from attention
                  </h3>

                  <p className="mb-4 text-sm text-slate-600">
                    These dimensions may be the most likely sources of operational friction
                    or inconsistency at the moment.
                  </p>

                  <div className="space-y-2">
                    {lowestDimensions.map((dimension) => (
                      <div
                        key={dimension.label}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-slate-700"
                      >
                        <span>{dimension.label}</span>
                        <span className="font-medium">{dimension.score} / 5</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
                {saveStatus === "saved" && completionEmailStatus === "sent" && (
                  <p>
                    Your result has been saved locally in this browser and your diagnostic completion has been recorded.
                  </p>
                )}
                {saveStatus === "saved" && completionEmailStatus === "idle" && (
                  <p>
                    Your result has been saved locally in this browser so you can continue to the interpretation and enquiry flow.
                  </p>
                )}
                {saveStatus === "saved" && completionEmailStatus === "error" && (
                  <p>
                    Your result has been saved locally in this browser, but the diagnostic completion notification could not be sent.
                  </p>
                )}
                {saveStatus === "error" && (
                  <p>
                    Your result has been calculated, but local saving failed in this browser.
                  </p>
                )}
              </div>

              <div className="mt-8 rounded-lg bg-slate-50 p-6">
                <h4 className="mb-2 text-lg font-semibold text-slate-950">
                  View a deeper interpretation of your result
                </h4>

                <p className="mb-4 text-sm text-slate-600">
                  Click through to see a more detailed interpretation of your score and,
                  if helpful, book a free 20-minute conversation to talk through what it
                  may mean for your organisation&apos;s HR operations.
                </p>

                <Link
                  href="/contact/diagnostic-interpretation"
                  className="inline-block rounded-lg bg-[#1E6FD9] px-6 py-3 text-white"
                >
                  View detailed interpretation
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/services/hr-foundations-sprint"
                  className="inline-block rounded-lg border border-slate-300 px-6 py-3 text-slate-800"
                >
                  View the HR Foundations Sprint
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}