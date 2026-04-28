import { createSupabaseAdminClient } from "./supabase/admin";

type SystemEventParams = {
    eventType: string;
    status?: "success" | "error";
    submissionId?: string;
    publicToken?: string;
    source?: string;
    metadata?: Record<string, unknown>;
};

export async function logSystemEvent(params: SystemEventParams) {
    const supabase = createSupabaseAdminClient();

    const {
        eventType,
        status = "success",
        submissionId,
        publicToken,
        source,
        metadata = {},
    } = params;

    const { error } = await supabase.from("system_events").insert({
        event_type: eventType,
        status,
        submission_id: submissionId ?? null,
        public_token: publicToken ?? null,
        source: source ?? null,
        metadata,
    });

    if (error) {
        // Do NOT throw. Logging must never break the main flow.
        console.error("SYSTEM_EVENT_LOG_FAILED", {
            eventType,
            error: error.message,
        });
    }
}