import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";

const BACKFILL_ENV_PATH = ".env.backfill.local";
const EXPECTED_SUPABASE_HOST = "qxddddhhpfrrxbaunwfw.supabase.co";
const OUTPUT_PATH = "/tmp/vanesch-d1-crm-backfill.sql";
const QUERY_PATH = "/tmp/vanesch-d1-crm-query.sql";
const D1_QUERY_OUTPUT_PATH = "/tmp/vanesch-d1-crm-query-output.txt";

const TABLES = [
  {
    name: "advisor_prospects",
    primaryKey: "prospect_id",
    expectedRows: 4,
    requiredColumns: new Set([
      "prospect_id", "source", "diagnostic_status", "created_at", "updated_at",
      "relationship_strength", "deal_stage", "lead_temperature",
    ]),
    columns: [
      "prospect_id", "name", "company", "role", "source", "segment",
      "diagnostic_status", "last_contact_date", "next_action_date",
      "observed_signals", "notes", "linked_submission_id", "created_at",
      "updated_at", "relationship_strength", "deal_stage",
      "lead_temperature", "next_step", "lost_reason", "contact_email",
      "contact_phone", "company_website", "billing_contact_name",
      "billing_contact_email", "linkedin_url",
    ],
    jsonColumns: new Set(["observed_signals"]),
  },
  {
    name: "advisor_prospect_activity",
    primaryKey: "activity_id",
    expectedRows: 31,
    requiredColumns: new Set([
      "activity_id", "prospect_id", "activity_type", "created_at",
    ]),
    columns: [
      "activity_id", "prospect_id", "linked_submission_id", "activity_type",
      "field_name", "old_value", "new_value", "note", "changed_by",
      "created_at", "note_type",
    ],
    jsonColumns: new Set(),
  },
  {
    name: "health_check_prospects",
    primaryKey: "prospect_id",
    expectedRows: 1,
    requiredColumns: new Set([
      "prospect_id", "submission_id", "relationship", "status", "source",
      "created_at", "updated_at",
    ]),
    columns: [
      "prospect_id", "submission_id", "name", "company", "relationship",
      "status", "last_contact_date", "next_action_date", "source", "notes",
      "created_at", "updated_at",
    ],
    jsonColumns: new Set(),
  },
  {
    name: "health_check_prospect_activity",
    primaryKey: "activity_id",
    expectedRows: 0,
    requiredColumns: new Set([
      "activity_id", "prospect_id", "submission_id", "activity_type", "created_at",
    ]),
    columns: [
      "activity_id", "prospect_id", "submission_id", "activity_type",
      "field_name", "old_value", "new_value", "note", "changed_by",
      "created_at",
    ],
    jsonColumns: new Set(),
  },
];

const ALLOWED_VALUES = {
  advisor_prospects: {
    source: new Set(["linkedin", "referral", "website", "saas", "other"]),
    segment: new Set(["smb", "mid", "enterprise"]),
    diagnostic_status: new Set([
      "not_invited", "invited", "started", "completed",
      "assessment_candidate", "in_conversation", "converted",
    ]),
    relationship_strength: new Set(["unknown", "weak", "medium", "strong"]),
    deal_stage: new Set([
      "new", "contacted", "replied", "meeting_booked", "in_conversation",
      "health_check_completed", "diagnostic_assessment_candidate",
      "proposal_discussed", "converted", "lost", "nurture",
    ]),
    lead_temperature: new Set(["cold", "warm", "hot"]),
  },
  advisor_prospect_activity: {
    note_type: new Set(["call", "meeting", "email", "linkedin", "internal"]),
  },
  health_check_prospects: {
    relationship: new Set(["weak", "medium", "strong"]),
    status: new Set([
      "not_contacted", "contacted", "replied", "call_booked",
      "opportunity", "won", "lost",
    ]),
    source: new Set(["network", "referral", "website", "other"]),
  },
};

function parseEnvLine(line) {
  const match = line.match(
    /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/,
  );
  if (!match) return null;

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
    if (commentIndex >= 0) value = value.slice(0, commentIndex).trimEnd();
  }
  return { key, value };
}

