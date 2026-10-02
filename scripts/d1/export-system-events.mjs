import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";

const EXPECTED_ROW_COUNT = 33;
const EXPECTED_STATUS_COUNTS = {
  success: 33,
  error: 0,
};
const OUTPUT_PATH = "/tmp/vanesch-d1-system-events-backfill.sql";
const D1_QUERY_OUTPUT_PATH =
  "/tmp/vanesch-d1-system-events-query-output.txt";
const BACKFILL_ENV_PATH = ".env.backfill.local";
const EXPECTED_SUPABASE_HOST = "qxddddhhpfrrxbaunwfw.supabase.co";

const COLUMNS = [
  "event_id",
  "event_type",
  "status",
  "submission_id",
  "public_token",
  "source",
  "metadata",
  "created_at",
];

const JSON_COLUMNS = new Set(["metadata"]);
const ALLOWED_STATUSES = new Set(["success", "error"]);

function parseEnvLine(line) {
  const match = line.match(
    /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/,
  );

  if (!match) {
    return null;
  }

  const [, key, rawValue] = match;
  let value = rawValue.trim();

  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    const quote = value[0];
    value = value.slice(1, -1);

    if (quote === '"') {
      value = value
        .replaceAll("\\n", "\n")
        .replaceAll("\\r", "\r")
        .replaceAll("\\t", "\t")
        .replaceAll('\\"', '"')
        .replaceAll("\\\\", "\\");
    }
  } else {
    const commentIndex = value.indexOf(" #");

    if (commentIndex >= 0) {
      value = value.slice(0, commentIndex).trimEnd();
    }
  }

  return { key, value };
}

async function loadBackfillEnvironment() {
  let envContents;

  try {
    envContents = await readFile(BACKFILL_ENV_PATH, "utf8");
  } catch {
    throw new Error(`Unable to read ${BACKFILL_ENV_PATH}.`);
  }

  for (const line of envContents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const parsed = parseEnvLine(line);

    if (parsed && process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }
}

function getRequiredEnvironmentVariable(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing ${name} in ${BACKFILL_ENV_PATH}.`,
    );
  }

  return value;
}

function sqlText(value) {
  return `'${value.replaceAll("\u0000", "").replaceAll("'", "''")}'`;
}

function sqlValue(column, value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (JSON_COLUMNS.has(column)) {
    const serialized = JSON.stringify(value);

    if (typeof serialized !== "string") {
      throw new Error(`Unable to serialize ${column}.`);
    }

    return sqlText(serialized);
  }

  if (typeof value !== "string") {
    throw new Error(`Expected text for ${column}.`);
  }

  return sqlText(value);
}

function validateRows(rows) {
  if (!Array.isArray(rows)) {
    throw new Error("Supabase did not return an array.");
  }

  if (rows.length !== EXPECTED_ROW_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_ROW_COUNT} Supabase rows but found ${rows.length}. Stop and re-audit before backfilling.`,
    );
  }

  const eventIds = new Set();
  const statusCounts = {
    success: 0,
    error: 0,
  };

  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error("Supabase returned an invalid row.");
    }

    for (const column of [
      "event_id",
      "event_type",
      "status",
      "created_at",
    ]) {
      if (typeof row[column] !== "string" || !row[column]) {
        throw new Error(
          `A Supabase system event is missing ${column}.`,
        );
      }
    }

    if (
      row.metadata === null ||
      typeof row.metadata !== "object" ||
      Array.isArray(row.metadata)
    ) {
      throw new Error(
        "A Supabase system event has invalid metadata.",
      );
    }

    if (eventIds.has(row.event_id)) {
      throw new Error(
        "Duplicate event_id detected in the Supabase export.",
      );
    }

    eventIds.add(row.event_id);

    if (!ALLOWED_STATUSES.has(row.status)) {
      throw new Error(
        "Unexpected system event status detected.",
      );
    }

    statusCounts[row.status] += 1;
  }

  for (const [status, expectedCount] of Object.entries(
    EXPECTED_STATUS_COUNTS,
  )) {
    if (statusCounts[status] !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} ${status} events but found ${statusCounts[status]}. Stop and re-audit before backfilling.`,
      );
    }
  }

  return statusCounts;
}

function buildSql(rows) {
  const columnList = COLUMNS.join(",\n  ");
  const statements = rows.map((row) => {
    const values = COLUMNS.map((column) =>
      sqlValue(column, row[column]),
    ).join(",\n  ");

    return `INSERT INTO system_events (
  ${columnList}
) VALUES (
  ${values}
);`;
  });

  return `-- One-time system_events backfill.
-- Contains live service data. Do not commit or retain this file.
-- Generated from Supabase for direct import into production D1.

${statements.join("\n\n")}
`;
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }

  return value;
}

function normalizeRow(row, sourceName) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    throw new Error(`${sourceName} returned an invalid row.`);
  }

  return Object.fromEntries(
    COLUMNS.map((column) => {
      if (!Object.hasOwn(row, column)) {
        throw new Error(
          `${sourceName} row is missing the ${column} column.`,
        );
      }

      let value = row[column];

      if (
        JSON_COLUMNS.has(column) &&
        typeof value === "string"
      ) {
        try {
          value = JSON.parse(value);
        } catch {
          throw new Error(
            `${sourceName} returned invalid JSON in ${column}.`,
          );
        }
      }

      return [column, canonicalize(value)];
    }),
  );
}

function normalizeAndHashRows(rows, sourceName) {
  const normalizedRows = rows
    .map((row) => normalizeRow(row, sourceName))
    .sort((left, right) =>
      left.event_id.localeCompare(right.event_id),
    );
  const serialized = JSON.stringify(normalizedRows);
  const hash = createHash("sha256").update(serialized).digest("hex");

  return { normalizedRows, hash };
}

