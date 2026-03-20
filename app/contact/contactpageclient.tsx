"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { loadDiagnosticState } from "../../lib/diagnostic-storage";

type DiagnosticDraftState = {
  answers: Record<number, 1 | 2 | 3 | 4 | 5 | undefined>;
  companySize: string;
  industry: string;
  role: string;
  countryRegion: string;
  email: string;
  acceptedNotice: boolean;
  showResults: boolean;
};

const DIAGNOSTIC_DRAFT_STORAGE_KEY = "greg-diagnostic-draft-v1";

const topicOptions = [
  "HR Operations Health Check",
  "HR Operations Advisory",
  "HR Technology Transformation",
  "HR Foundations for Growing Companies",
  "Enterprise HR Operations & Transformation",
  "Flexible Support",
  "M&A Integration",
  "Other",
] as const;

type TopicOption = (typeof topicOptions)[number];

function loadDiagnosticDraft(): DiagnosticDraftState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(DIAGNOSTIC_DRAFT_STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as DiagnosticDraftState;
  } catch (error) {
    console.error("Failed to load diagnostic draft:", error);
    return null;
  }
}

function normaliseTopic(topicParam: string | null, isDiagnosticJourney: boolean): TopicOption {
  if (isDiagnosticJourney) {
    return "HR Operations Health Check";
  }

  switch ((topicParam || "").trim().toLowerCase()) {
    case "flexible support":
      return "Flexible Support";
    case "hr operations advisory":
      return "HR Operations Advisory";
    case "hr technology transformation":
      return "HR Technology Transformation";
    case "hr foundations for growing companies":
      return "HR Foundations for Growing Companies";
    case "enterprise hr operations & transformation":
      return "Enterprise HR Operations & Transformation";
    case "m&a integration":
      return "M&A Integration";
    case "other":
      return "Other";
    default:
      return "HR Operations Advisory";
  }
}

function getIntroText(topic: TopicOption, isDiagnosticJourney: boolean): string {
  if (isDiagnosticJourney) {
    return "If you have completed the HR Operations Health Check and would like to explore your result in more detail, you can continue here.";
  }

  switch (topic) {
    case "Flexible Support":
      return "If you need senior HR operations support without a full-time headcount commitment, feel free to get in touch to discuss ad hoc, recurring, interim, or project-based support.";
    case "HR Foundations for Growing Companies":
      return "If your organisation is growing and needs stronger HR foundations, clearer processes, and more operational consistency, feel free to get in touch.";
    case "Enterprise HR Operations & Transformation":
      return "If you are exploring enterprise HR operations improvement, service delivery redesign, or broader transformation support, feel free to get in touch.";
    case "HR Technology Transformation":
      return "If you are exploring HR technology transformation, workflow redesign, or operational automation, feel free to get in touch.";
    case "M&A Integration":
      return "If you are navigating M&A integration, harmonisation, or post-deal HR operational change, feel free to get in touch.";
    case "Other":
      return "If you would like to discuss an HR operations, service delivery, or transformation challenge, feel free to get in touch.";
    default:
      return "If you are exploring HR operations advisory, HR technology transformation, or building stronger HR infrastructure, feel free to get in touch.";
  }
}

function getMessagePlaceholder(topic: TopicOption, isDiagnosticJourney: boolean): string {
  if (isDiagnosticJourney) {
    return "Briefly describe any questions you have about your diagnostic result, what stood out to you, or the HR operational challenges you would like to explore further.";
  }

  switch (topic) {
    case "Flexible Support":
      return "Briefly describe the type of support you are looking for (for example ad hoc, recurring, interim, or project-based), your current situation, and what would be most useful.";
    case "HR Foundations for Growing Companies":
      return "Briefly describe where your HR foundations currently feel unclear, inconsistent, or stretched, and what you would like to improve.";
    case "Enterprise HR Operations & Transformation":
      return "Briefly describe the organisational context, the operational or service delivery challenge, and the type of transformation support you are exploring.";
    case "HR Technology Transformation":
      return "Briefly describe your current systems, workflow, or automation challenge and the change you are trying to make.";
    case "M&A Integration":
      return "Briefly describe the transaction or integration context and the HR operational challenges you are working through.";
    case "Other":
      return "Briefly describe your organisation, challenge, or what prompted you to get in touch.";
    default:
      return "Briefly describe your organisation, the HR operations challenge you are facing, and what kind of support you are exploring.";
  }
}

