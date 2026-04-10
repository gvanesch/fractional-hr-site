"use client";

import { useMemo, useState } from "react";
import {
  buildDefaultSegmentationSchema,
  slugifySegmentationOptionKey,
  type SegmentationFieldDefinition,
  type SegmentationFieldKey,
  type SegmentationSchema,
  type SegmentationValues,
} from "@/lib/client-diagnostic/segmentation";
import { getCanonicalSegmentationOptions } from "@/lib/client-diagnostic/canonical-segmentation";

type QuestionnaireType = "HR" | "Manager" | "Leadership";

type ParticipantFormRow = {
  id: string;
  name: string;
  email: string;
  questionnaireType: QuestionnaireType;
  segmentationValues: SegmentationValues;
};

type FactPackRecipient = {
  name: string;
  email: string;
};

type CreateProjectResponse =
  | {
      success: true;
      projectId: string;
      participants: number;
    }
  | {
      success: false;
      error: string;
    };

const FIELD_ORDER: SegmentationFieldKey[] = ["function", "location", "level"];

function createParticipantRow(
  schema: SegmentationSchema,
  overrides?: Partial<ParticipantFormRow>,
): ParticipantFormRow {
  const defaultSegmentationValues: SegmentationValues = {};

  for (const field of schema.fields) {
    defaultSegmentationValues[field.fieldKey] =
      field.options[0]?.optionKey ?? "";
  }

  return {
    id: crypto.randomUUID(),
    name: "",
    email: "",
    questionnaireType: "Manager",
    segmentationValues: defaultSegmentationValues,
    ...overrides,
  };
}

function normaliseSchemaForSubmit(
  schema: SegmentationSchema,
): SegmentationSchema {
  return {
    fields: FIELD_ORDER.map((fieldKey) => {
      const field = schema.fields.find((item) => item.fieldKey === fieldKey);

      if (!field) {
        throw new Error(`Missing segmentation field: ${fieldKey}`);
      }

      const cleanedOptions = field.options
        .map((option) => ({
          optionKey: slugifySegmentationOptionKey(option.optionLabel),
          optionLabel: option.optionLabel.trim(),
          canonicalKey: option.canonicalKey.trim(),
        }))
        .filter(
          (option) =>
            option.optionKey && option.optionLabel && option.canonicalKey,
        );

      if (cleanedOptions.length === 0) {
        throw new Error(
          `At least one valid option is required for ${field.fieldLabel}.`,
        );
      }

      return {
        fieldKey,
        fieldLabel: field.fieldLabel.trim(),
        options: cleanedOptions,
      };
    }),
  };
}

function getCleanFactPackRecipient(
  factPackRecipient: FactPackRecipient,
): FactPackRecipient | null {
  const name = factPackRecipient.name.trim();
  const email = factPackRecipient.email.trim();

  if (!name && !email) {
    return null;
  }

  if (!name || !email) {
    throw new Error(
      "If you add a Client Fact Pack recipient, both name and email are required.",
    );
  }

  return {
    name,
    email,
  };
}

