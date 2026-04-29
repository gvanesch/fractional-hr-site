import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

type ProspectSource = "linkedin" | "referral" | "website" | "saas" | "other";
type ProspectSegment = "smb" | "mid" | "enterprise";
type RelationshipStrength = "unknown" | "weak" | "medium" | "strong";
type LeadTemperature = "cold" | "warm" | "hot";

const VALID_SOURCES: ProspectSource[] = [
    "linkedin",
    "referral",
    "website",
    "saas",
    "other",
];

const VALID_SEGMENTS: ProspectSegment[] = ["smb", "mid", "enterprise"];

const VALID_RELATIONSHIP_STRENGTHS: RelationshipStrength[] = [
    "unknown",
    "weak",
    "medium",
    "strong",
];

const VALID_LEAD_TEMPERATURES: LeadTemperature[] = ["cold", "warm", "hot"];

function normaliseOptionalText(value: unknown, maxLength = 5000) {
    if (value === undefined || value === null) return null;

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
            name?: string | null;
            company?: string | null;
            role?: string | null;
            source?: string;
            segment?: string | null;
            relationship_strength?: string;
            lead_temperature?: string;
            next_step?: string | null;
            notes?: string | null;
        };

        const name = normaliseOptionalText(body.name, 250);
        const company = normaliseOptionalText(body.company, 250);
        const role = normaliseOptionalText(body.role, 250);
        const nextStep = normaliseOptionalText(body.next_step, 500);
        const notes = normaliseOptionalText(body.notes, 5000);

        const source = body.source || "linkedin";
        const segment = body.segment || null;
        const relationshipStrength = body.relationship_strength || "unknown";
        const leadTemperature = body.lead_temperature || "warm";

        if (!name && !company) {
            return NextResponse.json(
                { success: false, error: "Name or company required" },
                { status: 400 },
            );
        }

        if (!VALID_SOURCES.includes(source as ProspectSource)) {
            return NextResponse.json(
                { success: false, error: "Invalid source" },
                { status: 400 },
            );
        }

        if (segment && !VALID_SEGMENTS.includes(segment as ProspectSegment)) {
            return NextResponse.json(
                { success: false, error: "Invalid segment" },
                { status: 400 },
            );
        }

        if (
            !VALID_RELATIONSHIP_STRENGTHS.includes(
                relationshipStrength as RelationshipStrength,
            )
        ) {
            return NextResponse.json(
                { success: false, error: "Invalid relationship_strength" },
                { status: 400 },
            );
        }

        if (!VALID_LEAD_TEMPERATURES.includes(leadTemperature as LeadTemperature)) {
            return NextResponse.json(
                { success: false, error: "Invalid lead_temperature" },
                { status: 400 },
            );
        }

        const admin = createSupabaseAdminClient();

        const { data, error } = await admin
            .from("advisor_prospects")
            .insert({
                name,
                company,
                role,
                source,
                segment,
                relationship_strength: relationshipStrength,
                lead_temperature: leadTemperature,
                next_step: nextStep,
                notes,
            })
            .select("prospect_id")
            .single();

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                prospect_id: data.prospect_id,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch (error) {
        console.error("advisor-create-prospect error", error);

        const message = error instanceof Error ? error.message : "Unexpected error";
        const status = message.startsWith("Invalid") ? 400 : 500;

        return NextResponse.json(
            { success: false, error: message },
            { status },
        );
    }
}