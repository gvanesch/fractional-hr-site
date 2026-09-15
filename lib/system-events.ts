import { getD1Database } from "./d1/database";
import { createSupabaseAdminClient } from "./supabase/admin";

type SystemEventParams = {
    eventType: string;
    status?: "success" | "error";
    submissionId?: string;
    publicToken?: string;
    source?: string;
    metadata?: Record<string, unknown>;
};

type SystemEventRecord = {
    eventId: string;
    eventType: string;
    status: "success" | "error";
    submissionId: string | null;
    publicToken: string | null;
    source: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
};

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
}

async function logSystemEventToSupabase(
    event: SystemEventRecord,
): Promise<void> {
    try {
        const supabase = createSupabaseAdminClient();

        const { error } = await supabase.from("system_events").insert({
            event_id: event.eventId,
            event_type: event.eventType,
            status: event.status,
            submission_id: event.submissionId,
            public_token: event.publicToken,
            source: event.source,
            metadata: event.metadata,
            created_at: event.createdAt,
        });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error("SYSTEM_EVENT_SUPABASE_LOG_FAILED", {
            eventType: event.eventType,
            error: errorMessage(error),
        });
    }
}

async function logSystemEventToD1(
    event: SystemEventRecord,
): Promise<void> {
    try {
        const result = await getD1Database()
            .prepare(
                `INSERT INTO system_events (
                    event_id,
                    event_type,
                    status,
                    submission_id,
                    public_token,
                    source,
                    metadata,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
                event.eventId,
                event.eventType,
                event.status,
                event.submissionId,
                event.publicToken,
                event.source,
                JSON.stringify(event.metadata),
                event.createdAt,
            )
            .run();

        if (!result.success) {
            throw new Error("D1 system event insert did not succeed.");
        }
    } catch (error) {
        console.error("SYSTEM_EVENT_D1_LOG_FAILED", {
            eventType: event.eventType,
            error: errorMessage(error),
        });
    }
}

export async function logSystemEvent(
    params: SystemEventParams,
): Promise<void> {
    const {
        eventType,
        status = "success",
        submissionId,
        publicToken,
        source,
        metadata = {},
    } = params;

    const event: SystemEventRecord = {
        eventId: crypto.randomUUID(),
        eventType,
        status,
        submissionId: submissionId ?? null,
        publicToken: publicToken ?? null,
        source: source ?? null,
        metadata,
        createdAt: new Date().toISOString(),
    };

    await Promise.all([
        logSystemEventToSupabase(event),
        logSystemEventToD1(event),
    ]);
}
