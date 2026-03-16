"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";

type AnswerValue = 1 | 2 | 3 | 4 | 5;

type Question = {
  id: number;
  dimension: string;
  text: string;
};

type ResultBand = {
  label: string;
  summary: string;
  freeInsights: string[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const questions: Question[] = [
  {
    id: 1,
    dimension: "Process clarity",
    text: "Our core HR processes are documented clearly enough that managers and HR team members can follow them consistently.",
  },
  {
    id: 2,
    dimension: "Consistency",
    text: "Employees and managers generally receive a consistent HR experience across teams, departments, or locations.",
  },
  {
    id: 3,
    dimension: "Service access",
    text: "Employees know where to go for HR help, and the route for getting support is clear.",
  },
  {
    id: 4,
    dimension: "Ownership",
    text: "Ownership for key HR processes, approvals, and escalations is clearly defined.",
  },
  {
    id: 5,
    dimension: "Onboarding",
    text: "Onboarding is structured and repeatable rather than depending heavily on individual managers or manual follow-up.",
  },
  {
    id: 6,
    dimension: "Technology alignment",
    text: "Our HR systems and workflows reflect how work actually happens in the organisation.",
  },
  {
    id: 7,
    dimension: "Knowledge and self-service",
    text: "Managers and employees can find answers to common HR questions without always needing direct help from HR.",
  },
  {
    id: 8,
    dimension: "Operational capacity",
    text: "HR has enough structure and capacity to improve operations proactively, rather than spending most of its time reacting.",
  },
  {
    id: 9,
    dimension: "Data and handoffs",
    text: "HR data, handoffs, and workflow transitions are reliable enough that work does not regularly get stuck, repeated, or corrected.",
  },
  {
    id: 10,
    dimension: "Change resilience",
    text: "When the organisation grows or changes, HR processes can adapt without becoming confusing or chaotic.",
  },
];

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

function scoreToBand(score: number): ResultBand {
  if (score <= 24) {
    return {
      label: "Emerging Foundations",
      summary:
        "HR processes may still be evolving and some operational responsibilities may be handled informally. As organisations grow, this can begin to create friction for managers and employees.",
      freeInsights: [
        "Core HR processes may still need clearer structure or documentation.",
        "Managers may experience inconsistency in how people processes are handled.",
        "Strengthening operational foundations can improve consistency and reduce management overhead.",
      ],
    };
  }

  if (score <= 49) {
    return {
      label: "Developing Structure",
      summary:
        "The organisation likely has some HR operational foundations in place, though inconsistencies may still appear across teams or processes as the business grows.",
      freeInsights: [
        "Some processes may rely too heavily on individual judgement or workarounds.",
        "Clearer process ownership can improve consistency across the organisation.",
        "More structured HR service delivery can support growth more effectively.",
      ],
    };
  }

  if (score <= 74) {
    return {
      label: "Structured but Improving",
      summary:
        "Many HR operational foundations appear to be in place. However, some areas may still benefit from refinement to improve efficiency, consistency, and resilience.",
      freeInsights: [
        "Core structures likely exist but may not yet be fully embedded.",
        "Some friction may still appear in handoffs, service access, or process execution.",
        "Targeted improvements could strengthen scalability and operational confidence.",
      ],
    };
  }

  return {
    label: "Operationally Mature",
    summary:
      "HR operations appear well structured and capable of supporting organisational growth. Continued refinement can help maintain efficiency and keep HR aligned with business priorities.",
    freeInsights: [
      "Processes appear relatively well established and consistent.",
      "Operational governance is likely supporting delivery effectively.",
      "Targeted optimisation may still unlock additional value over time.",
    ],
  };
}

function getDimensionScores(answers: Record<number, AnswerValue | undefined>) {
  return questions.map((q) => ({
    label: q.dimension,
    score: Number(answers[q.id] ?? 0),
  }));
}

function getOrCreateBrowserToken(): string {
  const storageKey = "diagnostic_browser_token";
  const existing = window.localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const newToken = `${crypto.randomUUID()}-${Date.now()}`;
  window.localStorage.setItem(storageKey, newToken);
  return newToken;
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

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
  const [submitError, setSubmitError] = useState("");

  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  const progress = Math.round((answeredCount / questions.length) * 100);
  const allAnswered = answeredCount === questions.length;
  const contextComplete = Boolean(companySize && industry && role);

  const rawScore = useMemo(() => {
    if (!allAnswered) return null;

    return questions.reduce((sum: number, question) => {
      return sum + Number(answers[question.id] ?? 0);
    }, 0);
  }, [answers, allAnswered]);

  const score = useMemo(() => {
    if (rawScore === null) return null;
    return Math.round(((rawScore - 10) / 40) * 100);
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

  function scrollToNextQuestion(updatedAnswers: Record<number, AnswerValue | undefined>) {
    const nextQuestion = questions.find((question) => !updatedAnswers[question.id]);

    if (!nextQuestion) {
      return;
    }

    const nextElement = questionRefs.current[nextQuestion.id];

    if (!nextElement) {
      return;
    }

    const headerOffset = 140;
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

    window.setTimeout(() => {
      scrollToNextQuestion(updatedAnswers);
    }, 120);
  }

  async function calculateScore() {
    if (!allAnswered || !acceptedNotice || !contextComplete || score === null || !band) {
      return;
    }

    setSaveStatus("saving");
    setSubmitError("");

    const dimensionMap = getDimensionScores(answers).reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.label] = item.score;
        return acc;
      },
      {}
    );

    let abuseToken: string | null = null;

    try {
      const browserToken = getOrCreateBrowserToken();
      const dailySalt = new Date().toISOString().slice(0, 10);
      abuseToken = await sha256Hex(`${browserToken}:${dailySalt}`);
    } catch (error) {
      console.error("Abuse token generation failed:", error);
    }

    const payload = {
      company_size: companySize,
      industry,
      role,
      country_region: countryRegion || null,
      email: email || null,
      score,
      band: band.label,
      process_clarity_score: dimensionMap["Process clarity"],
      consistency_score: dimensionMap["Consistency"],
      service_access_score: dimensionMap["Service access"],
      ownership_score: dimensionMap["Ownership"],
      onboarding_score: dimensionMap["Onboarding"],
      technology_alignment_score: dimensionMap["Technology alignment"],
      knowledge_self_service_score: dimensionMap["Knowledge and self-service"],
      operational_capacity_score: dimensionMap["Operational capacity"],
      data_handoffs_score: dimensionMap["Data and handoffs"],
      change_resilience_score: dimensionMap["Change resilience"],
      answers,
      abuse_token: abuseToken,
    };

    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.from("diagnostic_submissions").insert(payload);

      if (error) {
        console.error("Supabase insert error:", error);
        setSaveStatus("error");
        setSubmitError(
          "Your result has been calculated, but the submission could not be saved. Please check your Supabase configuration and try again."
        );
      } else {
        setSaveStatus("saved");
      }
    } catch (error) {
      console.error("Supabase client error:", error);
      setSaveStatus("error");
      setSubmitError(
        "Your result has been calculated, but the submission could not be saved. Please check your Supabase configuration and try again."
      );
    }

    setShowResults(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
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
    setSubmitError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="bg-[#F4F6FA] py-20">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="mb-8 text-4xl font-bold text-[#0A1628]">
          HR Operations Health Check
        </h1>

        <p className="mb-10 text-slate-600">
          Answer 10 questions to assess potential HR operational friction and get an
          immediate HR Operations Score.
        </p>

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
                onChange={(e) => setCompanySize(e.target.value)}
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
                onChange={(e) => setIndustry(e.target.value)}
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
                onChange={(e) => setRole(e.target.value)}
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
                onChange={(e) => setCountryRegion(e.target.value)}
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
                onChange={(e) => setEmail(e.target.value)}
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

        <div className="sticky top-20 z-40 mb-10 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
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

        <div className="space-y-8">
          {questions.map((q) => (
            <div
              key={q.id}
              ref={(element) => {
                questionRefs.current[q.id] = element;
              }}
              className="rounded-lg bg-white p-6 shadow-sm"
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
              onChange={(e) => setAcceptedNotice(e.target.checked)}
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
                saveStatus === "saving"
              }
              className="rounded-lg bg-[#1E6FD9] px-6 py-3 text-white disabled:bg-slate-400"
            >
              {saveStatus === "saving" ? "Calculating..." : "Calculate score"}
            </button>

            <button
              onClick={resetDiagnostic}
              className="rounded-lg border border-slate-300 px-6 py-3"
            >
              Reset
            </button>
          </div>
        </div>

        {showResults && score !== null && band && (
          <div className="mt-16 rounded-lg bg-white p-8 shadow">
            <h2 className="mb-2 text-2xl font-semibold">
              Your HR Operations Maturity Score: {score} / 100
            </h2>

            <p className="mb-1 text-lg font-medium text-[#1E6FD9]">{band.label}</p>

            <p className="mb-6 text-slate-700">{band.summary}</p>

            <h3 className="mb-4 text-lg font-semibold">Operational Profile</h3>

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
                <h3 className="mb-3 text-lg font-semibold">
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
              {saveStatus === "saved" && (
                <p>
                  Your result has been saved and may be used in aggregated or anonymised
                  benchmarking analysis.
                </p>
              )}
              {saveStatus === "error" && (
                <p>
                  Your result has been calculated, but the submission could not be saved.
                </p>
              )}
            </div>

            <div className="mt-8 rounded-lg bg-slate-50 p-6">
              <h4 className="mb-2 text-lg font-semibold">
                Would a short interpretation of your results be helpful?
              </h4>

              <p className="mb-4 text-sm text-slate-600">
                If helpful, we can walk through your diagnostic results together and
                discuss what they may mean for your organisation&apos;s HR operations.
                This is a free 20-minute conversation with no obligation.
              </p>

              <Link
                href="/contact/diagnostic-interpretation"
                className="inline-block rounded-lg bg-[#1E6FD9] px-6 py-3 text-white"
              >
                Book a free 20-minute interpretation
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
    </main>
  );
}