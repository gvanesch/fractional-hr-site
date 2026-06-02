import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import {
  addDaysToDateString,
  getAdvisorDashboardData,
  getLondonDateString,
  healthCheckEmail,
  isActiveDeal,
  sortByNextAction,
  type DashboardHealthCheck,
  type DashboardProspect,
} from "@/lib/advisor-dashboard";

export const metadata = {
  title: "Advisor Dashboard | Van Esch Advisory",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
      new Date(value.length <= 10 ? `${value}T00:00:00` : value),
    );
  } catch {
    return value;
  }
}

function formatDealStage(value: DashboardProspect["deal_stage"]): string {
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
      return "Assessment candidate";
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

function temperatureClasses(value: DashboardProspect["lead_temperature"]): string {
  switch (value) {
    case "hot":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    case "warm":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "cold":
      return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200";
  }
}

function bandClasses(band: string | null): string {
  const value = (band ?? "").toLowerCase();

  if (value.includes("strong") || value.includes("mature")) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  }

  if (value.includes("structured") || value.includes("developing")) {
    return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }

  if (
    value.includes("chaotic") ||
    value.includes("friction") ||
    value.includes("emerging")
  ) {
    return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
  }

  return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
}

// ---- Small presentational components -----------------------------------

function KpiCard({
  label,
  value,
  helper,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "alert" | "positive";
  href?: string;
}) {
  const valueColor =
    tone === "alert"
      ? "text-rose-600"
      : tone === "positive"
        ? "text-emerald-600"
        : "text-slate-900";

  const body = (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition group-hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-4">
        <p className={`text-3xl font-semibold ${valueColor}`}>{value}</p>
        {helper ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {body}
      </Link>
    );
  }

  return <div className="h-full">{body}</div>;
}

