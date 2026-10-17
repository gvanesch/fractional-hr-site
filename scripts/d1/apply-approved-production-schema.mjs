// Inert until Greg explicitly approves schema-only production migrations.
// This script never deploys a Worker, changes flags, imports rows, or alters Access.
import { readFile, writeFile, mkdtemp, mkdir, chmod, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
const account = "73221f18acc676e4992c89fcbf2b2a8f";
const database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
export const approvedSql = {
  "0004_create_client_diagnostic_core.sql": "4fc8ace3c87aa5bf6a05fc7a8443412d713bdacbfa22a4607284cf54ad5bc029",
  "0005_create_client_diagnostic_security.sql": "d956163a533cd947aee1477532749fc00ef1c0d4fb4a322bd2c73579d706027a",
};
export function validateApproval(approval, env, now = Date.now()) {
  if (env.GITHUB_REF !== "refs/heads/migration/d1" || env.CLOUDFLARE_ACCOUNT_ID !== account ||
      approval?.approvedBy !== "Greg van Esch" || approval?.scope !== "production-schema-0004-0005-only" ||
      approval?.databaseId !== database || approval?.accountId !== account ||
      !Number.isFinite(Date.parse(approval.confirmedAt)) ||
      now - Date.parse(approval.confirmedAt) < 0 || now - Date.parse(approval.confirmedAt) > 24 * 60 * 60 * 1000 ||
      JSON.stringify(approval.sqlHashes) !== JSON.stringify(approvedSql))
    throw new Error("Explicit, current schema-only production approval is absent or mismatched.");
}
async function main() {
  const approval = JSON.parse(await readFile(new URL("./production-schema-approval.json", import.meta.url)));
  validateApproval(approval, process.env);
  if (!process.env.CLOUDFLARE_API_TOKEN?.trim()) throw new Error("Configured Cloudflare credential is unavailable.");
  for (const [name, expectedHash] of Object.entries(approvedSql)) {
    const sql = await readFile(new URL(`../../migrations/${name}`, import.meta.url));
    if (createHash("sha256").update(sql).digest("hex") !== expectedHash)
      throw new Error(`Reviewed SQL changed: ${name}.`);
  }
  // Includes current full-row source/target hash equality and flags-off checks.
  execFileSync(process.execPath, ["scripts/d1/prod-readonly-preflight.mjs"], { stdio: "inherit" });
  const privateDir = await mkdtemp(join(tmpdir(), "vanesch-prod-schema-"));
  await chmod(privateDir, 0o700);
  const migrationsDir = join(privateDir, "migrations");
  await mkdir(migrationsDir, { mode: 0o700 });
  for (const name of Object.keys(approvedSql)) await copyFile(new URL(`../../migrations/${name}`, import.meta.url), join(migrationsDir, name));
  const configPath = join(privateDir, "wrangler.json");
  await writeFile(configPath, JSON.stringify({
    name: "fractional-hr-site", account_id: account,
    d1_databases: [{ binding: "DB", database_name: "vanesch-prod", database_id: database, migrations_dir: migrationsDir }],
  }), { mode: 0o600 });
  const run = args => execFileSync("npx", ["wrangler", ...args, "--config", configPath], {
    encoding: "utf8", env: { ...process.env, CI: "true" }, stdio: ["ignore", "pipe", "pipe"],
  });
  const raw = run(["d1", "time-travel", "info", "vanesch-prod", "--json"]);
  const recovery = JSON.parse(raw.slice(raw.indexOf("{")));
  if (typeof recovery.bookmark !== "string" || !recovery.bookmark)
    throw new Error("Verified recovery bookmark is unavailable; migrations were not applied.");
  await writeFile(join(privateDir, "recovery.json"), JSON.stringify(recovery), { mode: 0o600 });
  console.log(`Pre-migration recovery bookmark: ${recovery.bookmark}`);
  // Only the two hash-verified files are visible to Wrangler. --remote is explicit.
  try { run(["d1", "migrations", "apply", "vanesch-prod", "--remote"]); }
  catch { throw new Error("Approved migration application failed. Stop and inspect remote schema/history; do not retry blindly."); }
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`, {
    method: "POST", headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql: "SELECT name FROM d1_migrations ORDER BY name" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Post-application migration-history read failed; inspect before proceeding.");
  const result = await response.json();
  const names = result.result?.[0]?.results?.map(row => row.name);
  if (!result.success || !Array.isArray(names) || names.length !== 5 ||
      !Object.keys(approvedSql).every(name => names.includes(name)))
    throw new Error("Post-application migration history is not the expected five files.");
  for (const name of names) console.log(`Applied: ${name}`);
  console.log("Schema-only production migration completed. No Worker deployment, flags, Access, or data import changed.");
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url)
  main().catch(() => { console.error("Production schema step failed. Inspect sanitized checks and remote migration state before retrying."); process.exitCode = 1; });
