import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";
import {
    parseD1AdvisorProspectActivityRow,
    parseD1AdvisorProspectRow,
    syncD1AdvisorProspectMutation,
} from "@/lib/d1/crm-prospects";
import {
    getD1Database,
    isD1CrmProspectsEnabled,
    isD1CrmProspectsShadowWriteEnabled,
} from "@/lib/d1/database";

export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        }

        if (!isAllowedAdvisorEmail(user.email)) {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 },
            );
        }

        const body = (await request.json()) as {
            prospect_id?: string;
        };

        const prospectId = body.prospect_id?.trim();

        if (!prospectId) {
            return NextResponse.json(
                { success: false, error: "Missing prospect_id" },
                { status: 400 },
            );
        }

        if (isD1CrmProspectsEnabled()) {
            const database = getD1Database();
            const prospect = await database
                .prepare(
                    `SELECT linked_submission_id
                    FROM advisor_prospects
                    WHERE prospect_id = ?
                    LIMIT 1`,
                )
                .bind(prospectId)
                .first<{ linked_submission_id: string | null }>();

            if (!prospect) {
                return NextResponse.json(
                    { success: false, error: "Prospect not found" },
                    { status: 404 },
                );
            }

            const linkedSubmissionId = prospect.linked_submission_id;
            if (!linkedSubmissionId) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "No Health Check is linked to this prospect.",
                    },
                    { status: 400 },
                );
            }

            const now = new Date().toISOString();
            const results = await database.batch([
                database
                    .prepare(
                        `UPDATE advisor_prospects
                        SET linked_submission_id = NULL,
                            diagnostic_status = 'in_conversation',
                            updated_at = ?
                        WHERE prospect_id = ? AND linked_submission_id = ?`,
                    )
                    .bind(now, prospectId, linkedSubmissionId),
                database
                    .prepare(
                        `INSERT INTO advisor_prospect_activity (
                            activity_id,
                            prospect_id,
                            linked_submission_id,
                            activity_type,
                            field_name,
                            old_value,
                            new_value,
                            note,
                            changed_by,
                            created_at
                        ) VALUES (?, ?, ?, 'health_check_unlinked', 'linked_submission_id', ?, NULL, ?, ?, ?)`,
                    )
                    .bind(
                        crypto.randomUUID(),
                        prospectId,
                        linkedSubmissionId,
                        linkedSubmissionId,
                        "Health Check submission unlinked from prospect. Prospect returned to conversation workflow.",
                        user.email ?? null,
                        now,
                    ),
            ]);

            if (
                results.length !== 2 ||
                results.some(
                    (result) => !result.success || result.meta.changes !== 1,
                )
            ) {
                throw new Error("D1 did not unlink the Health Check atomically.");
            }

            return NextResponse.json(
                { success: true },
                { headers: { "Cache-Control": "no-store" } },
            );
        }

        const admin = createSupabaseAdminClient();

        const { data: prospect, error: prospectError } = await admin
            .from("advisor_prospects")
            .select("prospect_id, linked_submission_id, diagnostic_status")
            .eq("prospect_id", prospectId)
            .maybeSingle();

        if (prospectError) {
            return NextResponse.json(
                { success: false, error: prospectError.message },
                { status: 500 },
            );
        }

        if (!prospect) {
            return NextResponse.json(
                { success: false, error: "Prospect not found" },
                { status: 404 },
            );
        }

        const linkedSubmissionId =
            typeof prospect.linked_submission_id === "string"
                ? prospect.linked_submission_id
                : null;

        if (!linkedSubmissionId) {
            return NextResponse.json(
                { success: false, error: "No Health Check is linked to this prospect." },
                { status: 400 },
            );
        }

        const { data: updatedProspect, error: updateError } = await admin
            .from("advisor_prospects")
            .update({
                linked_submission_id: null,
                diagnostic_status: "in_conversation",
                updated_at: new Date().toISOString(),
            })
            .eq("prospect_id", prospectId)
            .select(
                "prospect_id,name,company,role,source,segment,diagnostic_status,last_contact_date,next_action_date,observed_signals,notes,linked_submission_id,created_at,updated_at,relationship_strength,deal_stage,lead_temperature,next_step,lost_reason,contact_email,contact_phone,company_website,billing_contact_name,billing_contact_email,linkedin_url",
            )
            .single();

        if (updateError) {
            return NextResponse.json(
                { success: false, error: updateError.message },
                { status: 500 },
            );
        }

        const { data: activity, error: activityError } = await admin
            .from("advisor_prospect_activity")
            .insert({
                prospect_id: prospectId,
                linked_submission_id: linkedSubmissionId,
                activity_type: "health_check_unlinked",
                field_name: "linked_submission_id",
                old_value: linkedSubmissionId,
                new_value: null,
                note:
                    "Health Check submission unlinked from prospect. Prospect returned to conversation workflow.",
                changed_by: user.email ?? null,
            })
            .select(
                "activity_id,prospect_id,linked_submission_id,activity_type,field_name,old_value,new_value,note,changed_by,created_at,note_type",
            )
            .single();

        if (activityError) {
            return NextResponse.json(
                { success: false, error: activityError.message },
                { status: 500 },
            );
        }

        if (isD1CrmProspectsShadowWriteEnabled()) {
            try {
                await syncD1AdvisorProspectMutation({
                    prospect: parseD1AdvisorProspectRow(updatedProspect),
                    activities: [
                        parseD1AdvisorProspectActivityRow(activity),
                    ],
                });

                console.log("ADVISOR_UNLINK_HEALTH_CHECK_D1_SHADOW_SUCCESS", {
                    prospectId,
                    submissionId: linkedSubmissionId,
                    activityId: activity.activity_id,
                });
            } catch (shadowError) {
                console.error("ADVISOR_UNLINK_HEALTH_CHECK_D1_SHADOW_FAILED", {
                    prospectId,
                    submissionId: linkedSubmissionId,
                    activityId: activity.activity_id,
                    error:
                        shadowError instanceof Error
                            ? shadowError.message
                            : "Unknown D1 shadow-write error",
                });
            }
        }

        return NextResponse.json(
            { success: true },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch (error) {
        console.error("advisor-unlink-health-check-prospect error", error);

        return NextResponse.json(
            { success: false, error: "Unexpected error" },
            { status: 500 },
        );
    }
}
