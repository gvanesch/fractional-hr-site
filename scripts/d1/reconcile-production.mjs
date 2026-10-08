// Read-only export/reconciliation. Writes only to a private local directory.
// Never execute the generated SQL without target/schema review and cutover approval.
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, readFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TABLES = [
  ["system_events", "event_id", 1],
  ["diagnostic_submissions", "id", 2],
  ["advisor_prospects", "prospect_id", 3],
  ["health_check_prospects", "prospect_id", 3],
  ["advisor_prospect_activity", "activity_id", 3],
  ["health_check_prospect_activity", "activity_id", 3],
  ["client_projects", "project_id", 4],
  ["client_participants", "participant_id", 4],
  ["client_responses", "response_id", 4],
  ["client_dimension_scores", "score_id", 4],
  ["client_fact_packs", "fact_pack_id", 4],
  ["client_functional_signal_requests", "signal_request_id", 4],
  ["client_service_access_context", "context_id", 4],
  ["client_diagnostic_invite_rate_limits", "ip_hash", 5],
  ["client_participant_otp_challenges", "challenge_id", 5],
  ["client_participant_verified_sessions", "session_id", 5],
];
const JSON_FIELDS = new Set([
  "metadata",
  "answers",
  "advisor_brief",
  "observed_signals",
  "segmentation_schema",
  "segmentation_values",
  "responses",
  "response_json",
  "response_data",
  "routes_used",
]);
const EXPECTED_SOURCE_HOST = "qxddddhhpfrrxbaunwfw.supabase.co";
const EXPECTED_PROD_DB = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
const EXPECTED_ACCOUNT_ID = "73221f18acc676e4992c89fcbf2b2a8f";
const safeIdentifier = (name) => {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error("Invalid identifier.");
  return `"${name}"`;
};
function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalJson(value[key])]),
    );
  return value;
}
export function normalizeValue(column, value) {
  if (value === null || value === undefined) return null;
  if (JSON_FIELDS.has(column))
    return JSON.stringify(
      canonicalJson(typeof value === "string" ? JSON.parse(value) : value),
    );
  if (
    /(?:_at|_until|_expires|_started|_used)$/.test(column) &&
    typeof value === "string" &&
    /^\d{4}-\d\d-\d\dT/.test(value)
  )
    return new Date(value).toISOString();
  return value;
}
export function canonicalRow(row, columns) {
  return Object.fromEntries(
    columns.map((column) => [column, normalizeValue(column, row[column])]),
  );
}
export function hashRows(rows, columns, key) {
  const normalized = rows
    .map((row) => canonicalRow(row, columns))
    .sort((a, b) => String(a[key]).localeCompare(String(b[key])));
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}
export function reconcileRows(source, target, columns, key) {
  const src = new Map(
    source.map((row) => [String(row[key]), canonicalRow(row, columns)]),
  );
  const dst = new Map(
    target.map((row) => [String(row[key]), canonicalRow(row, columns)]),
  );
  if (src.size !== source.length || dst.size !== target.length)
    throw new Error("Duplicate primary keys.");
  const missing = [],
    changed = [],
    unexpected = [];
  for (const [id, row] of src) {
    if (!dst.has(id)) missing.push(id);
    else if (JSON.stringify(row) !== JSON.stringify(dst.get(id)))
      changed.push(id);
  }
  for (const id of dst.keys()) if (!src.has(id)) unexpected.push(id);
  return {
    missing: missing.sort(),
    changed: changed.sort(),
    unexpected: unexpected.sort(),
    src,
  };
}
const sqlValue = (value) =>
  value === null
    ? "NULL"
    : typeof value === "number"
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`;
export function makeUpsert(table, key, columns, row) {
  const values = columns.map((column) =>
    sqlValue(normalizeValue(column, row[column])),
  );
  const mutable = columns.filter((column) => column !== key);
  return `INSERT INTO ${safeIdentifier(table)} (${columns.map(safeIdentifier).join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT(${safeIdentifier(key)}) DO UPDATE SET ${mutable.map((column) => `${safeIdentifier(column)}=excluded.${safeIdentifier(column)}`).join(", ")};`;
}

async function main() {
  const config = JSON.parse(
    await readFile(new URL("../../wrangler.jsonc", import.meta.url)),
  );
  const dbId = config.d1_databases.find(
    (item) => item.binding === "DB",
  )?.database_id;
  if (
    dbId !== EXPECTED_PROD_DB ||
    dbId === config.env.qa.d1_databases[0].database_id
  )
    throw new Error("D1 target mismatch.");
  const sourceUrl = new URL(
    process.env.BACKFILL_SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      `https://${EXPECTED_SOURCE_HOST}`,
  );
  if (
    sourceUrl.hostname !== EXPECTED_SOURCE_HOST ||
    sourceUrl.protocol !== "https:"
  )
    throw new Error("Supabase production source mismatch.");
  const supabaseKey = (
    process.env.BACKFILL_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();
  const cfToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? EXPECTED_ACCOUNT_ID;
  if (accountId !== EXPECTED_ACCOUNT_ID)
    throw new Error("Cloudflare account ID does not match the production target.");
  const missing = [];
  if (!supabaseKey) missing.push("BACKFILL_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)");
  if (!cfToken) missing.push("CLOUDFLARE_API_TOKEN");
  if (missing.length)
    throw new Error(`Missing local read credentials: ${missing.join(", ")}. Configure them locally; do not paste their values into chat.`);
  const privateDir = await mkdtemp(join(tmpdir(), "vanesch-d1-delta-"));
  await chmod(privateDir, 0o700);
  async function sourceRows(name, key) {
    const out = [];
    for (let offset = 0; ; offset += 500) {
      const url = new URL(`/rest/v1/${name}`, sourceUrl);
      url.searchParams.set("select", "*");
      url.searchParams.set("order", `${key}.asc`);
      url.searchParams.set("limit", "500");
      url.searchParams.set("offset", String(offset));
      const response = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: "application/json",
        },
      });
      if (!response.ok)
        throw new Error(
          `Supabase read failed for ${name}: HTTP ${response.status}`,
        );
      const page = await response.json();
      if (!Array.isArray(page)) throw new Error("Invalid Supabase result.");
      out.push(...page);
      if (page.length < 500) return out;
    }
  }
  async function d1Query(sql, params = []) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
      },
    );
    if (!response.ok)
      throw new Error(`D1 read failed: HTTP ${response.status}`);
    const result = await response.json();
    if (
      !result.success ||
      result.result?.[0]?.success !== true ||
      !Array.isArray(result.result[0].results)
    )
      throw new Error("Invalid D1 result.");
    return result.result[0].results;
  }
  const existing = new Set(
    (await d1Query("SELECT name FROM sqlite_master WHERE type='table'")).map(
      (row) => row.name,
    ),
  );
  const report = {
    source: EXPECTED_SOURCE_HOST,
    target: "vanesch-prod",
    database_id: dbId,
    generated_at: new Date().toISOString(),
    tables: {},
    source_stable: false,
    safe_to_import: false,
  };
  const snapshots = [];
  const upserts = [];
  for (const [table, key, migration] of TABLES) {
    const source = await sourceRows(table, key);
    const target = existing.has(table)
      ? await (async () => {
          const out = [];
          for (let offset = 0; ; offset += 500) {
            const page = await d1Query(
              `SELECT * FROM ${safeIdentifier(table)} ORDER BY ${safeIdentifier(key)} LIMIT 500 OFFSET ?`,
              [String(offset)],
            );
            out.push(...page);
            if (page.length < 500) return out;
          }
        })()
      : [];
    const columns = existing.has(table)
      ? (await d1Query(`PRAGMA table_info(${safeIdentifier(table)})`)).map(
          (row) => row.name,
        )
      : [...new Set(source.flatMap((row) => Object.keys(row)))].sort();
    if (
      source.length &&
      (!columns.includes(key) ||
        source.some((row) =>
          columns.some((column) => !Object.hasOwn(row, column)),
        ))
    )
      throw new Error(
        `Source and D1 schema differ for ${table}; inspect before backfill.`,
      );
    if (
      target.length &&
      target.some((row) =>
        columns.some((column) => !Object.hasOwn(row, column)),
      )
    )
      throw new Error(`Incomplete target result for ${table}.`);
    const comparison = reconcileRows(source, target, columns, key);
    report.tables[table] = {
      migration,
      target_table_exists: existing.has(table),
      source_count: source.length,
      d1_count: target.length,
      source_hash: hashRows(source, columns, key),
      d1_hash: hashRows(target, columns, key),
      missing: comparison.missing,
      changed: comparison.changed,
      unexpected: comparison.unexpected,
    };
    // Source snapshots are local and private; never upload respondent data to CI logs.
    snapshots.push({
      table,
      columns,
      key,
      source_hash: report.tables[table].source_hash,
    });
    for (const id of [...comparison.missing, ...comparison.changed])
      upserts.push(makeUpsert(table, key, columns, comparison.src.get(id)));
    console.log(
      `${table}: source=${source.length} d1=${target.length} missing=${comparison.missing.length} changed=${comparison.changed.length} unexpected=${comparison.unexpected.length} schema=${existing.has(table) ? "present" : "pending"}`,
    );
  }
  // Detect any production writes during the multi-table export; require a fresh run if changed.
  report.source_stable = (
    await Promise.all(
      snapshots.map(async (item) =>
        hashRows(
          await sourceRows(item.table, item.key),
          item.columns,
          item.key,
        ),
      ),
    )
  ).every((hash, index) => hash === snapshots[index].source_hash);
  report.safe_to_import = false; // Explicit approval and target/schema verification are always required.
  const sql = `-- TARGET: vanesch-prod (${dbId})\n-- DO NOT IMPORT BEFORE EXPLICIT PRODUCTION APPROVAL.\n-- Generated: ${report.generated_at}\nBEGIN TRANSACTION;\n${upserts.join("\n")}\nCOMMIT;\n`;
  const sqlPath = join(privateDir, "delta-backfill.sql");
  const reportPath = join(privateDir, "reconciliation.json");
  await writeFile(sqlPath, sql, { mode: 0o600 });
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", {
    mode: 0o600,
  });
  console.log(`Private output: ${privateDir}`);
  console.log(`Source stable during export: ${report.source_stable}`);
  if (!report.source_stable)
    throw new Error("Source changed during export; discard delta and retry.");
}
if (
  process.argv[1] &&
  new URL(`file://${process.argv[1]}`).href === import.meta.url
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
