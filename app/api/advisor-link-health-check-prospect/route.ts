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

        const userEmail = user.email;

        if (!isAllowedAdvisorEmail(userEmail)) {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 },
            );
        }

        const body = (await request.json()) as {
            prospect_id?: string;
            submission_id?: string;
        };

        const prospectId = body.prospect_id?.trim();
        const submissionId = body.submission_id?.trim();

        if (!prospectId || !submissionId) {
            return NextResponse.json(
                { success: false, error: "Missing prospect_id or submission_id" },
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

            if (
                prospect.linked_submission_id &&
                prospect.linked_submission_id !== submissionId
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "This prospect is already linked to a different Health Check. Unlink it first before linking a new one.",
                    },
                    { status: 400 },
                );
            }

            if (prospect.linked_submission_id === submissionId) {
                return NextResponse.json({ success: true, alreadyLinked: true });
            }

            const now = new Date().toISOString();
            const results = await database.batch([
                database
                    .prepare(
                        `UPDATE advisor_prospects
                        SET linked_submission_id = ?,
                            diagnostic_status = 'completed',
                            updated_at = ?
                        WHERE prospect_id = ? AND linked_submission_id IS NULL`,
                    )
                    .bind(submissionId, now, prospectId),
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
                            changed_by,
                            created_at
                        ) VALUES (?, ?, ?, 'health_check_linked', 'linked_submission_id', NULL, ?, ?, ?)`,
                    )
                    .bind(
                        crypto.randomUUID(),
                        prospectId,
                        submissionId,
                        submissionId,
                        userEmail,
                        now,
                    ),
            ]);

            if (
                results.length !== 2 ||
                results.some(
                    (result) => !result.success || result.meta.changes !== 1,
                )
            ) {
                throw new Error("D1 did not link the Health Check atomically.");
            }

            return NextResponse.json(
                { success: true },
                { headers: { "Cache-Control": "no-store" } },
            );
        }

        const admin = createSupabaseAdminClient();

        // STEP 1: Load current prospect
        const { data: prospect, error: fetchError } = await admin
            .from("advisor_prospects")
            .select(
                `
        prospect_id,
        linked_submission_id,
        diagnostic_status
      `,
            )
            .eq("prospect_id", prospectId)
            .single();

        if (fetchError || !prospect) {
            return NextResponse.json(
                { success: false, error: "Prospect not found" },
                { status: 404 },
            );
        }

        // STEP 2: Enforce single link rule
        if (
            prospect.linked_submission_id &&
            prospect.linked_submission_id !== submissionId
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "This prospect is already linked to a different Health Check. Unlink it first before linking a new one.",
                },
                { status: 400 },
            );
        }

        // If already linked to same submission, treat as success (idempotent)
        if (prospect.linked_submission_id === submissionId) {
            return NextResponse.json({
                success: true,
                alreadyLinked: true,
            });
        }

        // STEP 3: Update prospect
        const { data: updatedProspect, error: updateError } = await admin
            .from("advisor_prospects")
            .update({
                linked_submission_id: submissionId,
                diagnostic_status: "completed",
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

        // STEP 4: Log activity
        const { data: activity, error: activityError } = await admin
            .from("advisor_prospect_activity")
            .insert({
                prospect_id: prospectId,
                linked_submission_id: submissionId,
                activity_type: "health_check_linked",
                field_name: "linked_submission_id",
                old_value: prospect.linked_submission_id,
                new_value: submissionId,
                note: null,
                changed_by: userEmail,
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

                console.log("ADVISOR_LINK_HEALTH_CHECK_D1_SHADOW_SUCCESS", {
                    prospectId,
                    submissionId,
                    activityId: activity.activity_id,
                });
            } catch (shadowError) {
                console.error("ADVISOR_LINK_HEALTH_CHECK_D1_SHADOW_FAILED", {
                    prospectId,
                    submissionId,
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
        console.error("advisor-link-health-check-prospect error", error);

        return NextResponse.json(
            { success: false, error: "Unexpected error" },
            { status: 500 },
        );
    }
}
