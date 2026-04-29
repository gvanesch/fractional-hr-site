import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

type ProspectSource = "linkedin" | "referral" | "website" | "saas" | "other";
type ProspectSegment = "smb" | "mid" | "enterprise" | null;
type RelationshipStrength = "unknown" | "weak" | "medium" | "strong";
type LeadTemperature = "cold" | "warm" | "hot";
type DiagnosticStatus = "not_invited" | "invited" | "started" | "completed";

type DealStage =
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

type ProspectRow = {
    prospect_id: string;
    name: string | null;
    company: string | null;
    role: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    company_website: string | null;
    billing_contact_name: string | null;
    billing_contact_email: string | null;
    linkedin_url: string | null;
    source: ProspectSource;
    segment: ProspectSegment;
    diagnostic_status: DiagnosticStatus;
    deal_stage: DealStage;
    relationship_strength: RelationshipStrength;
    lead_temperature: LeadTemperature;
    last_contact_date: string | null;
    next_action_date: string | null;
    next_step: string | null;
    lost_reason: string | null;
    linked_submission_id: string | null;
};

const VALID_SOURCES: ProspectSource[] = [
    "linkedin",
    "referral",
    "website",
    "saas",
    "other",
];

const VALID_SEGMENTS = ["smb", "mid", "enterprise"];

const VALID_DIAGNOSTIC_STATUSES: DiagnosticStatus[] = [
    "not_invited",
    "invited",
    "started",
    "completed",
];

const VALID_DEAL_STAGES: DealStage[] = [
    "new",
    "contacted",
    "replied",
    "meeting_booked",
    "in_conversation",
    "diagnostic_assessment_candidate",
    "proposal_discussed",
    "converted",
    "lost",
    "nurture",
];

const VALID_RELATIONSHIP_STRENGTHS: RelationshipStrength[] = [
    "unknown",
    "weak",
    "medium",
    "strong",
];

const VALID_LEAD_TEMPERATURES: LeadTemperature[] = ["cold", "warm", "hot"];

function normaliseOptionalText(value: unknown, maxLength = 5000) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    if (typeof value !== "string") {
        throw new Error("Invalid text value");
    }

    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, maxLength) : null;
}

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

function comparableValue(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    return String(value);
}

function valueToDisplay(value: unknown): string {
    if (value === null || value === undefined || value === "") return "Empty";
    return String(value);
}

