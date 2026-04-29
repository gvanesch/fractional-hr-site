import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

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

        const { error: updateError } = await admin
            .from("advisor_prospects")
            .update({
                linked_submission_id: null,
                diagnostic_status: "in_conversation",
                updated_at: new Date().toISOString(),
            })
            .eq("prospect_id", prospectId);

        if (updateError) {
            return NextResponse.json(
                { success: false, error: updateError.message },
                { status: 500 },
            );
        }

        const { error: activityError } = await admin
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
        console.error("advisor-unlink-health-check-prospect error", error);

        return NextResponse.json(
            { success: false, error: "Unexpected error" },
            { status: 500 },
        );
    }
}