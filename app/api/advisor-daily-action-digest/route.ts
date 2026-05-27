import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

type AdvisorProspectRow = {
    prospect_id: string;
    name: string | null;
    company: string | null;
    role: string | null;
    deal_stage: string | null;
    lead_temperature: string | null;
    next_action_date: string | null;
    next_step: string | null;
    linked_submission_id: string | null;
    updated_at: string;
};

type ClientProjectRow = {
    project_id: string;
    company_name: string;
    project_status: string;
};

type ParticipantRow = {
    project_id: string;
    participant_status: string;
    invite_expires_at: string | null;
};

type ProjectDigestRow = {
    projectId: string;
    companyName: string;
    outstanding: number;
    inviteExpiryCount: number;
    dashboardUrl: string | null;
};

type ContactFormDiagnosticRow = {
    submission_id: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_company: string | null;
    contact_topic: string | null;
    score: number | null;
    band: string | null;
    contact_submitted_at: string | null;
};

type DigestData = {
    overdueProspects: AdvisorProspectRow[];
    dueTodayProspects: AdvisorProspectRow[];
    nextSevenDaysProspects: AdvisorProspectRow[];
    noNextActionProspects: AdvisorProspectRow[];
    contactFormDiagnostics: ContactFormDiagnosticRow[];
    activeProjects: ProjectDigestRow[];
};

function getSupabaseAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Missing Supabase environment variables.");
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        throw new Error("Missing RESEND_API_KEY.");
    }

    return new Resend(apiKey);
}

function getRequiredConfig() {
    const cronSecret = process.env.CRON_SECRET;
    const dailySummaryRecipient = process.env.DAILY_SUMMARY_RECIPIENT;
    const appBaseUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? null;

    if (!cronSecret) {
        throw new Error("Missing CRON_SECRET.");
    }

    if (!dailySummaryRecipient) {
        throw new Error("Missing DAILY_SUMMARY_RECIPIENT.");
    }

    return {
        cronSecret,
        dailySummaryRecipient,
        appBaseUrl,
    };
}

function isAuthorized(request: Request, cronSecret: string) {
    const authorizationHeader = request.headers.get("authorization");
    return authorizationHeader === `Bearer ${cronSecret}`;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
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

function getLondonHour(date: Date): number {
    const hourValue = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        hour12: false,
    }).format(date);

    return Number.parseInt(hourValue, 10);
}

