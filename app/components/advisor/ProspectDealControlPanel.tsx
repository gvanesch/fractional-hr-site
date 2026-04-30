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
    "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15";

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
        lastContactDate ?? "",
    );
    const [currentNextActionDate, setCurrentNextActionDate] = useState(
        nextActionDate ?? "",
    );
    const [currentLostReason, setCurrentLostReason] = useState(lostReason ?? "");

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
                err instanceof Error ? err.message : "Unable to update prospect.",
            );
        }
    }

    return (
        <section
            id="deal-control-panel"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        CRM workspace
                    </p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">
                        Manage deal movement
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        Keep the live commercial position current. Use the interaction
                        note below to record conversations and update the next step.
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

            <div className="mt-6 space-y-6">
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
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
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
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                    {saveState === "idle" &&
                        "Update this panel when the commercial position changes. Use interaction notes for conversation history and next-step detail."}
                    {saveState === "saving" && "Saving changes..."}
                    {saveState === "saved" && "CRM updated successfully."}
                    {saveState === "error" && error}
                </p>
            </div>
        </section>
    );
}