import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

type NoteType = "call" | "meeting" | "email" | "linkedin" | "internal";

const VALID_NOTE_TYPES: NoteType[] = [
    "call",
    "meeting",
    "email",
    "linkedin",
    "internal",
];

function normaliseOptionalDate(value: unknown, fieldName: string) {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;

    if (typeof value !== "string") {
        throw new Error(`Invalid ${fieldName}`);
    }

    const trimmed = value.trim();

    if (!trimmed) return null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return trimmed;
}

function normaliseOptionalText(value: unknown, maxLength = 500) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    if (typeof value !== "string") {
        throw new Error("Invalid text value");
    }

    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
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
            note?: string;
            note_type?: string;
            next_action_date?: string | null;
            next_step?: string | null;
        };

        const prospectId = body.prospect_id?.trim();
        const note = body.note?.trim();
        const noteType = body.note_type || "internal";
        const nextActionDate = normaliseOptionalDate(
            body.next_action_date,
            "next_action_date",
        );
        const nextStep = normaliseOptionalText(body.next_step, 500);

        if (!prospectId || !note) {
            return NextResponse.json(
                { success: false, error: "Missing prospect_id or note" },
                { status: 400 },
            );
        }

        if (!VALID_NOTE_TYPES.includes(noteType as NoteType)) {
            return NextResponse.json(
                { success: false, error: "Invalid note_type" },
                { status: 400 },
            );
        }

        const admin = createSupabaseAdminClient();

        const { data: prospect, error: prospectError } = await admin
            .from("advisor_prospects")
            .select("linked_submission_id")
            .eq("prospect_id", prospectId)
            .single();

        if (prospectError || !prospect) {
            return NextResponse.json(
                { success: false, error: "Prospect not found" },
                { status: 404 },
            );
        }

        const { error: insertError } = await admin
            .from("advisor_prospect_activity")
            .insert({
                prospect_id: prospectId,
                linked_submission_id: prospect.linked_submission_id ?? null,
                activity_type: "note_added",
                note_type: noteType,
                note,
                changed_by: user.email ?? null,
            });

        if (insertError) {
            return NextResponse.json(
                { success: false, error: insertError.message },
                { status: 500 },
            );
        }

        const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (nextActionDate !== undefined) {
            updatePayload.next_action_date = nextActionDate;
        }

        if (nextStep !== undefined) {
            updatePayload.next_step = nextStep;
        }

        if (Object.keys(updatePayload).length > 1) {
            const { error: updateError } = await admin
                .from("advisor_prospects")
                .update(updatePayload)
                .eq("prospect_id", prospectId);

            if (updateError) {
                return NextResponse.json(
                    { success: false, error: updateError.message },
                    { status: 500 },
                );
            }
        }

        return NextResponse.json(
            { success: true },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        const status = message.startsWith("Invalid") ? 400 : 500;

        return NextResponse.json(
            { success: false, error: message },
            { status },
        );
    }
}