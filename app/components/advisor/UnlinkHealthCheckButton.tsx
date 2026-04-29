"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlinkHealthCheckButton({
    prospectId,
}: {
    prospectId: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleUnlink() {
        const confirmed = window.confirm(
            "Unlink this Health Check?\n\nThis will unlock the prospect record and move it back to conversation tracking.",
        );

        if (!confirmed) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch(
                "/api/advisor-unlink-health-check-prospect",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prospect_id: prospectId,
                    }),
                },
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to unlink");
            }

            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unlink failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleUnlink}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
                {loading ? "Unlinking..." : "Unlink Health Check"}
            </button>

            {error ? (
                <p className="text-sm text-red-600">{error}</p>
            ) : null}
        </div>
    );
}