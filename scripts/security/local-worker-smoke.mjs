// Exercise the built OpenNext Worker against an ephemeral local D1 database.
// No Cloudflare/Resend/Supabase credentials, hosted database IDs, or hosted HTTP
// targets are passed to Wrangler. The only submission is local synthetic data.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../..", import.meta.url));
const origin = "http://127.0.0.1:8791";
const wrangler = path.join(root, "node_modules/wrangler/bin/wrangler.js");
const modes = ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"];

function localEnvironment() {
  // An allowlist prevents parent process credentials and proxy settings entering
  // the child. A private config directory also prevents project dotenv loading.
  const env = {};
  for (const name of ["PATH", "HOME", "TMPDIR", "TEMP", "TMP", "LANG", "LC_ALL", "SystemRoot"])
    if (process.env[name]) env[name] = process.env[name];
  return {
    ...env, CI: "true", NEXT_TELEMETRY_DISABLED: "1", WRANGLER_SEND_METRICS: "false",
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false", CLOUDFLARE_INCLUDE_PROCESS_ENV: "false",
  };
}

function start(args, cwd) {
  const child = spawn(process.execPath, [wrangler, ...args], {
    cwd, env: localEnvironment(), stdio: ["ignore", "pipe", "pipe"], detached: true,
  });
  const state = { finished: false, output: "" };
  const capture = chunk => { state.output = (state.output + chunk.toString()).slice(-8000); };
  child.stdout.on("data", capture);
  child.stderr.on("data", capture);
  const done = new Promise(resolve => {
    child.once("error", error => { state.finished = true; capture(error.message); resolve(-1); });
    child.once("close", code => { state.finished = true; resolve(code); });
  });
  return { child, state, done };
}

async function stop(run) {
  if (!run || run.state.finished) return;
  try { process.kill(-run.child.pid, "SIGTERM"); } catch { /* already exited */ }
  await Promise.race([run.done, delay(3000, undefined, { ref: false })]);
  if (!run.state.finished) {
    try { process.kill(-run.child.pid, "SIGKILL"); } catch { /* already exited */ }
    await Promise.race([run.done, delay(2000, undefined, { ref: false })]);
  }
}

async function localRequest(route, options = {}) {
  const url = new URL(route, origin);
  assert.equal(url.origin, origin, "smoke requests must stay on loopback");
  return fetch(url, { ...options, redirect: "error", signal: AbortSignal.timeout(5000) });
}

