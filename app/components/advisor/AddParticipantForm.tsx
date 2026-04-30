"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  SegmentationFieldKey,
  SegmentationSchema,
  SegmentationValues,
} from "@/lib/client-diagnostic/segmentation";

type AddParticipantFormProps = {
  projectId: string;
  segmentationSchema: SegmentationSchema | null;
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
    emailResult?: {
      success: boolean;
      error: string | null;
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

const SEGMENTATION_FIELD_ORDER: SegmentationFieldKey[] = [
  "function",
  "location",
  "level",
];

function isScoredQuestionnaireType(
  questionnaireType: QuestionnaireType,
): boolean {
  return (
    questionnaireType === "hr" ||
    questionnaireType === "manager" ||
    questionnaireType === "leadership"
  );
}

function createDefaultSegmentationValues(
  segmentationSchema: SegmentationSchema | null,
): SegmentationValues {
  if (!segmentationSchema) {
    return {};
  }

  return SEGMENTATION_FIELD_ORDER.reduce<SegmentationValues>((values, fieldKey) => {
    const field = segmentationSchema.fields.find(
      (candidate) => candidate.fieldKey === fieldKey,
    );

    return {
      ...values,
      [fieldKey]: field?.options[0]?.optionKey ?? "",
    };
  }, {});
}

export default function AddParticipantForm({
  projectId,
  segmentationSchema,
}: AddParticipantFormProps) {
  const router = useRouter();

  const [questionnaireType, setQuestionnaireType] =
    useState<QuestionnaireType>("manager");
  const [roleLabel, setRoleLabel] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [segmentationValues, setSegmentationValues] =
    useState<SegmentationValues>(() =>
      createDefaultSegmentationValues(segmentationSchema),
    );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isScoredParticipant = isScoredQuestionnaireType(questionnaireType);

  const segmentationFields = useMemo(() => {
    if (!segmentationSchema) {
      return [];
    }

    return SEGMENTATION_FIELD_ORDER.map((fieldKey) =>
      segmentationSchema.fields.find((field) => field.fieldKey === fieldKey),
    ).filter((field): field is NonNullable<typeof field> => Boolean(field));
  }, [segmentationSchema]);

  useEffect(() => {
    setSegmentationValues(createDefaultSegmentationValues(segmentationSchema));
  }, [segmentationSchema]);

  function updateSegmentationValue(
    fieldKey: SegmentationFieldKey,
    value: string,
  ) {
    setSegmentationValues((current) => ({
      ...current,
      [fieldKey]: value,
    }));
  }

  function resetForm() {
    setRoleLabel("");
    setName("");
    setEmail("");
    setQuestionnaireType("manager");
    setSegmentationValues(createDefaultSegmentationValues(segmentationSchema));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (isScoredParticipant && !segmentationSchema) {
        throw new Error(
          "Project segmentation options are unavailable, so a scored participant cannot be added.",
        );
      }

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
          segmentationValues: isScoredParticipant ? segmentationValues : null,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to create participant.",
        );
      }

      resetForm();
      setSuccessMessage("Participant added and invite email sent successfully.");

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
          Add a new participant mid-project and send their invite immediately.
          Scored participants require function, location, and level so reporting
          coverage remains usable.
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
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-500"
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
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-500"
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
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-500"
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
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            {QUESTIONNAIRE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isScoredParticipant ? (
          segmentationFields.length === SEGMENTATION_FIELD_ORDER.length ? (
            segmentationFields.map((field) => (
              <div key={field.fieldKey}>
                <label
                  htmlFor={`participant-${field.fieldKey}`}
                  className="block text-sm font-medium text-slate-700"
                >
                  {field.fieldLabel}
                </label>
                <select
                  id={`participant-${field.fieldKey}`}
                  value={segmentationValues[field.fieldKey] ?? ""}
                  onChange={(event) =>
                    updateSegmentationValue(field.fieldKey, event.target.value)
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  required
                >
                  {field.options.map((option) => (
                    <option key={option.optionKey} value={option.optionKey}>
                      {option.optionLabel}
                    </option>
                  ))}
                </select>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Project segmentation options are unavailable. Scored participants
              cannot be added until the project schema is available.
            </div>
          )
        ) : (
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Client Fact Pack participants do not use scored segmentation fields.
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center md:col-span-2">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (isScoredParticipant &&
                segmentationFields.length !== SEGMENTATION_FIELD_ORDER.length)
            }
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