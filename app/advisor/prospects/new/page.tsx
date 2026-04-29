"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProspectPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [company, setCompany] = useState("");
    const [role, setRole] = useState("");
    const [source, setSource] = useState("linkedin");
    const [segment, setSegment] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleCreate() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/advisor-create-prospect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    company,
                    role,
                    source,
                    segment: segment || null,
                    notes,
                }),
            });

            const payload = await response.json();

            if (!response.ok || !payload.success) {
                throw new Error(payload.error || "Unable to create prospect.");
            }

            router.push(`/advisor/prospects/${payload.prospect_id}`);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to create prospect.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Prospect CRM
                    </p>
                    <h1 className="mt-3 text-2xl font-semibold text-slate-900">
                        Add Prospect
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Create a manual prospect for outbound, referral, or partner-led
                        pipeline before any Health Check data exists.
                    </p>
                </div>

                <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />

                    <input
                        value={company}
                        onChange={(event) => setCompany(event.target.value)}
                        placeholder="Company"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />

                    <input
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        placeholder="Role"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />

                    <select
                        value={source}
                        onChange={(event) => setSource(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="linkedin">LinkedIn</option>
                        <option value="referral">Referral</option>
                        <option value="website">Website</option>
                        <option value="saas">SaaS</option>
                        <option value="other">Other</option>
                    </select>

                    <select
                        value={segment}
                        onChange={(event) => setSegment(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="">Segment</option>
                        <option value="smb">SMB</option>
                        <option value="mid">Mid-market</option>
                        <option value="enterprise">Enterprise</option>
                    </select>

                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={5}
                        placeholder="Notes"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />

                    {error ? <p className="text-sm text-red-600">{error}</p> : null}

                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full rounded-xl bg-[#1E6FD9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1859ad] disabled:opacity-60"
                    >
                        {loading ? "Creating..." : "Create Prospect"}
                    </button>
                </section>
            </div>
        </main>
    );
}