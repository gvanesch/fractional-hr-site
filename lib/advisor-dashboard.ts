import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Aggregated, read-only data model for the advisor overview dashboard.
// Each source is fetched independently and degrades gracefully: if one
// Supabase query fails, that section reports an error while the rest of the
// dashboard still renders.

export type DashboardProject = {
  project_id: string;
  project_name: string | null;
  company_name: string | null;
  project_status: "active" | "closed" | "archived" | null;
  created_at: string;
};

export type DashboardProspect = {
  prospect_id: string;
  name: string | null;
  company: string | null;
  role: string | null;
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
  next_action_date: string | null;
  linked_submission_id: string | null;
  updated_at: string;
};

export type DashboardHealthCheck = {
  submission_id: string;
  completed_at: string | null;
  contact_submitted_at: string | null;
  contact_name: string | null;
  contact_email: string | null;
  email: string | null;
  contact_company: string | null;
  industry: string | null;
  score: number | null;
  band: string | null;
};

export type DashboardSection<T> = {
  data: T;
  error: string | null;
};

export type AdvisorDashboardData = {
  projects: DashboardSection<DashboardProject[]>;
  prospects: DashboardSection<DashboardProspect[]>;
  healthChecks: DashboardSection<DashboardHealthCheck[]>;
};

export function getLondonDateString(date: Date): string {
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

export function addDaysToDateString(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function loadProjects(): Promise<DashboardSection<DashboardProject[]>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("client_projects")
      .select("project_id, project_name, company_name, project_status, created_at")
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []) as DashboardProject[], error: null };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function loadProspects(): Promise<DashboardSection<DashboardProspect[]>> {
  try {
    const supabase = createSupabaseAdminClient();
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
          next_step,
          next_action_date,
          linked_submission_id,
          updated_at
        `,
      )
      .order("updated_at", { ascending: false })
      .limit(250);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []) as DashboardProspect[], error: null };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function loadHealthChecks(): Promise<
  DashboardSection<DashboardHealthCheck[]>
> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("diagnostic_submissions")
      .select(
        `
          submission_id,
          completed_at,
          contact_submitted_at,
          contact_name,
          contact_email,
          email,
          contact_company,
          industry,
          score,
          band
        `,
      )
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(250);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []) as DashboardHealthCheck[], error: null };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAdvisorDashboardData(): Promise<AdvisorDashboardData> {
  const [projects, prospects, healthChecks] = await Promise.all([
    loadProjects(),
    loadProspects(),
    loadHealthChecks(),
  ]);

  return { projects, prospects, healthChecks };
}

// ---- Derived metrics ---------------------------------------------------

export function isActiveDeal(prospect: DashboardProspect): boolean {
  return prospect.deal_stage !== "converted" && prospect.deal_stage !== "lost";
}

export function temperatureRank(
  value: DashboardProspect["lead_temperature"],
): number {
  switch (value) {
    case "hot":
      return 0;
    case "warm":
      return 1;
    case "cold":
      return 2;
  }
}

export function sortByNextAction(
  a: DashboardProspect,
  b: DashboardProspect,
): number {
  const aDate = a.next_action_date ?? "9999-12-31";
  const bDate = b.next_action_date ?? "9999-12-31";

  if (aDate !== bDate) {
    return aDate.localeCompare(bDate);
  }

  return temperatureRank(a.lead_temperature) - temperatureRank(b.lead_temperature);
}

export function healthCheckEmail(check: DashboardHealthCheck): string | null {
  return check.contact_email || check.email || null;
}
