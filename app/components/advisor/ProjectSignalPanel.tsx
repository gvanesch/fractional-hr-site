type QuestionnaireType = "hr" | "manager" | "leadership" | "client_fact_pack";

type SegmentationValues = Record<string, string | null | undefined>;

type ParticipantSummary = {
    participantId: string;
    questionnaireType: QuestionnaireType;
    roleLabel: string;
    name: string;
    email: string;
    segmentationValues: SegmentationValues | null;
    participantStatus: string;
    startedAt: string | null;
    completedAt: string | null;
    updatedAt: string;
    invitedAt?: string | null;
    inviteExpiresAt?: string | null;
};

type RespondentGroupSummary = {
    questionnaireType: QuestionnaireType;
    label: string;
    totalInvited: number;
    outstanding: number;
    completed: number;
};

type CompletionSummary = {
    totalInvited: number;
    outstanding: number;
    completed: number;
    completionPercentage: number;
    respondentGroups: RespondentGroupSummary[];
};

type FactPackSummary = {
    invited: boolean;
    participantId: string | null;
    recipientName: string | null;
    recipientEmail: string | null;
    participantStatus: string | null;
    factPackStatus: "not_invited" | "not_started" | "in_progress" | "completed";
    hasSavedResponse: boolean;
    startedAt: string | null;
    completedAt: string | null;
    updatedAt: string | null;
    submittedAt: string | null;
};

type ProjectSignalPanelProps = {
    completion: CompletionSummary;
    scoredCompletion: CompletionSummary & {
        analysisReady: boolean;
    };
    factPack: FactPackSummary;
    participants: ParticipantSummary[];
};

type ReadinessTone = "rose" | "amber" | "emerald";

function getScoredGroups(respondentGroups: RespondentGroupSummary[]) {
    return respondentGroups.filter(
        (group) =>
            group.questionnaireType === "hr" ||
            group.questionnaireType === "manager" ||
            group.questionnaireType === "leadership",
    );
}

function getCompletedScoredGroups(
    respondentGroups: RespondentGroupSummary[],
): RespondentGroupSummary[] {
    return getScoredGroups(respondentGroups).filter((group) => group.completed > 0);
}

function getReadiness(params: {
    scoredCompletion: CompletionSummary & {
        analysisReady: boolean;
    };
    factPack: FactPackSummary;
}): {
    label: string;
    tone: ReadinessTone;
    summary: string;
} {
    const completedGroups = getCompletedScoredGroups(
        params.scoredCompletion.respondentGroups,
    );

    if (completedGroups.length < 2) {
        return {
            label: "Not usable yet",
            tone: "rose",
            summary:
                "Fewer than two scored respondent groups have submitted. Do not treat the current pattern as a reliable diagnostic read.",
        };
    }

    if (completedGroups.length < 3) {
        return {
            label: "Directional only",
            tone: "amber",
            summary:
                "Two scored respondent groups are represented. You can review emerging signals, but the report should still be treated as directional.",
        };
    }

    if (params.factPack.factPackStatus !== "completed") {
        return {
            label: "Scored data ready, context incomplete",
            tone: "amber",
            summary:
                "All scored respondent groups are represented, but the Client Fact Pack is not complete. Reporting can start, but operating context is still incomplete.",
        };
    }

    return {
        label: "Report ready",
        tone: "emerald",
        summary:
            "All scored respondent groups are represented and the Client Fact Pack is complete. The project is ready for fuller reporting and interpretation.",
    };
}

function getCoverageRisks(params: {
    scoredCompletion: CompletionSummary & {
        analysisReady: boolean;
    };
    participants: ParticipantSummary[];
}): string[] {
    const risks: string[] = [];
    const scoredGroups = getScoredGroups(params.scoredCompletion.respondentGroups);

    for (const group of scoredGroups) {
        if (group.completed === 0) {
            risks.push(`${group.label} has no completed responses.`);
        } else if (group.completed === 1) {
            risks.push(`${group.label} is represented by only one completed response.`);
        }
    }

    const activeScoredParticipants = params.participants.filter(
        (participant) =>
            participant.participantStatus !== "archived" &&
            participant.questionnaireType !== "client_fact_pack",
    );

    const completedScoredParticipants = activeScoredParticipants.filter(
        (participant) =>
            participant.participantStatus === "completed" ||
            participant.completedAt !== null,
    );

    const completedFunctions = new Set(
        completedScoredParticipants
            .map((participant) => participant.segmentationValues?.function)
            .filter((value): value is string => typeof value === "string" && value.length > 0),
    );

    const completedLocations = new Set(
        completedScoredParticipants
            .map((participant) => participant.segmentationValues?.location)
            .filter((value): value is string => typeof value === "string" && value.length > 0),
    );

    const completedLevels = new Set(
        completedScoredParticipants
            .map((participant) => participant.segmentationValues?.level)
            .filter((value): value is string => typeof value === "string" && value.length > 0),
    );

    if (completedScoredParticipants.length > 1 && completedFunctions.size <= 1) {
        risks.push("Completed scored responses currently show limited function spread.");
    }

    if (completedScoredParticipants.length > 1 && completedLocations.size <= 1) {
        risks.push("Completed scored responses currently show limited location spread.");
    }

    if (completedScoredParticipants.length > 1 && completedLevels.size <= 1) {
        risks.push("Completed scored responses currently show limited level spread.");
    }

    return risks.slice(0, 5);
}