export default function ContactPageClient() {
  const searchParams = useSearchParams();

  const topicParam = searchParams.get("topic");
  const sourceParam = searchParams.get("source");

  const isDiagnosticJourney =
    topicParam === "health-check" || sourceParam === "diagnostic";

  const defaultTopic = useMemo(
    () => normaliseTopic(topicParam, isDiagnosticJourney),
    [topicParam, isDiagnosticJourney]
  );

  const [selectedTopic, setSelectedTopic] = useState<TopicOption>(defaultTopic);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const introText = useMemo(
    () => getIntroText(selectedTopic, isDiagnosticJourney),
    [selectedTopic, isDiagnosticJourney]
  );

  const messagePlaceholder = useMemo(
    () => getMessagePlaceholder(selectedTopic, isDiagnosticJourney),
    [selectedTopic, isDiagnosticJourney]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;

    setIsSubmitting(true);
    setStatus("idle");

    const formData = new FormData(form);

    const payload: {
      name: FormDataEntryValue | null;
      email: FormDataEntryValue | null;
      company: FormDataEntryValue | null;
      topic: FormDataEntryValue | null;
      message: FormDataEntryValue | null;
      source: string;
      diagnosticAnswers?: ReturnType<typeof loadDiagnosticState> extends infer T
        ? T extends { answers: infer A }
          ? A
          : never
        : never;
      companySize?: string;
      industry?: string;
      role?: string;
      countryRegion?: string;
    } = {
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      topic: formData.get("topic"),
      message: formData.get("message"),
      source: sourceParam ?? "website",
    };

    if (isDiagnosticJourney) {
      const saved = loadDiagnosticState();
      const draft = loadDiagnosticDraft();

      if (saved) {
        payload.diagnosticAnswers = saved.answers;
      }

      if (draft) {
        payload.companySize = draft.companySize || undefined;
        payload.industry = draft.industry || undefined;
        payload.role = draft.role || undefined;
        payload.countryRegion = draft.countryRegion || undefined;
      }
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      setStatus("success");
      form.reset();
      setSelectedTopic(defaultTopic);
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="brand-kicker">Contact</p>
            <h1 className="brand-heading-xl mt-3">Start a conversation</h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              {introText}
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div className="brand-surface-soft rounded-2xl p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Organisation
                  </label>
                  <input
                    type="text"
                    name="company"
                    placeholder="Company name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Area of Interest
                  </label>
                  <select
                    name="topic"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value as TopicOption)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  >
                    {topicOptions.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Message
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    placeholder={messagePlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="brand-button-primary w-full rounded-xl py-3 text-base font-medium"
                >
                  {isSubmitting ? "Sending..." : "Send Enquiry"}
                </button>

                {status === "success" && (
                  <p className="text-sm text-green-600">
                    Your message has been sent successfully.
                  </p>
                )}

                {status === "error" && (
                  <p className="text-sm text-red-600">
                    Something went wrong. Please try again.
                  </p>
                )}
              </form>
            </div>

            <div className="space-y-8">
              <div className="brand-surface-soft rounded-2xl p-6 sm:p-8">
                <h2 className="brand-heading-md text-slate-900">
                  Contact Information
                </h2>

                <div className="mt-6 space-y-5 text-slate-700">
                  <div>
                    <p className="text-sm uppercase tracking-wider text-slate-500">
                      Location
                    </p>
                    <p className="mt-1 text-lg">Oxford, United Kingdom</p>
                  </div>

                  <div>
                    <p className="text-sm uppercase tracking-wider text-slate-500">
                      Engagement
                    </p>
                    <p className="mt-1 text-lg leading-8">
                      Remote advisory, transformation programmes, flexible support,
                      and selected on-site engagements.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <iframe
                  src="https://www.google.com/maps?q=Oxford,United%20Kingdom&output=embed"
                  className="h-[320px] w-full border-0"
                  loading="lazy"
                  title="Oxford map"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}