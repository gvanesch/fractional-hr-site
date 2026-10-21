import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";

const EXPECTED_ROW_COUNT = 3;
const EXPECTED_SOURCE_COUNTS = {
  "health-check": 2,
  "website-contact": 1,
};
const OUTPUT_PATH = "/tmp/vanesch-d1-diagnostic-backfill.sql";
const VERIFY_OUTPUT_PATH = "/tmp/vanesch-d1-diagnostic-verify.sql";
const D1_QUERY_OUTPUT_PATH =
  "/tmp/vanesch-d1-diagnostic-query-output.txt";
const BACKFILL_ENV_PATH = ".env.backfill.local";
const EXPECTED_SUPABASE_HOST = "qxddddhhpfrrxbaunwfw.supabase.co";

const COLUMNS = [
  "id",
  "created_at",
  "company_size",
  "industry",
  "role",
  "country_region",
  "email",
  "score",
  "band",
  "process_clarity_score",
  "consistency_score",
  "service_access_score",
  "ownership_score",
  "onboarding_score",
  "technology_alignment_score",
  "knowledge_self_service_score",
  "operational_capacity_score",
  "data_handoffs_score",
  "change_resilience_score",
  "answers",
  "abuse_token",
  "submission_id",
  "contact_name",
  "contact_email",
  "contact_company",
  "contact_topic",
  "contact_message",
  "contact_source",
  "advisor_brief",
  "contact_submitted_at",
  "status",
  "last_contacted_at",
  "notes",
  "completed_at",
  "submission_source",
  "completion_version",
  "public_token",
];

const JSON_COLUMNS = new Set(["answers", "advisor_brief"]);
const INTEGER_COLUMNS = new Set([
  "score",
  "process_clarity_score",
  "consistency_score",
  "service_access_score",
  "ownership_score",
  "onboarding_score",
  "technology_alignment_score",
  "knowledge_self_service_score",
  "operational_capacity_score",
  "data_handoffs_score",
  "change_resilience_score",
]);
const ALLOWED_STATUSES = new Set([
  "new",
  "contacted",
  "booked",
  "closed",
  "archived",
]);

function parseEnvLine(line) {
  const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);

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
    throw new Error(`Missing ${name} in ${BACKFILL_ENV_PATH}.`);
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

  if (INTEGER_COLUMNS.has(column)) {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw new Error(`Expected an integer for ${column}.`);
    }

    return String(value);
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

  const ids = new Set();
  const submissionIds = new Set();
  const publicTokens = new Set();
  const sourceCounts = {
    "health-check": 0,
    "website-contact": 0,
  };

  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error("Supabase returned an invalid row.");
    }

    if (typeof row.id !== "string" || !row.id) {
      throw new Error("A Supabase row is missing its id.");
    }

    if (typeof row.created_at !== "string" || !row.created_at) {
      throw new Error("A Supabase row is missing its created_at value.");
    }

    if (typeof row.submission_id !== "string" || !row.submission_id) {
      throw new Error("A Supabase row is missing its submission_id.");
    }

    if (ids.has(row.id)) {
      throw new Error("Duplicate id detected in the Supabase export.");
    }

    if (submissionIds.has(row.submission_id)) {
      throw new Error(
        "Duplicate submission_id detected in the Supabase export.",
      );
    }

    ids.add(row.id);
    submissionIds.add(row.submission_id);

    if (row.public_token !== null) {
      if (
        typeof row.public_token !== "string" ||
        !row.public_token ||
        publicTokens.has(row.public_token)
      ) {
        throw new Error("Invalid or duplicate public_token detected.");
      }

      publicTokens.add(row.public_token);
    }

    if (!ALLOWED_STATUSES.has(row.status)) {
      throw new Error("Unexpected diagnostic submission status detected.");
    }

    if (row.submission_source in sourceCounts) {
      sourceCounts[row.submission_source] += 1;
    } else {
      throw new Error("Unexpected submission_source detected.");
    }
  }

  for (const [source, expectedCount] of Object.entries(
    EXPECTED_SOURCE_COUNTS,
  )) {
    if (sourceCounts[source] !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} ${source} rows but found ${sourceCounts[source]}. Stop and re-audit before backfilling.`,
      );
    }
  }

  return sourceCounts;
}

function buildSql(rows) {
  const columnList = COLUMNS.join(",\n  ");
  const statements = rows.map((row) => {
    const values = COLUMNS.map((column) =>
      sqlValue(column, row[column]),
    ).join(",\n  ");

    return `INSERT INTO diagnostic_submissions (
  ${columnList}
) VALUES (
  ${values}
);`;
  });

  return `-- One-time diagnostic_submissions backfill.
-- Contains live personal data. Do not commit or retain this file.
-- Generated from Supabase for direct import into production D1.

${statements.join("\n\n")}
`;
}

function buildVerificationSql(rows) {
  const expectedColumns = COLUMNS.join(",\n    ");
  const expectedValues = rows
    .map((row) => {
      const values = COLUMNS.map((column) =>
        sqlValue(column, row[column]),
      ).join(",\n      ");

      return `(
      ${values}
    )`;
    })
    .join(",\n    ");

  const comparisons = COLUMNS.filter(
    (column) => column !== "submission_id",
  ).map((column) => {
    if (JSON_COLUMNS.has(column)) {
      return `(
          (d.${column} IS NULL AND e.${column} IS NULL)
          OR (
            d.${column} IS NOT NULL
            AND e.${column} IS NOT NULL
            AND json(d.${column}) = json(e.${column})
          )
        )`;
    }

    return `d.${column} IS e.${column}`;
  });

  return `-- One-time diagnostic_submissions parity verification.
-- Contains live personal data in expected values. Do not commit or retain.
-- Query output contains counts only.

WITH expected (
    ${expectedColumns}
  ) AS (
    VALUES
    ${expectedValues}
  ),
  comparison AS (
    SELECT
      CASE
        WHEN d.submission_id IS NOT NULL THEN 1
        ELSE 0
      END AS present,
      CASE
        WHEN
          d.submission_id IS NOT NULL
          AND ${comparisons.join("\n          AND ")}
        THEN 1
        ELSE 0
      END AS exact_match
    FROM expected AS e
    LEFT JOIN diagnostic_submissions AS d
      ON d.submission_id = e.submission_id
  )
SELECT
  (SELECT COUNT(*) FROM diagnostic_submissions) AS d1_total_rows,
  COUNT(*) AS expected_rows,
  COALESCE(SUM(present), 0) AS present_rows,
  COALESCE(SUM(exact_match), 0) AS exact_match_rows,
  COALESCE(
    SUM(
      CASE
        WHEN present = 1 AND exact_match = 0 THEN 1
        ELSE 0
      END
    ),
    0
  ) AS mismatched_rows,
  (
    SELECT COUNT(*)
    FROM diagnostic_submissions AS d
    WHERE NOT EXISTS (
      SELECT 1
      FROM expected AS e
      WHERE e.submission_id = d.submission_id
    )
  ) AS unexpected_rows
FROM comparison;

PRAGMA quick_check;
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
      left.submission_id.localeCompare(right.submission_id),
    );
  const serialized = JSON.stringify(normalizedRows);
  const hash = createHash("sha256").update(serialized).digest("hex");

  return { normalizedRows, hash };
}