async function main() {
  const directory = await mkdtemp(path.join(tmpdir(), "retirement-local-worker-"));
  let migration, server;
  try {
    const source = JSON.parse(await readFile(path.join(root, "wrangler.jsonc"), "utf8"));
    const qa = source.env?.qa;
    assert.equal(qa?.vars?.ADVISOR_AUTH_MODE, "cloudflare_access");
    for (const mode of modes) assert.equal(qa.vars[`D1_${mode}_MODE`], "d1");
    const config = path.join(directory, "wrangler.json");
    const persistence = path.join(directory, "state");
    const workerName = "supabase-retirement-local-qa";
    await writeFile(config, JSON.stringify({
      name: "supabase-retirement-local",
      main: path.join(root, ".open-next/worker.js"),
      compatibility_date: source.compatibility_date,
      compatibility_flags: source.compatibility_flags,
      env: {
        qa: {
          name: workerName,
          assets: { directory: path.join(root, ".open-next/assets"), binding: "ASSETS" },
          services: [{ binding: "WORKER_SELF_REFERENCE", service: workerName }],
          d1_databases: [{
            binding: "DB", database_name: "retirement-local-only",
            database_id: "00000000-0000-4000-8000-000000000000",
            migrations_dir: path.join(root, "migrations"),
          }],
          vars: {
            ...Object.fromEntries(modes.map(mode => [`D1_${mode}_MODE`, "d1"])),
            NEXT_PUBLIC_APP_ENV: "qa", NEXT_PUBLIC_SITE_URL: origin,
            ADVISOR_AUTH_MODE: "cloudflare_access", ADVISOR_ALLOWED_EMAILS: "test@example.invalid",
            CLOUDFLARE_ACCESS_AUD: "synthetic-local-audience",
            CLOUDFLARE_ACCESS_TEAM_DOMAIN: "https://synthetic-local.cloudflareaccess.com",
            BASELINE_ENABLED: "true", BASELINE_MAIL_MODE: "preview",
            CONTACT_FROM_EMAIL: "test@example.invalid", CONTACT_TO_EMAIL: "test@example.invalid",
            DAILY_SUMMARY_RECIPIENT: "test@example.invalid",
          },
        },
      },
    }, null, 2));
    // An explicit empty local secrets file prevents fallback to any project file.
    await writeFile(path.join(directory, ".dev.vars.qa"), "NEXTJS_ENV=production\n");
    const common = ["--local", "--env", "qa", "--config", config, "--persist-to", persistence];
    migration = start(["d1", "migrations", "apply", "DB", ...common], directory);
    const migrationExit = await Promise.race([migration.done, delay(60000, "timeout", { ref: false })]);
    assert.equal(migrationExit, 0, "local D1 migrations must complete within 60 seconds");
    console.log("Local D1 migrations applied to isolated synthetic state.");
    server = start(["dev", ...common, "--ip", "127.0.0.1", "--port", "8791",
      "--inspector-ip", "127.0.0.1", "--inspector-port", "0", "--local-protocol", "http",
      "--show-interactive-dev-session=false", "--log-level", "warn"], directory);
    const deadline = Date.now() + 90000;
    let health;
    while (Date.now() < deadline && !server.state.finished) {
      try {
        const response = await localRequest("/api/health");
        if (response.status === 200) { health = await response.json(); break; }
        await response.body?.cancel();
      } catch { /* server may still be compiling or starting */ }
      await delay(500);
    }
    assert.equal(health?.d1, "connected", "built Worker must connect to local D1");
    assert.equal(health?.supabase, "not_required", "built Worker must not require Supabase");
    for (const route of ["/", "/diagnostic", "/diagnostic-assessment"]) {
      const response = await localRequest(route);
      assert.equal(response.status, 200, `${route} must render`);
      assert.match(response.headers.get("content-type") ?? "", /text\/html/);
      assert.doesNotMatch(await response.text(), /Application error: a server-side exception|Internal Server Error/);
    }
    for (const route of ["/advisor", "/advisor/prospects", "/advisor/projects", "/api/advisor-project-participants"]) {
      const response = await localRequest(route);
      assert.equal(response.status, 403, `${route} must reject a missing Access JWT`);
      await response.body?.cancel();
    }
    const response = await localRequest("/api/diagnostic-complete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 3])),
        companySize: "LOCAL SYNTHETIC TEST", industry: "Local Worker smoke",
        role: "Synthetic tester", countryRegion: "Local only",
      }),
    });
    assert.equal(response.status, 200, "local Health Check must save without an email transport");
    const completion = await response.json();
    assert.equal(completion.ok, true);
    assert.equal(completion.score, 50);
    assert.equal(completion.internalEmailStatus, "failed");
    assert.equal(completion.resendId, null);
    assert.match(completion.publicToken ?? "", /^[0-9a-f-]{36}$/i);
    const read = await localRequest(`/api/public-diagnostic-result?token=${encodeURIComponent(completion.publicToken)}`);
    assert.equal(read.status, 200, "saved local Health Check must be readable from D1");
    const saved = await read.json();
    assert.equal(saved.ok, true);
    assert.equal(saved.result.score, completion.score);
    assert.equal(saved.result.band.label, completion.band);
    assert.equal(saved.context.companySize, "LOCAL SYNTHETIC TEST");
    assert.equal(saved.context.industry, "Local Worker smoke");
    assert.equal(saved.context.emailPresent, false);
    console.log("Local Worker smoke passed: D1 health, public pages, advisor denial and synthetic Health Check write/read. No hosted requests or email.");
  } catch (error) {
    // Child configuration and state contain synthetic values only.
    const output = server?.state.output || migration?.state.output;
    if (output) console.error(output);
    throw error;
  } finally {
    await stop(server);
    await stop(migration);
    await rm(directory, { recursive: true, force: true });
  }
}

await main();
