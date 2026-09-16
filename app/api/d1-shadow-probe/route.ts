import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1MigrationEnv = CloudflareEnv & {
  D1_SYSTEM_EVENTS_MODE?: string;
};

type ProbeRow = {
  event_id: string;
  event_type: string;
  status: string;
  source: string | null;
  metadata: string;
};

const localHostnames = new Set(["127.0.0.1", "localhost", "::1"]);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(request: Request) {
  const hostname = new URL(request.url).hostname;

  if (!localHostnames.has(hostname)) {
    return Response.json({ status: "not_found" }, { status: 404 });
  }

  const env = getCloudflareContext().env as D1MigrationEnv;

  if (env.D1_SYSTEM_EVENTS_MODE !== "shadow") {
    return Response.json({ status: "not_found" }, { status: 404 });
  }

  const eventId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const metadata = JSON.stringify({ probe: true });
  let inserted = false;

  try {
    const insertResult = await env.DB.prepare(
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
        eventId,
        "d1_shadow_probe",
        "success",
        null,
        null,
        "local_qa",
        metadata,
        createdAt,
      )
      .run();

    if (!insertResult.success) {
      throw new Error("D1 probe insert did not succeed.");
    }

    inserted = true;

    const row = await env.DB.prepare(
      `SELECT event_id, event_type, status, source, metadata
       FROM system_events
       WHERE event_id = ?`,
    )
      .bind(eventId)
      .first<ProbeRow>();

    if (
      !row ||
      row.event_id !== eventId ||
      row.event_type !== "d1_shadow_probe" ||
      row.status !== "success" ||
      row.source !== "local_qa" ||
      JSON.parse(row.metadata).probe !== true
    ) {
      throw new Error("D1 probe record did not round-trip correctly.");
    }

    await env.DB.prepare("DELETE FROM system_events WHERE event_id = ?")
      .bind(eventId)
      .run();

    inserted = false;

    return Response.json({
      status: "ok",
      d1: {
        write: "passed",
        read: "passed",
        cleanup: "passed",
      },
    });
  } catch (error) {
    if (inserted) {
      try {
        await env.DB.prepare("DELETE FROM system_events WHERE event_id = ?")
          .bind(eventId)
          .run();
      } catch (cleanupError) {
        console.error("D1_SHADOW_PROBE_CLEANUP_FAILED", {
          eventId,
          error: errorMessage(cleanupError),
        });
      }
    }

    console.error("D1_SHADOW_PROBE_FAILED", {
      eventId,
      error: errorMessage(error),
    });

    return Response.json(
      {
        status: "error",
        message: errorMessage(error),
      },
      { status: 500 },
    );
  }
}
