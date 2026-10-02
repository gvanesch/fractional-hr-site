import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("Production configuration audit uses GET only and never emits secret values", () => {
  const secret = "private-audit-fixture-value";
  const script = new URL("../../scripts/d1/production-config-audit.mjs", import.meta.url).href;
  const fixture = `
    globalThis.fetch = async (url, options) => {
      if (options.method && options.method !== 'GET') throw new Error('Mutation attempted');
      let result = [];
      if (url.endsWith('/settings')) result = {bindings: [{name:'RESEND_API_KEY',type:'secret_text',text:${JSON.stringify(secret)}}]};
      if (url.includes('/deployments')) result = {};
      return {ok:true, json:async()=>({success:true,result})};
    };
    await import(${JSON.stringify(script)});
  `;
  const env = { ...process.env, GITHUB_REF: "refs/heads/migration/d1", CLOUDFLARE_ACCOUNT_ID: "73221f18acc676e4992c89fcbf2b2a8f", CLOUDFLARE_API_TOKEN: secret };
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", fixture], { env, encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Binding RESEND_API_KEY: present/);
  assert.match(run.stdout, /Production Access applications matching site: 0/);
  assert.doesNotMatch(run.stdout + run.stderr, new RegExp(secret));
  const refused = spawnSync(process.execPath, ["--input-type=module", "-e", fixture], { env: { ...env, GITHUB_REF: "refs/heads/main" }, encoding: "utf8" });
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /target is not verified/);
});