function getNextAction(params: {
    scoredCompletion: CompletionSummary & {
        analysisReady: boolean;
    };
    factPack: FactPackSummary;
    coverageRisks: string[];
}): string {
    const scoredGroups = getScoredGroups(params.scoredCompletion.respondentGroups);
    const missingGroup = scoredGroups.find((group) => group.completed === 0);
    const lowCoverageGroup = scoredGroups.find((group) => group.completed === 1);

    if (missingGroup) {
        return `Prioritise at least one completed ${missingGroup.label} response before using the diagnostic read.`;
    }

    if (lowCoverageGroup) {
        return `Add or chase another ${lowCoverageGroup.label} participant if the client population allows it.`;
    }

    if (params.factPack.factPackStatus !== "completed") {
        return "Complete the Client Fact Pack before final report review.";
    }

    if (params.coverageRisks.length > 0) {
        return "Review coverage risks before treating the report as a balanced organisational read.";
    }

    return "Proceed to report review and use the dashboard only for final participant follow-up.";
}

function getToneClasses(tone: ReadinessTone): string {
    switch (tone) {
        case "rose":
            return "border-rose-200 bg-rose-50 text-rose-800";
        case "amber":
            return "border-amber-200 bg-amber-50 text-amber-800";
        case "emerald":
            return "border-emerald-200 bg-emerald-50 text-emerald-800";
        default:
            return "border-slate-200 bg-slate-50 text-slate-800";
    }
}

function formatFactPackStatus(status: FactPackSummary["factPackStatus"]): string {
    switch (status) {
        case "completed":
            return "Complete";
        case "in_progress":
            return "Draft saved";
        case "not_started":
            return "Not started";
        case "not_invited":
            return "Not invited";
        default:
            return status;
    }
}

export default function ProjectSignalPanel({
    completion,
    scoredCompletion,
    factPack,
    participants,
}: ProjectSignalPanelProps) {
    const readiness = getReadiness({ scoredCompletion, factPack });
    const coverageRisks = getCoverageRisks({ scoredCompletion, participants });
    const nextAction = getNextAction({
        scoredCompletion,
        factPack,
        coverageRisks,
    });

    return (
        <section className="brand-surface-card p-6 sm:p-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                    <p className="brand-section-kicker">Project readiness</p>
                    <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                        Readiness and coverage risks
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                        Simple operating checks to decide whether the project is ready for
                        report interpretation, still directional, or too partial to rely on.
                    </p>
                </div>

                <span
                    className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${getToneClasses(
                        readiness.tone,
                    )}`}
                >
                    {readiness.label}
                </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-4">
                <SignalMetric
                    label="Overall completion"
                    value={`${completion.completionPercentage}%`}
                />
                <SignalMetric
                    label="Scored responses"
                    value={`${scoredCompletion.completed} / ${scoredCompletion.totalInvited}`}
                />
                <SignalMetric
                    label="Outstanding"
                    value={String(completion.outstanding)}
                />
                <SignalMetric
                    label="Fact pack"
                    value={formatFactPackStatus(factPack.factPackStatus)}
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-slate-900">Readiness read</p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                        {readiness.summary}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-slate-900">Next action</p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{nextAction}</p>
                </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Coverage risks</p>

                {coverageRisks.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                        {coverageRisks.map((risk) => (
                            <li
                                key={risk}
                                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
                            >
                                {risk}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                        No obvious coverage risks detected by the current simple checks.
                    </p>
                )}
            </div>
        </section>
    );
}

function SignalMetric({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
        </div>
    );
}