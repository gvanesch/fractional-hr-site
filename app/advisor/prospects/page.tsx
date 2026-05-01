import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";
import LinkHealthCheckToProspectButton from "@/app/components/advisor/LinkHealthCheckToProspectButton";

export const dynamic = "force-dynamic";

export const metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

type NextActionFilter = "all" | "due" | "seven_days" | "none";

type SearchParams = Promise<{
    linkSubmissionId?: string;
    q?: string;
    nextAction?: string;
}>;

type AdvisorProspectsPageProps = {
    searchParams: SearchParams;
};

type AdvisorProspect = {
    prospect_id: string;
    name: string | null;
    company: string | null;
    role: string | null;
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
    lead_temperature: "cold" | "warm" | "hot";
    next_step: string | null;
    last_contact_date: string | null;
    next_action_date: string | null;
    linked_submission_id: string | null;
    created_at: string;
    updated_at: string;
};

const fieldClassName =
    "h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 text-sm leading-none text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1E6FD9] focus:ring-4 focus:ring-blue-100";

const primaryButtonClassName =
    "inline-flex h-12 items-center justify-center rounded-xl bg-[#1E6FD9] px-4 text-sm font-medium text-white transition hover:bg-[#1859ad]";

const darkButtonClassName =
    "inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700";

const secondaryButtonClassName =
    "inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50";

async function requireAdvisorSession() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/advisor/login?next=/advisor/prospects");
    }

    if (!isAllowedAdvisorEmail(user.email)) {
        redirect("/advisor/login?error=forbidden");
    }

    return user;
}

function getLondonDateString(date: Date): string {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
        return date.toISOString().slice(0, 10);
    }

    return `${year}-${month}-${day}`;
}

function addDaysToDateString(dateString: string, days: number): string {
    const date = new Date(`${dateString}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

function normaliseNextActionFilter(value: string | undefined): NextActionFilter {
    if (value === "due" || value === "seven_days" || value === "none") {
        return value;
    }

    return "all";
}

async function getProspects(
    searchQuery: string,
    nextActionFilter: NextActionFilter,
): Promise<AdvisorProspect[]> {
    const supabase = createSupabaseAdminClient();

    let query = supabase
        .from("advisor_prospects")
        .select(
            `
                prospect_id,
                name,
                company,
                role,
                source,
                segment,
                diagnostic_status,
                deal_stage,
                lead_temperature,
                next_step,
                last_contact_date,
                next_action_date,
                linked_submission_id,
                created_at,
                updated_at
            `,
        )
        .order("updated_at", { ascending: false })
        .limit(250);

    if (searchQuery) {
        const safeSearchQuery = searchQuery.replace(/[%_,]/g, "");
        query = query.or(
            `name.ilike.%${safeSearchQuery}%,company.ilike.%${safeSearchQuery}%,role.ilike.%${safeSearchQuery}%,source.ilike.%${safeSearchQuery}%,segment.ilike.%${safeSearchQuery}%,diagnostic_status.ilike.%${safeSearchQuery}%`,
        );
    }

    const today = getLondonDateString(new Date());

    if (nextActionFilter === "due") {
        query = query.lte("next_action_date", today);
    }

    if (nextActionFilter === "seven_days") {
        query = query
            .gte("next_action_date", today)
            .lte("next_action_date", addDaysToDateString(today, 7));
    }

    if (nextActionFilter === "none") {
        query = query.is("next_action_date", null);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Unable to load prospects: ${error.message}`);
    }

    return (data ?? []) as AdvisorProspect[];
}

function formatDate(value: string | null): string {
    if (!value) {
        return "Not set";
    }

    try {
        return new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
        }).format(new Date(`${value}T00:00:00`));
    } catch {
        return value;
    }
}

