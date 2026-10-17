import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateAdvisorRequest } from "@/lib/advisor-auth";
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
        const user = await authenticateAdvisorRequest(request);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
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

            const now = new Date().toISOString();
            const statements: D1PreparedStatement[] = [
                database
                    .prepare(
                        `INSERT INTO advisor_prospect_activity (
                            activity_id,
                            prospect_id,
                            linked_submission_id,
                            activity_type,
                            note_type,
                            note,
                            changed_by,
                            created_at
                        ) VALUES (?, ?, ?, 'note_added', ?, ?, ?, ?)`,
                    )
                    .bind(
                        crypto.randomUUID(),
                        prospectId,
                        prospect.linked_submission_id,
                        noteType,
                        note,
                        user.email ?? null,
                        now,
                    ),
            ];

            if (nextActionDate !== undefined || nextStep !== undefined) {
                const assignments = ["updated_at = ?"];
                const bindings: unknown[] = [now];

                if (nextActionDate !== undefined) {
                    assignments.push("next_action_date = ?");
                    bindings.push(nextActionDate);
                }

                if (nextStep !== undefined) {
                    assignments.push("next_step = ?");
                    bindings.push(nextStep);
                }

                bindings.push(prospectId);
                statements.push(
                    database
                        .prepare(
                            `UPDATE advisor_prospects
                            SET ${assignments.join(", ")}
                            WHERE prospect_id = ?`,
                        )
                        .bind(...bindings),
                );
            }

            const results = await database.batch(statements);
            if (
                results.length !== statements.length ||
                results.some(
                    (result) => !result.success || result.meta.changes !== 1,
                )
            ) {
                throw new Error("D1 did not save the prospect note atomically.");
            }

            return NextResponse.json(
                { success: true },
                { headers: { "Cache-Control": "no-store" } },
            );
        }

        const admin = createSupabaseAdminClient();

        const { data: prospect, error: prospectError } = await admin
            .from("advisor_prospects")
            .select(
                "prospect_id,name,company,role,source,segment,diagnostic_status,last_contact_date,next_action_date,observed_signals,notes,linked_submission_id,created_at,updated_at,relationship_strength,deal_stage,lead_temperature,next_step,lost_reason,contact_email,contact_phone,company_website,billing_contact_name,billing_contact_email,linkedin_url",
            )
            .eq("prospect_id", prospectId)
            .single();

        if (prospectError || !prospect) {
            return NextResponse.json(
                { success: false, error: "Prospect not found" },
                { status: 404 },
            );
        }

        const { data: activity, error: insertError } = await admin
            .from("advisor_prospect_activity")
            .insert({
                prospect_id: prospectId,
                linked_submission_id: prospect.linked_submission_id ?? null,
                activity_type: "note_added",
                note_type: noteType,
                note,
                changed_by: user.email ?? null,
            })
            .select(
                "activity_id,prospect_id,linked_submission_id,activity_type,field_name,old_value,new_value,note,changed_by,created_at,note_type",
            )
            .single();

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

        let updatedProspect = prospect;

        if (Object.keys(updatePayload).length > 1) {
            const { data, error: updateError } = await admin
                .from("advisor_prospects")
                .update(updatePayload)
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

            updatedProspect = data;
        }

        if (isD1CrmProspectsShadowWriteEnabled()) {
            try {
                await syncD1AdvisorProspectMutation({
                    prospect: parseD1AdvisorProspectRow(updatedProspect),
                    activities: [
                        parseD1AdvisorProspectActivityRow(activity),
                    ],
                });

                console.log("ADVISOR_ADD_PROSPECT_NOTE_D1_SHADOW_SUCCESS", {
                    prospectId,
                    activityId: activity.activity_id,
                });
            } catch (shadowError) {
                console.error("ADVISOR_ADD_PROSPECT_NOTE_D1_SHADOW_FAILED", {
                    prospectId,
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
