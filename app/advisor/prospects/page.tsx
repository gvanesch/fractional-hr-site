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

type SearchParams = Promise<{
    linkSubmissionId?: string;
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
    last_contact_date: string | null;
    next_action_date: string | null;
    linked_submission_id: string | null;
    created_at: string;
    updated_at: string;
};

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

async function getProspects(): Promise<AdvisorProspect[]> {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
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
        last_contact_date,
        next_action_date,
        linked_submission_id,
        created_at,
        updated_at
      `,
        )
        .order("updated_at", { ascending: false })
        .limit(250);

    if (error) {
        throw new Error(`Unable to load prospects: ${error.message}`);
    }

    return (data ?? []) as AdvisorProspect[];
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

export default async function AdvisorProspectsPage({
    searchParams,
}: AdvisorProspectsPageProps) {
    const advisorUser = await requireAdvisorSession();
    const prospects = await getProspects();
    const resolvedSearchParams = await searchParams;
    const linkSubmissionId = resolvedSearchParams.linkSubmissionId?.trim() || "";

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
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                            Signed in as <strong>{advisorUser.email}</strong>
                        </div>

                        <Link
                            href="/advisor/prospects/new"
                            className="inline-flex items-center justify-center rounded-xl bg-[#1E6FD9] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1859ad]"
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

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Total prospects</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {prospects.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Health Check linked
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {
                                prospects.filter((prospect) =>
                                    Boolean(prospect.linked_submission_id),
                                ).length
                            }
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            In conversation
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {
                                prospects.filter(
                                    (prospect) =>
                                        prospect.diagnostic_status === "in_conversation",
                                ).length
                            }
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Converted</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {
                                prospects.filter(
                                    (prospect) => prospect.diagnostic_status === "converted",
                                ).length
                            }
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {prospects.length === 0 ? (
                        <div className="p-8">
                            <h2 className="text-lg font-semibold text-slate-900">
                                No prospects yet
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Add prospects from LinkedIn, referrals, SaaS contacts, or other
                                outbound sources. Health Check data can be linked later.
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