async function loadBackfillEnvironment() {
  let contents;
  try {
    contents = await readFile(BACKFILL_ENV_PATH, "utf8");
  } catch {
    throw new Error(`Unable to read ${BACKFILL_ENV_PATH}.`);
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parsed = parseEnvLine(line);
    if (parsed && process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }
}

function requiredEnvironmentVariable(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in ${BACKFILL_ENV_PATH}.`);
  return value;
}

function sqlText(value) {
  return `'${value.replaceAll("\u0000", "").replaceAll("'", "''")}'`;
}

function sqlValue(table, column, value) {
  if (value === null || value === undefined) return "NULL";
  if (table.jsonColumns.has(column)) {
    const serialized = JSON.stringify(value);
    if (typeof serialized !== "string") {
      throw new Error(`Unable to serialize ${table.name}.${column}.`);
    }
    return sqlText(serialized);
  }
  if (typeof value !== "string") {
    throw new Error(`Expected text for ${table.name}.${column}.`);
  }
  return sqlText(value);
}

function validateRows(table, rows) {
  if (!Array.isArray(rows)) {
    throw new Error(`Supabase did not return an array for ${table.name}.`);
  }
  if (rows.length !== table.expectedRows) {
    throw new Error(
      `Expected ${table.expectedRows} Supabase ${table.name} rows but found ${rows.length}. Stop and re-audit before backfilling.`,
    );
  }

  const ids = new Set();
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(`Supabase returned an invalid ${table.name} row.`);
    }
    for (const column of table.columns) {
      if (!Object.hasOwn(row, column)) {
        throw new Error(`A ${table.name} row is missing ${column}.`);
      }
      const value = row[column];
      if (value !== null && !table.jsonColumns.has(column) && typeof value !== "string") {
        throw new Error(`Unexpected value type for ${table.name}.${column}.`);
      }
      if (table.requiredColumns.has(column) && (typeof value !== "string" || !value)) {
        throw new Error(`A ${table.name} row has an invalid required ${column}.`);
      }
    }

    const id = row[table.primaryKey];
    if (typeof id !== "string" || !id) {
      throw new Error(`A ${table.name} row has an invalid ${table.primaryKey}.`);
    }
    if (ids.has(id)) throw new Error(`Duplicate ${table.name} ${table.primaryKey}.`);
    ids.add(id);

    for (const column of table.jsonColumns) {
      const value = row[column];
      if (value !== null && (!Array.isArray(value) || value.some((item) => typeof item !== "string"))) {
        throw new Error(`Invalid JSON array in ${table.name}.${column}.`);
      }
    }

    for (const [column, allowed] of Object.entries(ALLOWED_VALUES[table.name] ?? {})) {
      const value = row[column];
      if (value !== null && !allowed.has(value)) {
        throw new Error(`Unexpected value in ${table.name}.${column}.`);
      }
    }
  }
}

function validateRelationships(rowsByTable) {
  const advisorIds = new Set(
    rowsByTable.advisor_prospects.map((row) => row.prospect_id),
  );
  for (const row of rowsByTable.advisor_prospect_activity) {
    if (!advisorIds.has(row.prospect_id)) {
      throw new Error("Advisor activity references a missing advisor prospect.");
    }
  }

  const healthIds = new Set(
    rowsByTable.health_check_prospects.map((row) => row.prospect_id),
  );
  const healthSubmissionIds = new Set(
    rowsByTable.health_check_prospects.map((row) => row.submission_id),
  );
  for (const row of rowsByTable.health_check_prospect_activity) {
    if (!healthIds.has(row.prospect_id)) {
      throw new Error("Health Check activity references a missing prospect.");
    }
    if (!healthSubmissionIds.has(row.submission_id)) {
      throw new Error("Health Check activity references a mismatched submission.");
    }
  }
}

function buildBackfillSql(rowsByTable) {
  const statements = [];
  for (const table of TABLES) {
    for (const row of rowsByTable[table.name]) {
      const columns = table.columns.join(",\n  ");
      const values = table.columns
        .map((column) => sqlValue(table, column, row[column]))
        .join(",\n  ");
      statements.push(`INSERT INTO ${table.name} (\n  ${columns}\n) VALUES (\n  ${values}\n);`);
    }
  }

  return `-- One-time CRM prospect and activity backfill.
-- Contains live personal data. Do not commit or retain this file.
-- Generated from Supabase for direct import into production D1.

${statements.join("\n\n")}
`;
}

