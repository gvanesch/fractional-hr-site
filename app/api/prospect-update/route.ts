import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateAdvisorRequest } from "@/lib/advisor-auth";
import {
  type D1HealthCheckProspectActivityRow,
  parseD1HealthCheckProspectActivityRow,
  parseD1HealthCheckProspectRow,
  syncD1HealthCheckProspectMutation,
} from "@/lib/d1/crm-prospects";
import {
  getD1Database,
  isD1CrmProspectsEnabled,
  isD1CrmProspectsShadowWriteEnabled,
} from "@/lib/d1/database";

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
    const user = await authenticateAdvisorRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const safeUserEmail = user.email?.trim().toLowerCase();

    if (!safeUserEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

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

    if (isD1CrmProspectsEnabled()) {
      const currentRow = await getD1Database()
        .prepare(
          `SELECT
            prospect_id,
            submission_id,
            name,
            company,
            relationship,
            status,
            last_contact_date,
            next_action_date,
            source,
            notes,
            created_at,
            updated_at
          FROM health_check_prospects
          WHERE prospect_id = ?
          LIMIT 1`,
        )
        .bind(prospectId)
        .first();

      if (!currentRow) {
        return NextResponse.json(
          { success: false, error: "Prospect not found" },
          { status: 404 },
        );
      }

      const current = parseD1HealthCheckProspectRow(currentRow);
      const updatedAt = new Date().toISOString();
      const activities: D1HealthCheckProspectActivityRow[] = [];

      const recordChange = (
        activityType: string,
        fieldName: string,
        oldValue: string | null,
        newValue: string | null,
      ) => {
        if (oldValue === newValue) {
          return;
        }

        activities.push({
          activityId: crypto.randomUUID(),
          prospectId: current.prospectId,
          submissionId: current.submissionId,
          activityType,
          fieldName,
          oldValue,
          newValue,
          note: null,
          changedBy: safeUserEmail,
          createdAt: updatedAt,
        });
      };

      recordChange("source_changed", "source", current.source, nextSource);
      recordChange(
        "relationship_changed",
        "relationship",
        current.relationship,
        nextRelationship,
      );
      recordChange("status_changed", "status", current.status, nextStatus);

      if (lastContactDate !== undefined) {
        recordChange(
          "last_contact_date_changed",
          "last_contact_date",
          current.lastContactDate,
          lastContactDate,
        );
      }

      if (nextActionDate !== undefined) {
        recordChange(
          "next_action_date_changed",
          "next_action_date",
          current.nextActionDate,
          nextActionDate,
        );
      }

      if (nextNotes !== undefined) {
        recordChange(
          "notes_changed",
          "notes",
          current.notes,
          nextNotes,
        );
      }

      await syncD1HealthCheckProspectMutation({
        prospect: {
          ...current,
          source: nextSource,
          relationship: nextRelationship,
          status: nextStatus,
          lastContactDate:
            lastContactDate === undefined
              ? current.lastContactDate
              : lastContactDate,
          nextActionDate:
            nextActionDate === undefined
              ? current.nextActionDate
              : nextActionDate,
          notes: nextNotes === undefined ? current.notes : nextNotes,
          updatedAt,
        },
        activities,
      });

      return NextResponse.json(
        {
          success: true,
          loggedActivityCount: activities.length,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

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

    const { data: updatedProspect, error: updateError } = await admin
      .from("health_check_prospects")
      .update(updatePayload)
      .eq("prospect_id", prospectId)
      .select(
        "prospect_id,submission_id,name,company,relationship,status,last_contact_date,next_action_date,source,notes,created_at,updated_at",
      )
      .single();

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

    let insertedActivities: unknown[] = [];

    if (activityRows.length > 0) {
      const { data, error: activityError } = await admin
        .from("health_check_prospect_activity")
        .insert(activityRows)
        .select(
          "activity_id,prospect_id,submission_id,activity_type,field_name,old_value,new_value,note,changed_by,created_at",
        );

      if (activityError) {
        return NextResponse.json(
          { success: false, error: activityError.message },
          { status: 500 },
        );
      }

      insertedActivities = data;
    }

    if (isD1CrmProspectsShadowWriteEnabled()) {
      try {
        await syncD1HealthCheckProspectMutation({
          prospect: parseD1HealthCheckProspectRow(updatedProspect),
          activities: insertedActivities.map((activity) =>
            parseD1HealthCheckProspectActivityRow(activity),
          ),
        });

        console.log("PROSPECT_UPDATE_D1_SHADOW_SUCCESS", {
          prospectId,
          activityCount: insertedActivities.length,
        });
      } catch (shadowError) {
        console.error("PROSPECT_UPDATE_D1_SHADOW_FAILED", {
          prospectId,
          activityCount: insertedActivities.length,
          error:
            shadowError instanceof Error
              ? shadowError.message
              : "Unknown D1 shadow-write error",
        });
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
