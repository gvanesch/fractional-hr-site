"use client";

import { useMemo, useState } from "react";

type QuestionnaireType = "HR" | "Manager" | "Leadership";

type ParticipantDraft = {
  id: string;
  name: string;
  email: string;
  questionnaireType: QuestionnaireType;
};

type CreateProjectResponse = {
  success?: boolean;
  projectId?: string;
  participants?: number;
  error?: string;
};

function createParticipant(questionnaireType: QuestionnaireType): ParticipantDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    email: "",
    questionnaireType,
  };
}

export default function AdvisorCreateProjectClient() {
  const [projectName, setProjectName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [participants, setParticipants] = useState<ParticipantDraft[]>([
    createParticipant("HR"),
    createParticipant("Manager"),
    createParticipant("Leadership"),
  ]);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [projectResult, setProjectResult] = useState<CreateProjectResponse | null>(null);

  const groupedParticipants = useMemo(() => {
    return {
      HR: participants.filter((participant) => participant.questionnaireType === "HR"),
      Manager: participants.filter((participant) => participant.questionnaireType === "Manager"),
      Leadership: participants.filter((participant) => participant.questionnaireType === "Leadership"),
    };
  }, [participants]);

  function updateParticipant(
    id: string,
    field: "name" | "email",
    value: string,
  ) {
    setParticipants((current) =>
      current.map((participant) =>
        participant.id === id ? { ...participant, [field]: value } : participant,
      ),
    );
  }

  function addParticipant(questionnaireType: QuestionnaireType) {
    setParticipants((current) => [...current, createParticipant(questionnaireType)]);
  }

  function removeParticipant(id: string) {
    setParticipants((current) => current.filter((participant) => participant.id !== id));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedParticipants = participants
      .map((participant) => ({
        name: participant.name.trim(),
        email: participant.email.trim(),
        questionnaireType: participant.questionnaireType,
      }))
      .filter((participant) => participant.name && participant.email);

    if (!projectName.trim()) {
      setSubmitState("error");
      setSubmitMessage("Project name is required.");
      return;
    }

    if (cleanedParticipants.length === 0) {
      setSubmitState("error");
      setSubmitMessage("Add at least one participant with a name and email.");
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage("");
    setProjectResult(null);

    try {
      const response = await fetch("/api/client-diagnostic-create-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: projectName.trim(),
          companyName: companyName.trim(),
          participants: cleanedParticipants,
        }),
      });

      const result = (await response.json()) as CreateProjectResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to create project.");
      }

      setProjectResult(result);
      setSubmitState("success");
      setSubmitMessage("Project created successfully.");
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(
        error instanceof Error ? error.message : "Unable to create project.",
      );
    }
  }

  return (
    <section className="brand-light-section">
      <div className="brand-container py-10 sm:py-12">
        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="brand-surface-card p-6 sm:p-8">
            <p className="brand-section-kicker">Project setup</p>
            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Core details
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <FieldBlock
                label="Project name"
                value={projectName}
                onChange={setProjectName}
                placeholder="Example: Acme diagnostic wave 1"
              />

              <FieldBlock
                label="Company name"
                value={companyName}
                onChange={setCompanyName}
                placeholder="Example: Acme Ltd"
              />
            </div>
          </section>

          <ParticipantSection
            title="HR participants"
            description="Add HR team members who should complete the HR diagnostic."
            participants={groupedParticipants.HR}
            onAdd={() => addParticipant("HR")}
            onUpdate={updateParticipant}
            onRemove={removeParticipant}
          />

          <ParticipantSection
            title="Manager participants"
            description="Add managers who will complete the manager questionnaire."
            participants={groupedParticipants.Manager}
            onAdd={() => addParticipant("Manager")}
            onUpdate={updateParticipant}
            onRemove={removeParticipant}
          />

          <ParticipantSection
            title="Leadership participants"
            description="Add leadership respondents who will complete the leadership questionnaire."
            participants={groupedParticipants.Leadership}
            onAdd={() => addParticipant("Leadership")}
            onUpdate={updateParticipant}
            onRemove={removeParticipant}
          />

          <section className="brand-surface-card p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={submitState === "submitting"}
                className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitState === "submitting" ? "Creating project..." : "Create project"}
              </button>
            </div>

            {submitState === "success" ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {submitMessage}
              </div>
            ) : null}

            {submitState === "error" ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitMessage}
              </div>
            ) : null}

            {projectResult?.success ? (
              <div className="mt-6 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Project created</p>
                <p className="mt-2">Project ID: {projectResult.projectId}</p>
                <p className="mt-1">Participants created: {projectResult.participants}</p>
              </div>
            ) : null}
          </section>
        </form>
      </div>
    </section>
  );
}

function FieldBlock({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand-accent)]"
      />
    </label>
  );
}

function ParticipantSection({
  title,
  description,
  participants,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  description: string;
  participants: ParticipantDraft[];
  onAdd: () => void;
  onUpdate: (id: string, field: "name" | "email", value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="brand-surface-card p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="brand-section-kicker">{title}</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="brand-button-dark"
        >
          Add participant
        </button>
      </div>

      <div className="mt-8 space-y-4">
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
                onClick={() => onRemove(participant.id)}
                className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
              >
                Remove
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FieldBlock
                label="Name"
                value={participant.name}
                onChange={(value) => onUpdate(participant.id, "name", value)}
                placeholder="Full name"
              />

              <FieldBlock
                label="Email"
                value={participant.email}
                onChange={(value) => onUpdate(participant.id, "email", value)}
                placeholder="name@company.com"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}