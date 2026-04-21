import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
    buildAdvisorBrief,
    calculateDiagnosticResult,
    type DiagnosticAnswers,
} from "@/lib/diagnostic";

export const dynamic = "force-dynamic";

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: {
            "Cache-Control": "no-store",
        },
    });
}

function asDiagnosticAnswers(value: unknown): DiagnosticAnswers | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const parsed: Record<number, 1 | 2 | 3 | 4 | 5 | undefined> = {};

    for (const [key, rawValue] of Object.entries(value)) {
        const questionId = Number(key);

        if (!Number.isInteger(questionId)) {
            return null;
        }

        if (
            rawValue === 1 ||
            rawValue === 2 ||
            rawValue === 3 ||
            rawValue === 4 ||
            rawValue === 5
        ) {
            parsed[questionId] = rawValue;
        }
    }

    return parsed as DiagnosticAnswers;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token")?.trim();

        if (!token) {
            return jsonResponse({ ok: false, error: "Token required" }, 400);
        }

        const supabase = createSupabaseAdminClient();

        const { data, error } = await supabase
            .from("diagnostic_submissions")
            .select("answers, company_size, industry, role, email")
            .eq("public_token", token)
            .single();

        if (error || !data) {
            return jsonResponse({ ok: false, error: "Not found" }, 404);
        }

        const answers = asDiagnosticAnswers(data.answers);

        if (!answers) {
            return jsonResponse({ ok: false, error: "Invalid data" }, 500);
        }

        const result = calculateDiagnosticResult(answers);
        const brief = buildAdvisorBrief(result);

        return jsonResponse({
            ok: true,
            result,
            context: {
                companySize: data.company_size ?? null,
                industry: data.industry ?? null,
                role: data.role ?? null,
                emailPresent: Boolean(data.email),
            },
            interpretation: {
                overallAssessment: brief.overallAssessment,
                focusAreas: brief.suggestedFocusAreas,
                whatTypicallyHappensNext: brief.whatTypicallyHappensNext,
            },
        });
    } catch (error) {
        console.error("public-diagnostic-result error", error);
        return jsonResponse(
            { ok: false, error: "Unable to load diagnostic result" },
            500,
        );
    }
}