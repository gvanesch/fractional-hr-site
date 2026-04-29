import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

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
        const { error: updateError } = await admin
            .from("advisor_prospects")
            .update({
                linked_submission_id: submissionId,
                diagnostic_status: "completed",
                updated_at: new Date().toISOString(),
            })
            .eq("prospect_id", prospectId);

        if (updateError) {
            return NextResponse.json(
                { success: false, error: updateError.message },
                { status: 500 },
            );
        }

        // STEP 4: Log activity
        const { error: activityError } = await admin
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
            });

        if (activityError) {
            return NextResponse.json(
                { success: false, error: activityError.message },
                { status: 500 },
            );
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