function extractD1Rows(output) {
  const cleaned = output.replace(
    /\u001b\[[0-9;]*m/g,
    "",
  );
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

  const rows = parsed.flatMap((entry) =>
    Array.isArray(entry?.results) ? entry.results : [],
  );

  return rows;
}

function compareRows(sourceRows, d1Rows) {
  const source = normalizeAndHashRows(sourceRows, "Supabase");
  const d1 = normalizeAndHashRows(d1Rows, "D1");
  const sourceBySubmissionId = new Map(
    source.normalizedRows.map((row) => [
      row.submission_id,
      JSON.stringify(row),
    ]),
  );
  const d1BySubmissionId = new Map(
    d1.normalizedRows.map((row) => [
      row.submission_id,
      JSON.stringify(row),
    ]),
  );

  let exactMatchRows = 0;
  let missingRows = 0;
  let mismatchedRows = 0;

  for (const [submissionId, sourceRow] of sourceBySubmissionId) {
    const d1Row = d1BySubmissionId.get(submissionId);

    if (d1Row === undefined) {
      missingRows += 1;
    } else if (d1Row === sourceRow) {
      exactMatchRows += 1;
    } else {
      mismatchedRows += 1;
    }
  }

  let unexpectedRows = 0;

  for (const submissionId of d1BySubmissionId.keys()) {
    if (!sourceBySubmissionId.has(submissionId)) {
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

  const endpoint = new URL(
    "/rest/v1/diagnostic_submissions",
    parsedSupabaseUrl,
  );

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
    "--verify-write",
    "--compare-d1-output",
  ]);

  for (const arg of args) {
    if (!allowedArgs.has(arg)) {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (args.size > 1) {
    throw new Error(
      "Use only one mode at a time.",
    );
  }

  await loadBackfillEnvironment();

  const rows = await fetchRows();
  const sourceCounts = validateRows(rows);

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
        sources: sourceCounts,
        outputWritten: true,
        outputPath: OUTPUT_PATH,
        permissions: "0600",
      }),
    );
    return;
  }

  if (args.has("--verify-write")) {
    const sql = buildVerificationSql(rows);

    await writeFile(VERIFY_OUTPUT_PATH, sql, {
      encoding: "utf8",
      mode: 0o600,
    });
    await chmod(VERIFY_OUTPUT_PATH, 0o600);

    console.log(
      JSON.stringify({
        status: "ok",
        mode: "verify-write",
        rows: rows.length,
        sources: sourceCounts,
        outputWritten: true,
        outputPath: VERIFY_OUTPUT_PATH,
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
      sources: sourceCounts,
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
