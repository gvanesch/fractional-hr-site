import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

type ProspectSource = "network" | "referral" | "website" | "other";

type ProspectStatus =
  | "not_contacted"
  | "contacted"
  | "replied"
  | "call_booked"
  | "opportunity"
  | "won"
  | "lost";

type ProspectRelationship = "weak" | "medium" | "strong";

type ProspectRow = {
  prospect_id: string;
  submission_id: string;
  source: ProspectSource;
  relationship: ProspectRelationship;
  status: ProspectStatus;
  last_contact_date: string | null;
  next_action_date: string | null;
  notes: string | null;
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

const VALID_SOURCES: ProspectSource[] = [
  "network",
  "referral",
  "website",
  "other",
];

const VALID_STATUSES: ProspectStatus[] = [
  "not_contacted",
  "contacted",
  "replied",
  "call_booked",
  "opportunity",
  "won",
  "lost",
];

const VALID_RELATIONSHIPS: ProspectRelationship[] = ["weak", "medium", "strong"];

function normaliseOptionalDate(
  value: unknown,
  fieldName: string,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid ${fieldName}`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return trimmed;
}

function normaliseOptionalNotes(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Invalid notes");
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 5000);
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

    const safeUserEmail = userEmail as string;

    const body = (await request.json()) as {
      prospect_id?: string;
      source?: string;
      relationship?: string;
      status?: string;
      last_contact_date?: string | null;
      next_action_date?: string | null;
      notes?: string | null;
    };

    const prospectId = body.prospect_id?.trim();

    if (!prospectId) {
      return NextResponse.json(
        { success: false, error: "Missing prospect_id" },
        { status: 400 },
      );
    }

    if (!body.source || !VALID_SOURCES.includes(body.source as ProspectSource)) {
      return NextResponse.json(
        { success: false, error: "Invalid source" },
        { status: 400 },
      );
    }

    if (!body.status || !VALID_STATUSES.includes(body.status as ProspectStatus)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 },
      );
    }

    if (
      !body.relationship ||
      !VALID_RELATIONSHIPS.includes(body.relationship as ProspectRelationship)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid relationship" },
        { status: 400 },
      );
    }

    const nextSource = body.source as ProspectSource;
    const nextStatus = body.status as ProspectStatus;
    const nextRelationship = body.relationship as ProspectRelationship;
    const lastContactDate = normaliseOptionalDate(
      body.last_contact_date,
      "last_contact_date",
    );
    const nextActionDate = normaliseOptionalDate(
      body.next_action_date,
      "next_action_date",
    );
    const nextNotes = normaliseOptionalNotes(body.notes);

    const admin = createSupabaseAdminClient();

    const { data: currentRow, error: currentError } = await admin
      .from("health_check_prospects")
      .select(
        `
          prospect_id,
          submission_id,
          source,
          relationship,
          status,
          last_contact_date,
          next_action_date,
          notes
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
      source: ProspectSource;
      relationship: ProspectRelationship;
      status: ProspectStatus;
      last_contact_date?: string | null;
      next_action_date?: string | null;
      notes?: string | null;
      updated_at: string;
    } = {
      source: nextSource,
      relationship: nextRelationship,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (lastContactDate !== undefined) {
      updatePayload.last_contact_date = lastContactDate;
    }

    if (nextActionDate !== undefined) {
      updatePayload.next_action_date = nextActionDate;
    }

    if (nextNotes !== undefined) {
      updatePayload.notes = nextNotes;
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

    if (current.source !== nextSource) {
      activityRows.push({
        prospect_id: current.prospect_id,
        submission_id: current.submission_id,
        activity_type: "source_changed",
        field_name: "source",
        old_value: current.source,
        new_value: nextSource,
        note: null,
        changed_by: safeUserEmail,
      });
    }

    if (current.relationship !== nextRelationship) {
      activityRows.push({
        prospect_id: current.prospect_id,
        submission_id: current.submission_id,
        activity_type: "relationship_changed",
        field_name: "relationship",
        old_value: current.relationship,
        new_value: nextRelationship,
        note: null,
        changed_by: safeUserEmail,
      });
    }

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
      lastContactDate !== undefined &&
      (current.last_contact_date ?? null) !== lastContactDate
    ) {
      activityRows.push({
        prospect_id: current.prospect_id,
        submission_id: current.submission_id,
        activity_type: "last_contact_date_changed",
        field_name: "last_contact_date",
        old_value: current.last_contact_date,
        new_value: lastContactDate,
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

    if (nextNotes !== undefined && (current.notes ?? null) !== nextNotes) {
      activityRows.push({
        prospect_id: current.prospect_id,
        submission_id: current.submission_id,
        activity_type: "notes_changed",
        field_name: "notes",
        old_value: current.notes,
        new_value: nextNotes,
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

    const status =
      message === "Invalid last_contact_date" ||
      message === "Invalid next_action_date" ||
      message === "Invalid notes"
        ? 400
        : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status },
    );
  }
}