import { getCloudflareContext } from "@opennextjs/cloudflare";

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

type D1MigrationEnv = CloudflareEnv & {
    D1_SYSTEM_EVENTS_MODE?: string;
};

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
}

function shouldShadowWriteToD1(): boolean {
    try {
        const env = getCloudflareContext().env as D1MigrationEnv;

        return env.D1_SYSTEM_EVENTS_MODE === "shadow";
    } catch {
        return false;
    }
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

    const writes: Promise<void>[] = [logSystemEventToSupabase(event)];

    if (shouldShadowWriteToD1()) {
        writes.push(logSystemEventToD1(event));
    }

    await Promise.all(writes);
}
