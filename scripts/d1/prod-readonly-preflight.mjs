// Read-only production D1 inventory. Print schema names and counts only.
import { readFile } from "node:fs/promises";
import { hashRows } from "./reconcile-production.mjs";

const expectedAccount = "73221f18acc676e4992c89fcbf2b2a8f";
const expectedDb = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const config = JSON.parse(await readFile(new URL("../../wrangler.jsonc", import.meta.url)));
if (
  process.env.GITHUB_REF !== "refs/heads/migration/d1" ||
  process.env.CLOUDFLARE_ACCOUNT_ID !== expectedAccount ||
  !token ||
  config.d1_databases?.find((item) => item.binding === "DB")?.database_id !== expectedDb ||
  config.env?.qa?.d1_databases?.find((item) => item.binding === "DB")?.database_id === expectedDb
) throw new Error("Production read-only target is not verified.");

async function select(sql) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${expectedAccount}/d1/database/${expectedDb}/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new Error(`Production D1 read HTTP ${response.status}.`);
  const data = await response.json();
  if (!data.success || data.result?.[0]?.success !== true || !Array.isArray(data.result[0].results))
    throw new Error("Production D1 returned an invalid read result.");
  return data.result[0].results;
}

const tables = await select("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
const names = new Set(tables.map((row) => row.name));
const expectedTables = [
  "system_events", "diagnostic_submissions", "advisor_prospects",
  "health_check_prospects", "advisor_prospect_activity", "health_check_prospect_activity",
];
const pendingTables = ["client_projects", "client_participants", "client_participant_otp_challenges"];
for (const name of expectedTables) {
  if (!names.has(name)) throw new Error(`Expected production table missing: ${name}.`);
  const rows = await select(`SELECT count(*) AS row_count FROM "${name}"`);
  console.log(`${name}: ${rows[0]?.row_count}`);
}
for (const name of pendingTables) console.log(`${name}: ${names.has(name) ? "present" : "pending"}`);
if (!names.has("d1_migrations")) throw new Error("Production migration history is unavailable.");
const migrations = await select("SELECT name FROM d1_migrations ORDER BY name");
for (const row of migrations) console.log(`applied: ${row.name}`);
if (migrations.some((row) => /000[45]_/.test(row.name)))
  throw new Error("Production migrations 0004 or 0005 were already applied; review state.");

// Compare complete rows in memory; print only aggregate equality, never records.
const manifest = JSON.parse(await readFile(new URL("./production-source-manifest.json", import.meta.url)));
if (manifest.source !== "qxddddhhpfrrxbaunwfw" ||
    Date.now() - Date.parse(manifest.generatedAt) > 24 * 60 * 60 * 1000 ||
    !Number.isFinite(Date.parse(manifest.generatedAt)))
  throw new Error("Source manifest is invalid or stale; take a fresh source snapshot.");
for (let pass = 0; pass < 2; pass++) {
  for (const name of expectedTables) {
    const expected = manifest.tables[name];
    const columns = (await select(`PRAGMA table_info("${name}")`)).map(row => row.name);
    if (!expected || JSON.stringify(columns) !== JSON.stringify(expected.columns))
      throw new Error(`Schema mismatch: ${name}.`);
    const rows = await select(`SELECT * FROM "${name}" ORDER BY "${expected.key}"`);
    const match = rows.length === expected.count && hashRows(rows, columns, expected.key) === expected.hash;
    console.log(`${name}: full-row hash ${match ? "matches" : "DIFFERS"} (pass ${pass + 1})`);
    if (!match) throw new Error(`Production data differs for ${name}; no writes performed.`);
  }
}
console.log("All six production tables match the source snapshot across two reads. No writes performed.");

const workerSettingsResponse = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${expectedAccount}/workers/scripts/fractional-hr-site/settings`,
  { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) },
);
if (!workerSettingsResponse.ok) throw new Error(`Production Worker settings read HTTP ${workerSettingsResponse.status}.`);
const workerSettings = await workerSettingsResponse.json();
if (!workerSettings.success || !Array.isArray(workerSettings.result?.bindings))
  throw new Error("Invalid production Worker settings result.");
const prodBindings = new Map(workerSettings.result.bindings.map(row => [row.name, row]));
if ((prodBindings.get("DB")?.database_id ?? prodBindings.get("DB")?.id) !== expectedDb)
  throw new Error("Production Worker DB binding differs; no writes performed.");
for (const name of ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"]) {
  const mode = prodBindings.get(`D1_${name}_MODE`)?.text ?? "off";
  if (mode !== "off") throw new Error(`Production D1_${name}_MODE is not off; review before proceeding.`);
  console.log(`Production D1_${name}_MODE: off`);
}
console.log("Production Worker target verified; all D1 flags remain off. Settings were read only.");
