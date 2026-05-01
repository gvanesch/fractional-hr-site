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
    source: ProspectSource;
    segment: ProspectSegment;
    relationshipStrength: RelationshipStrength;
    dealStage: DealStage;
    leadTemperature: LeadTemperature;
    lastContactDate: string | null;
    nextActionDate: string | null;
    lostReason: string | null;
};

const inputClass =
    "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15";

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {children}
        </span>
    );
}

export default function ProspectDealControlPanel({
    prospectId,
    source,
    segment,
    relationshipStrength,
    dealStage,
    leadTemperature,
    lastContactDate,
    nextActionDate,
    lostReason,
}: ProspectDealControlPanelProps) {
    const router = useRouter();

    const [currentSource, setCurrentSource] = useState(source);
    const [currentSegment, setCurrentSegment] = useState<ProspectSegment>(segment);
    const [currentRelationshipStrength, setCurrentRelationshipStrength] =
        useState(relationshipStrength);
    const [currentDealStage, setCurrentDealStage] = useState(dealStage);
    const [currentLeadTemperature, setCurrentLeadTemperature] =
        useState(leadTemperature);
    const [currentLastContactDate, setCurrentLastContactDate] = useState(
        lastContactDate ?? ""
    );
    const [currentNextActionDate, setCurrentNextActionDate] = useState(
        nextActionDate ?? ""
    );
    const [currentLostReason, setCurrentLostReason] = useState(
        lostReason ?? ""
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
                    source: currentSource,
                    segment: currentSegment,
                    relationship_strength: currentRelationshipStrength,
                    deal_stage: currentDealStage,
                    lead_temperature: currentLeadTemperature,
                    last_contact_date: currentLastContactDate || null,
                    next_action_date: currentNextActionDate || null,
                    lost_reason:
                        currentDealStage === "lost" ? currentLostReason || null : null,
                }),
            });

            const payload = (await response.json().catch(() => null)) as
                | { success?: boolean; error?: string }
                | null;

            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || "Unable to update prospect.");
            }

            setSaveState("saved");
            router.refresh();
        } catch (err) {
            setSaveState("error");
            setError(
                err instanceof Error ? err.message : "Unable to update prospect."
            );
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        CRM workspace
                    </p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">
                        Manage deal movement
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        Keep the live commercial position current. Update stage,
                        temperature, and timing as conversations progress.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveState === "saving"}
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1E6FD9] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1859ad] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saveState === "saving" ? "Saving..." : "Save update"}
                </button>
            </div>

            <div className="mt-8 space-y-8">
                {/* Deal state */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                        Deal state
                    </h3>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <label className="block">
                            <FieldLabel>Deal stage</FieldLabel>
                            <select
                                value={currentDealStage}
                                onChange={(e) =>
                                    setCurrentDealStage(e.target.value as DealStage)
                                }
                                className={`${inputClass} mt-2 appearance-none`}
                            >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="replied">Replied</option>
                                <option value="meeting_booked">Meeting booked</option>
                                <option value="in_conversation">In conversation</option>
                                <option value="diagnostic_assessment_candidate">
                                    Diagnostic Assessment candidate
                                </option>
                                <option value="proposal_discussed">
                                    Proposal discussed
                                </option>
                                <option value="converted">Converted</option>
                                <option value="lost">Lost</option>
                                <option value="nurture">Nurture</option>
                            </select>
                        </label>

                        <label className="block">
                            <FieldLabel>Lead temperature</FieldLabel>
                            <select
                                value={currentLeadTemperature}
                                onChange={(e) =>
                                    setCurrentLeadTemperature(
                                        e.target.value as LeadTemperature
                                    )
                                }
                                className={`${inputClass} mt-2 appearance-none`}
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
                                onChange={(e) =>
                                    setCurrentRelationshipStrength(
                                        e.target.value as RelationshipStrength
                                    )
                                }
                                className={`${inputClass} mt-2 appearance-none`}
                            >
                                <option value="unknown">Unknown</option>
                                <option value="weak">Weak</option>
                                <option value="medium">Medium</option>
                                <option value="strong">Strong</option>
                            </select>
                        </label>
                    </div>
                </div>

                {/* Movement */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                        Commercial movement
                    </h3>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <FieldLabel>Last contact</FieldLabel>
                            <input
                                type="date"
                                value={currentLastContactDate}
                                onChange={(e) =>
                                    setCurrentLastContactDate(e.target.value)
                                }
                                className={`${inputClass} mt-2`}
                            />
                        </label>

                        <label className="block">
                            <FieldLabel>Next action date</FieldLabel>
                            <input
                                type="date"
                                value={currentNextActionDate}
                                onChange={(e) =>
                                    setCurrentNextActionDate(e.target.value)
                                }
                                className={`${inputClass} mt-2`}
                            />
                        </label>
                    </div>

                    {currentDealStage === "lost" ? (
                        <label className="mt-4 block">
                            <FieldLabel>Lost reason</FieldLabel>
                            <input
                                value={currentLostReason}
                                onChange={(e) =>
                                    setCurrentLostReason(e.target.value)
                                }
                                placeholder="Why was this lost?"
                                className={`${inputClass} mt-2`}
                            />
                        </label>
                    ) : null}
                </div>

                {/* Qualification */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                        Qualification
                    </h3>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <FieldLabel>Source</FieldLabel>
                            <select
                                value={currentSource}
                                onChange={(e) =>
                                    setCurrentSource(e.target.value as ProspectSource)
                                }
                                className={`${inputClass} mt-2 appearance-none`}
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
                                onChange={(e) =>
                                    setCurrentSegment(
                                        e.target.value
                                            ? (e.target.value as Exclude<
                                                ProspectSegment,
                                                null
                                            >)
                                            : null
                                    )
                                }
                                className={`${inputClass} mt-2 appearance-none`}
                            >
                                <option value="">Not set</option>
                                <option value="smb">SMB</option>
                                <option value="mid">Mid-market</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                    {saveState === "idle" &&
                        "Update this panel when the commercial position changes."}
                    {saveState === "saving" && "Saving changes..."}
                    {saveState === "saved" && "CRM updated successfully."}
                    {saveState === "error" && error}
                </p>
            </div>
        </section>
    );
}