import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";
import ProspectDealControlPanel from "@/app/components/advisor/ProspectDealControlPanel";
import UnlinkHealthCheckButton from "@/app/components/advisor/UnlinkHealthCheckButton";
import AddProspectNote from "@/app/components/advisor/AddProspectNote";

export const dynamic = "force-dynamic";

export const metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

type ProspectDetailPageProps = {
    params: Promise<{
        prospectId: string;
    }>;
};

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = {
    [key: string]: JsonValue;
};

type NoteType = "call" | "meeting" | "email" | "linkedin" | "internal";

type AdvisorProspect = {
    prospect_id: string;
    name: string | null;
    company: string | null;
    role: string | null;

    // NEW CONTACT + ORG FIELDS
    contact_email: string | null;
    contact_phone: string | null;
    company_website: string | null;
    billing_contact_name: string | null;
    billing_contact_email: string | null;
    linkedin_url: string | null;

    source: "linkedin" | "referral" | "website" | "saas" | "other";
    segment: "smb" | "mid" | "enterprise" | null;

    diagnostic_status:
    | "not_invited"
    | "invited"
    | "started"
    | "completed"
    | "assessment_candidate"
    | "in_conversation"
    | "converted";

    deal_stage:
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

    relationship_strength: "unknown" | "weak" | "medium" | "strong";
    lead_temperature: "cold" | "warm" | "hot";

    last_contact_date: string | null;
    next_action_date: string | null;
    next_step: string | null;
    lost_reason: string | null;

    observed_signals: string[] | null;
    notes: string | null;

    linked_submission_id: string | null;

    created_at: string;
    updated_at: string;
};

type HealthCheckSignal = {
    submission_id: string;
    completed_at: string | null;
    contact_name: string | null;
    contact_email: string | null;
    contact_company: string | null;
    contact_topic: string | null;
    company_size: string | null;
    industry: string | null;
    role: string | null;
    score: number | null;
    band: string | null;
    advisor_brief: JsonValue | null;
};

type ProspectActivity = {
    activity_id: string;
    prospect_id: string;
    linked_submission_id: string | null;
    activity_type: string;
    note_type: NoteType | null;
    field_name: string | null;
    old_value: string | null;
    new_value: string | null;
    note: string | null;
    changed_by: string | null;
    created_at: string;
};

function asObject(value: JsonValue | null): JsonObject | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as JsonObject;
}

function asString(value: JsonValue | undefined): string | null {
    return typeof value === "string" && value.trim() ? value : null;
}

function getBriefLine(value: JsonValue | null): string | null {
    const objectValue = asObject(value);

    if (!objectValue) {
        return null;
    }

    return (
        asString(objectValue.headline) ||
        asString(objectValue.recommendedCallAngle) ||
        asString(objectValue.executiveReadout) ||
        asString(objectValue.overallAssessment)
    );
}

function formatDateTime(value: string | null): string {
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

function formatDate(value: string | null): string {
    if (!value) return "Not set";

    try {
        return new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
        }).format(new Date(`${value}T00:00:00`));
    } catch {
        return value;
    }
}

function formatSource(value: AdvisorProspect["source"]): string {
    switch (value) {
        case "linkedin":
            return "LinkedIn";
        case "referral":
            return "Referral";
        case "website":
            return "Website";
        case "saas":
            return "SaaS";
        case "other":
            return "Other";
    }
}

function formatSegment(value: AdvisorProspect["segment"]): string {
    switch (value) {
        case "smb":
            return "SMB";
        case "mid":
            return "Mid-market";
        case "enterprise":
            return "Enterprise";
        default:
            return "Not set";
    }
}

function formatDiagnosticStatus(
    value: AdvisorProspect["diagnostic_status"],
): string {
    switch (value) {
        case "not_invited":
            return "Not invited";
        case "invited":
            return "Invited";
        case "started":
            return "Started";
        case "completed":
            return "Completed";
        case "assessment_candidate":
            return "Legacy: assessment candidate";
        case "in_conversation":
            return "Legacy: in conversation";
        case "converted":
            return "Legacy: converted";
    }
}

