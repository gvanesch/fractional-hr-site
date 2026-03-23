"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  calculatePercentageScore,
  calculateRawScore,
  scoreToBand,
  type AnswerValue,
  type ResultBand,
} from "../../lib/diagnostic";
import { loadDiagnosticState } from "../../lib/diagnostic-storage";

type ContactPageClientProps = {
  topicParam?: string;
  sourceParam?: string;
};

type ContactFormState = {
  name: string;
  email: string;
  company: string;
  topic: string;
  message: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

type DiagnosticContextPayload = {
  score: number;
  bandLabel: ResultBand;
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
  answers?: Record<number, AnswerValue | undefined>;
};

type DiagnosticMetadata = {
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
};

const TOPIC_OPTIONS = [
  "HR Operations Advisory",
  "HR Foundations Sprint",
  "HRIS Automation",
  "Service Delivery Improvement",
  "Diagnostic Follow-up",
  "General Enquiry",
] as const;

function normaliseTopic(topicParam?: string, sourceParam?: string): string {
  const isDiagnosticJourney =
    topicParam === "health-check" || sourceParam === "diagnostic";

  if (isDiagnosticJourney) {
    return "Diagnostic Follow-up";
  }

  if (!topicParam) {
    return "HR Operations Advisory";
  }

  const decodedTopic = decodeURIComponent(topicParam).trim().toLowerCase();

  switch (decodedTopic) {
    case "hr-foundations-sprint":
      return "HR Foundations Sprint";
    case "hris-automation":
      return "HRIS Automation";
    case "service-delivery-improvement":
      return "Service Delivery Improvement";
    case "diagnostic-follow-up":
      return "Diagnostic Follow-up";
    case "general-enquiry":
      return "General Enquiry";
    case "hr-operations-advisory":
      return "HR Operations Advisory";
    case "health-check":
      return "Diagnostic Follow-up";
    default:
      return "HR Operations Advisory";
  }
}

function getIntroCopy(topic: string, isDiagnosticJourney: boolean) {
  if (isDiagnosticJourney || topic === "Diagnostic Follow-up") {
    return {
      eyebrow: "Diagnostic follow-up",
      title: "Continue the conversation",
      description:
        "Use this form to ask a question about your diagnostic result, share more context, or start a discussion about the issues highlighted in your assessment.",
      placeholder:
        "Briefly describe any questions you have about your diagnostic result, or the HR operational challenges you would like to explore.",
    };
  }

  switch (topic) {
    case "HR Foundations Sprint":
      return {
        eyebrow: "HR foundations sprint",
        title: "Discuss your HR foundations",
        description:
          "Share a little context about your organisation and where things are starting to break down. I will use that to shape a practical first conversation.",
        placeholder:
          "Briefly describe your current HR foundations, the operational issues you are facing, and what support you may need.",
      };
    case "HRIS Automation":
      return {
        eyebrow: "HRIS automation",
        title: "Discuss HRIS automation",
        description:
          "Share the systems, manual work, or service delivery friction you want to improve. The aim is to understand what is happening today and where automation could realistically help.",
        placeholder:
          "Briefly describe your current HR systems, manual processes, and the automation or service issues you want to improve.",
      };
    case "Service Delivery Improvement":
      return {
        eyebrow: "Service delivery improvement",
        title: "Discuss service delivery improvement",
        description:
          "Use this form to outline the service model, pain points, or operating issues you want to resolve.",
        placeholder:
          "Briefly describe your current service delivery challenges, where friction is showing up, and what better looks like.",
      };
    case "General Enquiry":
      return {
        eyebrow: "General enquiry",
        title: "Start a conversation",
        description:
          "Share a little context about your organisation and what you want to improve. I will come back with a sensible next step.",
        placeholder:
          "Briefly describe your organisation, the challenge you are working through, and the support you may need.",
      };
    case "HR Operations Advisory":
    default:
      return {
        eyebrow: "HR operations advisory",
        title: "Discuss your HR operations priorities",
        description:
          "Share some context on your organisation, the operational challenges you are facing, and where you need practical support.",
        placeholder:
          "Briefly describe your organisation, the HR operational issues you want to address, and the support you may need.",
      };
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function extractDiagnosticMetadata(value: unknown): DiagnosticMetadata {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;

  return {
    companySize: isString(record.companySize) ? record.companySize : undefined,
    industry: isString(record.industry) ? record.industry : undefined,
    role: isString(record.role) ? record.role : undefined,
    countryRegion: isString(record.countryRegion)
      ? record.countryRegion
      : undefined,
  };
}

function buildDiagnosticContext(): DiagnosticContextPayload | undefined {
  const diagnosticState = loadDiagnosticState();

  if (!diagnosticState?.answers) {
    return undefined;
  }

  const answers = diagnosticState.answers as Record<number, AnswerValue | undefined>;
  const rawScore = calculateRawScore(answers);
  const score = calculatePercentageScore(rawScore);
  const bandLabel = scoreToBand(score);
  const metadata = extractDiagnosticMetadata(diagnosticState);

  return {
    score,
    bandLabel,
    companySize: metadata.companySize,
    industry: metadata.industry,
    role: metadata.role,
    countryRegion: metadata.countryRegion,
    answers,
  };
}

export default function ContactPageClient({
  topicParam,
  sourceParam,
}: ContactPageClientProps) {
  const isDiagnosticJourney =
    topicParam === "health-check" || sourceParam === "diagnostic";

  const defaultTopic = useMemo(
    () => normaliseTopic(topicParam, sourceParam),
    [topicParam, sourceParam],
  );

  const introCopy = useMemo(
    () => getIntroCopy(defaultTopic, isDiagnosticJourney),
    [defaultTopic, isDiagnosticJourney],
  );

  const [formState, setFormState] = useState<ContactFormState>({
    name: "",
    email: "",
    company: "",
    topic: defaultTopic,
    message: "",
  });

  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

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
      const diagnosticContext = isDiagnosticJourney
        ? buildDiagnosticContext()
        : undefined;

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formState,
          source: isDiagnosticJourney ? "diagnostic" : "contact-page",
          diagnosticContext,
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      setSubmitState("success");
      setSuccessMessage(
        data.message ||
          "Thanks, your message has been sent. I will come back to you shortly.",
      );

      setFormState({
        name: "",
        email: "",
        company: "",
        topic: defaultTopic,
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
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="brand-kicker">{introCopy.eyebrow}</p>
            <h1 className="brand-heading-xl mt-6 text-white">
              {introCopy.title}
            </h1>
            <p className="brand-body-on-dark mt-6 max-w-2xl">
              {introCopy.description}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="https://calendly.com/greg-vanesch/30min"
                className="brand-button-primary"
                target="_blank"
                rel="noreferrer"
              >
                Book diagnostic conversation
              </Link>

              <Link href="/diagnostic" className="brand-button-dark">
                Take the health check
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="brand-surface">
            <div className="max-w-2xl">
              <p className="brand-section-kicker">Contact form</p>
              <h2 className="brand-heading-lg mt-4">Share your context</h2>
              <p className="brand-body mt-4 text-slate-700">
                The more specific you are about the operational issue, the more
                useful the next conversation will be.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formState.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="company"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Company
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={formState.company}
                    onChange={(event) =>
                      updateField("company", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="topic"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Topic
                  </label>
                  <select
                    id="topic"
                    value={formState.topic}
                    onChange={(event) => updateField("topic", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                    required
                  >
                    {TOPIC_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-slate-900"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  value={formState.message}
                  onChange={(event) =>
                    updateField("message", event.target.value)
                  }
                  placeholder={introCopy.placeholder}
                  className="min-h-[180px] w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                  required
                />
              </div>

              {submitState === "success" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  {successMessage}
                </div>
              ) : null}

              {submitState === "error" ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={submitState === "submitting"}
                >
                  {submitState === "submitting"
                    ? "Sending..."
                    : "Send enquiry"}
                </button>

                <p className="text-sm text-slate-500">
                  Or book directly if you already know you want a first
                  conversation.
                </p>
              </div>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="brand-card-dark">
              <p className="brand-section-kicker">Booking option</p>
              <h2 className="brand-heading-md mt-4 text-white">
                Prefer to speak directly?
              </h2>
              <p className="brand-body-on-dark mt-4">
                You can book a 30-minute diagnostic conversation now. That is
                usually the fastest route if the issue is already clear.
              </p>
              <div className="mt-6">
                <Link
                  href="https://calendly.com/greg-vanesch/30min"
                  className="brand-button-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Book now
                </Link>
              </div>
            </div>

            <div className="brand-surface-soft">
              <p className="brand-section-kicker">What to include</p>
              <h2 className="brand-heading-md mt-4 text-slate-950">
                Useful context
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li>Current company stage or size</li>
                <li>Where HR operations are breaking down</li>
                <li>Any systems involved</li>
                <li>What good would look like</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}