export default function AdvisorCreateProjectClient() {
  const defaultSchema = useMemo(() => buildDefaultSegmentationSchema(), []);
  const [projectName, setProjectName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [segmentationSchema, setSegmentationSchema] =
    useState<SegmentationSchema>(defaultSchema);
  const [participants, setParticipants] = useState<ParticipantFormRow[]>([
    createParticipantRow(defaultSchema, {
      questionnaireType: "HR",
    }),
  ]);
  const [factPackRecipient, setFactPackRecipient] = useState<FactPackRecipient>({
    name: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function updateFieldLabel(fieldKey: SegmentationFieldKey, fieldLabel: string) {
    setSegmentationSchema((current) => ({
      fields: current.fields.map((field) =>
        field.fieldKey === fieldKey ? { ...field, fieldLabel } : field,
      ),
    }));
  }

function updateOptionLabel(
  fieldKey: SegmentationFieldKey,
  optionKey: string,
  optionLabel: string,
) {
  setSegmentationSchema((current) => ({
    fields: current.fields.map((field) =>
      field.fieldKey === fieldKey
        ? {
            ...field,
            options: field.options.map((option) =>
              option.optionKey === optionKey
                ? {
                    ...option,
                    optionLabel,
                  }
                : option,
            ),
          }
        : field,
    ),
  }));
}

  function updateOptionCanonicalKey(
    fieldKey: SegmentationFieldKey,
    optionKey: string,
    canonicalKey: string,
  ) {
    setSegmentationSchema((current) => ({
      fields: current.fields.map((field) =>
        field.fieldKey === fieldKey
          ? {
              ...field,
              options: field.options.map((option) =>
                option.optionKey === optionKey
                  ? {
                      ...option,
                      canonicalKey,
                    }
                  : option,
              ),
            }
          : field,
      ),
    }));
  }

  function addOptionRow(fieldKey: SegmentationFieldKey) {
    const canonicalOptions = getCanonicalSegmentationOptions(fieldKey);
    const defaultCanonicalKey = canonicalOptions[0]?.key ?? "other";
    const newOptionKey = `option_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;

    setSegmentationSchema((current) => ({
      fields: current.fields.map((field) =>
        field.fieldKey === fieldKey
          ? {
              ...field,
              options: [
                ...field.options,
                {
                  optionKey: newOptionKey,
                  optionLabel: "",
                  canonicalKey: defaultCanonicalKey,
                },
              ],
            }
          : field,
      ),
    }));
  }

  function removeOptionRow(fieldKey: SegmentationFieldKey, optionKey: string) {
    setSegmentationSchema((current) => {
      const nextFields = current.fields.map((field) => {
        if (field.fieldKey !== fieldKey) {
          return field;
        }

        if (field.options.length === 1) {
          return field;
        }

        return {
          ...field,
          options: field.options.filter((option) => option.optionKey !== optionKey),
        };
      });

      const nextSchema: SegmentationSchema = {
        fields: nextFields,
      };

      const updatedField = nextSchema.fields.find(
        (field) => field.fieldKey === fieldKey,
      );

      const fallbackOptionKey = updatedField?.options[0]?.optionKey ?? "";

      setParticipants((currentParticipants) =>
        currentParticipants.map((participant) => {
          if (participant.segmentationValues[fieldKey] !== optionKey) {
            return participant;
          }

          return {
            ...participant,
            segmentationValues: {
              ...participant.segmentationValues,
              [fieldKey]: fallbackOptionKey,
            },
          };
        }),
      );

      return nextSchema;
    });
  }

  function addParticipant() {
    setParticipants((current) => [
      ...current,
      createParticipantRow(segmentationSchema),
    ]);
  }

  function removeParticipant(id: string) {
    setParticipants((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((participant) => participant.id !== id);
    });
  }

  function updateParticipant(
    id: string,
    updates: Partial<ParticipantFormRow>,
  ) {
    setParticipants((current) =>
      current.map((participant) =>
        participant.id === id ? { ...participant, ...updates } : participant,
      ),
    );
  }

  function updateParticipantSegmentationValue(
    id: string,
    fieldKey: SegmentationFieldKey,
    value: string,
  ) {
    setParticipants((current) =>
      current.map((participant) =>
        participant.id === id
          ? {
              ...participant,
              segmentationValues: {
                ...participant.segmentationValues,
                [fieldKey]: value,
              },
            }
          : participant,
      ),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const cleanedSchema = normaliseSchemaForSubmit(segmentationSchema);
      const cleanedFactPackRecipient =
        getCleanFactPackRecipient(factPackRecipient);

      const response = await fetch("/api/client-diagnostic-create-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: projectName.trim(),
          companyName: companyName.trim(),
          segmentationSchema: cleanedSchema,
          participants: participants.map((participant) => ({
            name: participant.name.trim(),
            email: participant.email.trim(),
            questionnaireType: participant.questionnaireType,
            segmentationValues: participant.segmentationValues,
          })),
          factPackRecipient: cleanedFactPackRecipient,
        }),
      });

      const result = (await response.json()) as CreateProjectResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to create project.",
        );
      }

      const resetSchema = buildDefaultSegmentationSchema();

      setSuccessMessage(
        `Project created successfully. ${result.participants} participant(s) invited.`,
      );
      setProjectName("");
      setCompanyName("");
      setSegmentationSchema(resetSchema);
      setParticipants([
        createParticipantRow(resetSchema, {
          questionnaireType: "HR",
        }),
      ]);
      setFactPackRecipient({
        name: "",
        email: "",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create project.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="brand-surface-card p-6 sm:p-8">
        <p className="brand-section-kicker">Project setup</p>
        <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
          Core project details
        </h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-900">
              Project name
            </span>
            <input
              type="text"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
              placeholder="Example: Q2 HR Operating Model Diagnostic"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-900">
              Company name
            </span>
            <input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
              placeholder="Example: Acme Group"
            />
          </label>
        </div>
      </section>

      <section className="brand-surface-card p-6 sm:p-8">
        <p className="brand-section-kicker">Participant segmentation</p>
        <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
          Define client-facing field names and canonical mappings
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          The internal structure remains fixed as function, location, and level.
          The labels and option names shown to participants can be adapted to the
          client&apos;s language. Canonical mappings stay controlled so
          cross-project reporting remains clean over time.
        </p>

        <div className="mt-8 space-y-6">
          {FIELD_ORDER.map((fieldKey) => {
            const field = segmentationSchema.fields.find(
              (item) => item.fieldKey === fieldKey,
            ) as SegmentationFieldDefinition;

            const canonicalOptions = getCanonicalSegmentationOptions(field.fieldKey);

            return (
              <div
                key={field.fieldKey}
                className="rounded-2xl border border-[var(--brand-border)] bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-900">
                        Display label
                      </span>
                      <input
                        type="text"
                        value={field.fieldLabel}
                        onChange={(event) =>
                          updateFieldLabel(field.fieldKey, event.target.value)
                        }
                        className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => addOptionRow(field.fieldKey)}
                    className="brand-button-dark mt-7"
                  >
                    Add option
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {field.options.map((option, optionIndex) => (
                    <div
                      key={option.optionKey}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Option {optionIndex + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            removeOptionRow(field.fieldKey, option.optionKey)
                          }
                          className="text-sm font-medium text-slate-500 hover:text-slate-900"
                          disabled={field.options.length === 1}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="text-sm font-medium text-slate-900">
                            Display option
                          </span>
                          <input
                            type="text"
                            value={option.optionLabel}
                            onChange={(event) =>
                              updateOptionLabel(
                                field.fieldKey,
                                option.optionKey,
                                event.target.value,
                              )
                            }
                            className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
                            placeholder="Example: People Team"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium text-slate-900">
                            Canonical mapping
                          </span>
                          <select
                            value={option.canonicalKey}
                            onChange={(event) =>
                              updateOptionCanonicalKey(
                                field.fieldKey,
                                option.optionKey,
                                event.target.value,
                              )
                            }
                            className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
                          >
                            {canonicalOptions.map((canonicalOption) => (
                              <option
                                key={canonicalOption.key}
                                value={canonicalOption.key}
                              >
                                {canonicalOption.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="brand-surface-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="brand-section-kicker">Participants</p>
            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Add invitees and assign segmentation values
            </h2>
          </div>

          <button
            type="button"
            onClick={addParticipant}
            className="brand-button-dark"
          >
            Add participant
          </button>
        </div>

        <div className="mt-8 space-y-6">
          {participants.map((participant, index) => (
            <div
              key={participant.id}
              className="rounded-2xl border border-[var(--brand-border)] bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-semibold text-slate-900">
                  Participant {index + 1}
                </p>

                <button
                  type="button"
                  onClick={() => removeParticipant(participant.id)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900"
                  disabled={participants.length === 1}
                >
                  Remove
                </button>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-900">
                    Name
                  </span>
                  <input
                    type="text"
                    value={participant.name}
                    onChange={(event) =>
                      updateParticipant(participant.id, {
                        name: event.target.value,
                      })
                    }
                    className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-900">
                    Email
                  </span>
                  <input
                    type="email"
                    value={participant.email}
                    onChange={(event) =>
                      updateParticipant(participant.id, {
                        email: event.target.value,
                      })
                    }
                    className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-900">
                    Questionnaire type
                  </span>
                  <select
                    value={participant.questionnaireType}
                    onChange={(event) =>
                      updateParticipant(participant.id, {
                        questionnaireType: event.target
                          .value as QuestionnaireType,
                      })
                    }
                    className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
                  >
                    <option value="HR">HR</option>
                    <option value="Manager">Manager</option>
                    <option value="Leadership">Leadership</option>
                  </select>
                </label>

                {FIELD_ORDER.map((fieldKey) => {
                  const field = segmentationSchema.fields.find(
                    (item) => item.fieldKey === fieldKey,
                  ) as SegmentationFieldDefinition;

                  return (
                    <label key={field.fieldKey} className="block">
                      <span className="text-sm font-medium text-slate-900">
                        {field.fieldLabel}
                      </span>
                      <select
                        value={
                          participant.segmentationValues[field.fieldKey] ?? ""
                        }
                        onChange={(event) =>
                          updateParticipantSegmentationValue(
                            participant.id,
                            field.fieldKey,
                            event.target.value,
                          )
                        }
                        className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
                      >
                        {field.options.map((option) => (
                          <option
                            key={option.optionKey}
                            value={option.optionKey}
                          >
                            {option.optionLabel}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="brand-surface-card p-6 sm:p-8">
        <p className="brand-section-kicker">Client fact pack</p>
        <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
          Optional recipient
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Send one separate Client Fact Pack to capture system, tooling, and
          infrastructure context. This is tracked in the project but excluded
          from scored analysis.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-900">
              Recipient name
            </span>
            <input
              type="text"
              value={factPackRecipient.name}
              onChange={(event) =>
                setFactPackRecipient((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
              placeholder="Example: Jane Smith"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-900">
              Recipient email
            </span>
            <input
              type="email"
              value={factPackRecipient.email}
              onChange={(event) =>
                setFactPackRecipient((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
              placeholder="Example: jane@acme.com"
            />
          </label>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating project..." : "Create project"}
        </button>
      </div>
    </form>
  );
}