function buildQuerySql() {
  const queries = TABLES.map((table) => {
    const pairs = ["'_table'", `'${table.name}'`];
    for (const column of table.columns) {
      pairs.push(`'${column}'`);
      pairs.push(
        table.jsonColumns.has(column)
          ? `CASE WHEN ${column} IS NULL THEN NULL ELSE json(${column}) END`
          : column,
      );
    }
    return `SELECT json_object(\n  ${pairs.join(",\n  ")}\n) AS row_json\nFROM ${table.name}`;
  });
  return `-- One-time CRM parity query.
-- Output contains live personal data. Protect and delete the output after comparison.

${queries.join("\nUNION ALL\n")}
ORDER BY row_json;
`;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function normalizeRow(table, row, sourceName) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    throw new Error(`${sourceName} returned an invalid ${table.name} row.`);
  }
  const normalized = { _table: table.name };
  for (const column of table.columns) {
    if (!Object.hasOwn(row, column)) {
      throw new Error(`${sourceName} ${table.name} row is missing ${column}.`);
    }
    let value = row[column];
    if (table.jsonColumns.has(column) && typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        throw new Error(`${sourceName} returned invalid JSON in ${table.name}.${column}.`);
      }
    }
    normalized[column] = canonicalize(value);
  }
  return normalized;
}

function normalizeAndHashRows(rowsByTable, sourceName) {
  const rows = TABLES.flatMap((table) =>
    rowsByTable[table.name].map((row) => normalizeRow(table, row, sourceName)),
  ).sort((left, right) => {
    const tableOrder = left._table.localeCompare(right._table);
    if (tableOrder !== 0) return tableOrder;
    const table = TABLES.find((candidate) => candidate.name === left._table);
    return left[table.primaryKey].localeCompare(right[table.primaryKey]);
  });
  const serialized = JSON.stringify(rows);
  return {
    rows,
    hash: createHash("sha256").update(serialized).digest("hex"),
  };
}

function extractD1Rows(output) {
  const cleaned = output.replace(/\u001b\[[0-9;]*m/g, "");
  const marker = '[\n  {\n    "results"';
  const markerStart = cleaned.indexOf(marker);
  const fallbackStart = cleaned.lastIndexOf("\n[");
  const start = markerStart >= 0 ? markerStart : fallbackStart >= 0 ? fallbackStart + 1 : -1;
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end < start) {
    throw new Error("Unable to find Wrangler JSON in the protected D1 output.");
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("Unable to parse Wrangler JSON from the protected D1 output.");
  }
  if (!Array.isArray(parsed)) throw new Error("Wrangler did not return an array.");
  return parsed.flatMap((entry) => Array.isArray(entry?.results) ? entry.results : []);
}

function groupD1Rows(rows) {
  const grouped = Object.fromEntries(TABLES.map((table) => [table.name, []]));
  for (const result of rows) {
    if (typeof result?.row_json !== "string") {
      throw new Error("D1 returned a row without row_json.");
    }
    let row;
    try {
      row = JSON.parse(result.row_json);
    } catch {
      throw new Error("D1 returned invalid row_json.");
    }
    const table = TABLES.find((candidate) => candidate.name === row?._table);
    if (!table) throw new Error("D1 returned a row with an unknown _table value.");
    grouped[table.name].push(row);
  }
  return grouped;
}

function compareRows(sourceRowsByTable, d1RowsByTable) {
  const source = normalizeAndHashRows(sourceRowsByTable, "Supabase");
  const d1 = normalizeAndHashRows(d1RowsByTable, "D1");
  const rowKey = (row) => {
    const table = TABLES.find((candidate) => candidate.name === row._table);
    return `${row._table}:${row[table.primaryKey]}`;
  };
  const sourceMap = new Map(source.rows.map((row) => [rowKey(row), JSON.stringify(row)]));
  const d1Map = new Map(d1.rows.map((row) => [rowKey(row), JSON.stringify(row)]));

  let exactMatchRows = 0;
  let missingRows = 0;
  let mismatchedRows = 0;
  for (const [key, sourceRow] of sourceMap) {
    const d1Row = d1Map.get(key);
    if (d1Row === undefined) missingRows += 1;
    else if (d1Row === sourceRow) exactMatchRows += 1;
    else mismatchedRows += 1;
  }
  let unexpectedRows = 0;
  for (const key of d1Map.keys()) {
    if (!sourceMap.has(key)) unexpectedRows += 1;
  }

  const expectedRows = TABLES.reduce((sum, table) => sum + table.expectedRows, 0);
  const counts = Object.fromEntries(
    TABLES.map((table) => [table.name, {
      source: sourceRowsByTable[table.name].length,
      d1: d1RowsByTable[table.name].length,
    }]),
  );
  const passed = source.rows.length === expectedRows && d1.rows.length === expectedRows &&
    exactMatchRows === expectedRows && missingRows === 0 && mismatchedRows === 0 &&
    unexpectedRows === 0 && source.hash === d1.hash;

  return {
    passed,
    counts,
    sourceRows: source.rows.length,
    d1Rows: d1.rows.length,
    exactMatchRows,
    missingRows,
    mismatchedRows,
    unexpectedRows,
    sourceHash: source.hash,
    d1Hash: d1.hash,
    hashMatch: source.hash === d1.hash,
  };
}

