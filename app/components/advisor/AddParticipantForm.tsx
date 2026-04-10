"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AddParticipantFormProps = {
  projectId: string;
};

type QuestionnaireType =
  | "hr"
  | "manager"
  | "leadership"
  | "client_fact_pack";

type ApiResponse =
  | {
      success: true;
      participant: {
        participant_id: string;
      };
    }
  | {
      success: false;
      error: string;
    };

const QUESTIONNAIRE_OPTIONS: Array<{
  value: QuestionnaireType;
  label: string;
}> = [
  { value: "hr", label: "HR" },
  { value: "manager", label: "Manager" },
  { value: "leadership", label: "Leadership" },
  { value: "client_fact_pack", label: "Fact Pack" },
];

export default function AddParticipantForm({
  projectId,
}: AddParticipantFormProps) {
  const router = useRouter();

  const [questionnaireType, setQuestionnaireType] =
    useState<QuestionnaireType>("manager");
  const [roleLabel, setRoleLabel] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/advisor-project-participants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          projectId,
          questionnaireType,
          roleLabel,
          name,
          email,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to create participant.",
        );
      }

      setRoleLabel("");
      setName("");
      setEmail("");
      setQuestionnaireType("manager");
      setSuccessMessage("Participant added successfully.");

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create participant.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="brand-surface-card p-6">
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold text-slate-900">
          Add participant
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-700">
          Add a new participant mid-project so the advisor workspace can stay
          aligned with the real stakeholder group as the engagement evolves.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="participant-name"
            className="block text-sm font-medium text-slate-700"
          >
            Name
          </label>
          <input
            id="participant-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            placeholder="Jane Smith"
          />
        </div>

        <div>
          <label
            htmlFor="participant-email"
            className="block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="participant-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            placeholder="jane@company.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="participant-role-label"
            className="block text-sm font-medium text-slate-700"
          >
            Role label
          </label>
          <input
            id="participant-role-label"
            type="text"
            value={roleLabel}
            onChange={(event) => setRoleLabel(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            placeholder="Regional People Manager"
            required
          />
        </div>

        <div>
          <label
            htmlFor="participant-questionnaire-type"
            className="block text-sm font-medium text-slate-700"
          >
            Questionnaire type
          </label>
          <select
            id="participant-questionnaire-type"
            value={questionnaireType}
            onChange={(event) =>
              setQuestionnaireType(event.target.value as QuestionnaireType)
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            {QUESTIONNAIRE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding participant..." : "Add participant"}
          </button>

          {successMessage ? (
            <p className="text-sm text-emerald-700">{successMessage}</p>
          ) : null}

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
      </form>
    </section>
  );
}