"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadDiagnosticState } from "@/lib/diagnostic-storage";
import type { DiagnosticAnswers } from "@/lib/diagnostic";

type ContactFormState = {
  name: string;
  email: string;
  company: string;
  topic: string;
  message: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

type LoadedDiagnosticState = {
  answers?: DiagnosticAnswers;
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
  result?: {
    score: number;
    band: {
      label: string;
      summary: string;
    };
  };
} | null;

type HealthCheckDraftState = {
  answers?: Record<number, 1 | 2 | 3 | 4 | 5 | undefined>;
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
  email?: string;
  acceptedNotice?: boolean;
  showResults?: boolean;
};

const DIAGNOSTIC_DRAFT_STORAGE_KEY = "greg-diagnostic-draft-v1";
const HEALTH_CHECK_SUBMISSION_ID_STORAGE_KEY = "health-check-submission-id";

const enquiryTopics = [
  "General Enquiry",
  "HR Health Check Interpretation",
  "HR Operations Diagnostic Assessment",
  "HR Foundations Sprint",
  "HR Operations Advisory",
  "HR Technology / Workflow Support",
  "M&A / Integration Support",
  "Fractional HR Advisory",
];

function normaliseTopic(
  topicParam?: string | null,
  sourceParam?: string | null,
): string {
  const decoded =
    typeof topicParam === "string" ? decodeURIComponent(topicParam).trim() : "";

  if (
    sourceParam === "diagnostic-interpretation" ||
    decoded === "Diagnostic Interpretation" ||
    decoded === "HR Health Check Interpretation"
  ) {
    return "HR Health Check Interpretation";
  }

  if (
    decoded === "Fractional HR Advisory" ||
    decoded === "Fractional HR Leadership"
  ) {
    return "Fractional HR Advisory";
  }

  if (decoded && enquiryTopics.includes(decoded)) {
    return decoded;
  }

  return "General Enquiry";
}

function baseFieldClassName() {
  return "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15";
}

function normaliseDraftAnswers(
  answers: HealthCheckDraftState["answers"],
): DiagnosticAnswers | undefined {
  if (!answers || typeof answers !== "object") {
    return undefined;
  }

  const entries = Object.entries(answers).filter(([, value]) =>
    value === 1 || value === 2 || value === 3 || value === 4 || value === 5,
  );

  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(
    entries.map(([key, value]) => [Number(key), value]),
  ) as DiagnosticAnswers;
}

export default function ContactPageClient() {
  const searchParams = useSearchParams();

  const topicParam = searchParams.get("topic");
  const sourceParam = searchParams.get("source");
  const scoreParam = searchParams.get("score");
  const bandParam = searchParams.get("band");
  const submissionIdParam = searchParams.get("submissionId");

  const forcedTopic = useMemo(
    () => normaliseTopic(topicParam, sourceParam),
    [topicParam, sourceParam],
  );

  const isHealthCheckJourney = sourceParam === "diagnostic-interpretation";

  const [formState, setFormState] = useState<ContactFormState>({
    name: "",
    email: "",
    company: "",
    topic: forcedTopic,
    message: "",
  });

  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [diagnosticState, setDiagnosticState] =
    useState<LoadedDiagnosticState>(null);
  const [draftState, setDraftState] = useState<HealthCheckDraftState | null>(
    null,
  );
  const [storedSubmissionId, setStoredSubmissionId] = useState("");

  useEffect(() => {
    try {
      const state = loadDiagnosticState();
      setDiagnosticState((state as LoadedDiagnosticState) ?? null);
    } catch (error) {
      console.error("Failed to load diagnostic state for contact form:", error);
      setDiagnosticState(null);
    }

    try {
      const rawDraft = window.localStorage.getItem(
        DIAGNOSTIC_DRAFT_STORAGE_KEY,
      );

      if (rawDraft) {
        const parsed = JSON.parse(rawDraft) as HealthCheckDraftState;
        setDraftState(parsed);
      } else {
        setDraftState(null);
      }
    } catch (error) {
      console.error("Failed to load health check draft for contact form:", error);
      setDraftState(null);
    }

    try {
      const storedId =
        window.localStorage.getItem(HEALTH_CHECK_SUBMISSION_ID_STORAGE_KEY) ?? "";
      setStoredSubmissionId(storedId);
    } catch (error) {
      console.error("Failed to load stored health check submission id:", error);
      setStoredSubmissionId("");
    }
  }, []);

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      topic: forcedTopic,
    }));
  }, [forcedTopic]);

  const effectiveSubmissionId = useMemo(() => {
    if (submissionIdParam && submissionIdParam.trim()) {
      return submissionIdParam.trim();
    }

    if (storedSubmissionId && storedSubmissionId.trim()) {
      return storedSubmissionId.trim();
    }

    return "";
  }, [submissionIdParam, storedSubmissionId]);

  const displayScore =
    diagnosticState?.result?.score ?? (scoreParam ? Number(scoreParam) : null);

  const displayBand = diagnosticState?.result?.band?.label ?? bandParam ?? null;

  const effectiveTopic = isHealthCheckJourney
    ? "HR Health Check Interpretation"
    : formState.topic;

  const effectiveDiagnosticAnswers =
    normaliseDraftAnswers(draftState?.answers) ?? diagnosticState?.answers;

  const effectiveCompanySize = draftState?.companySize?.trim() || undefined;
  const effectiveIndustry = draftState?.industry?.trim() || undefined;
  const effectiveRole = draftState?.role?.trim() || undefined;
  const effectiveCountryRegion = draftState?.countryRegion?.trim() || undefined;

  function updateField<K extends keyof ContactFormState>(
    key: K,
    value: ContactFormState[K],
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitState("submitting");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formState,
          topic: effectiveTopic,
          source: sourceParam ?? "contact-page",
          submissionId: effectiveSubmissionId || undefined,
          diagnosticAnswers: effectiveDiagnosticAnswers,
          companySize: effectiveCompanySize,
          industry: effectiveIndustry,
          role: effectiveRole,
          countryRegion: effectiveCountryRegion,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSubmitState("success");
      setSuccessMessage(
        data.message ||
        "Thanks. Your message has been sent and we will come back to you shortly.",
      );

      setFormState({
        name: "",
        email: "",
        company: "",
        topic: forcedTopic,
        message: "",
      });
    } catch (error) {
      setSubmitState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Contact</p>

              <h1 className="brand-heading-xl">Start a conversation.</h1>
            </div>

            <p className="brand-subheading brand-body-on-dark max-w-4xl">
              A short initial conversation to understand what is happening,
              where greater clarity may be useful, and what a sensible next step looks like.
            </p>

            <p className="max-w-4xl text-base leading-8 text-[#C7D8EA]">
              In many cases, the Health Check is the right first step. It provides a structured initial read that helps shape a more focused conversation.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section-tight">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
            <div className="brand-surface-card p-8 lg:p-10">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Conversation form</p>

                <h2 className="brand-heading-lg text-slate-950">
                  Share the basics.
                </h2>

                <p className="brand-body-lg">
                  A short summary of what is not running as it should, where it
                  is creating friction, and what would be most useful to explore
                  is enough.
                </p>
              </div>

              {isHealthCheckJourney && (displayScore !== null || displayBand) ? (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Health Check context detected
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Score
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {displayScore !== null
                          ? `${displayScore} / 100`
                          : "Not available"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Profile
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {displayBand ?? "Not available"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Because this message is linked to your Health Check, the
                    related responses and result may be attached so they can be
                    reviewed in context.
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Please avoid including sensitive personal employee data in
                    your message.
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={baseFieldClassName()}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">
                      Work email
                    </label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={baseFieldClassName()}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formState.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className={baseFieldClassName()}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Topic
                  </label>
                  <select
                    value={effectiveTopic}
                    onChange={(e) => updateField("topic", e.target.value)}
                    className={baseFieldClassName()}
                    required
                    disabled={isHealthCheckJourney}
                  >
                    {enquiryTopics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>

                  {isHealthCheckJourney ? (
                    <p className="mt-2 text-xs text-slate-500">
                      This has been selected automatically because you arrived
                      from the Health Check journey.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    What would be useful to discuss?
                  </label>
                  <textarea
                    value={formState.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    className={`${baseFieldClassName()} min-h-[380px] resize-y`}
                    placeholder={`Briefly describe:
• what is currently not working as it should
• where this is creating friction
• what would be most useful to explore`}
                    required
                  />
                </div>

                {submitState === "error" && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                {submitState === "success" && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="brand-button-primary"
                  disabled={submitState === "submitting"}
                >
                  {submitState === "submitting"
                    ? "Sending..."
                    : "Start a conversation"}
                </button>

              </form>
            </div>

            <div className="brand-stack-lg">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Recommended first step</p>

                <h2 className="brand-heading-lg text-slate-950">
                  In many cases, take the Health Check first.
                </h2>

                <p className="brand-body-lg">
                  The Health Check is often the most useful starting point when the situation would benefit from a clearer view before deciding what to do next.
                </p>

                <div className="pt-2">
                  <Link
                    href="/diagnostic"
                    className="brand-button-dark px-6 py-3 text-base font-medium"
                  >
                    Take the Health Check
                  </Link>
                </div>
              </div>

              <div className="brand-ruled-list">
                <div className="brand-ruled-item">
                  <p className="brand-ruled-item-num">01</p>
                  <div>
                    <h3 className="brand-ruled-item-title">
                      Use the Health Check when
                    </h3>
                    <p className="brand-ruled-item-body">
                      The pattern is visible, but you want a clearer initial view
                      before deciding what to do next.
                    </p>
                  </div>
                </div>

                <div className="brand-ruled-item">
                  <p className="brand-ruled-item-num">02</p>
                  <div>
                    <h3 className="brand-ruled-item-title">
                      Use the form now when
                    </h3>
                    <p className="brand-ruled-item-body">
                      The issue is already clear enough that a direct conversation
                      would be more useful than a first diagnostic read.
                    </p>
                  </div>
                </div>

                <div className="brand-ruled-item">
                  <p className="brand-ruled-item-num">03</p>
                  <div>
                    <h3 className="brand-ruled-item-title">
                      What happens next
                    </h3>
                    <p className="brand-ruled-item-body">
                      We review the message and come back to you with a clear next step. That is usually a focused discussion based on your context, with any further diagnostic or structured work shaped from there.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pb-8 border-b border-slate-200">
                <p className="text-sm leading-7 text-slate-600">
                  Please avoid including sensitive personal employee data in
                  your message.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}