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

const healthCheckDeliverables = [
  {
    title: "Overall assessment",
    text: "A clear view of current HR operational maturity and whether the function appears stable, developing, or under strain.",
  },
  {
    title: "10-dimension insight",
    text: "A structured read across process clarity, ownership, service access, systems enablement, handoffs, and delivery consistency.",
  },
  {
    title: "Likely friction points",
    text: "Early signals of where operational drag may be building, including inconsistent practice, unclear ownership, or overly manual work.",
  },
  {
    title: "Practical focus areas",
    text: "A first indication of which areas are most likely to benefit from closer attention before issues become more embedded.",
  },
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
  const [pendingScrollQuestionId, setPendingScrollQuestionId] = useState<
    number | null
  >(null);

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

    const nextQuestion = questions.find((question) => !updatedAnswers[question.id]);

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
        "Your result has been calculated, but local saving failed in this browser. Please try again."
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
          "Your score has been calculated. The diagnostic notification could not be sent because the optional email address entered appears to be invalid."
        );
      } else {
        setSubmitError(
          "Your score has been calculated, but the diagnostic completion notification could not be sent."
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
            <p className="brand-kicker">HR Operations Health Check</p>
            <h1 className="brand-heading-xl mt-3">
              Identify where HR operations may be starting to strain
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Answer 10 questions to assess how HR is operating across process
              clarity, ownership, service access, and delivery consistency.
            </p>
            <p className="mt-4 max-w-3xl text-sm text-[#8AAAC8]">
              This is not a generic survey. It is designed to surface how HR
              actually functions in practice and where operational friction may
              be building.
            </p>
            <p className="mt-4 max-w-3xl text-sm text-[#8AAAC8]">
              The result provides a structured view of potential strain. For
              organisations that need a deeper perspective, it can lead into the
              HR Operations Diagnostic Assessment across leadership, managers,
              and HR.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
          <div className="mb-10 rounded-[1.75rem] bg-white p-6 shadow-sm sm:p-8">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <h2 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                  What you will receive
                </h2>
                <p className="text-base leading-7 text-slate-700">
                  The Health Check is designed to do more than produce a score.
                  It gives you an initial operational read on how HR appears to
                  be functioning in practice, where strain may be accumulating,
                  and which issues are more likely to reflect systemic patterns
                  rather than isolated frustrations.
                </p>
                <p className="text-base leading-7 text-slate-700">
                  It is intended as a structured first layer of clarity. For
                  some organisations, that will be enough to sharpen internal
                  priorities. For others, it will indicate where a deeper
                  diagnostic is likely to be worthwhile.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {healthCheckDeliverables.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  >
                    <h3 className="text-base font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-5">
                <h3 className="text-lg font-semibold text-slate-950">
                  How this is used
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  The Health Check is the starting point. It helps identify
                  whether the issues you are seeing are isolated or part of a
                  wider operational pattern.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  For organisations that need a deeper view, this can lead into
                  the HR Operations Diagnostic Assessment. That next step gathers
                  structured input across leadership, managers, and HR to build
                  a more complete picture of how work actually flows through the
                  organisation and where gaps are most likely to matter.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-10 rounded-[1.5rem] bg-white p-6 shadow-sm sm:p-8">
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
                  Optional. You will not be added to a mailing list or contacted
                  without context. If you choose to provide your email, it is
                  only used to share your result or respond to a specific enquiry.
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
                  {answeredCount} / {questions.length} questions answered ({progress}%)
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
            <p className="text-sm leading-7 text-slate-600">
              If helpful, results can also be discussed in a short follow-up
              conversation to interpret the findings and talk through what they
              may mean in practice.
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
                  : "Get My Diagnostic Result"}
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
                  Click through to see a more detailed interpretation of your
                  score and, if helpful, book a free 20-minute conversation to
                  talk through what it may mean for your organisation&apos;s HR
                  operations.
                </p>

                <Link
                  href="/contact/diagnostic-interpretation"
                  className="inline-block rounded-lg bg-[#1E6FD9] px-6 py-3 text-white"
                >
                  View detailed interpretation
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}