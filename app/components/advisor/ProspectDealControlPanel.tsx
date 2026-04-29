"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProspectSource = "linkedin" | "referral" | "website" | "saas" | "other";
type ProspectSegment = "smb" | "mid" | "enterprise" | null;
type RelationshipStrength = "unknown" | "weak" | "medium" | "strong";
type DealStage =
    | "new"
    | "contacted"
    | "replied"
    | "meeting_booked"
    | "in_conversation"
    | "diagnostic_assessment_candidate"
    | "proposal_discussed"
    | "converted"
    | "lost"
    | "nurture";
type LeadTemperature = "cold" | "warm" | "hot";

type ProspectDealControlPanelProps = {
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
    source: ProspectSource;
    segment: ProspectSegment;
    relationshipStrength: RelationshipStrength;
    dealStage: DealStage;
    leadTemperature: LeadTemperature;
    lastContactDate: string | null;
    nextActionDate: string | null;
    nextStep: string | null;
    lostReason: string | null;
    notes: string | null;
    observedSignals: string[] | null;
};

const inputClass =
    "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15";

const textareaClass =
    "min-h-[120px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15";

function signalsToText(value: string[] | null): string {
    return value?.join("\n") ?? "";
}

function textToSignals(value: string): string[] | null {
    const signals = value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

    return signals.length > 0 ? signals : null;
}

function FieldLabel({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {children}
        </span>
    );
}

