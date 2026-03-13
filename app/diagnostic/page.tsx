"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AnswerValue = 1 | 2 | 3 | 4 | 5;

type Question = {
  id: number;
  dimension: string;
  text: string;
};

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

function scoreToBand(score: number) {
  if (score <= 24) {
    return {
      label: "Operationally Chaotic",
      summary:
        "Your HR operations are likely highly reactive, inconsistent, and too dependent on individual effort or workarounds.",
      freeInsights: [
        "Core HR processes may not be clear or consistently followed.",
        "Managers and employees may be getting different answers to similar issues.",
        "Operational friction is likely becoming visible during growth, onboarding, or change.",
      ],
    };
  }

  if (score <= 49) {
    return {
      label: "Friction Building",
      summary:
        "Some HR foundations exist, but operational friction is likely increasing as the organisation grows.",
      freeInsights: [
        "Managers may interpret HR processes differently.",
        "Manual workarounds may be increasing.",
        "Growth may be exposing gaps that previously went unnoticed.",
      ],
    };
  }

  if (score <= 74) {
    return {
      label: "Partially Structured",
      summary:
        "Your organisation appears to have reasonable HR foundations, though opportunities likely exist to improve consistency and scalability.",
      freeInsights: [
        "Core structures likely exist but may be fragmented.",
        "Some operational drag may exist in workflows.",
        "Incremental improvements could unlock significant value.",
      ],
    };
  }

  return {
    label: "Operationally Strong",
    summary:
      "Your HR operations appear relatively well structured and capable of supporting organisational growth.",
    freeInsights: [
      "Processes appear relatively structured.",
      "Operational governance likely exists.",
      "Targeted improvements may further optimise delivery.",
    ],
  };
}

function getDimensionAverages(answers: Record<number, AnswerValue | undefined>) {
  const groups: { label: string; ids: number[] }[] = [
    { label: "Process clarity", ids: [1] },
    { label: "Consistency", ids: [2] },
    { label: "Service access", ids: [3] },
    { label: "Ownership", ids: [4] },
    { label: "Onboarding", ids: [5] },
    { label: "Technology alignment", ids: [6] },
    { label: "Knowledge and self-service", ids: [7] },
    { label: "Operational capacity", ids: [8] },
    { label: "Data and handoffs", ids: [9] },
    { label: "Change resilience", ids: [10] },
  ];

  return groups.map((group) => {
    const values: number[] = group.ids.map((id) => Number(answers[id] ?? 0));

    const total = values.reduce((sum: number, value: number) => sum + value, 0);

    const average = total / values.length;

    return {
      label: group.label,
      average,
      score: Math.round(((average - 1) / 4) * 100),
    };
  });
}

export default function DiagnosticPage() {
  const [answers, setAnswers] = useState<
    Record<number, AnswerValue | undefined>
  >({});

  const [acceptedNotice, setAcceptedNotice] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  const progress = Math.round((answeredCount / questions.length) * 100);
  const allAnswered = answeredCount === questions.length;

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
    return getDimensionAverages(answers).sort((a, b) => a.score - b.score);
  }, [answers, allAnswered]);

  function updateAnswer(questionId: number, value: AnswerValue) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setShowResults(false);
  }

  function calculateScore() {
    if (!allAnswered || !acceptedNotice) return;
    setShowResults(true);
  }

  function resetDiagnostic() {
    setAnswers({});
    setAcceptedNotice(false);
    setShowResults(false);
  }

  return (
    <main className="bg-[#F4F6FA] py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-4xl font-bold text-[#0A1628] mb-8">
          HR Operations Health Check
        </h1>

        <p className="text-slate-600 mb-10">
          Answer 10 questions to assess potential HR operational friction.
        </p>

        <div className="mb-10">
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1E6FD9]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-sm text-slate-600 mt-2">
            {answeredCount} / {questions.length} questions answered
          </p>
        </div>

        <div className="space-y-8">
          {questions.map((q) => (
            <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-slate-800 font-medium mb-4">{q.text}</p>

              <div className="space-y-2">
                {scaleOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 text-sm text-slate-700"
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

        <div className="mt-10 space-y-4">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={acceptedNotice}
              onChange={(e) => setAcceptedNotice(e.target.checked)}
            />
            I understand this tool provides general informational guidance only
            and is not legal or professional advice.
          </label>

          <div className="flex gap-4">
            <button
              onClick={calculateScore}
              disabled={!allAnswered || !acceptedNotice}
              className="bg-[#1E6FD9] text-white px-6 py-3 rounded-lg disabled:bg-slate-400"
            >
              Calculate score
            </button>

            <button
              onClick={resetDiagnostic}
              className="border border-slate-300 px-6 py-3 rounded-lg"
            >
              Reset
            </button>
          </div>
        </div>

        {showResults && score !== null && band && (
          <div className="mt-16 bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">
              Your HR Operations Score: {score} / 100
            </h2>

            <p className="font-medium text-lg mb-2">{band.label}</p>

            <p className="text-slate-700 mb-6">{band.summary}</p>

            <ul className="space-y-2 text-slate-700">
              {band.freeInsights.map((insight) => (
                <li key={insight}>• {insight}</li>
              ))}
            </ul>

            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-block bg-[#1E6FD9] text-white px-6 py-3 rounded-lg"
              >
                Discuss your diagnostic
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}