function formatDealStage(value: AdvisorProspect["deal_stage"]): string {
    switch (value) {
        case "new":
            return "New";
        case "contacted":
            return "Contacted";
        case "replied":
            return "Replied";
        case "meeting_booked":
            return "Meeting booked";
        case "in_conversation":
            return "In conversation";
        case "diagnostic_assessment_candidate":
            return "Diagnostic Assessment candidate";
        case "proposal_discussed":
            return "Proposal discussed";
        case "converted":
            return "Converted";
        case "lost":
            return "Lost";
        case "nurture":
            return "Nurture";
    }
}

function formatLeadTemperature(
    value: AdvisorProspect["lead_temperature"],
): string {
    switch (value) {
        case "cold":
            return "Cold";
        case "warm":
            return "Warm";
        case "hot":
            return "Hot";
    }
}

function formatNoteType(value: ProspectActivity["note_type"]): string {
    switch (value) {
        case "call":
            return "Call";
        case "meeting":
            return "Meeting";
        case "email":
            return "Email";
        case "linkedin":
            return "LinkedIn";
        case "internal":
            return "Internal note";
        default:
            return "Note";
    }
}

function getDaysSince(value: string | null): number | null {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const today = new Date();
    const difference = today.getTime() - date.getTime();

    return Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)));
}

function isOverdueDate(value: string | null): boolean {
    if (!value) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(`${value}T00:00:00`);
    return date.getTime() < today.getTime();
}

function dealBadgeClasses(value: AdvisorProspect["deal_stage"]): string {
    switch (value) {
        case "new":
        case "contacted":
        case "replied":
        case "nurture":
            return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
        case "meeting_booked":
        case "in_conversation":
            return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
        case "diagnostic_assessment_candidate":
        case "proposal_discussed":
            return "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200";
        case "converted":
            return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
        case "lost":
            return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    }
}

function formatActivityDescription(activity: ProspectActivity): string {
    const actor = activity.changed_by || "Advisor";

    if (activity.activity_type === "health_check_linked") {
        return `${actor} linked a Health Check to this prospect.`;
    }

    if (activity.activity_type === "health_check_unlinked") {
        return `${actor} unlinked a Health Check from this prospect.`;
    }

    return `${actor} recorded ${activity.activity_type.replaceAll("_", " ")}.`;
}

async function requireAdvisorSession(prospectId: string) {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect(`/advisor/login?next=/advisor/prospects/${prospectId}`);
    }

    if (!isAllowedAdvisorEmail(user.email)) {
        redirect("/advisor/login?error=forbidden");
    }

    return user;
}

async function getProspect(
    prospectId: string,
): Promise<AdvisorProspect | null> {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
        .from("advisor_prospects")
        .select(
            `
        prospect_id,
        name,
        company,
        role,
        contact_email,
        contact_phone,
        company_website,
        billing_contact_name,
        billing_contact_email,
        linkedin_url,
        source,
        segment,
        diagnostic_status,
        deal_stage,
        relationship_strength,
        lead_temperature,
        last_contact_date,
        next_action_date,
        next_step,
        lost_reason,
        observed_signals,
        notes,
        linked_submission_id,
        created_at,
        updated_at
      `,
        )
        .eq("prospect_id", prospectId)
        .maybeSingle();

    if (error) {
        throw new Error(`Unable to load prospect: ${error.message}`);
    }

    return (data as AdvisorProspect | null) ?? null;
}

async function getLinkedHealthCheck(
    submissionId: string | null,
): Promise<HealthCheckSignal | null> {
    if (!submissionId) {
        return null;
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
        .from("diagnostic_submissions")
        .select(
            `
        submission_id,
        completed_at,
        contact_name,
        contact_email,
        contact_company,
        contact_topic,
        company_size,
        industry,
        role,
        score,
        band,
        advisor_brief
      `,
        )
        .eq("submission_id", submissionId)
        .maybeSingle();

    if (error) {
        throw new Error(`Unable to load linked Health Check: ${error.message}`);
    }

    return (data as HealthCheckSignal | null) ?? null;
}

async function getActivity(prospectId: string): Promise<ProspectActivity[]> {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
        .from("advisor_prospect_activity")
        .select(
            `
        activity_id,
        prospect_id,
        linked_submission_id,
        activity_type,
        note_type,
        field_name,
        old_value,
        new_value,
        note,
        changed_by,
        created_at
      `,
        )
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        throw new Error(`Unable to load prospect activity: ${error.message}`);
    }

    return (data ?? []) as ProspectActivity[];
}

function SummaryItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}

export default async function ProspectDetailPage({
    params,
}: ProspectDetailPageProps) {
    const { prospectId } = await params;

    await requireAdvisorSession(prospectId);

    const prospect = await getProspect(prospectId);

    if (!prospect) {
        notFound();
    }

    const [linkedHealthCheck, activity] = await Promise.all([
        getLinkedHealthCheck(prospect.linked_submission_id),
        getActivity(prospect.prospect_id),
    ]);

    const notesActivity = activity.filter(
        (item) => item.activity_type === "note_added",
    );
    const systemActivity = activity.filter(
        (item) => item.activity_type !== "note_added",
    );

    const lastInteraction = notesActivity[0] ?? null;
    const daysSinceLastInteraction = lastInteraction
        ? getDaysSince(lastInteraction.created_at)
        : null;
    const nextActionOverdue = isOverdueDate(prospect.next_action_date);

    const briefLine = linkedHealthCheck
        ? getBriefLine(linkedHealthCheck.advisor_brief)
        : null;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-6xl space-y-8">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Prospect CRM
                            </p>
                            <h1 className="mt-3 text-2xl font-semibold text-slate-900">
                                {prospect.company || prospect.name || "Unnamed prospect"}
                            </h1>
                            <p className="mt-2 text-sm text-slate-600">
                                {prospect.name || "No named contact"}
                                {prospect.role ? ` · ${prospect.role}` : ""}
                            </p>
                        </div>

                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${dealBadgeClasses(
                                prospect.deal_stage,
                            )}`}
                        >
                            {formatDealStage(prospect.deal_stage)}
                        </span>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryItem
                            label="Deal stage"
                            value={formatDealStage(prospect.deal_stage)}
                        />
                        <SummaryItem
                            label="Lead temperature"
                            value={formatLeadTemperature(prospect.lead_temperature)}
                        />
                        <SummaryItem
                            label="Next step"
                            value={prospect.next_step || "Not set"}
                        />
                        <SummaryItem
                            label="Next action date"
                            value={formatDate(prospect.next_action_date)}
                        />
                        <SummaryItem
                            label="Last interaction"
                            value={
                                lastInteraction
                                    ? `${formatNoteType(
                                        lastInteraction.note_type,
                                    )} · ${formatDateTime(lastInteraction.created_at)}`
                                    : "No interaction logged"
                            }
                        />
                        <SummaryItem
                            label="Days since contact"
                            value={
                                daysSinceLastInteraction === null
                                    ? "Not available"
                                    : `${daysSinceLastInteraction}`
                            }
                        />
                        <SummaryItem
                            label="Next action status"
                            value={nextActionOverdue ? "Overdue" : "On track"}
                        />
                        <SummaryItem
                            label="Contact discipline"
                            value={
                                !lastInteraction
                                    ? "No history yet"
                                    : nextActionOverdue
                                        ? "Action needed"
                                        : "Tracked"
                            }
                        />
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryItem label="Source" value={formatSource(prospect.source)} />
                        <SummaryItem
                            label="Segment"
                            value={formatSegment(prospect.segment)}
                        />
                        <SummaryItem
                            label="Health Check status"
                            value={formatDiagnosticStatus(prospect.diagnostic_status)}
                        />
                        <SummaryItem
                            label="Last updated"
                            value={formatDateTime(prospect.updated_at)}
                        />
                    </div>
                </section>

                <ProspectDealControlPanel
                    prospectId={prospect.prospect_id}
                    name={prospect.name}
                    company={prospect.company}
                    role={prospect.role}
                    contactEmail={prospect.contact_email}
                    contactPhone={prospect.contact_phone}
                    companyWebsite={prospect.company_website}
                    billingContactName={prospect.billing_contact_name}
                    billingContactEmail={prospect.billing_contact_email}
                    linkedinUrl={prospect.linkedin_url}
                    source={prospect.source}
                    segment={prospect.segment}
                    relationshipStrength={prospect.relationship_strength}
                    dealStage={prospect.deal_stage}
                    leadTemperature={prospect.lead_temperature}
                    lastContactDate={prospect.last_contact_date}
                    nextActionDate={prospect.next_action_date}
                    nextStep={prospect.next_step}
                    lostReason={prospect.lost_reason}
                    notes={prospect.notes}
                    observedSignals={prospect.observed_signals}
                />

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Health Check signal
                            </p>
                            <h2 className="mt-3 text-xl font-semibold text-slate-900">
                                Linked diagnostic context
                            </h2>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                The Health Check is supporting evidence. Deal progression remains
                                managed in the CRM.
                            </p>
                        </div>

                        {prospect.linked_submission_id ? (
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href={`/advisor/${prospect.linked_submission_id}`}
                                    className="inline-flex items-center justify-center rounded-xl bg-[#1E6FD9] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1859ad]"
                                >
                                    Open Health Check
                                </Link>

                                <UnlinkHealthCheckButton prospectId={prospect.prospect_id} />
                            </div>
                        ) : null}
                    </div>

                    {linkedHealthCheck ? (
                        <div className="mt-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <SummaryItem
                                    label="Score"
                                    value={
                                        linkedHealthCheck.score === null
                                            ? "Not available"
                                            : `${linkedHealthCheck.score} / 100`
                                    }
                                />
                                <SummaryItem
                                    label="Band"
                                    value={linkedHealthCheck.band || "Not available"}
                                />
                                <SummaryItem
                                    label="Completed"
                                    value={formatDateTime(linkedHealthCheck.completed_at)}
                                />
                                <SummaryItem
                                    label="Topic"
                                    value={linkedHealthCheck.contact_topic || "Not provided"}
                                />
                            </div>

                            {briefLine ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Advisory read
                                    </p>
                                    <p className="mt-3 text-sm leading-7 text-slate-700">
                                        {briefLine}
                                    </p>
                                </div>
                            ) : null}

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <SummaryItem
                                    label="Health Check contact"
                                    value={linkedHealthCheck.contact_name || "Not provided"}
                                />
                                <SummaryItem
                                    label="Email"
                                    value={linkedHealthCheck.contact_email || "Not provided"}
                                />
                                <SummaryItem
                                    label="Company size"
                                    value={linkedHealthCheck.company_size || "Not provided"}
                                />
                                <SummaryItem
                                    label="Industry"
                                    value={linkedHealthCheck.industry || "Not provided"}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                            <p className="text-sm leading-7 text-slate-700">
                                No Health Check is linked yet. Link one from the Health Check
                                repository when a prospect completes it.
                            </p>
                        </div>
                    )}
                </section>

                <AddProspectNote prospectId={prospect.prospect_id} />

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Historic notes
                        </p>
                        <h2 className="mt-3 text-xl font-semibold text-slate-900">
                            Conversation notes
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            Append-only notes recorded against this prospect. These are kept
                            separate from system activity so the conversation history is easy
                            to read.
                        </p>
                    </div>

                    {notesActivity.length > 0 ? (
                        <div className="mt-6 space-y-4">
                            {notesActivity.map((item) => (
                                <article
                                    key={item.activity_id}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                                >
                                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                                        {item.note}
                                    </p>
                                    <p className="mt-3 text-xs uppercase tracking-[0.12em] text-slate-500">
                                        {formatNoteType(item.note_type)} ·{" "}
                                        {formatDateTime(item.created_at)}
                                        {item.changed_by ? ` · ${item.changed_by}` : ""}
                                    </p>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                            <p className="text-sm leading-7 text-slate-700">
                                No historic notes have been added yet.
                            </p>
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Activity history
                        </p>
                        <h2 className="mt-3 text-xl font-semibold text-slate-900">
                            System timeline
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            Field changes, Health Check links, and other system-level CRM
                            activity.
                        </p>
                    </div>

                    {systemActivity.length > 0 ? (
                        <div className="mt-6 space-y-4">
                            {systemActivity.map((item) => (
                                <div
                                    key={item.activity_id}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                                >
                                    <p className="text-sm font-medium text-slate-900">
                                        {formatActivityDescription(item)}
                                    </p>

                                    {item.old_value || item.new_value ? (
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {item.old_value ? `From: ${item.old_value}` : ""}
                                            {item.old_value && item.new_value ? " · " : ""}
                                            {item.new_value ? `To: ${item.new_value}` : ""}
                                        </p>
                                    ) : null}

                                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                                        {formatDateTime(item.created_at)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                            <p className="text-sm leading-7 text-slate-700">
                                No system activity has been recorded yet.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}