function formatDateTime(value: string): string {
    try {
        return new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
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
            return "Invited to Health Check";
        case "started":
            return "Health Check started";
        case "completed":
            return "Health Check completed";
        case "assessment_candidate":
            return "Diagnostic Assessment candidate";
        case "in_conversation":
            return "In conversation";
        case "converted":
            return "Converted";
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

function formatNextActionFilter(value: NextActionFilter): string {
    switch (value) {
        case "due":
            return "due today or overdue";
        case "seven_days":
            return "due in the next 7 days";
        case "none":
            return "with no next action set";
        case "all":
            return "all next actions";
    }
}

function statusBadgeClasses(
    value: AdvisorProspect["diagnostic_status"],
): string {
    switch (value) {
        case "not_invited":
            return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
        case "invited":
        case "started":
            return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
        case "completed":
        case "assessment_candidate":
            return "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200";
        case "in_conversation":
            return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
        case "converted":
            return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    }
}

function temperatureRank(value: AdvisorProspect["lead_temperature"]): number {
    switch (value) {
        case "hot":
            return 0;
        case "warm":
            return 1;
        case "cold":
            return 2;
    }
}

function isActiveDeal(prospect: AdvisorProspect): boolean {
    return prospect.deal_stage !== "converted" && prospect.deal_stage !== "lost";
}

function sortActionProspects(a: AdvisorProspect, b: AdvisorProspect): number {
    const aDate = a.next_action_date ?? "9999-12-31";
    const bDate = b.next_action_date ?? "9999-12-31";

    if (aDate !== bDate) {
        return aDate.localeCompare(bDate);
    }

    return temperatureRank(a.lead_temperature) - temperatureRank(b.lead_temperature);
}

function MetricCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="flex h-full min-h-[126px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function ActionFocusColumn({
    title,
    description,
    prospects,
}: {
    title: string;
    description: string;
    prospects: AdvisorProspect[];
}) {
    return (
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    {description}
                </p>
            </div>

            {prospects.length > 0 ? (
                <div className="mt-5 flex-1 space-y-2">
                    {prospects.map((prospect) => (
                        <Link
                            key={prospect.prospect_id}
                            href={`/advisor/prospects/${prospect.prospect_id}`}
                            className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#1E6FD9] hover:bg-blue-50"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                        {prospect.company ||
                                            prospect.name ||
                                            "Unnamed prospect"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        {prospect.next_step || "No next step set"}
                                    </p>
                                </div>

                                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                                    {formatLeadTemperature(prospect.lead_temperature)}
                                </span>
                            </div>

                            <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                {formatDate(prospect.next_action_date)} ·{" "}
                                {formatDealStage(prospect.deal_stage)}
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="mt-5 flex flex-1 items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <p className="text-sm leading-6 text-slate-600">
                        No prospects in this action group.
                    </p>
                </div>
            )}
        </div>
    );
}

export default async function AdvisorProspectsPage({
    searchParams,
}: AdvisorProspectsPageProps) {
    const advisorUser = await requireAdvisorSession();
    const resolvedSearchParams = await searchParams;
    const linkSubmissionId = resolvedSearchParams.linkSubmissionId?.trim() || "";
    const searchQuery = resolvedSearchParams.q?.trim() || "";
    const nextActionFilter = normaliseNextActionFilter(
        resolvedSearchParams.nextAction,
    );

    const [allProspects, prospects] = await Promise.all([
        getProspects("", "all"),
        getProspects(searchQuery, nextActionFilter),
    ]);

    const today = getLondonDateString(new Date());
    const nextSevenDays = addDaysToDateString(today, 7);

    const activeProspects = allProspects.filter(isActiveDeal);

    const overdueProspects = activeProspects
        .filter(
            (prospect) =>
                prospect.next_action_date !== null &&
                prospect.next_action_date < today,
        )
        .sort(sortActionProspects);

    const dueTodayProspects = activeProspects
        .filter((prospect) => prospect.next_action_date === today)
        .sort(sortActionProspects);

    const upcomingProspects = activeProspects
        .filter(
            (prospect) =>
                prospect.next_action_date !== null &&
                prospect.next_action_date > today &&
                prospect.next_action_date <= nextSevenDays,
        )
        .sort(sortActionProspects);

    const clearParams = new URLSearchParams();

    if (linkSubmissionId) {
        clearParams.set("linkSubmissionId", linkSubmissionId);
    }

    const clearPath = clearParams.toString()
        ? `/advisor/prospects?${clearParams.toString()}`
        : "/advisor/prospects";

    const hasActiveFilters = Boolean(searchQuery) || nextActionFilter !== "all";

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Prospect CRM
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            Track outbound, referral, and partner-led prospects before Health
                            Check data exists. Link completed Health Checks once the prospect
                            moves into the diagnostic flow.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm">
                            Signed in as <strong className="ml-1">{advisorUser.email}</strong>
                        </div>

                        <Link
                            href="/advisor/prospects/new"
                            className={primaryButtonClassName}
                        >
                            Add Prospect
                        </Link>
                    </div>
                </div>

                {linkSubmissionId ? (
                    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                        <p className="text-sm font-semibold text-blue-900">
                            Link Health Check to an existing prospect
                        </p>
                        <p className="mt-2 text-sm leading-6 text-blue-800">
                            Select the prospect this Health Check belongs to. This will mark
                            the diagnostic status as completed and add the link to the prospect
                            activity timeline.
                        </p>
                    </section>
                ) : null}

                <section className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard label="Total prospects" value={allProspects.length} />
                    <MetricCard
                        label="Health Check linked"
                        value={
                            allProspects.filter((prospect) =>
                                Boolean(prospect.linked_submission_id),
                            ).length
                        }
                    />
                    <MetricCard
                        label="Due today / overdue"
                        value={overdueProspects.length + dueTodayProspects.length}
                    />
                    <MetricCard label="Next 7 days" value={upcomingProspects.length} />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Action focus
                        </p>
                        <h2 className="mt-3 text-xl font-semibold text-slate-900">
                            What needs attention
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            Active prospects with dated follow-up actions. Lost and converted
                            prospects are excluded from this action view.
                        </p>
                    </div>

                    <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-3">
                        <ActionFocusColumn
                            title="Overdue"
                            description="Follow-ups that should already have happened."
                            prospects={overdueProspects}
                        />
                        <ActionFocusColumn
                            title="Due today"
                            description="Actions scheduled for today."
                            prospects={dueTodayProspects}
                        />
                        <ActionFocusColumn
                            title="Next 7 days"
                            description="Upcoming follow-ups to keep warm."
                            prospects={upcomingProspects}
                        />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <form
                        action="/advisor/prospects"
                        className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]"
                    >
                        {linkSubmissionId ? (
                            <input
                                type="hidden"
                                name="linkSubmissionId"
                                value={linkSubmissionId}
                            />
                        ) : null}

                        <label className="sr-only" htmlFor="prospect-search">
                            Search prospects
                        </label>
                        <input
                            id="prospect-search"
                            name="q"
                            type="search"
                            defaultValue={searchQuery}
                            placeholder="Search by company, contact, role, source, segment, or status"
                            className={fieldClassName}
                        />

                        <label className="sr-only" htmlFor="next-action-filter">
                            Filter by next action
                        </label>
                        <select
                            id="next-action-filter"
                            name="nextAction"
                            defaultValue={nextActionFilter}
                            className={fieldClassName}
                        >
                            <option value="all">All next actions</option>
                            <option value="due">Due today / overdue</option>
                            <option value="seven_days">Next 7 days</option>
                            <option value="none">No next action</option>
                        </select>

                        <button type="submit" className={darkButtonClassName}>
                            Apply
                        </button>

                        {hasActiveFilters ? (
                            <Link href={clearPath} className={secondaryButtonClassName}>
                                Clear
                            </Link>
                        ) : null}
                    </form>

                    {hasActiveFilters ? (
                        <p className="mt-3 text-sm text-slate-600">
                            Showing {prospects.length} result
                            {prospects.length === 1 ? "" : "s"}
                            {searchQuery ? (
                                <>
                                    {" "}
                                    for <strong>{searchQuery}</strong>
                                </>
                            ) : null}{" "}
                            across <strong>{formatNextActionFilter(nextActionFilter)}</strong>.
                        </p>
                    ) : null}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {prospects.length === 0 ? (
                        <div className="p-8">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {hasActiveFilters ? "No matching prospects" : "No prospects yet"}
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                {hasActiveFilters
                                    ? "Try a different search term or next action filter."
                                    : "Add prospects from LinkedIn, referrals, SaaS contacts, or other outbound sources. Health Check data can be linked later."}
                            </p>
                        </div>
                    ) : (
                        <div className="hidden lg:block">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Prospect
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Source
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Segment
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Diagnostic status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Next action
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Updated
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {prospects.map((prospect) => (
                                        <tr key={prospect.prospect_id} className="align-top">
                                            <td className="px-4 py-4 text-sm text-slate-700">
                                                <div className="font-medium text-slate-900">
                                                    {prospect.company ||
                                                        prospect.name ||
                                                        "Unnamed prospect"}
                                                </div>
                                                <div className="mt-1">
                                                    {prospect.name || "No named contact"}
                                                </div>
                                                {prospect.role ? (
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {prospect.role}
                                                    </div>
                                                ) : null}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                                                {formatSource(prospect.source)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                                                {formatSegment(prospect.segment)}
                                            </td>

                                            <td className="px-4 py-4 text-sm">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(
                                                        prospect.diagnostic_status,
                                                    )}`}
                                                >
                                                    {formatDiagnosticStatus(prospect.diagnostic_status)}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                                                {formatDate(prospect.next_action_date)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                                                {formatDateTime(prospect.updated_at)}
                                            </td>

                                            <td className="px-4 py-4 text-sm">
                                                <div className="flex flex-col gap-2">
                                                    <Link
                                                        href={`/advisor/prospects/${prospect.prospect_id}`}
                                                        className="font-medium text-[#1E6FD9] hover:underline"
                                                    >
                                                        Open
                                                    </Link>

                                                    {linkSubmissionId ? (
                                                        <LinkHealthCheckToProspectButton
                                                            prospectId={prospect.prospect_id}
                                                            submissionId={linkSubmissionId}
                                                        />
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {prospects.length > 0 ? (
                        <div className="grid gap-4 p-4 lg:hidden">
                            {prospects.map((prospect) => (
                                <article
                                    key={prospect.prospect_id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-900">
                                                {prospect.company ||
                                                    prospect.name ||
                                                    "Unnamed prospect"}
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {prospect.name || "No named contact"}
                                            </p>
                                            {prospect.role ? (
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {prospect.role}
                                                </p>
                                            ) : null}
                                        </div>

                                        <span
                                            className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(
                                                prospect.diagnostic_status,
                                            )}`}
                                        >
                                            {formatDiagnosticStatus(prospect.diagnostic_status)}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <p className="text-sm text-slate-600">
                                            <strong>Source:</strong> {formatSource(prospect.source)}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            <strong>Segment:</strong> {formatSegment(prospect.segment)}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            <strong>Next action:</strong>{" "}
                                            {formatDate(prospect.next_action_date)}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            <strong>Updated:</strong>{" "}
                                            {formatDateTime(prospect.updated_at)}
                                        </p>
                                    </div>

                                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4">
                                        <Link
                                            href={`/advisor/prospects/${prospect.prospect_id}`}
                                            className="font-medium text-[#1E6FD9] hover:underline"
                                        >
                                            Open prospect
                                        </Link>

                                        {linkSubmissionId ? (
                                            <LinkHealthCheckToProspectButton
                                                prospectId={prospect.prospect_id}
                                                submissionId={linkSubmissionId}
                                            />
                                        ) : null}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : null}
                </section>
            </div>
        </main>
    );
}