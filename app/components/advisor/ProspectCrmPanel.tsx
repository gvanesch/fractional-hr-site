"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProspectRecord = {
  prospect_id: string;
  submission_id: string;
  name: string | null;
  company: string | null;
  relationship: "weak" | "medium" | "strong";
  status:
  | "not_contacted"
  | "contacted"
  | "replied"
  | "call_booked"
  | "opportunity"
  | "won"
  | "lost";
  last_contact_date: string | null;
  next_action_date: string | null;
  source: "network" | "referral" | "website" | "other";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type SummaryData = {
  score?: number;
  band?: string;
  narrative?: string;
  callAngle?: string;
};

type ProspectCrmPanelProps = {
  prospect: ProspectRecord | null;
  summary?: SummaryData;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function formatSubmittedAt(value: string | null): string {
  if (!value) return "Not available";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatProspectStatus(value: ProspectRecord["status"]): string {
  switch (value) {
    case "not_contacted":
      return "Not Contacted";
    case "contacted":
      return "Contacted";
    case "replied":
      return "Replied";
    case "call_booked":
      return "Call Booked";
    case "opportunity":
      return "Opportunity";
    case "won":
      return "Won";
    case "lost":
      return "Lost";
  }
}

function formatRelationship(value: ProspectRecord["relationship"]): string {
  switch (value) {
    case "weak":
      return "Weak";
    case "medium":
      return "Medium";
    case "strong":
      return "Strong";
  }
}

function prospectStatusBadgeClasses(status: ProspectRecord["status"]): string {
  switch (status) {
    case "not_contacted":
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
    case "contacted":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
    case "replied":
      return "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200";
    case "call_booked":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "opportunity":
      return "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200";
    case "won":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "lost":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
  }
}

function relationshipBadgeClasses(
  relationship: ProspectRecord["relationship"],
): string {
  switch (relationship) {
    case "weak":
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
    case "medium":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "strong":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  }
}

export default function ProspectCrmPanel({
  prospect,
  summary,
}: ProspectCrmPanelProps) {
  const router = useRouter();

  const [source, setSource] = useState<ProspectRecord["source"] | "">(
    prospect?.source ?? "",
  );
  const [relationship, setRelationship] = useState<
    ProspectRecord["relationship"] | ""
  >(prospect?.relationship ?? "");
  const [status, setStatus] = useState<ProspectRecord["status"] | "">(
    prospect?.status ?? "",
  );
  const [lastContactDate, setLastContactDate] = useState(
    prospect?.last_contact_date ?? "",
  );
  const [nextActionDate, setNextActionDate] = useState(
    prospect?.next_action_date ?? "",
  );
  const [notes, setNotes] = useState(prospect?.notes ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [updatedAtLabel, setUpdatedAtLabel] = useState(
    prospect?.updated_at
      ? formatSubmittedAt(prospect.updated_at)
      : "Not available",
  );

  async function handleSave() {
    if (!prospect) {
      return;
    }

    setSaveState("saving");
    setErrorMessage("");

    try {
      const response = await fetch("/api/prospect-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prospect_id: prospect.prospect_id,
          source,
          relationship,
          status,
          last_contact_date: lastContactDate || null,
          next_action_date: nextActionDate || null,
          notes: notes || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Unable to update prospect.");
      }

      setSaveState("saved");
      setUpdatedAtLabel(
        new Intl.DateTimeFormat("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date()),
      );

      router.refresh();
    } catch (error) {
      setSaveState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update prospect.",
      );
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      {summary ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Health Check snapshot
          </p>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-800">
            {summary.score !== undefined ? (
              <span>
                <strong>Score:</strong> {summary.score} / 100
              </span>
            ) : null}

            {summary.band ? (
              <span>
                <strong>Profile:</strong> {summary.band}
              </span>
            ) : null}
          </div>

          {summary.narrative ? (
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {summary.narrative}
            </p>
          ) : null}

          {summary.callAngle ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Suggested call angle
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-800">
                {summary.callAngle}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0A1628]">Prospect CRM</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Manage commercial progression alongside the diagnostic signal.
          </p>
        </div>

        {prospect ? (
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${prospectStatusBadgeClasses(
                (status || prospect.status) as ProspectRecord["status"],
              )}`}
            >
              {formatProspectStatus(
                (status || prospect.status) as ProspectRecord["status"],
              )}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${relationshipBadgeClasses(
                (relationship ||
                  prospect.relationship) as ProspectRecord["relationship"],
              )}`}
            >
              {formatRelationship(
                (relationship ||
                  prospect.relationship) as ProspectRecord["relationship"],
              )}
            </span>
          </div>
        ) : null}
      </div>

      {prospect ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label
                htmlFor="prospect-source"
                className="text-sm font-semibold text-slate-500"
              >
                Source
              </label>
              <select
                id="prospect-source"
                value={source}
                onChange={(event) =>
                  setSource(event.target.value as ProspectRecord["source"])
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
              >
                <option value="network">Network</option>
                <option value="referral">Referral</option>
                <option value="website">Website</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label
                htmlFor="prospect-relationship"
                className="text-sm font-semibold text-slate-500"
              >
                Relationship
              </label>
              <select
                id="prospect-relationship"
                value={relationship}
                onChange={(event) =>
                  setRelationship(
                    event.target.value as ProspectRecord["relationship"],
                  )
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
              >
                <option value="weak">Weak</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label
                htmlFor="prospect-status"
                className="text-sm font-semibold text-slate-500"
              >
                Prospect status
              </label>
              <select
                id="prospect-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ProspectRecord["status"])
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
              >
                <option value="not_contacted">Not Contacted</option>
                <option value="contacted">Contacted</option>
                <option value="replied">Replied</option>
                <option value="call_booked">Call Booked</option>
                <option value="opportunity">Opportunity</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label
                htmlFor="last-contact-date"
                className="text-sm font-semibold text-slate-500"
              >
                Last contact date
              </label>
              <input
                id="last-contact-date"
                type="date"
                value={lastContactDate}
                onChange={(event) => setLastContactDate(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label
                htmlFor="next-action-date"
                className="text-sm font-semibold text-slate-500"
              >
                Next action date
              </label>
              <input
                id="next-action-date"
                type="date"
                value={nextActionDate}
                onChange={(event) => setNextActionDate(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">
                Prospect updated
              </p>
              <p className="mt-2 text-sm text-slate-900">{updatedAtLabel}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <label
              htmlFor="prospect-notes"
              className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500"
            >
              Notes
            </label>
            <textarea
              id="prospect-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={6}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-7 text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
              placeholder="Add internal commercial notes for this prospect..."
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              {saveState === "idle" &&
                "Update source, relationship, status, contact dates, or notes."}
              {saveState === "saving" && "Saving changes..."}
              {saveState === "saved" && "Prospect updated successfully."}
              {saveState === "error" && errorMessage}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="inline-flex items-center justify-center rounded-xl bg-[#1E6FD9] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1859ad] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveState === "saving" ? "Saving..." : "Save CRM update"}
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-sm leading-7 text-slate-700">
            No prospect record exists yet for this submission. A prospect is
            created when a Health Check moves into a contact request. That keeps
            passive completions separate from active commercial follow-up.
          </p>
        </div>
      )}
    </section>
  );
}