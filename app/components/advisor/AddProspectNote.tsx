"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type NoteType = "call" | "meeting" | "email" | "linkedin" | "internal";

export default function AddProspectNote({
    prospectId,
}: {
    prospectId: string;
}) {
    const router = useRouter();

    const [noteType, setNoteType] = useState<NoteType>("call");
    const [note, setNote] = useState("");
    const [nextActionDate, setNextActionDate] = useState("");
    const [nextStep, setNextStep] = useState("");
    const [state, setState] = useState<"idle" | "saving" | "error">("idle");
    const [error, setError] = useState("");

    async function handleAdd() {
        if (!note.trim()) return;

        setState("saving");
        setError("");

        try {
            const response = await fetch("/api/advisor-add-prospect-note", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prospect_id: prospectId,
                    note_type: noteType,
                    note,
                    next_action_date: nextActionDate || null,
                    next_step: nextStep || null,
                }),
            });

            const payload = (await response.json().catch(() => null)) as
                | { success?: boolean; error?: string }
                | null;

            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || "Failed to add note.");
            }

            setNote("");
            setNextActionDate("");
            setNextStep("");
            setState("idle");
            router.refresh();
        } catch (err) {
            setState("error");
            setError(err instanceof Error ? err.message : "Failed to add note.");
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Add interaction
                </p>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">
                    Record a note
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Add a dated interaction note and, where useful, update the next step
                    at the same time.
                </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Interaction type
                    </span>
                    <select
                        value={noteType}
                        onChange={(event) => setNoteType(event.target.value as NoteType)}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="call">Call</option>
                        <option value="meeting">Meeting</option>
                        <option value="email">Email</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="internal">Internal note</option>
                    </select>
                </label>

                <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Note
                    </span>
                    <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={4}
                        placeholder="What happened, what matters, and what changed?"
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6"
                    />
                </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Next action date
                    </span>
                    <input
                        type="date"
                        value={nextActionDate}
                        onChange={(event) => setNextActionDate(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                </label>

                <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Next step
                    </span>
                    <input
                        value={nextStep}
                        onChange={(event) => setNextStep(event.target.value)}
                        placeholder="What should happen next?"
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                    {state === "idle" &&
                        "Notes are stored as historic interaction records."}
                    {state === "saving" && "Saving note..."}
                    {state === "error" && error}
                </p>

                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={state === "saving" || !note.trim()}
                    className="inline-flex items-center justify-center rounded-xl bg-[#1E6FD9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1859ad] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {state === "saving" ? "Saving..." : "Add note"}
                </button>
            </div>
        </section>
    );
}