function formatFieldLabel(field: keyof ProspectRow): string {
    switch (field) {
        case "name":
            return "Name";
        case "company":
            return "Company";
        case "role":
            return "Role";
        case "contact_email":
            return "Contact email";
        case "contact_phone":
            return "Contact phone";
        case "company_website":
            return "Company website";
        case "billing_contact_name":
            return "Billing contact name";
        case "billing_contact_email":
            return "Billing contact email";
        case "linkedin_url":
            return "LinkedIn/profile URL";
        case "source":
            return "Source";
        case "segment":
            return "Segment";
        case "diagnostic_status":
            return "Health Check status";
        case "deal_stage":
            return "Deal stage";
        case "relationship_strength":
            return "Relationship";
        case "lead_temperature":
            return "Lead temperature";
        case "last_contact_date":
            return "Last contact date";
        case "next_action_date":
            return "Next action date";
        case "next_step":
            return "Next step";
        case "lost_reason":
            return "Lost reason";
        case "linked_submission_id":
            return "Linked Health Check";
        case "prospect_id":
            return "Prospect ID";
    }
}

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
            name?: string | null;
            company?: string | null;
            role?: string | null;
            contact_email?: string | null;
            contact_phone?: string | null;
            company_website?: string | null;
            billing_contact_name?: string | null;
            billing_contact_email?: string | null;
            linkedin_url?: string | null;
            source?: string;
            segment?: string | null;
            diagnostic_status?: string;
            deal_stage?: string;
            relationship_strength?: string;
            lead_temperature?: string;
            last_contact_date?: string | null;
            next_action_date?: string | null;
            next_step?: string | null;
            lost_reason?: string | null;
            linked_submission_id?: string | null;
        };

        const prospectId = body.prospect_id?.trim();

        if (!prospectId) {
            return NextResponse.json(
                { success: false, error: "Missing prospect_id" },
                { status: 400 },
            );
        }

        if ("linked_submission_id" in body) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Use the dedicated link or unlink flow to modify Health Check associations.",
                },
                { status: 400 },
            );
        }

        if (body.source && !VALID_SOURCES.includes(body.source as ProspectSource)) {
            return NextResponse.json(
                { success: false, error: "Invalid source" },
                { status: 400 },
            );
        }

        if (body.segment && !VALID_SEGMENTS.includes(body.segment)) {
            return NextResponse.json(
                { success: false, error: "Invalid segment" },
                { status: 400 },
            );
        }

        if (
            body.diagnostic_status &&
            !VALID_DIAGNOSTIC_STATUSES.includes(
                body.diagnostic_status as DiagnosticStatus,
            )
        ) {
            return NextResponse.json(
                { success: false, error: "Invalid diagnostic_status" },
                { status: 400 },
            );
        }

        if (
            body.deal_stage &&
            !VALID_DEAL_STAGES.includes(body.deal_stage as DealStage)
        ) {
            return NextResponse.json(
                { success: false, error: "Invalid deal_stage" },
                { status: 400 },
            );
        }

        if (
            body.relationship_strength &&
            !VALID_RELATIONSHIP_STRENGTHS.includes(
                body.relationship_strength as RelationshipStrength,
            )
        ) {
            return NextResponse.json(
                { success: false, error: "Invalid relationship_strength" },
                { status: 400 },
            );
        }

        if (
            body.lead_temperature &&
            !VALID_LEAD_TEMPERATURES.includes(
                body.lead_temperature as LeadTemperature,
            )
        ) {
            return NextResponse.json(
                { success: false, error: "Invalid lead_temperature" },
                { status: 400 },
            );
        }

        const nextValues: Partial<ProspectRow> = {
            name: normaliseOptionalText(body.name, 250),
            company: normaliseOptionalText(body.company, 250),
            role: normaliseOptionalText(body.role, 250),
            contact_email: normaliseOptionalText(body.contact_email, 320),
            contact_phone: normaliseOptionalText(body.contact_phone, 80),
            company_website: normaliseOptionalText(body.company_website, 500),
            billing_contact_name: normaliseOptionalText(
                body.billing_contact_name,
                250,
            ),
            billing_contact_email: normaliseOptionalText(
                body.billing_contact_email,
                320,
            ),
            linkedin_url: normaliseOptionalText(body.linkedin_url, 500),
            source: body.source as ProspectSource | undefined,
            segment:
                body.segment === ""
                    ? null
                    : (body.segment as ProspectSegment | undefined),
            diagnostic_status: body.diagnostic_status as DiagnosticStatus | undefined,
            deal_stage: body.deal_stage as DealStage | undefined,
            relationship_strength: body.relationship_strength as
                | RelationshipStrength
                | undefined,
            lead_temperature: body.lead_temperature as LeadTemperature | undefined,
            last_contact_date: normaliseOptionalDate(
                body.last_contact_date,
                "last_contact_date",
            ),
            next_action_date: normaliseOptionalDate(
                body.next_action_date,
                "next_action_date",
            ),
            next_step: normaliseOptionalText(body.next_step, 500),
            lost_reason: normaliseOptionalText(body.lost_reason, 1000),
        };

        const admin = createSupabaseAdminClient();

        const { data: currentRow, error: currentError } = await admin
            .from("advisor_prospects")
            .select(
                `
          prospect_id,
          name,
          company,
          role,
          contact_email,
          contact_phone,
          company_website,
          billing_contact_name,
          billing_contact_email,
          linkedin_url,
          source,
          segment,
          diagnostic_status,
          deal_stage,
          relationship_strength,
          lead_temperature,
          last_contact_date,
          next_action_date,
          next_step,
          lost_reason,
          linked_submission_id
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

        const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const changes: Array<{
            field: keyof ProspectRow;
            oldValue: unknown;
            newValue: unknown;
        }> = [];

        const trackedFields: Array<keyof ProspectRow> = [
            "name",
            "company",
            "role",
            "contact_email",
            "contact_phone",
            "company_website",
            "billing_contact_name",
            "billing_contact_email",
            "linkedin_url",
            "source",
            "segment",
            "diagnostic_status",
            "deal_stage",
            "relationship_strength",
            "lead_temperature",
            "last_contact_date",
            "next_action_date",
            "next_step",
            "lost_reason",
        ];

        for (const field of trackedFields) {
            const nextValue = nextValues[field];

            if (nextValue === undefined) continue;

            const oldValue = current[field];

            if (comparableValue(oldValue) === comparableValue(nextValue)) continue;

            updatePayload[field] = nextValue;
            changes.push({
                field,
                oldValue,
                newValue: nextValue,
            });
        }

        if (changes.length === 0) {
            return NextResponse.json({
                success: true,
                loggedActivityCount: 0,
            });
        }

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

        const groupedChangeNote = changes
            .map(
                (change) =>
                    `${formatFieldLabel(change.field)}: ${valueToDisplay(
                        change.oldValue,
                    )} → ${valueToDisplay(change.newValue)}`,
            )
            .join("\n");

        const { error: activityError } = await admin
            .from("advisor_prospect_activity")
            .insert({
                prospect_id: prospectId,
                linked_submission_id: current.linked_submission_id,
                activity_type: "crm_record_updated",
                field_name: "multiple_fields",
                old_value: null,
                new_value: null,
                note: groupedChangeNote,
                changed_by: user.email ?? null,
            });

        if (activityError) {
            return NextResponse.json(
                { success: false, error: activityError.message },
                { status: 500 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                loggedActivityCount: 1,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch (error) {
        console.error("advisor-update-prospect error", error);

        const message = error instanceof Error ? error.message : "Unexpected error";
        const status = message.startsWith("Invalid") ? 400 : 500;

        return NextResponse.json({ success: false, error: message }, { status });
    }
}