function extractD1Rows(output) {
  const cleaned = output.replace(/\u001b\[[0-9;]*m/g, "");
  const preferredMarker = '[\n  {\n    "results"';
  const preferredStart = cleaned.indexOf(preferredMarker);
  const fallbackStart = cleaned.lastIndexOf("\n[");
  const start =
    preferredStart >= 0
      ? preferredStart
      : fallbackStart >= 0
        ? fallbackStart + 1
        : -1;
  const end = cleaned.lastIndexOf("]");

  if (start < 0 || end < start) {
    throw new Error(
      "Unable to find the Wrangler JSON result in the protected D1 output.",
    );
  }

  let parsed;

  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error(
      "Unable to parse the Wrangler JSON result from the protected D1 output.",
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Wrangler did not return an array.");
  }

  return parsed.flatMap((entry) =>
    Array.isArray(entry?.results) ? entry.results : [],
  );
}

function compareRows(sourceRows, d1Rows) {
  const source = normalizeAndHashRows(sourceRows, "Supabase");
  const d1 = normalizeAndHashRows(d1Rows, "D1");
  const sourceByEventId = new Map(
    source.normalizedRows.map((row) => [
      row.event_id,
      JSON.stringify(row),
    ]),
  );
  const d1ByEventId = new Map(
    d1.normalizedRows.map((row) => [
      row.event_id,
      JSON.stringify(row),
    ]),
  );

  let exactMatchRows = 0;
  let missingRows = 0;
  let mismatchedRows = 0;

  for (const [eventId, sourceRow] of sourceByEventId) {
    const d1Row = d1ByEventId.get(eventId);

    if (d1Row === undefined) {
      missingRows += 1;
    } else if (d1Row === sourceRow) {
      exactMatchRows += 1;
    } else {
      mismatchedRows += 1;
    }
  }

  let unexpectedRows = 0;

  for (const eventId of d1ByEventId.keys()) {
    if (!sourceByEventId.has(eventId)) {
      unexpectedRows += 1;
    }
  }

  const passed =
    source.normalizedRows.length === EXPECTED_ROW_COUNT &&
    d1.normalizedRows.length === EXPECTED_ROW_COUNT &&
    exactMatchRows === EXPECTED_ROW_COUNT &&
    missingRows === 0 &&
    mismatchedRows === 0 &&
    unexpectedRows === 0 &&
    source.hash === d1.hash;

  return {
    passed,
    sourceRows: source.normalizedRows.length,
    d1Rows: d1.normalizedRows.length,
    exactMatchRows,
    missingRows,
    mismatchedRows,
    unexpectedRows,
    sourceHash: source.hash,
    d1Hash: d1.hash,
    hashMatch: source.hash === d1.hash,
  };
}

async function fetchRows() {
  const supabaseUrl = getRequiredEnvironmentVariable(
    "BACKFILL_SUPABASE_URL",
  );
  const serviceRoleKey = getRequiredEnvironmentVariable(
    "BACKFILL_SUPABASE_SERVICE_ROLE_KEY",
  );
  const parsedSupabaseUrl = new URL(supabaseUrl);

  if (parsedSupabaseUrl.hostname !== EXPECTED_SUPABASE_HOST) {
    throw new Error(
      `Backfill project mismatch. Expected ${EXPECTED_SUPABASE_HOST} but found ${parsedSupabaseUrl.hostname}.`,
    );
  }

  const endpoint = new URL("/rest/v1/system_events", parsedSupabaseUrl);

  endpoint.searchParams.set("select", COLUMNS.join(","));
  endpoint.searchParams.set("order", "created_at.asc");

  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Supabase export request failed with HTTP ${response.status}.`,
    );
  }

  return response.json();
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const allowedArgs = new Set([
    "--check",
    "--write",
    "--compare-d1-output",
  ]);

  for (const arg of args) {
    if (!allowedArgs.has(arg)) {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (args.size > 1) {
    throw new Error("Use only one mode at a time.");
  }

  await loadBackfillEnvironment();

  const rows = await fetchRows();
  const statusCounts = validateRows(rows);

  if (args.has("--compare-d1-output")) {
    let d1Output;

    try {
      d1Output = await readFile(D1_QUERY_OUTPUT_PATH, "utf8");
    } catch {
      throw new Error(
        `Unable to read ${D1_QUERY_OUTPUT_PATH}.`,
      );
    }

    const d1Rows = extractD1Rows(d1Output);
    const comparison = compareRows(rows, d1Rows);

    console.log(
      JSON.stringify({
        status: comparison.passed ? "ok" : "error",
        mode: "compare-d1-output",
        ...comparison,
      }),
    );

    if (!comparison.passed) {
      process.exitCode = 1;
    }

    return;
  }

  if (args.has("--write")) {
    const sql = buildSql(rows);

    await writeFile(OUTPUT_PATH, sql, {
      encoding: "utf8",
      mode: 0o600,
    });
    await chmod(OUTPUT_PATH, 0o600);

    console.log(
      JSON.stringify({
        status: "ok",
        mode: "write",
        rows: rows.length,
        statuses: statusCounts,
        outputWritten: true,
        outputPath: OUTPUT_PATH,
        permissions: "0600",
      }),
    );
    return;
  }

  console.log(
    JSON.stringify({
      status: "ok",
      mode: "check",
      rows: rows.length,
      statuses: statusCounts,
      outputWritten: false,
    }),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    }),
  );
  process.exitCode = 1;
});