function SectionShell({
  kicker,
  title,
  description,
  action,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {kicker}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>

        {action ? (
          <Link
            href={action.href}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {action.label}
          </Link>
        ) : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
      <p className="text-sm font-medium text-rose-700">
        Unable to load this data from Supabase.
      </p>
      <p className="mt-1 text-xs text-rose-600">{message}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <p className="text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

type ActionItem = {
  id: string;
  priority: number;
  category: string;
  categoryTone: "alert" | "warn" | "info";
  title: string;
  detail: string;
  href: string;
};

function categoryToneClasses(tone: ActionItem["categoryTone"]): string {
  switch (tone) {
    case "alert":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    case "warn":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "info":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
  }
}

function ActionRow({ item }: { item: ActionItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#1E6FD9] hover:bg-blue-50/40"
    >
      <div className="min-w-0">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryToneClasses(
            item.categoryTone,
          )}`}
        >
          {item.category}
        </span>
        <p className="mt-2 truncate text-sm font-semibold text-slate-900">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-600">{item.detail}</p>
      </div>
      <span className="mt-1 shrink-0 text-xs font-medium text-[#1E6FD9]">
        Open
      </span>
    </Link>
  );
}

export default async function AdvisorHomePage() {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const { projects, prospects, healthChecks } = await getAdvisorDashboardData();

  const today = getLondonDateString(new Date());
  const inSevenDays = addDaysToDateString(today, 7);

  // ---- Project metrics ----
  const activeProjects = projects.data.filter(
    (project) => project.project_status === "active",
  );
  const closedProjects = projects.data.filter(
    (project) => project.project_status === "closed",
  );

  // ---- Prospect / CRM metrics ----
  const activeProspects = prospects.data.filter(isActiveDeal);
  const hotProspects = activeProspects.filter((p) => p.lead_temperature === "hot");
  const warmProspects = activeProspects.filter(
    (p) => p.lead_temperature === "warm",
  );

  const overdueProspects = activeProspects
    .filter((p) => p.next_action_date !== null && p.next_action_date < today)
    .sort(sortByNextAction);
  const dueTodayProspects = activeProspects
    .filter((p) => p.next_action_date === today)
    .sort(sortByNextAction);
  const upcomingProspects = activeProspects
    .filter(
      (p) =>
        p.next_action_date !== null &&
        p.next_action_date > today &&
        p.next_action_date <= inSevenDays,
    )
    .sort(sortByNextAction);

  const recentProspects = prospects.data.slice(0, 5);

  // Pipeline distribution across active deal stages.
  const stageCounts = new Map<DashboardProspect["deal_stage"], number>();
  for (const prospect of activeProspects) {
    stageCounts.set(
      prospect.deal_stage,
      (stageCounts.get(prospect.deal_stage) ?? 0) + 1,
    );
  }
  const pipelineStages = Array.from(stageCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  // ---- Health Check metrics ----
  const linkedSubmissionIds = new Set(
    prospects.data
      .map((p) => p.linked_submission_id)
      .filter((value): value is string => Boolean(value)),
  );

  const unlinkedHealthChecks = healthChecks.data.filter(
    (check) => !linkedSubmissionIds.has(check.submission_id),
  );
  const unlinkedWithEmail = unlinkedHealthChecks.filter((check) =>
    Boolean(healthCheckEmail(check)),
  );

  const scored = healthChecks.data.filter(
    (check) => typeof check.score === "number",
  );
  const averageScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((total, check) => total + (check.score ?? 0), 0) /
            scored.length,
        )
      : null;

  const recentHealthChecks = healthChecks.data.slice(0, 5);

  // ---- Action centre (prioritised) ----
  const actionItems: ActionItem[] = [];

  for (const prospect of overdueProspects) {
    actionItems.push({
      id: `overdue-${prospect.prospect_id}`,
      priority: 0,
      category: "Overdue follow-up",
      categoryTone: "alert",
      title: prospect.company || prospect.name || "Unnamed prospect",
      detail: `${prospect.next_step || "No next step set"} · due ${formatDate(
        prospect.next_action_date,
      )}`,
      href: `/advisor/prospects/${prospect.prospect_id}`,
    });
  }

  for (const prospect of dueTodayProspects) {
    actionItems.push({
      id: `due-${prospect.prospect_id}`,
      priority: 1,
      category: "Due today",
      categoryTone: "warn",
      title: prospect.company || prospect.name || "Unnamed prospect",
      detail: prospect.next_step || "No next step set",
      href: `/advisor/prospects/${prospect.prospect_id}`,
    });
  }

  for (const check of unlinkedWithEmail.slice(0, 5)) {
    actionItems.push({
      id: `unlinked-${check.submission_id}`,
      priority: 2,
      category: "Unlinked Health Check",
      categoryTone: "info",
      title:
        check.contact_company ||
        check.contact_name ||
        healthCheckEmail(check) ||
        "Health Check submission",
      detail: `${healthCheckEmail(check) ?? "No email"} · link to a prospect to follow up`,
      href: `/advisor/prospects?linkSubmissionId=${check.submission_id}`,
    });
  }

  for (const prospect of hotProspects.filter((p) => !p.next_action_date)) {
    actionItems.push({
      id: `hot-${prospect.prospect_id}`,
      priority: 3,
      category: "Hot prospect · no action",
      categoryTone: "warn",
      title: prospect.company || prospect.name || "Unnamed prospect",
      detail: "Hot lead with no next action scheduled",
      href: `/advisor/prospects/${prospect.prospect_id}`,
    });
  }

  actionItems.sort((a, b) => a.priority - b.priority);
  const topActions = actionItems.slice(0, 8);

  const hasAnyError = Boolean(
    projects.error || prospects.error || healthChecks.error,
  );

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Command centre
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              A single view across diagnostic projects, Health Check signals,
              and the prospect pipeline — with the actions that need your
              attention surfaced first.
            </p>

            <p className="mt-6 text-sm text-white/70">
              Signed in as <strong className="text-white">{advisorUser.email}</strong>
            </p>
          </div>
        </div>
      </section>

      <div className="brand-container space-y-8 py-10">
        {hasAnyError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Some dashboard data could not be loaded. Affected sections are
              flagged below; the rest of the dashboard is current.
            </p>
          </div>
        ) : null}

        {/* KPI row */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Active projects"
            value={projects.error ? "—" : activeProjects.length}
            helper={
              projects.error
                ? "Data unavailable"
                : `${closedProjects.length} closed`
            }
            href="/advisor/projects"
          />
          <KpiCard
            label="Health Checks"
            value={healthChecks.error ? "—" : healthChecks.data.length}
            helper={
              healthChecks.error ? "Data unavailable" : "Completed submissions"
            }
            href="/advisor/health-checks"
          />
          <KpiCard
            label="Unlinked + email"
            value={
              healthChecks.error || prospects.error
                ? "—"
                : unlinkedWithEmail.length
            }
            helper="Need linking to a prospect"
            tone={unlinkedWithEmail.length > 0 ? "alert" : "default"}
            href="/advisor/health-checks"
          />
          <KpiCard
            label="Active prospects"
            value={prospects.error ? "—" : activeProspects.length}
            helper={
              prospects.error
                ? "Data unavailable"
                : `${hotProspects.length} hot · ${warmProspects.length} warm`
            }
            href="/advisor/prospects"
          />
          <KpiCard
            label="Overdue / today"
            value={
              prospects.error
                ? "—"
                : overdueProspects.length + dueTodayProspects.length
            }
            helper={`${overdueProspects.length} overdue · ${dueTodayProspects.length} today`}
            tone={
              overdueProspects.length + dueTodayProspects.length > 0
                ? "alert"
                : "default"
            }
            href="/advisor/prospects?nextAction=due"
          />
          <KpiCard
            label="Avg HC score"
            value={healthChecks.error ? "—" : averageScore ?? "N/A"}
            helper="Across completed checks"
          />
        </section>

        {/* Action centre */}
        <SectionShell
          kicker="Action centre"
          title="What needs your attention"
          description="Prioritised across overdue follow-ups, today's actions, unlinked Health Checks, and hot prospects without a next step."
        >
          {prospects.error && healthChecks.error ? (
            <SectionError
              message={prospects.error || healthChecks.error || "Unknown error"}
            />
          ) : topActions.length === 0 ? (
            <EmptyState message="Nothing outstanding. No overdue follow-ups, unlinked Health Checks with contact details, or hot prospects missing a next action." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {topActions.map((item) => (
                <ActionRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </SectionShell>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* CRM / pipeline overview */}
          <SectionShell
            kicker="Pipeline"
            title="Prospect CRM overview"
            description="Active deals by stage and the most recently updated prospects."
            action={{ label: "Open CRM", href: "/advisor/prospects" }}
          >
            {prospects.error ? (
              <SectionError message={prospects.error} />
            ) : prospects.data.length === 0 ? (
              <EmptyState message="No prospects yet. Add prospects from LinkedIn, referrals, or other outbound sources." />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatPill label="Hot" value={hotProspects.length} />
                  <StatPill label="Warm" value={warmProspects.length} />
                  <StatPill
                    label="Cold"
                    value={
                      activeProspects.length -
                      hotProspects.length -
                      warmProspects.length
                    }
                  />
                  <StatPill label="Next 7 days" value={upcomingProspects.length} />
                </div>

                {pipelineStages.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Active deal stages
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pipelineStages.map(([stage, count]) => (
                        <span
                          key={stage}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                        >
                          {formatDealStage(stage)}
                          <span className="rounded-full bg-white px-1.5 text-slate-900">
                            {count}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Recently updated
                  </p>
                  <div className="mt-3 space-y-2">
                    {recentProspects.map((prospect) => (
                      <Link
                        key={prospect.prospect_id}
                        href={`/advisor/prospects/${prospect.prospect_id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-[#1E6FD9] hover:bg-blue-50/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {prospect.company || prospect.name || "Unnamed prospect"}
                          </p>
                          <p className="truncate text-xs text-slate-600">
                            {formatDealStage(prospect.deal_stage)} ·{" "}
                            {formatDate(prospect.updated_at)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${temperatureClasses(
                            prospect.lead_temperature,
                          )}`}
                        >
                          {prospect.lead_temperature}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </SectionShell>

          {/* Health Check overview */}
          <SectionShell
            kicker="Health Checks"
            title="Health Check overview"
            description="Latest completed submissions with score bands and linking status."
            action={{ label: "View all", href: "/advisor/health-checks" }}
          >
            {healthChecks.error ? (
              <SectionError message={healthChecks.error} />
            ) : healthChecks.data.length === 0 ? (
              <EmptyState message="No completed Health Checks yet." />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatPill label="Total" value={healthChecks.data.length} />
                  <StatPill
                    label="Unlinked"
                    value={unlinkedHealthChecks.length}
                  />
                  <StatPill label="Avg score" value={averageScore ?? "N/A"} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Latest submissions
                  </p>
                  <div className="mt-3 space-y-2">
                    {recentHealthChecks.map((check) => (
                      <HealthCheckRow
                        key={check.submission_id}
                        check={check}
                        linked={linkedSubmissionIds.has(check.submission_id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </SectionShell>
        </div>

        {/* Project overview */}
        <SectionShell
          kicker="Projects"
          title="Diagnostic project overview"
          description="Active diagnostic engagements and their current status."
          action={{ label: "All projects", href: "/advisor/projects" }}
        >
          {projects.error ? (
            <SectionError message={projects.error} />
          ) : projects.data.length === 0 ? (
            <EmptyState message="No diagnostic projects yet. Create one to begin a client engagement." />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatPill label="Active" value={activeProjects.length} />
                <StatPill label="Closed" value={closedProjects.length} />
                <StatPill label="Total" value={projects.data.length} />
              </div>

              {activeProjects.length === 0 ? (
                <EmptyState message="No active projects right now." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeProjects.slice(0, 6).map((project) => (
                    <Link
                      key={project.project_id}
                      href={`/advisor/project/${project.project_id}`}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#1E6FD9] hover:bg-blue-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {project.project_name ||
                            project.company_name ||
                            "Untitled project"}
                        </p>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          Active
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {project.company_name || "No company recorded"} · created{" "}
                        {formatDate(project.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </SectionShell>
      </div>
    </main>
  );
}

function HealthCheckRow({
  check,
  linked,
}: {
  check: DashboardHealthCheck;
  linked: boolean;
}) {
  const name =
    check.contact_name ||
    check.contact_company ||
    healthCheckEmail(check) ||
    "Anonymous submission";

  return (
    <Link
      href={`/advisor/${check.submission_id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-[#1E6FD9] hover:bg-blue-50/40"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
        <p className="truncate text-xs text-slate-600">
          {check.industry || "Industry not set"} ·{" "}
          {formatDate(check.completed_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!linked && healthCheckEmail(check) ? (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
            Unlinked
          </span>
        ) : null}
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bandClasses(
            check.band,
          )}`}
        >
          {check.score ?? "N/A"}
        </span>
      </div>
    </Link>
  );
}
