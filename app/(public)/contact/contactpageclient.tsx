"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadDiagnosticState } from "@/lib/diagnostic-storage"
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

const enquiryTopics = [
  "General Enquiry",
  "HR Health Check Interpretation",
  "HR Operations Diagnostic Assessment",
  "HR Foundations Sprint",
  "HR Operations Advisory",
  "HR Technology / Workflow Support",
  "M&A / Integration Support",
  "Fractional HR Leadership",
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
  }, []);

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      topic: forcedTopic,
    }));
  }, [forcedTopic]);

  const displayScore =
    diagnosticState?.result?.score ?? (scoreParam ? Number(scoreParam) : null);

  const displayBand =
    diagnosticState?.result?.band?.label ?? bandParam ?? null;

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
          "Thanks, your enquiry has been sent. We will come back to you shortly.",
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
          <div className="max-w-3xl">
            <p className="brand-kicker">Contact</p>
            <h1 className="brand-heading-xl mt-6 text-white">
              Make an enquiry
            </h1>
            <p className="brand-body-on-dark mt-6 max-w-2xl">
              Share a little context about your organisation and what you would
              like to explore.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="brand-surface-card p-8 lg:p-10">
              <div className="max-w-3xl">
                <p className="brand-section-kicker">Enquiry form</p>
                <h2 className="brand-heading-lg mt-3 text-slate-950">
                  Discuss your context
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-700">
                  A short summary of the situation, what is proving difficult,
                  and what would be most useful to explore is enough.
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
                    Because this enquiry is linked to your HR Health Check,
                    previously submitted responses, result, and related context
                    may be attached to this enquiry so it can be reviewed and
                    discussed appropriately.
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
                    Enquiry type
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
                      from the HR Health Check interpretation journey.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    What would you like to discuss?
                  </label>
                  <textarea
                    value={formState.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    className={`${baseFieldClassName()} min-h-[190px] resize-y`}
                    placeholder={`Briefly describe:
• what is currently not working as it should
• where this is creating friction
• what would be most useful to get from the conversation`}
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
                  {submitState === "submitting" ? "Sending..." : "Send enquiry"}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="brand-surface-card p-6 lg:p-8">
                <p className="brand-section-kicker">Location</p>
                <h3 className="brand-heading-md text-slate-950">
                  Oxford, United Kingdom
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Based in Oxford and supporting growing and complex
                  organisations across the UK and internationally.
                </p>

                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <iframe
                    src="https://www.google.com/maps?q=Oxford%2C%20UK&z=12&output=embed"
                    width="100%"
                    height="220"
                    loading="lazy"
                    title="Map showing Oxford, United Kingdom"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="block border-0"
                  />
                </div>
              </div>

              <div className="brand-surface-card p-6 lg:p-8">
                <p className="brand-section-kicker">What happens next</p>
                <h3 className="brand-heading-md text-slate-950">
                  From enquiry to a focused conversation
                </h3>

                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                    We review your enquiry alongside any Health Check context
                    linked to it.
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                    We then arrange a short feedback conversation to walk
                    through what the result is likely to mean in practice.
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                    Where useful, that conversation can lead into the HR
                    Operations Diagnostic Assessment or a focused Sprint.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}