async function fetchTable(table, supabaseUrl, serviceRoleKey) {
  const endpoint = new URL(`/rest/v1/${table.name}`, supabaseUrl);
  endpoint.searchParams.set("select", table.columns.join(","));
  endpoint.searchParams.set("order", `${table.primaryKey}.asc`);
  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase ${table.name} export failed with HTTP ${response.status}.`);
  }
  return response.json();
}

async function fetchRows() {
  const supabaseUrl = requiredEnvironmentVariable("BACKFILL_SUPABASE_URL");
  const serviceRoleKey = requiredEnvironmentVariable(
    "BACKFILL_SUPABASE_SERVICE_ROLE_KEY",
  );
  const parsedUrl = new URL(supabaseUrl);
  if (parsedUrl.hostname !== EXPECTED_SUPABASE_HOST) {
    throw new Error(
      `Backfill project mismatch. Expected ${EXPECTED_SUPABASE_HOST} but found ${parsedUrl.hostname}.`,
    );
  }

  const entries = await Promise.all(
    TABLES.map(async (table) => [
      table.name,
      await fetchTable(table, parsedUrl, serviceRoleKey),
    ]),
  );
  const rowsByTable = Object.fromEntries(entries);
  for (const table of TABLES) validateRows(table, rowsByTable[table.name]);
  validateRelationships(rowsByTable);
  return rowsByTable;
}

async function writeProtected(path, contents) {
  await writeFile(path, contents, { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const allowed = new Set(["--check", "--write", "--write-query", "--compare-d1-output"]);
  for (const arg of args) {
    if (!allowed.has(arg)) throw new Error(`Unknown argument: ${arg}`);
  }
  if (args.size > 1) throw new Error("Use only one mode at a time.");

  await loadBackfillEnvironment();
  const rowsByTable = await fetchRows();
  const counts = Object.fromEntries(
    TABLES.map((table) => [table.name, rowsByTable[table.name].length]),
  );

  if (args.has("--compare-d1-output")) {
    let output;
    try {
      output = await readFile(D1_QUERY_OUTPUT_PATH, "utf8");
    } catch {
      throw new Error(`Unable to read ${D1_QUERY_OUTPUT_PATH}.`);
    }
    const comparison = compareRows(rowsByTable, groupD1Rows(extractD1Rows(output)));
    console.log(JSON.stringify({
      status: comparison.passed ? "ok" : "error",
      mode: "compare-d1-output",
      ...comparison,
    }));
    if (!comparison.passed) process.exitCode = 1;
    return;
  }

  if (args.has("--write")) {
    await writeProtected(OUTPUT_PATH, buildBackfillSql(rowsByTable));
    console.log(JSON.stringify({
      status: "ok", mode: "write", counts, outputWritten: true,
      outputPath: OUTPUT_PATH, permissions: "0600",
    }));
    return;
  }

  if (args.has("--write-query")) {
    await writeProtected(QUERY_PATH, buildQuerySql());
    console.log(JSON.stringify({
      status: "ok", mode: "write-query", counts, outputWritten: true,
      outputPath: QUERY_PATH, permissions: "0600",
    }));
    return;
  }

  console.log(JSON.stringify({
    status: "ok", mode: "check", counts, outputWritten: false,
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: "error",
    error: error instanceof Error ? error.message : "Unknown error",
  }));
  process.exitCode = 1;
});