export default function ProspectDealControlPanel({
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
    source,
    segment,
    relationshipStrength,
    dealStage,
    leadTemperature,
    lastContactDate,
    nextActionDate,
    nextStep,
    lostReason,
    notes,
    observedSignals,
}: ProspectDealControlPanelProps) {
    const router = useRouter();

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
    const [currentSource, setCurrentSource] = useState(source);
    const [currentSegment, setCurrentSegment] = useState<ProspectSegment>(segment);
    const [currentRelationshipStrength, setCurrentRelationshipStrength] =
        useState(relationshipStrength);
    const [currentDealStage, setCurrentDealStage] = useState(dealStage);
    const [currentLeadTemperature, setCurrentLeadTemperature] =
        useState(leadTemperature);
    const [currentLastContactDate, setCurrentLastContactDate] = useState(
        lastContactDate ?? "",
    );
    const [currentNextActionDate, setCurrentNextActionDate] = useState(
        nextActionDate ?? "",
    );
    const [currentNextStep, setCurrentNextStep] = useState(nextStep ?? "");
    const [currentLostReason, setCurrentLostReason] = useState(lostReason ?? "");
    const [currentNotes, setCurrentNotes] = useState(notes ?? "");
    const [currentObservedSignals, setCurrentObservedSignals] = useState(
        signalsToText(observedSignals),
    );

    const [saveState, setSaveState] = useState<
        "idle" | "saving" | "saved" | "error"
    >("idle");
    const [error, setError] = useState("");
    const [isEditingContact, setIsEditingContact] = useState(false);
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
                    source: currentSource,
                    segment: currentSegment,
                    relationship_strength: currentRelationshipStrength,
                    deal_stage: currentDealStage,
                    lead_temperature: currentLeadTemperature,
                    last_contact_date: currentLastContactDate || null,
                    next_action_date: currentNextActionDate || null,
                    next_step: currentNextStep || null,
                    lost_reason:
                        currentDealStage === "lost" ? currentLostReason || null : null,
                    notes: currentNotes || null,
                    observed_signals: textToSignals(currentObservedSignals),
                }),
            });

            const payload = (await response.json().catch(() => null)) as
                | { success?: boolean; error?: string }
                | null;

            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || "Unable to update prospect.");
            }

            setSaveState("saved");
            setIsEditingContact(false);
            router.refresh();
        } catch (err) {
            setSaveState("error");
            setError(
                err instanceof Error ? err.message : "Unable to update prospect.",
            );
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        CRM workspace
                    </p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">
                        Manage prospect record
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        Keep the commercial workflow, contact details, organisation context,
                        notes, and buying signals current from one place.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveState === "saving"}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1E6FD9] px-4 text-sm font-medium text-white transition hover:bg-[#1859ad] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saveState === "saving" ? "Saving..." : "Save CRM update"}
                </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Deal state</h3>
                        <div className="mt-3 grid gap-4 md:grid-cols-3">
                            <label className="block">
                                <FieldLabel>Deal stage</FieldLabel>
                                <select
                                    value={currentDealStage}
                                    onChange={(event) =>
                                        setCurrentDealStage(event.target.value as DealStage)
                                    }
                                    className={`mt-2 ${inputClass}`}
                                >
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="replied">Replied</option>
                                    <option value="meeting_booked">Meeting booked</option>
                                    <option value="in_conversation">In conversation</option>
                                    <option value="diagnostic_assessment_candidate">
                                        Diagnostic Assessment candidate
                                    </option>
                                    <option value="proposal_discussed">Proposal discussed</option>
                                    <option value="converted">Converted</option>
                                    <option value="lost">Lost</option>
                                    <option value="nurture">Nurture</option>
                                </select>
                            </label>

                            <label className="block">
                                <FieldLabel>Lead temperature</FieldLabel>
                                <select
                                    value={currentLeadTemperature}
                                    onChange={(event) =>
                                        setCurrentLeadTemperature(
                                            event.target.value as LeadTemperature,
                                        )
                                    }
                                    className={`mt-2 ${inputClass}`}
                                >
                                    <option value="cold">Cold</option>
                                    <option value="warm">Warm</option>
                                    <option value="hot">Hot</option>
                                </select>
                            </label>

                            <label className="block">
                                <FieldLabel>Relationship</FieldLabel>
                                <select
                                    value={currentRelationshipStrength}
                                    onChange={(event) =>
                                        setCurrentRelationshipStrength(
                                            event.target.value as RelationshipStrength,
                                        )
                                    }
                                    className={`mt-2 ${inputClass}`}
                                >
                                    <option value="unknown">Unknown</option>
                                    <option value="weak">Weak</option>
                                    <option value="medium">Medium</option>
                                    <option value="strong">Strong</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Commercial movement
                        </h3>
                        <div className="mt-3 grid gap-4 md:grid-cols-3">
                            <label className="block">
                                <FieldLabel>Last contact</FieldLabel>
                                <input
                                    type="date"
                                    value={currentLastContactDate}
                                    onChange={(event) =>
                                        setCurrentLastContactDate(event.target.value)
                                    }
                                    className={`mt-2 ${inputClass}`}
                                />
                            </label>

                            <label className="block">
                                <FieldLabel>Next action date</FieldLabel>
                                <input
                                    type="date"
                                    value={currentNextActionDate}
                                    onChange={(event) =>
                                        setCurrentNextActionDate(event.target.value)
                                    }
                                    className={`mt-2 ${inputClass}`}
                                />
                            </label>

                            <label className="block">
                                <FieldLabel>Next step</FieldLabel>
                                <input
                                    value={currentNextStep}
                                    onChange={(event) => setCurrentNextStep(event.target.value)}
                                    placeholder="What happens next?"
                                    className={`mt-2 ${inputClass}`}
                                />
                            </label>
                        </div>

                        {currentDealStage === "lost" ? (
                            <label className="mt-4 block">
                                <FieldLabel>Lost reason</FieldLabel>
                                <input
                                    value={currentLostReason}
                                    onChange={(event) =>
                                        setCurrentLostReason(event.target.value)
                                    }
                                    placeholder="Why was this lost?"
                                    className={`mt-2 ${inputClass}`}
                                />
                            </label>
                        ) : null}
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Qualification
                        </h3>
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                            <label className="block">
                                <FieldLabel>Source</FieldLabel>
                                <select
                                    value={currentSource}
                                    onChange={(event) =>
                                        setCurrentSource(event.target.value as ProspectSource)
                                    }
                                    className={`mt-2 ${inputClass}`}
                                >
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="referral">Referral</option>
                                    <option value="website">Website</option>
                                    <option value="saas">SaaS</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>

                            <label className="block">
                                <FieldLabel>Segment</FieldLabel>
                                <select
                                    value={currentSegment ?? ""}
                                    onChange={(event) =>
                                        setCurrentSegment(
                                            event.target.value
                                                ? (event.target.value as Exclude<
                                                    ProspectSegment,
                                                    null
                                                >)
                                                : null,
                                        )
                                    }
                                    className={`mt-2 ${inputClass}`}
                                >
                                    <option value="">Not set</option>
                                    <option value="smb">SMB</option>
                                    <option value="mid">Mid-market</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block">
                            <FieldLabel>Working note</FieldLabel>
                            <textarea
                                value={currentNotes}
                                onChange={(event) => setCurrentNotes(event.target.value)}
                                placeholder="Current working summary. Historic notes should be added below."
                                className={`mt-2 ${textareaClass}`}
                            />
                        </label>

                        <label className="block">
                            <FieldLabel>Observed signals</FieldLabel>
                            <textarea
                                value={currentObservedSignals}
                                onChange={(event) =>
                                    setCurrentObservedSignals(event.target.value)
                                }
                                placeholder="One signal per line."
                                className={`mt-2 ${textareaClass}`}
                            />
                        </label>
                    </div>
                </div>

                <aside className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">
                            Contact & organisation
                        </h3>

                        {!isEditingContact ? (
                            <button
                                type="button"
                                onClick={() => setIsEditingContact(true)}
                                className="text-sm font-medium text-[#1E6FD9] hover:underline"
                            >
                                Edit details
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsEditingContact(false)}
                                className="text-sm font-medium text-slate-600 hover:underline"
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <label className="block">
                            <FieldLabel>Name</FieldLabel>
                            <input
                                value={currentName}
                                onChange={(e) => setCurrentName(e.target.value)}
                                disabled={!isEditingContact}
                                className={`mt-2 ${inputClass} ${!isEditingContact ? "bg-slate-100" : ""}`}
                            />
                        </label>

                        <label className="block">
                            <FieldLabel>Role</FieldLabel>
                            <input
                                value={currentRole}
                                onChange={(e) => setCurrentRole(e.target.value)}
                                disabled={!isEditingContact}
                                className={`mt-2 ${inputClass} ${!isEditingContact ? "bg-slate-100" : ""}`}
                            />
                        </label>

                        <label className="block">
                            <FieldLabel>Email</FieldLabel>
                            <input
                                value={currentContactEmail}
                                onChange={(e) => setCurrentContactEmail(e.target.value)}
                                disabled={!isEditingContact}
                                className={`mt-2 ${inputClass} ${!isEditingContact ? "bg-slate-100" : ""}`}
                            />
                        </label>

                        <label className="block">
                            <FieldLabel>Phone</FieldLabel>
                            <input
                                value={currentContactPhone}
                                onChange={(e) => setCurrentContactPhone(e.target.value)}
                                disabled={!isEditingContact}
                                className={`mt-2 ${inputClass} ${!isEditingContact ? "bg-slate-100" : ""}`}
                            />
                        </label>

                        <label className="block">
                            <FieldLabel>Company</FieldLabel>
                            <input
                                value={currentCompany}
                                onChange={(e) => setCurrentCompany(e.target.value)}
                                disabled={!isEditingContact}
                                className={`mt-2 ${inputClass} ${!isEditingContact ? "bg-slate-100" : ""}`}
                            />
                        </label>

                        <label className="block">
                            <FieldLabel>Website</FieldLabel>
                            <input
                                value={currentCompanyWebsite}
                                onChange={(e) => setCurrentCompanyWebsite(e.target.value)}
                                disabled={!isEditingContact}
                                className={`mt-2 ${inputClass} ${!isEditingContact ? "bg-slate-100" : ""}`}
                            />
                        </label>

                        <label className="block">
                            <FieldLabel>LinkedIn</FieldLabel>
                            <input
                                value={currentLinkedinUrl}
                                onChange={(e) => setCurrentLinkedinUrl(e.target.value)}
                                disabled={!isEditingContact}
                                className={`mt-2 ${inputClass} ${!isEditingContact ? "bg-slate-100" : ""}`}
                            />
                        </label>

                        {isEditingContact && (
                            <button
                                type="button"
                                onClick={handleSave}
                                className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-[#1E6FD9] px-4 text-sm font-medium text-white hover:bg-[#1859ad]"
                            >
                                Save contact changes
                            </button>
                        )}
                    </div>
                </aside>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                    {saveState === "idle" &&
                        "Update the CRM when the commercial position or contact details change."}
                    {saveState === "saving" && "Saving changes..."}
                    {saveState === "saved" && "CRM updated successfully."}
                    {saveState === "error" && error}
                </p>
            </div>
        </section>
    );
}