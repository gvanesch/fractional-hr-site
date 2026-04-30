"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProspectContactOrganisationPanelProps = {
    prospectId: string;
    name: string | null;
    company: string | null;
    role: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    companyWebsite: string | null;
    billingContactName: string | null;
    billingContactEmail: string | null;
    linkedinUrl: string | null;
};

const inputClass =
    "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15";

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {children}
        </span>
    );
}

export default function ProspectContactOrganisationPanel({
    prospectId,
    name,
    company,
    role,
    contactEmail,
    contactPhone,
    companyWebsite,
    billingContactName,
    billingContactEmail,
    linkedinUrl,
}: ProspectContactOrganisationPanelProps) {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [currentName, setCurrentName] = useState(name ?? "");
    const [currentCompany, setCurrentCompany] = useState(company ?? "");
    const [currentRole, setCurrentRole] = useState(role ?? "");
    const [currentContactEmail, setCurrentContactEmail] = useState(
        contactEmail ?? "",
    );
    const [currentContactPhone, setCurrentContactPhone] = useState(
        contactPhone ?? "",
    );
    const [currentCompanyWebsite, setCurrentCompanyWebsite] = useState(
        companyWebsite ?? "",
    );
    const [currentBillingContactName, setCurrentBillingContactName] = useState(
        billingContactName ?? "",
    );
    const [currentBillingContactEmail, setCurrentBillingContactEmail] = useState(
        billingContactEmail ?? "",
    );
    const [currentLinkedinUrl, setCurrentLinkedinUrl] = useState(
        linkedinUrl ?? "",
    );

    const [saveState, setSaveState] = useState<
        "idle" | "saving" | "saved" | "error"
    >("idle");
    const [error, setError] = useState("");

    async function handleSave() {
        setSaveState("saving");
        setError("");

        try {
            const response = await fetch("/api/advisor-update-prospect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prospect_id: prospectId,
                    name: currentName || null,
                    company: currentCompany || null,
                    role: currentRole || null,
                    contact_email: currentContactEmail || null,
                    contact_phone: currentContactPhone || null,
                    company_website: currentCompanyWebsite || null,
                    billing_contact_name: currentBillingContactName || null,
                    billing_contact_email: currentBillingContactEmail || null,
                    linkedin_url: currentLinkedinUrl || null,
                }),
            });

            const payload = (await response.json().catch(() => null)) as
                | { success?: boolean; error?: string }
                | null;

            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || "Unable to update contact details.");
            }

            setSaveState("saved");
            setIsEditing(false);
            router.refresh();
        } catch (err) {
            setSaveState("error");
            setError(
                err instanceof Error ? err.message : "Unable to update contact details.",
            );
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Contact & organisation
                    </p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">
                        Reference details
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        Core contact and organisation details. Edit only when the
                        underlying contact record changes.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    {isEditing ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saveState === "saving"}
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1E6FD9] px-4 text-sm font-medium text-white transition hover:bg-[#1859ad] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saveState === "saving" ? "Saving..." : "Save details"}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700"
                        >
                            Edit details
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="block">
                    <FieldLabel>Name</FieldLabel>
                    <input
                        value={currentName}
                        onChange={(event) => setCurrentName(event.target.value)}
                        disabled={!isEditing}
                        className={`mt-2 ${inputClass} ${!isEditing ? "bg-slate-100 text-slate-600" : ""}`}
                    />
                </label>

                <label className="block">
                    <FieldLabel>Role</FieldLabel>
                    <input
                        value={currentRole}
                        onChange={(event) => setCurrentRole(event.target.value)}
                        disabled={!isEditing}
                        className={`mt-2 ${inputClass} ${!isEditing ? "bg-slate-100 text-slate-600" : ""}`}
                    />
                </label>

                <label className="block">
                    <FieldLabel>Email</FieldLabel>
                    <input
                        value={currentContactEmail}
                        onChange={(event) => setCurrentContactEmail(event.target.value)}
                        disabled={!isEditing}
                        className={`mt-2 ${inputClass} ${!isEditing ? "bg-slate-100 text-slate-600" : ""}`}
                    />
                </label>

                <label className="block">
                    <FieldLabel>Phone</FieldLabel>
                    <input
                        value={currentContactPhone}
                        onChange={(event) => setCurrentContactPhone(event.target.value)}
                        disabled={!isEditing}
                        className={`mt-2 ${inputClass} ${!isEditing ? "bg-slate-100 text-slate-600" : ""}`}
                    />
                </label>

                <label className="block">
                    <FieldLabel>Company</FieldLabel>
                    <input
                        value={currentCompany}
                        onChange={(event) => setCurrentCompany(event.target.value)}
                        disabled={!isEditing}
                        className={`mt-2 ${inputClass} ${!isEditing ? "bg-slate-100 text-slate-600" : ""}`}
                    />
                </label>

                <label className="block">
                    <FieldLabel>Website</FieldLabel>
                    <input
                        value={currentCompanyWebsite}
                        onChange={(event) =>
                            setCurrentCompanyWebsite(event.target.value)
                        }
                        disabled={!isEditing}
                        className={`mt-2 ${inputClass} ${!isEditing ? "bg-slate-100 text-slate-600" : ""}`}
                    />
                </label>

                <label className="block">
                    <FieldLabel>LinkedIn</FieldLabel>
                    <input
                        value={currentLinkedinUrl}
                        onChange={(event) => setCurrentLinkedinUrl(event.target.value)}
                        disabled={!isEditing}
                        className={`mt-2 ${inputClass} ${!isEditing ? "bg-slate-100 text-slate-600" : ""}`}
                    />
                </label>

                <label className="block">
                    <FieldLabel>Billing contact</FieldLabel>
                    <input
                        value={currentBillingContactName}
                        onChange={(event) =>
                            setCurrentBillingContactName(event.target.value)
                        }
                        disabled={!isEditing}
                        className={`mt-2 ${inputClass} ${!isEditing ? "bg-slate-100 text-slate-600" : ""}`}
                    />
                </label>

                <label className="block md:col-span-2">
                    <FieldLabel>Billing email</FieldLabel>
                    <input
                        value={currentBillingContactEmail}
                        onChange={(event) =>
                            setCurrentBillingContactEmail(event.target.value)
                        }
                        disabled={!isEditing}
                        className={`mt-2 ${inputClass} ${!isEditing ? "bg-slate-100 text-slate-600" : ""}`}
                    />
                </label>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                    {saveState === "idle" &&
                        "These details are reference data. Keep regular deal movement in the CRM workspace and conversation history in notes."}
                    {saveState === "saving" && "Saving details..."}
                    {saveState === "saved" && "Contact and organisation details updated."}
                    {saveState === "error" && error}
                </p>
            </div>
        </section>
    );
}