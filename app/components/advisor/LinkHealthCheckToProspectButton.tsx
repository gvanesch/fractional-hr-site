"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LinkHealthCheckToProspectButtonProps = {
    prospectId: string;
    submissionId: string;
};

export default function LinkHealthCheckToProspectButton({
    prospectId,
    submissionId,
}: LinkHealthCheckToProspectButtonProps) {
    const router = useRouter();

    const [state, setState] = useState<"idle" | "linking" | "linked" | "error">(
        "idle",
    );
    const [error, setError] = useState("");

    async function handleLink() {
        setState("linking");
        setError("");

        try {
            const response = await fetch("/api/advisor-link-health-check-prospect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prospect_id: prospectId,
                    submission_id: submissionId,
                }),
            });

            const payload = (await response.json().catch(() => null)) as
                | { success?: boolean; error?: string }
                | null;

            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || "Unable to link Health Check.");
            }

            setState("linked");
            router.refresh();
        } catch (err) {
            setState("error");
            setError(
                err instanceof Error ? err.message : "Unable to link Health Check.",
            );
        }
    }

    return (
        <div className="space-y-1">
            <button
                type="button"
                onClick={handleLink}
                disabled={state === "linking" || state === "linked"}
                className="inline-flex items-center justify-center rounded-lg bg-[#1E6FD9] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1859ad] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {state === "linking"
                    ? "Linking..."
                    : state === "linked"
                        ? "Linked"
                        : "Link Health Check"}
            </button>

            {state === "error" ? (
                <p className="max-w-xs text-xs leading-5 text-red-600">{error}</p>
            ) : null}
        </div>
    );
}