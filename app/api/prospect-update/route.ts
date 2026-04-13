import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

type ProspectStatus =
  | "not_contacted"
  | "contacted"
  | "replied"
  | "call_booked"
  | "opportunity"
  | "won"
  | "lost";

type ProspectRow = {
  prospect_id: string;
  submission_id: string;
  status: ProspectStatus;
  next_action_date: string | null;
};

type ActivityInsert = {
  prospect_id: string;
  submission_id: string;
  activity_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  changed_by: string;
};

const VALID_STATUSES: ProspectStatus[] = [
  "not_contacted",
  "contacted",
  "replied",
  "call_booked",
  "opportunity",
  "won",
  "lost",
];

function normaliseOptionalDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  if (typeof value !== "string") {
    throw new Error("Invalid next_action_date");
  }

  const trimmed = value.trim();

  if (!trimmed) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("Invalid next_action_date");
  }

  return trimmed;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userEmail = session.user.email;

    if (!isAllowedAdvisorEmail(userEmail)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Safe after validation
    const safeUserEmail = userEmail as string;

    const body = (await request.json()) as {
      prospect_id?: string;
      status?: string;
      next_action_date?: string | null;
    };

    const prospectId = body.prospect_id?.trim();

    if (!prospectId) {
      return NextResponse.json(
        { success: false, error: "Missing prospect_id" },
        { status: 400 },
      );
    }

    if (!body.status || !VALID_STATUSES.includes(body.status as ProspectStatus)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 },
      );
    }

    const nextActionDate = normaliseOptionalDate(body.next_action_date);
    const nextStatus = body.status as ProspectStatus;

    const admin = createSupabaseAdminClient();

    const { data: currentRow, error: currentError } = await admin
      .from("health_check_prospects")
      .select(
        `
          prospect_id,
          submission_id,
          status,
          next_action_date
        `,
      )
      .eq("prospect_id", prospectId)
      .maybeSingle();

    if (currentError) {
      return NextResponse.json(
        { success: false, error: currentError.message },
        { status: 500 },
      );
    }

    if (!currentRow) {
      return NextResponse.json(
        { success: false, error: "Prospect not found" },
        { status: 404 },
      );
    }

    const current = currentRow as ProspectRow;

    const updatePayload: {
      status: ProspectStatus;
      next_action_date?: string | null;
      updated_at: string;
    } = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextActionDate !== undefined) {
      updatePayload.next_action_date = nextActionDate;
    }

    const { error: updateError } = await admin
      .from("health_check_prospects")
      .update(updatePayload)
      .eq("prospect_id", prospectId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 },
      );
    }

    const activityRows: ActivityInsert[] = [];

    if (current.status !== nextStatus) {
      activityRows.push({
        prospect_id: current.prospect_id,
        submission_id: current.submission_id,
        activity_type: "status_changed",
        field_name: "status",
        old_value: current.status,
        new_value: nextStatus,
        note: null,
        changed_by: safeUserEmail,
      });
    }

    if (
      nextActionDate !== undefined &&
      (current.next_action_date ?? null) !== nextActionDate
    ) {
      activityRows.push({
        prospect_id: current.prospect_id,
        submission_id: current.submission_id,
        activity_type: "next_action_date_changed",
        field_name: "next_action_date",
        old_value: current.next_action_date,
        new_value: nextActionDate,
        note: null,
        changed_by: safeUserEmail,
      });
    }

    if (activityRows.length > 0) {
      const { error: activityError } = await admin
        .from("health_check_prospect_activity")
        .insert(activityRows);

      if (activityError) {
        return NextResponse.json(
          { success: false, error: activityError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        loggedActivityCount: activityRows.length,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("prospect-update error", error);

    const message =
      error instanceof Error ? error.message : "Unexpected error";

    const status = message === "Invalid next_action_date" ? 400 : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status },
    );
  }
}