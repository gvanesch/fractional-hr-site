import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const source = join(root, "scripts/d1/prepare-qa-deploy.mjs");
const configSource = join(root, "wrangler.jsonc");
const account = "73221f18acc676e4992c89fcbf2b2a8f";
const preload =
  "globalThis.fetch=async()=>({ok:true,json:async()=>({success:true,result:{subdomain:'qa-test'}})});";

async function run(configChange) {
  const dir = await mkdtemp(join(tmpdir(), "qa-deploy-guard-"));
  const script = join(dir, "scripts/d1/prepare-qa-deploy.mjs");
  const configPath = join(dir, "wrangler.jsonc");
  const envPath = join(dir, "github-env");
  await mkdir(join(dir, "scripts/d1"), { recursive: true });
  await cp(source, script);
  const config = JSON.parse(await readFile(configSource, "utf8"));
  configChange?.(config);
  await writeFile(configPath, JSON.stringify(config));
  await writeFile(envPath, "");
  const result = spawnSync(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(preload)}`, script], {
    encoding: "utf8",
    env: {
      ...process.env,
      GITHUB_REF: "refs/heads/migration/d1",
      GITHUB_ENV: envPath,
      CLOUDFLARE_ACCOUNT_ID: account,
      CLOUDFLARE_API_TOKEN: "test-token",
    },
  });
  return { result, config: JSON.parse(await readFile(configPath, "utf8")), env: await readFile(envPath, "utf8") };
}

test("QA deploy guard pins the database, Worker, flags, and site URL", async () => {
  const { result, config, env } = await run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(config.env.qa.vars.NEXT_PUBLIC_APP_ENV, "qa");
  assert.equal(config.env.qa.vars.NEXT_PUBLIC_SITE_URL, "https://fractional-hr-site-qa.qa-test.workers.dev");
  assert.equal(config.vars.D1_CLIENT_DIAGNOSTIC_MODE, "off");
  assert.match(env, /NEXT_PUBLIC_SITE_URL=https:\/\/fractional-hr-site-qa\.qa-test\.workers\.dev/);
  for (const change of [
    (c) => { c.env.qa.d1_databases[0].database_id = c.d1_databases[0].database_id; },
    (c) => { c.env.qa.services[0].service = c.name; },
    (c) => { c.vars.D1_CLIENT_DIAGNOSTIC_MODE = "d1"; },
    (c) => { c.env.qa.routes = [{ pattern: "vanesch.uk/*" }]; },
  ]) {
    const rejected = await run(change);
    assert.notEqual(rejected.result.status, 0);
    assert.equal(rejected.config.env.qa.vars.NEXT_PUBLIC_SITE_URL, undefined);
  }
});
