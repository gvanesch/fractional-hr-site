"use client";

import { FormEvent, useMemo, useState } from "react";

type ContactPageClientProps = {
  topicParam?: string;
  sourceParam?: string;
  scoreParam?: string;
  bandParam?: string;
};

type ContactFormState = {
  name: string;
  email: string;
  company: string;
  topic: string;
  message: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

function normaliseTopic(topicParam?: string): string {
  if (!topicParam) {
    return "General Enquiry";
  }

  const decodedTopic = decodeURIComponent(topicParam).trim();

  return decodedTopic.length > 0 ? decodedTopic : "General Enquiry";
}

function buildPrefilledMessage(
  scoreParam?: string,
  bandParam?: string,
): string {
  if (!scoreParam || !bandParam) return "";

  return `Diagnostic context:
Score: ${scoreParam}
Band: ${bandParam}

Please provide guidance on what this means and what should be prioritised.`;
}

export default function ContactPageClient({
  topicParam,
  sourceParam,
  scoreParam,
  bandParam,
}: ContactPageClientProps) {
  const defaultTopic = useMemo(() => normaliseTopic(topicParam), [topicParam]);

  const [formState, setFormState] = useState<ContactFormState>({
    name: "",
    email: "",
    company: "",
    topic: defaultTopic,
    message: buildPrefilledMessage(scoreParam, bandParam),
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formState,
          source: sourceParam ?? "contact-page",
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      setSubmitState("success");
      setSuccessMessage(
        data.message ||
          "Thanks, your enquiry has been sent. I will come back to you shortly.",
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
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-24 lg:py-28">
          <div className="max-w-3xl">
            <p className="brand-kicker">Contact</p>
            <h1 className="brand-heading-xl mt-6 text-white">
              Make an enquiry
            </h1>
            <p className="brand-body-on-dark mt-6 max-w-2xl">
              Use the form below to share a little context about your
              organisation and the support you may need.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:items-start">
          <div className="brand-surface p-8 rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="max-w-2xl">
              <p className="brand-section-kicker">Enquiry form</p>
              <h2 className="brand-heading-lg mt-4">Share your context</h2>
              <p className="brand-body mt-4 text-slate-700">
                A short summary of your organisation, the issue you are working
                through, and the support you may need is enough to start.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <input type="hidden" value={formState.topic} name="topic" />

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Enquiry
                </label>
                <textarea
                  value={formState.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  className="min-h-[220px] w-full rounded-xl border border-slate-300 px-4 py-3"
                  required
                />
              </div>

              {submitState === "success" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  {successMessage}
                </div>
              )}

              {submitState === "error" && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  {errorMessage}
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

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8">
              <p className="brand-section-kicker">Location</p>
              <h2 className="brand-heading-md text-slate-950">
                Oxford, United Kingdom
              </h2>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}