function addDaysToDateString(dateString: string, days: number): string {
    const date = new Date(`${dateString}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

function formatDate(value: string | null): string {
    if (!value) return "Not set";

    try {
        return new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeZone: "Europe/London",
        }).format(new Date(`${value}T00:00:00Z`));
    } catch {
        return value;
    }
}

function formatLabel(value: string | null): string {
    if (!value) return "Not set";

    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function buildProspectUrl(
    appBaseUrl: string | null,
    prospectId: string,
): string | null {
    if (!appBaseUrl) return null;

    return `${appBaseUrl}/advisor/prospects/${prospectId}`;
}

function buildProjectUrl(
    appBaseUrl: string | null,
    projectId: string,
): string | null {
    if (!appBaseUrl) return null;

    return `${appBaseUrl}/advisor/client-diagnostic/${projectId}`;
}

function buildHealthCheckUrl(
    appBaseUrl: string | null,
    submissionId: string | null,
): string | null {
    if (!appBaseUrl || !submissionId) return null;

    return `${appBaseUrl}/advisor/${submissionId}`;
}

function buildProspectSection(
    title: string,
    prospects: AdvisorProspectRow[],
    appBaseUrl: string | null,
) {
    if (prospects.length === 0) {
        return "";
    }

    const rows = prospects
        .map((prospect) => {
            const prospectUrl = buildProspectUrl(appBaseUrl, prospect.prospect_id);
            const healthCheckUrl = buildHealthCheckUrl(
                appBaseUrl,
                prospect.linked_submission_id,
            );

            const prospectLink = prospectUrl
                ? `<a href="${escapeHtml(prospectUrl)}" style="color: #1E6FD9; text-decoration: none;">Open prospect</a>`
                : "";

            const healthCheckLink = healthCheckUrl
                ? `&nbsp;|&nbsp;<a href="${escapeHtml(healthCheckUrl)}" style="color: #1E6FD9; text-decoration: none;">Open Health Check</a>`
                : "";

            return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628;">
            <strong>${escapeHtml(prospect.company || prospect.name || "Unnamed prospect")}</strong>
            <br />
            <span style="color: #64748B;">${escapeHtml(prospect.name || "No named contact")}${prospect.role ? `, ${escapeHtml(prospect.role)}` : ""}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #334155;">
            ${escapeHtml(formatLabel(prospect.deal_stage))}
            <br />
            <span style="color: #64748B;">${escapeHtml(formatLabel(prospect.lead_temperature))}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #334155;">
            ${escapeHtml(formatDate(prospect.next_action_date))}
            <br />
            <span style="color: #64748B;">${escapeHtml(prospect.next_step || "No next step recorded")}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #334155;">
            ${prospectLink}${healthCheckLink}
          </td>
        </tr>
      `;
        })
        .join("");

    return `
    <section style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin: 0 0 16px 0;">
      <h3 style="margin: 0 0 12px 0; color: #0A1628; font-size: 18px; line-height: 1.3;">
        ${escapeHtml(title)}
      </h3>

      <table style="width: 100%; border-collapse: collapse; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: #F8FAFC;">
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: left;">Prospect</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: left;">Stage</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: left;">Next action</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: left;">Links</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function buildContactFormDiagnosticSection(
    diagnostics: ContactFormDiagnosticRow[],
    appBaseUrl: string | null,
) {
    if (diagnostics.length === 0) {
        return "";
    }

    const rows = diagnostics
        .map((item) => {
            const healthCheckUrl = buildHealthCheckUrl(
                appBaseUrl,
                item.submission_id,
            );

            const link = healthCheckUrl
                ? `<a href="${escapeHtml(healthCheckUrl)}" style="color: #1E6FD9; text-decoration: none;">Open Health Check</a>`
                : "";

            return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628;">
            <strong>${escapeHtml(item.contact_company || item.contact_name || "Unknown contact")}</strong>
            <br />
            <span style="color: #64748B;">
              ${escapeHtml(item.contact_name || "No name")} · ${escapeHtml(item.contact_email || "No email")}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #334155;">
            ${item.score ?? "-"} / 100
            <br />
            <span style="color: #64748B;">${escapeHtml(item.band || "Unknown")}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #334155;">
            ${escapeHtml(item.contact_topic || "General enquiry")}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #334155;">
            ${link}
          </td>
        </tr>
      `;
        })
        .join("");

    return `
    <section style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin: 0 0 16px 0;">
      <h3 style="margin: 0 0 12px 0; color: #0A1628; font-size: 18px; line-height: 1.3;">
        Contact-form diagnostics requiring review
      </h3>
      <p style="margin: 0 0 14px 0; color: #64748B; line-height: 1.6;">
        These are Health Check records where a contact form was submitted. Anonymous and passive Health Checks are excluded.
      </p>

      <table style="width: 100%; border-collapse: collapse; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: #F8FAFC;">
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: left;">Contact</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: left;">Score</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: left;">Topic</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628; text-align: left;">Link</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function buildProjectSection(projects: ProjectDigestRow[]) {
    if (projects.length === 0) {
        return "";
    }

    const rows = projects
        .map((project) => {
            const projectLink = project.dashboardUrl
                ? `<a href="${escapeHtml(project.dashboardUrl)}" style="color: #1E6FD9; text-decoration: none;">Open project dashboard</a>`
                : "";

            return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #0A1628;">
            <strong>${escapeHtml(project.companyName)}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #334155; text-align: center;">
            ${project.outstanding}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #334155; text-align: center;">
            ${project.inviteExpiryCount}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #334155;">
            ${projectLink}
          </td>
        </tr>
      `;
        })
        .join("");

    return `
    <section style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin: 0 0 16px 0;">
      <h3 style="margin: 0 0 12px 0; color: #0A1628; font-size: 18px; line-height: 1.3;">
        Active projects needing attention
      </h3>

      <table style="width: 100%; border-collapse: collapse; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: #F8FAFC;">
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: left;">Project</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center;">Outstanding</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center;">Invites expiring</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: left;">Link</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function buildEmailHtml(data: DigestData, appBaseUrl: string | null) {
    const totalActions =
        data.overdueProspects.length +
        data.dueTodayProspects.length +
        data.nextSevenDaysProspects.length +
        data.noNextActionProspects.length +
        data.contactFormDiagnostics.length +
        data.activeProjects.length;

    const emptyState =
        totalActions === 0
            ? `
        <section style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin: 0 0 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #0A1628; font-size: 18px;">No immediate actions</h3>
          <p style="margin: 0; color: #334155;">There are no overdue prospect actions, due actions, near-term prospect actions, contact-form diagnostics, missing next actions, or active project follow-ups requiring attention today.</p>
        </section>
      `
            : "";

    return `
    <div style="background: #F4F6FA; padding: 24px; font-family: Inter, Arial, sans-serif; color: #0A1628;">
      <div style="max-width: 900px; margin: 0 auto;">
        <h2 style="margin: 0 0 8px 0; font-size: 24px; line-height: 1.2; color: #0A1628;">
          Daily Advisor Action Digest
        </h2>
        <p style="margin: 0 0 24px 0; color: #64748B;">
          Pipeline actions, contact-form diagnostics, and active project follow-ups needing attention.
        </p>

        ${emptyState}
        ${buildProspectSection("Overdue prospect actions", data.overdueProspects, appBaseUrl)}
        ${buildProspectSection("Prospect actions due today", data.dueTodayProspects, appBaseUrl)}
        ${buildProspectSection("Prospect actions due in the next 7 days", data.nextSevenDaysProspects, appBaseUrl)}
        ${buildProspectSection("Prospects with no next action set", data.noNextActionProspects, appBaseUrl)}
        ${buildContactFormDiagnosticSection(data.contactFormDiagnostics, appBaseUrl)}
        ${buildProjectSection(data.activeProjects)}
      </div>
    </div>
  `;
}

async function loadProspectsForDigest(
    today: string,
    nextSevenDays: string,
): Promise<{
    overdueProspects: AdvisorProspectRow[];
    dueTodayProspects: AdvisorProspectRow[];
    nextSevenDaysProspects: AdvisorProspectRow[];
    noNextActionProspects: AdvisorProspectRow[];
}> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
        .from("advisor_prospects")
        .select(
            `
        prospect_id,
        name,
        company,
        role,
        deal_stage,
        lead_temperature,
        next_action_date,
        next_step,
        linked_submission_id,
        updated_at
      `,
        )
        .order("next_action_date", { ascending: true, nullsFirst: false })
        .limit(500)
        .returns<AdvisorProspectRow[]>();

    if (error) {
        throw new Error(`Failed to load advisor prospects: ${error.message}`);
    }

    const prospects = data ?? [];
    const activeProspects = prospects.filter(
        (prospect) =>
            prospect.deal_stage !== "converted" && prospect.deal_stage !== "lost",
    );

    return {
        overdueProspects: activeProspects.filter(
            (prospect) =>
                prospect.next_action_date !== null && prospect.next_action_date < today,
        ),
        dueTodayProspects: activeProspects.filter(
            (prospect) => prospect.next_action_date === today,
        ),
        nextSevenDaysProspects: activeProspects.filter(
            (prospect) =>
                prospect.next_action_date !== null &&
                prospect.next_action_date > today &&
                prospect.next_action_date <= nextSevenDays,
        ),
        noNextActionProspects: activeProspects
            .filter((prospect) => prospect.next_action_date === null)
            .slice(0, 25),
    };
}

async function loadProjectsForDigest(
    appBaseUrl: string | null,
    today: string,
    nextSevenDays: string,
): Promise<ProjectDigestRow[]> {
    const supabase = getSupabaseAdminClient();

    const { data: projects, error: projectsError } = await supabase
        .from("client_projects")
        .select("project_id, company_name, project_status")
        .eq("project_status", "active")
        .order("company_name", { ascending: true })
        .returns<ClientProjectRow[]>();

    if (projectsError) {
        throw new Error(`Failed to load active projects: ${projectsError.message}`);
    }

    if (!projects || projects.length === 0) {
        return [];
    }

    const projectIds = projects.map((project) => project.project_id);

    const { data: participants, error: participantsError } = await supabase
        .from("client_participants")
        .select("project_id, participant_status, invite_expires_at")
        .in("project_id", projectIds)
        .returns<ParticipantRow[]>();

    if (participantsError) {
        throw new Error(
            `Failed to load project participants: ${participantsError.message}`,
        );
    }

    const participantRows = participants ?? [];

    return projects
        .map((project) => {
            const projectParticipants = participantRows.filter(
                (participant) => participant.project_id === project.project_id,
            );

            const outstanding = projectParticipants.filter(
                (participant) => participant.participant_status !== "completed",
            ).length;

            const inviteExpiryCount = projectParticipants.filter(
                (participant) =>
                    participant.participant_status !== "completed" &&
                    participant.invite_expires_at !== null &&
                    participant.invite_expires_at >= today &&
                    participant.invite_expires_at <= nextSevenDays,
            ).length;

            return {
                projectId: project.project_id,
                companyName: project.company_name,
                outstanding,
                inviteExpiryCount,
                dashboardUrl: buildProjectUrl(appBaseUrl, project.project_id),
            };
        })
        .filter((project) => project.outstanding > 0 || project.inviteExpiryCount > 0);
}

async function loadContactFormDiagnostics(): Promise<ContactFormDiagnosticRow[]> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
        .from("diagnostic_submissions")
        .select(
            `
        submission_id,
        contact_name,
        contact_email,
        contact_company,
        contact_topic,
        score,
        band,
        contact_submitted_at
      `,
        )
        .not("contact_submitted_at", "is", null)
        .not("contact_email", "is", null)
        .not("contact_name", "is", null)
        .order("contact_submitted_at", { ascending: false })
        .limit(200)
        .returns<ContactFormDiagnosticRow[]>();

    if (error) {
        throw new Error(`Failed to load contact-form diagnostics: ${error.message}`);
    }

    const submissions = data ?? [];

    if (submissions.length === 0) {
        return [];
    }

    const submissionIds = submissions.map((submission) => submission.submission_id);

    const { data: linkedProspects, error: prospectError } = await supabase
        .from("advisor_prospects")
        .select(
            `
        linked_submission_id,
        deal_stage
      `,
        )
        .in("linked_submission_id", submissionIds);

    if (prospectError) {
        throw new Error(`Failed to load linked prospects: ${prospectError.message}`);
    }

    const prospectMap = new Map(
        (linkedProspects ?? []).map((prospect) => [
            prospect.linked_submission_id,
            prospect,
        ]),
    );

    return submissions.filter((submission) => {
        const linkedProspect = prospectMap.get(submission.submission_id);

        if (!linkedProspect) {
            return true;
        }

        const stage = linkedProspect.deal_stage;

        return !["in_conversation", "proposal_discussed", "converted", "lost"].includes(
            stage,
        );
    });
}

export async function POST(request: Request) {
    try {
        const { cronSecret, dailySummaryRecipient, appBaseUrl } =
            getRequiredConfig();

        if (!isAuthorized(request, cronSecret)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Forbidden.",
                },
                { status: 403 },
            );
        }

        const requestUrl = new URL(request.url);
        const forceSend = requestUrl.searchParams.get("force") === "true";
        const londonHour = getLondonHour(new Date());

        if (!forceSend && londonHour !== 8) {
            return NextResponse.json({
                success: true,
                message: "Skipped outside 08:00 Europe/London.",
                londonHour,
            });
        }

        const today = getLondonDateString(new Date());
        const nextSevenDays = addDaysToDateString(today, 7);

        const prospectDigest = await loadProspectsForDigest(today, nextSevenDays);
        const contactFormDiagnostics = await loadContactFormDiagnostics();
        const activeProjects = await loadProjectsForDigest(
            appBaseUrl,
            today,
            nextSevenDays,
        );

        const data: DigestData = {
            ...prospectDigest,
            contactFormDiagnostics,
            activeProjects,
        };

        const emailHtml = buildEmailHtml(data, appBaseUrl);
        const resend = getResendClient();

        const resendResponse = await resend.emails.send({
            from: "Van Esch Advisory <no-reply@vanesch.uk>",
            to: dailySummaryRecipient,
            subject: "Daily Advisor Action Digest",
            html: emailHtml,
        });

        if (resendResponse.error) {
            throw new Error(
                `Resend failed to send advisor action digest: ${resendResponse.error.message}`,
            );
        }

        console.info(
            JSON.stringify({
                event: "advisor_daily_action_digest_sent",
                recipient: dailySummaryRecipient,
                overdueProspects: data.overdueProspects.length,
                dueTodayProspects: data.dueTodayProspects.length,
                nextSevenDaysProspects: data.nextSevenDaysProspects.length,
                noNextActionProspects: data.noNextActionProspects.length,
                contactFormDiagnostics: data.contactFormDiagnostics.length,
                activeProjects: data.activeProjects.length,
            }),
        );

        return NextResponse.json({
            success: true,
            message: "Advisor action digest email sent.",
            overdueProspects: data.overdueProspects.length,
            dueTodayProspects: data.dueTodayProspects.length,
            nextSevenDaysProspects: data.nextSevenDaysProspects.length,
            noNextActionProspects: data.noNextActionProspects.length,
            contactFormDiagnostics: data.contactFormDiagnostics.length,
            activeProjects: data.activeProjects.length,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error occurred.";

        console.error(
            JSON.stringify({
                event: "advisor_daily_action_digest_failed",
                error: message,
            }),
        );

        return NextResponse.json(
            {
                success: false,
                error: "Failed to send advisor action digest.",
            },
            { status: 500 },
        );
    }
}

export async function GET() {
    return NextResponse.json(
        {
            success: false,
            error: "Method not allowed.",
        },
        { status: 405 },
    );
}