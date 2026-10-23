// Recovery exercise: only a newly created, unbound, synthetic D1 database is writable.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
const account = "73221f18acc676e4992c89fcbf2b2a8f";
const branch = "refs/heads/security/recovery-rehearsal-2026-10-23";
const production = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
const qa = "b25d59da-5f93-4301-9996-7be0c9708789";
assert.equal(process.env.GITHUB_REPOSITORY, "gvanesch/fractional-hr-site");
assert.equal(process.env.GITHUB_REF, branch);
assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID, account);
assert.match(process.env.GITHUB_RUN_ID || "", /^\d+$/);
assert.ok(process.env.CLOUDFLARE_API_TOKEN);
const name = `security-recovery-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT || "1"}`;
let destination;
const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
async function api(method, path, body) {
  // Reject every production mutation, existing QA mutation, worker mutation and deletion.
  const readonly = method === "GET" && (
    ["workers/scripts/fractional-hr-site/settings", "workers/scripts/fractional-hr-site/deployments"].includes(path) ||
    path.startsWith(`d1/database/${production}/time_travel/bookmark`)
  );
  const create = method === "POST" && path === "d1/database" && !destination && body?.name === name;
  const isolated = destination && ![production, qa].includes(destination) && (
    (method === "GET" && [ `d1/database/${destination}`, `d1/database/${destination}/time_travel/bookmark` ].includes(path)) ||
    (method === "POST" && (path === `d1/database/${destination}/query` || path.startsWith(`d1/database/${destination}/time_travel/restore?bookmark=`)))
  );
  assert.ok(readonly || create || isolated, "API target outside rehearsal allowlist");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, {
    method, headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(45000),
  });
  const json = await response.json();
  if (!response.ok || !json.success) throw Error(`Rehearsal API rejected: HTTP ${response.status}; codes=${(json.errors || []).map(e=>e.code).join(",")}`);
  return json.result;
}
async function checkpoint() {
  const settings = await api("GET", "workers/scripts/fractional-hr-site/settings");
  const bindings = [...settings.bindings].sort((a,b)=>a.name.localeCompare(b.name));
  const db = bindings.find(b=>b.name === "DB");
  assert.equal(db.id ?? db.database_id, production);
  assert.equal(bindings.find(b=>b.name === "BASELINE_MAIL_MODE").text, "send");
  assert.equal(bindings.find(b=>b.name === "ADVISOR_AUTH_MODE")?.text ?? "supabase", "supabase");
  const deployment = (await api("GET", "workers/scripts/fractional-hr-site/deployments")).deployments[0];
  assert.deepEqual(deployment.versions.map(v=>[v.version_id,v.percentage]), [["3570dea7-eecc-43a1-a9d7-257120822a92",100]]);
  return hash({ bindings, versions: deployment.versions });
}
async function query(sql, params = []) {
  const result = await api("POST", `d1/database/${destination}/query`, { sql, params });
  assert.ok(Array.isArray(result) && result.every(r=>r.success !== false), "SQL failed");
  return result;
}
const q = value => "'" + String(value).replaceAll("'", "''") + "'";
async function snapshot() {
  const schema = (await query("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type,name"))[0].results;
  const data = {};
  for (const table of schema.filter(x=>x.type === "table")) {
    assert.match(table.name, /^[a-zA-Z0-9_]+$/);
    data[table.name] = (await query(`SELECT * FROM "${table.name}"`))[0].results.map(r=>JSON.stringify(r)).sort();
  }
  return { digest: hash({schema,data}), tables: schema.filter(x=>x.type === "table").length,
    participantCount: data.tb_baseline_participants.length, responseCount: data.tb_baseline_responses.length };
}
async function verify(expected) {
  for (let attempt=0; attempt<15; attempt++) {
    const actual = await snapshot();
    if (actual.digest === expected.digest) return actual;
    if (attempt === 14) assert.equal(actual.digest, expected.digest, "Restored schema/data digest differs");
    await new Promise(r=>setTimeout(r,2000));
  }
}
const started = Date.now();
const before = await checkpoint();
assert.ok((await api("GET", `d1/database/${production}/time_travel/bookmark`)).bookmark);
assert.ok((await api("GET", `d1/database/${production}/time_travel/bookmark?timestamp=${encodeURIComponent(new Date(Date.now()-86400000).toISOString())}`)).bookmark);
const created = await api("POST", "d1/database", { name, primary_location_hint: "weur" });
destination = created.uuid;
assert.match(destination || "", /^[a-f0-9-]{36}$/);
assert.ok(![production,qa].includes(destination));
assert.equal(created.name, name);
console.log(JSON.stringify({stage:"created-unbound-synthetic-database",name,destination}));
const info = await api("GET", `d1/database/${destination}`);
assert.equal(info.name, name);
for (const directory of ["migrations", "baseline-migrations"]) {
  for (const file of (await readdir(directory)).filter(f=>f.endsWith(".sql")).sort()) {
    await query(await readFile(`${directory}/${file}`, "utf8"));
  }
}
const now = "2026-10-23T12:00:00.000Z", expiry = "2026-10-30T18:00:00.000Z";
await query(`INSERT INTO tb_baseline_versions VALUES ('recovery-synthetic-v1','{"synthetic":true}',${q(now)});
INSERT INTO tb_baseline_campaigns (campaign_id,name,version,status,closes_at,privacy_notice,retention_days,created_at) VALUES ('recovery','Synthetic recovery rehearsal','recovery-synthetic-v1','open',${q(expiry)},'Synthetic, unbound database only',730,${q(now)});
INSERT INTO tb_baseline_dashboard_shares VALUES ('share','recovery','Synthetic share','{}','synthetic-share-hash',${q(expiry)},NULL,${q(now)});`);
for(let i=0;i<50;i++) {
  const id = `synthetic-${String(i).padStart(2,"0")}`, complete = i<25;
  const draft = JSON.stringify({synthetic:true,work:{lifecycle:60,systems:40},note:`Synthetic response ${i}`});
  await query(`INSERT INTO tb_baseline_participants VALUES (${q(id)},'recovery',${q(id+"@example.invalid")},'{"synthetic":true}',1,${q(now)});
INSERT INTO tb_baseline_invites VALUES (${q(id)},${q(id)},${q(id+"-hash")},${q(expiry)},NULL,${q(now)});
INSERT INTO tb_baseline_sessions VALUES (${q(id+"-session")},${q(id)},${q(id)},${q(expiry)},${q(now)});
INSERT INTO tb_baseline_verifications VALUES (${q(id)},${q(id)},'synthetic-code-hash',${q(expiry)},0,${q(now)},${q(now)});
INSERT INTO tb_baseline_responses VALUES (${q(id)},'recovery-synthetic-v1',${q(complete?"completed":"in_progress")},${complete?8:4},3,'synthetic-mutation',${q(draft)},${q(now)},${complete?q(now):"NULL"});
INSERT INTO tb_baseline_roster_details VALUES (${q(id)},'{"fte":0.8}',${q(now)});
INSERT INTO tb_baseline_work VALUES (${q(id)},'lifecycle','Synthetic lifecycle','synthetic','people_operations',60,'{}');
INSERT INTO tb_baseline_broad_work VALUES (${q(id)},'systems','Synthetic systems',40,'{}');
INSERT INTO tb_baseline_collection_context VALUES (${q(id)},'{"isPeopleManager":false}',${q(now)});
INSERT INTO tb_baseline_answer_copies VALUES (${q(id)},'recovery-synthetic-v1',${q(id+"@example.invalid")},'preview',0,${q(now)});
INSERT INTO tb_baseline_audit VALUES (${q(id)},'recovery','synthetic','recovery-seed',${q(id)},'{}',${q(now)});`);
}
const original = await snapshot();
assert.equal(original.participantCount,50); assert.equal(original.responseCount,50);
const bookmark = (await api("GET",`d1/database/${destination}/time_travel/bookmark`)).bookmark;
assert.ok(bookmark);
console.log(JSON.stringify({stage:"seed-and-bookmark-verified",...original}));
await query("UPDATE tb_baseline_responses SET draft_json='{\"synthetic\":true,\"state\":\"after-checkpoint\"}', revision=4 WHERE participant_id='synthetic-49'; UPDATE tb_baseline_dashboard_shares SET revoked_at='2026-10-23T12:01:00.000Z' WHERE share_id='share';");
const later = await snapshot(); assert.notEqual(later.digest,original.digest);
const restoreStarted = Date.now();
const restored = await api("POST",`d1/database/${destination}/time_travel/restore?bookmark=${encodeURIComponent(bookmark)}`);
await verify(original);
assert.ok(restored.previous_bookmark, "Undo bookmark missing");
console.log(JSON.stringify({stage:"restore-verified",seconds:(Date.now()-restoreStarted)/1000,...original}));
await api("POST",`d1/database/${destination}/time_travel/restore?bookmark=${encodeURIComponent(restored.previous_bookmark)}`);
await verify(later);
assert.equal(await checkpoint(),before,"Production settings/version changed during rehearsal");
console.log(JSON.stringify({stage:"complete",destination,name,syntheticParticipants:50,restoredSchemaAndData:true,undoRestorePreservedLaterChanges:true,productionUnchanged:true,productionSqlQueries:0,productionWrites:0,emailsSent:0,productionDataCopied:false,databaseRetained:true,elapsedSeconds:(Date.now()-started)/1000},null,2));
